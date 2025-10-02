import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import {
  getProduct,
  getProducts,
  getProductsByCategory,
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
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  removeCategory,
  getTowers,
  getTower,
  createTower,
  updateTower,
  removeTower,
  getEquipments,
  getEquipment,
  createEquipment,
  updateEquipment,
  removeEquipment,
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

app.get("/getProductsByCategory/:categoryCode", async (req, res) => {
  const categoryCode = req.params.categoryCode;
  const products = await getProductsByCategory(categoryCode);
  res.send(products);
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
    priceUnit,
    minQty,
    qty,
    rentalCosts,
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
    priceUnit,
    minQty,
    qty,
    rentalCosts,
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
    product_category,
    product_unit,
    price_unit,
    buy_price,
    sell_price,
    seller,
    buyer,
    count,
    soldPrice,
    min_count,
    paymentDetails,
  } = req.body;

  const sellProductRes = await sellProduct(
    warehouse_code,
    product_code,
    product_name,
    product_category,
    product_unit,
    price_unit,
    buy_price,
    sell_price,
    seller,
    buyer,
    paymentDetails,
    count,
    soldPrice,
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

// Categories routes
app.get("/getCategories", async (req, res) => {
  const categories = await getCategories();
  res.send(categories);
});

app.get("/getCategory/:code", async (req, res) => {
  const code = req.params.code;
  const category = await getCategory(code);
  if (category) {
    res.send(category);
  } else {
    res.status(404).send({ message: "Category not found" });
  }
});

app.post("/createCategory", async (req, res) => {
  const { code, name } = req.body;
  const newCategory = await createCategory(code, name);

  if (newCategory?.message) {
    res.status(406).send(newCategory);
  } else {
    res.status(201).send(newCategory);
  }
});

app.post("/updateCategory", async (req, res) => {
  const { code, name } = req.body;
  const updatedCategory = await updateCategory(code, name);

  if (updatedCategory?.message) {
    res.status(404).send(updatedCategory);
  } else {
    res.status(200).send(updatedCategory);
  }
});

app.post("/removeCategory", async (req, res) => {
  const { code } = req.body;
  const removedCategory = await removeCategory(code);
  res.status(200).send(removedCategory);
});

// Tower routes
app.get("/getTowers", async (req, res) => {
  const towers = await getTowers();
  res.send(towers);
});

app.get("/getTower/:id", async (req, res) => {
  const id = req.params.id;
  const tower = await getTower(id);
  if (tower) {
    res.send(tower);
  } else {
    res.status(404).send({ message: "Tower not found" });
  }
});

app.post("/createTower", async (req, res) => {
  const { name, size } = req.body;
  const newTower = await createTower(name, size);

  if (newTower?.message) {
    res.status(406).send(newTower);
  } else {
    res.status(201).send(newTower);
  }
});

app.post("/updateTower", async (req, res) => {
  const { name, size, id } = req.body;
  const updatedTower = await updateTower(name, size, id);

  if (updatedTower?.message) {
    res.status(404).send(updatedTower);
  } else {
    res.status(200).send(updatedTower);
  }
});

app.post("/removeTower", async (req, res) => {
  const { object_id } = req.body;
  const removedTower = await removeTower(object_id);
  res.status(200).send(removedTower);
});

// Equipment routes
app.get("/getEquipments", async (req, res) => {
  const equipments = await getEquipments();
  res.send(equipments);
});

app.get("/getEquipment/:id", async (req, res) => {
  const id = req.params.id;
  const equipment = await getEquipment(id);
  if (equipment) {
    res.send(equipment);
  } else {
    res.status(404).send({ message: "Equipment not found" });
  }
});

app.post("/createEquipment", async (req, res) => {
  const { name, model, serialNumber, storageLocation, qty } = req.body;
  const newEquipment = await createEquipment(
    name,
    model,
    serialNumber,
    storageLocation,
    qty
  );

  if (newEquipment?.message) {
    res.status(406).send(newEquipment);
  } else {
    res.status(201).send(newEquipment);
  }
});

app.post("/updateEquipment", async (req, res) => {
  const { name, model, serialNumber, storageLocation, qty, id } = req.body;
  const updatedEquipment = await updateEquipment(
    name,
    model,
    serialNumber,
    storageLocation,
    qty,
    id
  );

  if (updatedEquipment?.message) {
    res.status(404).send(updatedEquipment);
  } else {
    res.status(200).send(updatedEquipment);
  }
});

app.post("/removeEquipment", async (req, res) => {
  const { object_id } = req.body;
  const removedEquipment = await removeEquipment(object_id);
  res.status(200).send(removedEquipment);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
