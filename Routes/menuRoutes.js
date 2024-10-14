const express = require("express");
const router = express.Router();
const menuController = require("../Controllers/menuContoller");

router.route("/").get(menuController.getMenu)

module.exports=router;