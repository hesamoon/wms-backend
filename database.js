import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql
  .createPool({
    host: process.env.HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    charset: "utf8mb4",
  })
  .promise();

export async function initializeDatabase() {
  await pool.query(
    `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE}`
  );
  await pool.query(`USE ${process.env.MYSQL_DATABASE}`);

  const createProductTableQuery = `
    CREATE TABLE IF NOT EXISTS
      product (
          object_id INT PRIMARY KEY AUTO_INCREMENT,
          warehouse_code VARCHAR(50) NOT NULL,
          product_code VARCHAR(50) NOT NULL,
          product_name VARCHAR(50) NOT NULL,
          buy_price VARCHAR(50) NOT NULL,
          sell_price VARCHAR(50) NOT NULL,
          seller JSON,
          count INT NOT NULL,
          createAt TIMESTAMP NOT NULL DEFAULT NOW(),
          updateAt TIMESTAMP NOT NULL DEFAULT NOW()
      )
  `;

  await pool.query(createProductTableQuery);

  const createSoldProductTableQuery = `
    CREATE TABLE IF NOT EXISTS
      sold_product (
          object_id INT PRIMARY KEY AUTO_INCREMENT,
          warehouse_code VARCHAR(50) NOT NULL,
          product_code VARCHAR(50) NOT NULL,
          product_name VARCHAR(50) NOT NULL,
          buy_price VARCHAR(50) NOT NULL,
          sell_price VARCHAR(50) NOT NULL,
          seller JSON,
          count INT NOT NULL,
          createAt TIMESTAMP NOT NULL DEFAULT NOW(),
          updateAt TIMESTAMP NOT NULL DEFAULT NOW(),
          soldAt TIMESTAMP NOT NULL DEFAULT NOW()
      )
  `;

  await pool.query(createSoldProductTableQuery);
}

export async function getProducts() {
  const [rows] = await pool.query(`SELECT * FROM product`);
  return rows;
}

export async function getProduct(code) {
  const [rows] = await pool.query(
    `
    SELECT * 
    FROM product
    WHERE product_code=?`,
    [code]
  );
  return rows[0];
}

export async function getProductByID(id) {
  const [rows] = await pool.query(
    `
    SELECT * 
    FROM product
    WHERE object_id=?`,
    [id]
  );
  return rows[0];
}

export async function createProduct(
  warehouse_code,
  product_code,
  product_name,
  count,
  buy_price,
  sell_price,
  seller,
  createAt,
  updateAt
) {
  const [result] = await pool.query(
    `
    INSERT IGNORE INTO
        product (
          warehouse_code,
          product_code,
          product_name,
          count,
          buy_price,
          sell_price,
          seller,
          createAt,
          updateAt
        )
    VALUES (
      ?, ?, ?, ?, ?, ?, 
      JSON_OBJECT('name', ?, 'phone', ?, 'user_code', ?), 
      ?, ?
    )
  `,
    [
      warehouse_code,
      product_code,
      product_name,
      count,
      buy_price,
      sell_price,
      seller.name,
      seller.phone,
      seller.user_code,
      createAt,
      updateAt,
    ]
  );

  if (result.affectedRows > 0) {
    const id = result.insertId;
    return getProductByID(id);
  } else {
    return { message: "ID Exist!" };
  }
}

export async function updateProduct(
  warehouse_code,
  product_code,
  product_name,
  count,
  buy_price,
  sell_price,
  seller,
  updateAt
) {
  const [result] = await pool.query(
    `
    UPDATE product
    SET 
      product_name = ?,
      count = ?,
      buy_price = ?,
      sell_price = ?,
      seller = JSON_OBJECT('name', ?, 'phone', ?, 'user_code', ?),
      updateAt = ?
    WHERE 
      warehouse_code = ? AND 
      product_code = ?;
  `,
    [
      product_name,
      count,
      buy_price,
      sell_price,
      seller.name,
      seller.phone,
      seller.user_code,
      updateAt,
      warehouse_code,
      product_code,
    ]
  );

  return getProduct(product_code);
}

export async function getSoldProducts() {
  const [rows] = await pool.query(`SELECT * FROM sold_product`);
  return rows;
}

export async function sellProduct(
  warehouse_code,
  product_code,
  product_name,
  buy_price,
  sell_price,
  seller,
  count,
  createAt,
  updateAt,
  soldAt
) {
  const [result] = await pool.query(
    `
  INSERT INTO sold_product (
    warehouse_code,
    product_code,
    product_name,
    buy_price,
    sell_price,
    seller,
    count,
    createAt,
    updateAt,
    soldAt
  ) VALUES (
    ?, ?, ?, ?, ?, 
    JSON_OBJECT('name', ?, 'phone', ?, 'user_code', ?), 
    ?, ?, ?, ?
  )`,
    [
      warehouse_code,
      product_code,
      product_name,
      buy_price,
      sell_price,
      seller.name,
      seller.phone,
      seller.user_code,
      count,
      createAt,
      updateAt,
      soldAt,
    ]
  );

  if (result.affectedRows > 0) {
    return { message: "sale record added" };
  } else {
    return { message: "sale record was not added" };
  }
}

export async function getUsers() {
  const [rows] = await pool.query(`SELECT * FROM users`);
  return rows;
}

export async function getUser(number, password) {
  const [rows] = await pool.query(
    `
    SELECT * 
    FROM users
    WHERE number=? AND password=?`,
    [number, password]
  );
  return rows;
}

export async function verifyUser(number, password) {
  const [rows] = await pool.query(
    `
    SELECT * 
    FROM users
    WHERE number=? AND password=?`,
    [number, password]
  );
  return rows;
}

// const notes = await getNotes();
// const note = await getNote(1);
// const res = await createNote("test", "test");
// console.log(res);
