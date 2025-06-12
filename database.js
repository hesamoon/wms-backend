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
          product_category JSON,
          product_unit VARCHAR(50) NOT NULL,
          buy_price VARCHAR(50) NOT NULL,
          sell_price VARCHAR(50) NOT NULL,
          seller JSON,
          min_count INT NOT NULL,
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
          product_category JSON,
          product_unit VARCHAR(50) NOT NULL,
          buy_price VARCHAR(50) NOT NULL,
          sell_price VARCHAR(50) NOT NULL,
          seller JSON,
          buyer JSON,
          paymentDetails JSON,
          min_count INT NOT NULL,
          count INT NOT NULL,
          createAt TIMESTAMP NOT NULL DEFAULT NOW(),
          updateAt TIMESTAMP NOT NULL DEFAULT NOW(),
          soldAt TIMESTAMP NOT NULL DEFAULT NOW()
      )
  `;

  await pool.query(createSoldProductTableQuery);

  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS
      users (
          object_id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(50) NOT NULL,
          number VARCHAR(50) NOT NULL,
          password VARCHAR(50) NOT NULL,
          user_code VARCHAR(50) NOT NULL,
          role VARCHAR(50) NOT NULL,
          createAt TIMESTAMP NOT NULL DEFAULT NOW()
      )
  `;

  await pool.query(createUsersTableQuery);

  const createBuyersTableQuery = `
    CREATE TABLE IF NOT EXISTS
      buyers (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(50) NOT NULL,
          number VARCHAR(50) NOT NULL,
          address VARCHAR(50) NOT NULL,
          type VARCHAR(50) NOT NULL,
          createAt TIMESTAMP NOT NULL DEFAULT NOW()
      )
  `;

  await pool.query(createBuyersTableQuery);
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
  product_category,
  product_unit,
  min_count,
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
          product_category,
          product_unit,
          min_count,
          count,
          buy_price,
          sell_price,
          seller,
          createAt,
          updateAt
        )
    VALUES (
      ?, ?, ?, 
      JSON_OBJECT('code', ?, 'name', ?), 
      ?, ?, ?, ?, ?, 
      JSON_OBJECT('name', ?, 'phone', ?, 'user_code', ?), 
      ?, ?
    )
  `,
    [
      warehouse_code,
      product_code,
      product_name,
      product_category.code,
      product_category.name,
      product_unit,
      min_count,
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

export async function removeProduct(product_code) {
  const [result] = await pool.query(
    `DELETE FROM product WHERE product_code=?`,
    [product_code]
  );

  return { ...result, product_code };
}

export async function getSoldProducts() {
  const [rows] = await pool.query(`SELECT * FROM sold_product`);
  return rows;
}

export async function sellProduct(
  warehouse_code,
  product_code,
  product_name,
  product_unit,
  buy_price,
  sell_price,
  seller,
  buyer,
  paymentDetails,
  count,
  min_count,
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
    product_unit,
    buy_price,
    sell_price,
    seller,
    buyer,
    paymentDetails,
    count,
    min_count,
    createAt,
    updateAt,
    soldAt
  ) VALUES (
    ?, ?, ?, ?, ?, ?, 
    JSON_OBJECT('name', ?, 'phone', ?, 'user_code', ?), 
    JSON_OBJECT('name', ?, 'number', ?, 'address', ?, 'type', ?), 
    JSON_OBJECT('payMethod', ?, 'confirmerCode', ?, 'settlement', ?, 'desc', ?, 'discountPrice', ?), 
    ?, ?, ?, ?, ?
  )`,
    [
      warehouse_code,
      product_code,
      product_name,
      product_unit,
      buy_price,
      sell_price,
      seller.name,
      seller.phone,
      seller.user_code,
      buyer.name,
      buyer.number,
      buyer.address,
      buyer.type,
      paymentDetails.payMethod,
      paymentDetails.confirmerCode,
      paymentDetails.settlement,
      paymentDetails.desc,
      paymentDetails.discountPrice,
      count,
      min_count,
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

export async function updatePaymentDetails(desc, settlement, id) {
  const [result] = await pool.query(
    `
    UPDATE sold_product
    SET paymentDetails = JSON_SET(
        paymentDetails,
        '$.desc', ?,
        '$.settlement', ?
    )
    WHERE object_id = ?;
  `,
    [desc, settlement, id]
  );

  return result;
}

export async function getUsers() {
  const [rows] = await pool.query(`SELECT * FROM users`);
  return rows;
}

export async function addUser(name, number, password, user_code, role) {
  const [result] = await pool.query(
    `
    INSERT INTO
        users (
          name,
          number,
          password,
          user_code,
          role
        )
    VALUES (
      ?, ?, ?, ?, ?
    )
  `,
    [name, number, password, user_code, role]
  );

  return result;
}

export async function addBuyer(name, number, address, type) {
  const [result] = await pool.query(
    `
    INSERT INTO
        buyers (
          name,
          number,
          address,
          type
        )
    VALUES (
      ?, ?, ?, ?
    )
  `,
    [name, number, address, type]
  );

  return result;
}

export async function getBuyers() {
  const [rows] = await pool.query(`SELECT * FROM buyers`);
  return rows;
}

export async function updateUser(name, number, password, user_code, role) {
  const [result] = await pool.query(
    `
    UPDATE users
    SET 
      name = ?,
      number = ?,
      password = ?,
      user_code = ?,
      role = ?
    WHERE 
      user_code = ? AND 
      number = ?;
  `,
    [name, number, password, user_code, role, user_code, number]
  );
  return getUser(number, password);
}

export async function removeUser(number, user_code) {
  const [result] = await pool.query(
    `DELETE FROM users WHERE number=? AND user_code=?`,
    [number, user_code]
  );

  return { ...result, user_code };
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
