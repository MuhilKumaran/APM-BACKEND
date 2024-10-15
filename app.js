const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const customerRoutes = require("./Routes/customerRoutes");
const menuRoutes = require("./Routes/menuRoutes");
// const { db } = require("./firebaseAdmin");
const adminRoutes = require("./Routes/adminRoutes");
const pincode = require("./Modules/validPincode");
const path = require("path");
const pdf = require("html-pdf");
const axios = require("axios");
const featueRoutes = require("./Routes/featureRoutes");
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://annapoorna-mithais.onrender.com",
      "https://www.annapoornamithai.com/",
      "https://annapoorna-test-backend.onrender.com",
    ], // or your production frontend URL
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: true, // Allow any origin
//     credentials: true,
//   })
// );

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/menus", menuRoutes);
app.use("/customers", customerRoutes);
app.use("/admin", adminRoutes);
app.use("/feature", featueRoutes);

module.exports = app;
