import { pool } from "@/config";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { PoolClient } from "pg";
import { fileURLToPath } from "url";

interface migration {
  id: string;
  name: string;
  created_at: Date;
}

/**
 * File System
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql_folder = path.join(__dirname, "up");
const down_folder = path.join(__dirname, "down");

async function get_sql_files() {
  const files = await readdir(sql_folder);
  return files.sort((a, b) => a.localeCompare(b));
}

async function get_down_sql_files() {
  const files = await readdir(down_folder);

  return files.sort((a, b) => b.localeCompare(a));
}

function replace_to_up_filename(name: string) {
  if (name.endsWith(".down.sql")) {
    return name.replace(".down.sql", ".sql");
  }
  throw new Error(`Invalid migration file ${name}`);
}

function replace_to_down_filename(name: string, down?: boolean) {
  if (name.endsWith(".down.sql") && !down) {
    return name.replace(".down.sql", ".sql");
  }

  throw new Error(`Invalid migration file ${name}`);
}

async function read_file(folder: string, filename: string) {
  const data = await readFile(path.join(folder, filename), "utf-8");
  return data;
}

/**
 *  Migration
 */

async function ensure_migration_table_exists() {
  const client = await pool.connect();
  try {
    const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    await client.query(query);
  } finally {
    client.release();
  }
}

async function get_existing_migrations(): Promise<migration[]> {
  const client = await pool.connect();

  try {
    const result = await client.query(`select * from migrations`);

    return result.rows;
  } finally {
    client.release();
  }
}

async function check_file_migrated(file: string): Promise<boolean> {
  const existing_migrations = await get_existing_migrations();

  const is_already_migrated = existing_migrations.find(
    (migration) => migration.name === file,
  );

  return !!is_already_migrated;
}

async function record_a_migration(filename: string, client: PoolClient) {
  await client.query("insert into migrations (name) values ($1)", [filename]);
}

async function delete_migration(filename: string, client: PoolClient) {
  await client.query("delete from migrations where name = $1", [filename]);
}

async function migrate_one(sql: string, file: string) {
  const client = await pool.connect();
  console.log(`Migrating : ${file}`);

  try {
    await client.query("begin");
    await client.query(sql);
    await record_a_migration(file, client);
    await client.query("commit");
  } catch (err) {
    console.log(`
      \n
      Failed to migrate: ${file}
    \n
    `);
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

async function undo_one(sql: string, file: string) {
  const client = await pool.connect();

  console.log(`Undo migration: ${file}`);
  try {
    await client.query("begin");
    await client.query(sql);
    await delete_migration(file, client);
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    console.log(`
      \n
      Failed to undo migrate: ${file}
    \n
    `);
    throw err;
  } finally {
    client.release();
  }
}

async function migrate_all() {
  const files = await get_sql_files();
  let file_to_migrate = [];

  for (const file of files) {
    const is_already_migrated = await check_file_migrated(file);
    if (!is_already_migrated) {
      file_to_migrate.push(file);
    }
  }

  console.log({ file_to_migrate });

  if (file_to_migrate.length === 0) {
    console.log("There are no files to migrate");
    return;
  }

  for (const file of file_to_migrate) {
    const data = await read_file(sql_folder, file);
    await migrate_one(data, file);
  }
}

async function undo_all() {
  const files = await get_down_sql_files();

  const files_to_undo = [];

  for (const file of files) {
    const is_migrated = await check_file_migrated(replace_to_up_filename(file));
    if (is_migrated) files_to_undo.push(file);
  }

  console.log({
    existing: files,
    files_to_undo,
  });

  if (files_to_undo.length === 0) {
    console.log(`There is nothing to undo`);
    return;
  }

  for (const file of files_to_undo) {
    const data = await read_file(down_folder, file);
    await undo_one(data, replace_to_down_filename(file));
  }
}

async function migrate() {
  const usage = `
  Usage:
    yarn migrate migrate:[all | filename.sql]
    yarn migrate migrate:undo [all | filename.name]
  `;

  const args = process.argv[2];

  await ensure_migration_table_exists();

  if (args === "migrate:all") {
    console.log(`Trigger : ${args} \n`);
    await migrate_all();
  } else if (args.startsWith("migrate:") && args.endsWith(".sql")) {
    console.log(`Trigger Migration : ${args} \n`);
    const migrate_file = args.split(":")[1];
    if (!(await check_file_migrated(migrate_file))) {
      const data = await read_file(sql_folder, migrate_file);
      await migrate_one(data, migrate_file);
    } else {
      console.log(`${migrate_file} already migrated`);
    }
  } else if (args.startsWith("undo:") && args.endsWith(".down.sql")) {
    console.log(`Trigger Undo : ${args} \n`);
    const migrate_file = args.split(":")[1];
    const data = await read_file(down_folder, migrate_file);
    await undo_one(data, replace_to_down_filename(migrate_file));
  } else if (args === "migrate:undo:all") {
    console.log(`Trigger : ${args} \n`);
    await undo_all();
  } else {
    console.log(usage);
  }
}

migrate();
