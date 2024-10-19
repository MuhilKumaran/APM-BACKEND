require("dotenv").config({ path: "../config.env" });

const db = require("../Modules/mysql");
// const db = require("../firebaseAdmin");
//retrive menu in db
exports.getMenu = async (req, res, next) => {
  try {
    const sql = "SELECT product_info,image FROM menu_items";
    const result = await new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
    if (result.image) {
      result.image = result.image.toString("base64");
    }
    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error in listing menus" });
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const { product_name, shelf_life } = req.body;
    // SQL query to update the shelf_life of the menu item
    const sql =
      "UPDATE menu_items SET product_info = JSON_SET(product_info, '$.shelf_life', ?) WHERE product_name = ?";
    // Execute the SQL query with the given parameters
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [shelf_life, product_name], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    // Check if the update was successful
    if (result.affectedRows > 0) {
      return res
        .status(200)
        .json({ message: "Shelf life updated successfully" });
    } else {
      return res.status(404).json({ message: "Menu item not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error in updating menu item" });
  }
};
