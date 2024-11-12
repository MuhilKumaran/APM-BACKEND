const axios = require("axios");
const db = require("../Modules/mysql");
const ExcelJS = require("exceljs");

exports.comparePrice = async (req, res) => {
  const { minimumOrderValue, cartValue } = req.body;

  if (cartValue >= minimumOrderValue) {
    res.json({
      status: true,
      message: "Cart value meets the minimum order requirement.",
    });
  } else {
    res.json({
      status: false,
      message: "Cart value is below the minimum order requirement.",
    });
  }
};

exports.checkPincode = async (req, res) => {
  const apiKey = "AIzaSyAIYbbdYTIaMG1BXNDhHcsprSYJt-1v9ts";
  const spreadsheetId = "1seqdcQeeqDWpc3IX0Q-of96ED-WoQT341st-g8vzDKs";
  const range = "Sheet1";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}&majorDimension=ROWS`;
  const { pincode } = req.body;
  console.log(pincode);
  if (!pincode) {
    return res
      .status(400)
      .json({ status: false, message: "Pincode is Required" });
  }
  try {
    const response = await axios.get(url);
    const data = response.data.values;

    const foundItem = data.find((item) => item[1] == pincode);
    console.log(foundItem);
    if (foundItem) {
      return res
        .status(200)
        .json({ status: true, message: "Delivery Available" });
    } else {
      return res
        .status(404)
        .json({ status: false, message: "Delivery Not Available" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: "Error fetching pincode data" });
  }
};

exports.getPrice = async (req, res) => {
  const { totalAmount, taxPercentage, discountPercentage, deliveryFee } =
    req.body;

  const taxAmount = (totalAmount * taxPercentage) / 100;

  const discountAmount = (totalAmount * discountPercentage) / 100;

  const finalAmount = totalAmount + taxAmount - discountAmount + deliveryFee;

  res.json({
    totalAmount,
    taxAmount,
    discountAmount,
    deliveryFee,
    finalAmount,
  });
};

exports.viewReport = async (req, res) => {
  const { inputdate } = req.body;
  console.log(inputdate);

  try {
    if (!inputdate) {
      return res
        .status(400)
        .json({ status: false, message: "Please provide a valid date." });
    }

    const sql = `
      SELECT order_id, received_date, processing_date, shipped_date, delivered_date , address, name , order_status
      FROM customer_orders
      WHERE DATE(received_date) = ?
       OR DATE(processing_date) = ?
       OR DATE(shipped_date) = ?
       OR DATE(delivered_date) = ? `;
    const result = await new Promise((resolve, reject) => {
      db.query(
        sql,
        [inputdate, inputdate, inputdate, inputdate],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
    res.status(200).json({ status: true, result: result });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: "Error in Getting Report",
    });
  }
};

exports.downloadReport = async (req, res) => {
  console.log("in download-report");
  console.log(req.body);
  const { inputdate } = req.body; // Get single date input from user
  console.log(inputdate);
  // Validate input
  try {
    if (!inputdate) {
      return res
        .status(400)
        .json({ status: false, message: "Please provide a valid date." });
    }

    const sql = `
      SELECT order_id, received_date, processing_date, shipped_date, delivered_date , address, name , order_status
      FROM customer_orders
      WHERE DATE(received_date) = ?
       OR DATE(processing_date) = ?
       OR DATE(shipped_date) = ?
       OR DATE(delivered_date) = ? `;
    const results = await new Promise((resolve, reject) => {
      db.query(
        sql,
        [inputdate, inputdate, inputdate, inputdate],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders Report");

    // Define columns for the worksheet
    worksheet.columns = [
      { header: "Order ID", key: "order_id", width: 15 },
      { header: "Name", key: "name", width: 15 },
      { header: "Address", key: "address", width: 30 },
      { header: "Received Date", key: "received_date", width: 20 },
      { header: "Processing Date", key: "processing_date", width: 20 },
      { header: "Shipped Date", key: "shipped_date", width: 20 },
      { header: "Delivered Date", key: "delivered_date", width: 20 },
      { header: "Order Status", key: "order_status", width: 15 },
    ];

    results.forEach((order) => {
      worksheet.addRow({
        order_id: order.order_id,
        name: order.name,
        address: order.address,
        received_date: order.received_date ? order.received_date : "-",
        processing_date: order.processing_date ? order.processing_date : "-",
        shipped_date: order.shipped_date ? order.shipped_date : "-",
        delivered_date: order.delivered_date ? order.delivered_date : "-",
        order_status: order.order_status,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="orders-report.xlsx"'
    );

    workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: "Error in Getting Report",
    });
  }
};

// exports.viewReport = async (req, res) => {
//   const { inputdate } = req.body; // Get single date input from user
//   console.log(inputdate);
//   // Validate input
//   try {
//     if (!inputdate) {
//       return res.status(400).send("Please provide a valid date.");
//     }

//     const sql = `
//       SELECT order_id, received_date, processing_date, shipped_date, delivered_date , address, name , order_status
//       FROM customer_orders
//       WHERE DATE(received_date) = ?
//        OR DATE(processing_date) = ?
//        OR DATE(shipped_date) = ?
//        OR DATE(delivered_date) = ? `;
//     const result = await new Promise((resolve, reject) => {
//       db.query(
//         sql,
//         [inputdate, inputdate, inputdate, inputdate],
//         (err, result) => {
//           if (err) {
//             return reject(err);
//           }
//           resolve(result);
//         }
//       );
//     });
//     res.status(200).json({ status: true, result: result });
//   } catch (error) {
//     return res.status(500).json({
//       status: false,
//       error: "Error in Getting Report",
//     });
//   }
// };

// exports.downloadReport = async (req, res) => {
//   console.log("in download-report");
//   console.log(req.body);
//   const { inputdate } = req.body; // Get single date input from user
//   console.log(inputdate);
//   // Validate input
//   try {
//     if (!inputdate) {
//       return res.status(400).send("Please provide a valid date.");
//     }

//     const sql = `
//       SELECT order_id, received_date, processing_date, shipped_date, delivered_date , address, name , order_status
//       FROM customer_orders
//       WHERE DATE(received_date) = ?
//        OR DATE(processing_date) = ?
//        OR DATE(shipped_date) = ?
//        OR DATE(delivered_date) = ? `;
//     const results = await new Promise((resolve, reject) => {
//       db.query(
//         sql,
//         [inputdate, inputdate, inputdate, inputdate],
//         (err, result) => {
//           if (err) {
//             return reject(err);
//           }
//           resolve(result);
//         }
//       );
//     });
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Orders Report");

//     // Define columns for the worksheet
//     worksheet.columns = [
//       { header: "Order ID", key: "order_id", width: 15 },
//       { header: "Name", key: "name", width: 15 },
//       { header: "Address", key: "address", width: 30 },
//       { header: "Received Date", key: "received_date", width: 20 },
//       { header: "Processing Date", key: "processing_date", width: 20 },
//       { header: "Shipped Date", key: "shipped_date", width: 20 },
//       { header: "Delivered Date", key: "delivered_date", width: 20 },
//       { header: "Order Status", key: "order_status", width: 15 },
//     ];

//     results.forEach((order) => {
//       worksheet.addRow({
//         order_id: order.order_id,
//         name: order.name,
//         address: order.address,
//         received_date: order.received_date ? order.received_date : "-",
//         processing_date: order.processing_date ? order.processing_date : "-",
//         shipped_date: order.shipped_date ? order.shipped_date : "-",
//         delivered_date: order.delivered_date ? order.delivered_date : "-",
//         order_status: order.order_status,
//       });
//     });

//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader(
//       "Content-Disposition",
//       'attachment; filename="orders-report.xlsx"'
//     );

//     workbook.xlsx.write(res).then(() => {
//       res.end();
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       status: false,
//       error: "Error in Getting Report",
//     });
//   }
// };
