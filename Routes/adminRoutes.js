const express = require("express");
const router = express.Router();
const adminController = require("../Controllers/adminController");

//  router.route("/signup").post(adminController.signUpAdmin);
router.route("/login").post(adminController.loginAdmin);
router.route("/logout").post(adminController.logoutAdmin);  
router.route("/updateMenu").put(adminController.updateMenu); 

router
  .route("/manage-orders")
  .patch(adminController.manageOrder)
  .post(adminController.getOrdersByDeliveryStatus);

router
  .route("/cancel-order").patch(adminController.cancelOrder);

router
  .route("/refund-order")
  .post(adminController.refundOrder)
  

module.exports = router;
