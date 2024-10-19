const express = require("express");
const router = express.Router();
const featureController = require("../Controllers/featureController");

router.route("/comparePrice").post(featureController.comparePrice);
router.route("/getTotalprice").post(featureController.getPrice);
router.route("/checkPincode").post(featureController.checkPincode);
module.exports = router;
