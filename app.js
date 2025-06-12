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
  removeProduct,
  addUser,
  updateUser,
  removeUser,
  addBuyer,
  getBuyers,
  updatePaymentDetails,
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

app.post("/addUser", async (req, res) => {
  const { name, number, password, user_code, role } = req.body;
  const newUser = await addUser(name, number, password, user_code, role);
  res.status(201).send(newUser);
});

app.post("/addBuyer", async (req, res) => {
  const { name, number, address, type } = req.body;
  const newBuyer = await addBuyer(name, number, address, type);
  res.status(201).send(newBuyer);
});

app.get("/getBuyers", async (req, res) => {
  const users = await getBuyers();
  res.send(users);
});

app.post("/updateUser", async (req, res) => {
  const { name, number, password, user_code, role } = req.body;

  const updatedUser = await updateUser(name, number, password, user_code, role);
  res.status(201).send(updatedUser);
});

app.post("/removeUser", async (req, res) => {
  const { number, user_code } = req.body;

  const removedUser = await removeUser(number, user_code);
  res.status(201).send(removedUser);
});

app.post("/createProduct", async (req, res) => {
  const {
    warehouseCode,
    productCode,
    productName,
    productCategory,
    productUnit,
    minQty,
    qty,
    buyPrice,
    sellPrice,
    seller,
  } = req.body;

  const newProduct = await createProduct(
    warehouseCode,
    productCode,
    productName,
    productCategory,
    productUnit,
    minQty,
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

app.post("/updatePaymentDetails", async (req, res) => {
  const { desc, settlement, id } = req.body;

  const updatedPaymentDetails = await updatePaymentDetails(
    desc,
    settlement,
    id
  );

  if (updatedPaymentDetails.affectedRows > 0) {
    res
      .status(201)
      .send({ success: true, message: "بروزرسانی اطلاعات با موفقیت انجام شد" });
  } else {
    res
      .status(201)
      .send({ success: false, message: "بروزرسانی اطلاعات انجام نشد" });
  }
});

app.post("/removeProduct", async (req, res) => {
  const { product_code } = req.body;

  const removedProduct = await removeProduct(product_code);

  res.status(200).send(removedProduct);
});

app.post("/sellProduct", async (req, res) => {
  const {
    warehouse_code,
    product_code,
    product_name,
    product_unit,
    buy_price,
    sell_price,
    seller,
    buyer,
    count,
    min_count,
    paymentDetails,
  } = req.body;

  const sellProductRes = await sellProduct(
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
