require("dotenv").config({ path: "../config.env" });
const axios = require("axios");
const db = require("../Modules/mysql");

exports.getMenu = async (req, res, next) => {
  try {
    const apiKey = "AIzaSyAIYbbdYTIaMG1BXNDhHcsprSYJt-1v9ts";
    const spreadsheetId = "1V6IXsmmj9cS68L8GcCDInoxlL0H0dCkyJg16-boW0Fw";
    const range = "Sheet1"; // Only specify the sheet name to get all data
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}&majorDimension=ROWS`;
    const response = await axios.get(url);
    const data = response.data.values;

    // Format the data as required
    const formatWeight = (weights) => {
      return weights.map((weight) => {
        JSON.parse(weight);
      });
    };
    // const formattedData = data.slice(1).map((item) => ({
    //   hsn_code: item[0], // "21069099"
    //   category: item[1], // "Sweets"
    //   name: item[2], // "Kaju Katli | Kaju Barfi | Diamond Sweet"
    //   description: item[3], // "Crispy Cashew nuts soaked then grinded into fine dough and elegantly served with pure silver leaf."
    //   availability: item[4], // "Available"
    //   mrp: JSON.parse(item[5]), // {250G: '326', 500G: '651', 1KG: '1302'}
    //   selling_price: JSON.parse(item[6]), // {250G: '310', 500G: '620', 1KG: '1240'}
    //   discount_percent: item[7], // "5"
    //   life: item[8], // "10 Days"
    //   image: item[9].split(","), // "[img1,img2]"
    //   gst: item[10],
    //   weights: item[11].split(",,"),
    // }));
    const formattedData = data.slice(1).map((item) => ({
      hsn_code: item[0], // "21069099"
      category: item[1], // "Sweets"
      name: item[2], // "Kaju Katli | Kaju Barfi | Diamond Sweet"
      description: item[3], // "Crispy Cashew nuts soaked then grinded into fine dough and elegantly served with pure silver leaf."
      availability: item[4], // "Available"
      mrp: JSON.parse(item[5]), // {250G: '326', 500G: '651', 1KG: '1302'}
      selling_price: JSON.parse(item[6]), // {250G: '310', 500G: '620', 1KG: '1240'}
      discount_percent: item[7], // "5"
      life: item[8], // "10 Days"
      image: item[9].split(","), // "[img1,img2]"
      gst: item[10],
      weights: item[11]
        .split(",,")
        .map((weightStr) => {
          // Format and parse each weight entry as JSON
          try {
            const formattedStr = weightStr
              .replace(/(\w+):/g, '"$1":') // Quote keys
              .replace(/:\s*([\w\s]+)/g, (match, p1) => {
                // Add quotes to values with spaces or non-numeric characters
                return p1.trim().match(/^\d+$/)
                  ? `: ${p1.trim()}`
                  : `: "${p1.trim()}"`;
              });
            return JSON.parse(formattedStr);
          } catch (e) {
            console.error(`Error parsing weight entry: ${weightStr}`, e);
            return null; // Handle any invalid entries
          }
        })
        .filter(Boolean), // Remove any null entries from the array
    }));

    // Send the formatted data as response
    return res.status(200).json({ data: formattedData });
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
