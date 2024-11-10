const express = require("express");
const router = express.Router();
const customerController = require("../Controllers/customerController");
const authenticate = require("../Modules/auth");

router.route("/signup").post(customerController.signupCustomer);

router.route("/send-otp").post(customerController.sendOTP);

router
  .route("/verify-otp").post(customerController.verifyOtp);

router
  .route("/logout")
  .post(authenticate.authenticateCustomer, customerController.logoutCustomer);

router
  .route("/orders")
  .post(authenticate.authenticateCustomer, customerController.createOrder)
  .get(authenticate.authenticateCustomer, customerController.getOrders)
  .patch(customerController.cancelOrder);

router
  .route("/verify-order")
  .post(authenticate.authenticateCustomer, customerController.verifyOrder);

router.route("/refund-order").post(customerController.refundOrder);

router.route("/contact-us").post(customerController.sendContactUs);

router.route("/webhook").post(customerController.webhook);

module.exports = router;
