import { pool } from "@/config";
import { createHash } from "crypto";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { PoolClient } from "pg";
import { fileURLToPath } from "url";

interface Migration {
  id: number;
  name: string;
  checksum: string | null;
  created_at: Date;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UP_DIR = path.join(__dirname, "up");
const DOWN_DIR = path.join(__dirname, "down");

// Any constant bigint — every runner must use the same one.
const LOCK_ID = 7_283_401;

// Put this on the FIRST line of a file that cannot run in a transaction
// (e.g. CREATE INDEX CONCURRENTLY). Such a file must hold ONE statement:
// Postgres wraps a multi-statement query in an implicit transaction anyway.
const NO_TX = "-- migrate:no-transaction";

// numeric: true → "2_x.sql" sorts before "10_x.sql"
const collator = new Intl.Collator("en", { numeric: true });
const by_name = (a: string, b: string) => collator.compare(a, b);

const USAGE = `
Usage:
  yarn migrate migrate:all
  yarn migrate migrate:<file>.sql
  yarn migrate migrate:undo:<file>.down.sql
  yarn migrate migrate:undo:all [--force]   (--force required when NODE_ENV=production)
`;

// ---------------------------------------------------------------- files

async function list_dir(dir: string): Promise<string[]> {
  try {
    return await readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function list_up_files() {
  const files = await list_dir(UP_DIR);
  return files
    .filter((f) => f.endsWith(".sql") && !f.endsWith(".down.sql"))
    .sort(by_name);
}

async function list_down_files() {
  const files = await list_dir(DOWN_DIR);
  return new Set(files.filter((f) => f.endsWith(".down.sql")));
}

function to_down_name(up: string) {
  return up.slice(0, -".sql".length) + ".down.sql";
}

function to_up_name(down: string) {
  return down.slice(0, -".down.sql".length) + ".sql";
}

async function read_sql(dir: string, file: string) {
  const sql = await readFile(path.join(dir, file), "utf-8");
  return sql.replace(/\r\n/g, "\n"); // git autocrlf must not change the checksum
}

function checksum(sql: string) {
  return createHash("sha256").update(sql).digest("hex");
}

// ---------------------------------------------------------------- db

async function ensure_table(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.query(
    `ALTER TABLE migrations ADD COLUMN IF NOT EXISTS checksum TEXT`,
  );
}

async function get_applied(client: PoolClient) {
  const { rows } = await client.query<Migration>(`SELECT * FROM migrations`);
  return new Map(rows.map((m) => [m.name, m]));
}

function latest_applied(applied: Map<string, Migration>) {
  const names = [...applied.keys()].sort(by_name);
  return names[names.length - 1];
}

// Fails if an already-applied file was edited. Legacy rows (no checksum) are adopted.
async function verify_checksums(
  client: PoolClient,
  applied: Map<string, Migration>,
  up_files: string[],
) {
  const on_disk = new Set(up_files);

  for (const m of applied.values()) {
    if (!on_disk.has(m.name)) {
      console.warn(`Warning: ${m.name} is applied but missing from up/`);
      continue;
    }

    const sum = checksum(await read_sql(UP_DIR, m.name));

    if (m.checksum === null) {
      await client.query(`UPDATE migrations SET checksum = $1 WHERE id = $2`, [
        sum,
        m.id,
      ]);
      m.checksum = sum;
    } else if (m.checksum !== sum) {
      throw new Error(
        `${m.name} was edited after it was applied. Write a new migration instead.`,
      );
    }
  }
}

// A pending file that sorts before an applied one (e.g. merged in from another branch).
function assert_in_order(pending: string[], applied: Map<string, Migration>) {
  const latest = latest_applied(applied);
  if (!latest) return;

  const late = pending.filter((f) => by_name(f, latest) < 0);
  if (late.length) {
    throw new Error(
      `Out of order: ${late.join(", ")} sorts before already-applied ${latest}. ` +
        `Rename it with a newer prefix.`,
    );
  }
}

// ---------------------------------------------------------------- run one file

async function run_sql(
  client: PoolClient,
  sql: string,
  record: () => Promise<unknown>,
) {
  if (sql.trimStart().startsWith(NO_TX)) {
    await client.query(sql);
    await record();
    return;
  }

  await client.query("BEGIN");
  try {
    await client.query(sql);
    await record();
    await client.query("COMMIT");
  } catch (err) {
    // a failed ROLLBACK must not hide the real error
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  }
}

async function apply_up(client: PoolClient, file: string) {
  console.log(`Migrating: ${file}`);
  const sql = await read_sql(UP_DIR, file);

  try {
    await run_sql(client, sql, () =>
      client.query(`INSERT INTO migrations (name, checksum) VALUES ($1, $2)`, [
        file,
        checksum(sql),
      ]),
    );
  } catch (err) {
    console.error(`Failed to migrate: ${file}`);
    throw err;
  }
}

async function apply_down(client: PoolClient, up_file: string) {
  const down_file = to_down_name(up_file);
  console.log(`Undoing: ${up_file} (${down_file})`);
  const sql = await read_sql(DOWN_DIR, down_file);

  try {
    await run_sql(client, sql, () =>
      client.query(`DELETE FROM migrations WHERE name = $1`, [up_file]),
    );
  } catch (err) {
    console.error(`Failed to undo: ${up_file}`);
    throw err;
  }
}

// ---------------------------------------------------------------- commands

async function migrate_all(
  client: PoolClient,
  up_files: string[],
  applied: Map<string, Migration>,
) {
  const pending = up_files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log("There are no files to migrate");
    return;
  }

  assert_in_order(pending, applied);
  console.log({ pending });

  for (const file of pending) await apply_up(client, file);
}

async function migrate_one(
  client: PoolClient,
  up_files: string[],
  applied: Map<string, Migration>,
  file: string,
) {
  if (!file.endsWith(".sql") || file.endsWith(".down.sql")) {
    throw new Error(`Expected an up file like 001_x.sql, got "${file}"`);
  }
  // membership check also blocks path traversal ("../../x.sql")
  if (!up_files.includes(file)) throw new Error(`${file} not found in up/`);

  if (applied.has(file)) {
    console.log(`${file} already migrated`);
    return;
  }

  const pending = up_files.filter((f) => !applied.has(f));
  assert_in_order(pending, applied);

  if (pending[0] !== file) {
    throw new Error(`Apply ${pending[0]} first — migrations run in order.`);
  }

  await apply_up(client, file);
}

async function undo_one(
  client: PoolClient,
  applied: Map<string, Migration>,
  down_file: string,
) {
  if (!down_file.endsWith(".down.sql")) {
    throw new Error(
      `Expected a down file like 001_x.down.sql, got "${down_file}"`,
    );
  }

  const up_file = to_up_name(down_file);

  if (!applied.has(up_file)) {
    console.log(`${up_file} is not applied — nothing to undo`);
    return;
  }

  const latest = latest_applied(applied);
  if (up_file !== latest) {
    throw new Error(
      `Undo ${to_down_name(latest)} first — migrations are undone newest-first.`,
    );
  }

  const down_files = await list_down_files();
  if (!down_files.has(down_file))
    throw new Error(`${down_file} not found in down/`);

  await apply_down(client, up_file);
}

async function undo_all(client: PoolClient, applied: Map<string, Migration>) {
  if (
    process.env.NODE_ENV === "production" &&
    !process.argv.includes("--force")
  ) {
    throw new Error("Refusing migrate:undo:all in production without --force");
  }

  const to_undo = [...applied.keys()].sort(by_name).reverse();

  if (to_undo.length === 0) {
    console.log("There is nothing to undo");
    return;
  }

  // check every down file exists BEFORE undoing anything
  const down_files = await list_down_files();
  const missing = to_undo.map(to_down_name).filter((f) => !down_files.has(f));
  if (missing.length) {
    throw new Error(
      `Missing down files, nothing undone: ${missing.join(", ")}`,
    );
  }

  console.log({ to_undo });

  for (const file of to_undo) await apply_down(client, file);
}

// ---------------------------------------------------------------- entry

async function main() {
  const arg = process.argv[2];

  if (!arg?.startsWith("migrate:")) {
    console.log(USAGE);
    process.exitCode = 1;
    return;
  }

  const client = await pool.connect();

  try {
    // session-level lock: a second runner waits here, then finds nothing to do
    await client.query(`SELECT pg_advisory_lock($1)`, [LOCK_ID]);

    try {
      await ensure_table(client);

      const up_files = await list_up_files();
      const applied = await get_applied(client);
      await verify_checksums(client, applied, up_files);

      console.log(`Trigger: ${arg}\n`);

      if (arg === "migrate:all") {
        await migrate_all(client, up_files, applied);
      } else if (arg === "migrate:undo:all") {
        await undo_all(client, applied);
      } else if (arg.startsWith("migrate:undo:")) {
        await undo_one(client, applied, arg.slice("migrate:undo:".length));
      } else {
        await migrate_one(
          client,
          up_files,
          applied,
          arg.slice("migrate:".length),
        );
      }
    } finally {
      await client
        .query(`SELECT pg_advisory_unlock($1)`, [LOCK_ID])
        .catch(() => {}); // lock dies with the connection anyway
    }
  } finally {
    client.release();
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
