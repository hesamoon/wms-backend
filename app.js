import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import {
  getProduct,
  getProducts,
  getSoldProducts,
  createProduct,
  updateProduct,
  initializeDatabase,
  sellProduct,
  getUsers,
  getUser,
} from "./database.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["POST", "GET"],
    credentials: true,
  })
);

await initializeDatabase();

app.get("/getProducts", async (req, res) => {
  const products = await getProducts();
  res.send(products);
});

app.get("/getProduct/:id", async (req, res) => {
  const id = req.params.id;
  const product = await getProduct(id);
  res.send(product);
});

app.get("/getSoldProducts", async (req, res) => {
  const soldProducts = await getSoldProducts();
  res.send(soldProducts);
});

app.get("/getUsers", async (req, res) => {
  const users = await getUsers();
  res.send(users);
});

app.post("/createProduct", async (req, res) => {
  const { warehouseCode, productCode, productName, qty, buyPrice, sellPrice, seller } =
    req.body;

  const newProduct = await createProduct(
    warehouseCode,
    productCode,
    productName,
    qty,
    buyPrice,
    sellPrice,
    seller,
    new Date(),
    new Date()
  );
  if (newProduct?.message === "ID Exist!") {
    res.status(406).send(newProduct);
  } else {
    res.status(201).send(newProduct);
  }
});

app.post("/updateProduct", async (req, res) => {
  const {
    warehouse_code,
    product_code,
    product_name,
    count,
    buy_price,
    sell_price,
    seller,
    updateAt,
  } = req.body;

  const updatedProduct = await updateProduct(
    warehouse_code,
    product_code,
    product_name,
    count,
    buy_price,
    sell_price,
    seller,
    new Date(updateAt)
  );

  res.status(201).send(updatedProduct);
});

app.post("/sellProduct", async (req, res) => {
  const {
    warehouse_code,
    product_code,
    product_name,
    buy_price,
    sell_price,
    seller,
    count,
  } = req.body;

  const sellProductRes = await sellProduct(
    warehouse_code,
    product_code,
    product_name,
    buy_price,
    sell_price,
    seller,
    count,
    new Date(),
    new Date(),
    new Date()
  );

  if (sellProductRes.message === "sale record added") {
    const currProduct = await getProduct(product_code);
    await updateProduct(
      currProduct.warehouse_code,
      currProduct.product_code,
      currProduct.product_name,
      currProduct.count - count,
      currProduct.buy_price,
      currProduct.sell_price,
      currProduct.seller,
      new Date()
    );

    res.status(201).send(sellProductRes);
  } else {
    res.status(500).send(sellProductRes);
  }
});

app.post("/login", async (req, res) => {
  const user = await getUser(req.body.number, req.body.password);
  if (user.length > 0) {
    const token = jwt.sign({ ...user[0] }, "secure", { expiresIn: "1d" });
    return res.json({ status: "Success", token });
  }
  return res.json({ status: "No Record" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
