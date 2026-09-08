# Database Schemas (Namespaces) with node-postgres (`pg`)

This document explains how to use PostgreSQL schemas (namespaces) to logically isolate tables by business domain, and how to interact with them using raw SQL via the `pg` (node-postgres) library.

## Why Use Schemas?
By default, PostgreSQL creates tables in the `public` schema. When building a Modular Monolith with the intention of eventually extracting microservices, dumping everything into `public` creates tight coupling. 

Using schemas (e.g., `iam.users`, `catalog.products`, `sales.orders`) acts as a namespace. It enforces physical boundaries between your domains and makes future service extraction significantly easier, while also keeping your database organized.

## Recommended Namespaces for eKommerce

1. **`iam` (Identity & Access Management)**
   - `iam.users`
   - `iam.roles`

2. **`catalog`**
   - `catalog.categories`
   - `catalog.products`

3. **`inventory`**
   - `inventory.stock_movements`

4. **`sales` (Checkout & Orders)**
   - `sales.carts`
   - `sales.cart_items`
   - `sales.orders`
   - `sales.order_items`
   - `sales.coupons`

5. **`finance`**
   - `finance.payments`

---

## 1. Creating Schemas and Tables via Raw SQL Migrations

When using raw `node-postgres`, your migrations will be `.sql` files or JavaScript scripts that execute raw SQL strings. 

To create a namespaced table, you must first create the schema, then prefix the table name with the schema name.

### Example Migration Script (`001_create_catalog.js`)
```javascript
const { Pool } = require('pg');
const pool = new Pool({ /* config */ });

async function up() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Start transaction

    // 1. Create the namespace
    await client.query('CREATE SCHEMA IF NOT EXISTS catalog;');

    // 2. Create the table inside the namespace
    await client.query(`
      CREATE TABLE IF NOT EXISTS catalog.products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Migration successful');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed', e);
  } finally {
    client.release();
  }
}

up();
```

---

## 2. Querying with Namespaces in `node-postgres`

When writing your data access layer, you just include the schema in your standard SQL strings. This approach has **zero overhead** and gives you maximum performance compared to query builders.

### Example: Selecting Data
```javascript
// catalog.repository.js
async function getProducts() {
  const result = await pool.query(
    'SELECT id, name, price FROM catalog.products ORDER BY created_at DESC'
  );
  return result.rows;
}
```

### Example: Inserting Data
```javascript
async function addProduct(name, price) {
  const result = await pool.query(`
    INSERT INTO catalog.products (name, price)
    VALUES ($1, $2)
    RETURNING *;
  `, [name, price]);
  return result.rows[0];
}
```

### Example: Transactions Across Namespaces (The Checkout Flow)
Because it's a Modular Monolith sharing one database, you can still run ACID transactions that span multiple schemas. 

```javascript
async function processCheckout(userId, cartItems) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Read from IAM namespace
    const userResult = await client.query('SELECT role FROM iam.users WHERE id = $1', [userId]);

    // 2. Lock rows in Catalog namespace
    await client.query('SELECT * FROM catalog.products WHERE id = $1 FOR UPDATE', [cartItems[0].productId]);

    // 3. Write to Sales namespace
    const orderResult = await client.query(`
      INSERT INTO sales.orders (user_id, total_amount) 
      VALUES ($1, $2) RETURNING id
    `, [userId, calculatedTotal]);

    // 4. Write to Inventory namespace
    await client.query(`
      INSERT INTO inventory.stock_movements (product_id, quantity, type)
      VALUES ($1, $2, 'OUT')
    `, [cartItems[0].productId, -cartItems[0].quantity]);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
```

## The Microservices Preparation Rule
Even though raw SQL allows you to do `JOIN`s across schemas (e.g., `JOIN catalog.products ON sales.orders.product_id = catalog.products.id`), try to **avoid cross-schema Foreign Key constraints**. 

If `sales.orders` has a `user_id` column, treat it as a loose reference to `iam.users(id)`. By not explicitly enforcing a Foreign Key constraint between schemas, you ensure that extracting the `sales` schema to an entirely different physical database in the future won't break your tables.


 ### Re-explaining Schemas with Raw SQL (node-postgres)

  Using a database schema acts exactly like a namespace. Here is how you can implement this with pure pg.
  #### 1. Managing Migrations with Raw SQL
  Without a tool like Knex, you will write your migrations as pure SQL strings and execute them using the pg driver.
  To create a namespace and a table within it, you execute two SQL statements:

    // Example using node-postgres
    const { Pool } = require('pg');
    const pool = new Pool();
    
    async function runMigration() {
      const client = await pool.connect();
      try {
        await client.query('BEGIN'); // Start transaction
    
        // 1. Create the namespace
        await client.query('CREATE SCHEMA IF NOT EXISTS catalog;');
    
        // 2. Create the table inside the namespace
        await client.query(`
          CREATE TABLE IF NOT EXISTS catalog.products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price NUMERIC(10, 2) NOT NULL
          );
        `);

        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

  #### 2. Querying Data

  When querying, you simply prepend the schema name to the table. This has zero performance overhead. In fact, executing raw queries using pg is much faster than running them through a query builder's parser.

    // Selecting data
    const result = await pool.query('SELECT * FROM catalog.products WHERE price > $1', [50.00]);
    console.log(result.rows);

    // Inserting data
    const insertResult = await pool.query(`
      INSERT INTO catalog.products (name, price) 
      VALUES ($1, $2) 
      RETURNING id
    `, ['Laptop', 1200.00]);

  #### 3. Cross-Namespace Transactions

  One of the massive benefits of the Modular Monolith is that you can still use database transactions across different namespaces. For example, during checkout:

    await client.query('BEGIN');

    // Lock row in catalog namespace
    await client.query('SELECT id FROM catalog.products WHERE id = $1 FOR UPDATE', [productId]);

    // Insert into sales namespace
    await client.query('INSERT INTO sales.orders (user_id) VALUES ($1)', [userId]);

    // Adjust inventory in inventory namespace
    await client.query('INSERT INTO inventory.stock_movements (product_id, quantity) VALUES ($1, -1)', [productId]);

    await client.query('COMMIT');


