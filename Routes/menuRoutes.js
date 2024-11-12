const express = require("express");
const router = express.Router();
const menuController = require("../Controllers/menuController");

router.route("/menuItems").get(menuController.getMenu)

module.exports=router;