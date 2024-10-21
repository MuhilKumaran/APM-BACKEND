const axios = require("axios");
const db = require("../Modules/mysql");
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
  const { pincode } = req.body;
  console.log(pincode);
  try {
    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`
    );

    console.log(response);
    const postOffices = response.data[0]?.PostOffice || [];
    if (postOffices.length > 0) {
      const state = postOffices[0].State;
      const district = postOffices[0].District;
      console.log("hii");
      // Check if the state is Tamil Nadu, Karnataka, or Kerala
      if (!["Tamil Nadu", "Karnataka", "Kerala"].includes(state)) {
        const pincodeData = {
          pincode: pincode,
          state: state,
          district: district,
        };

        const pincodeRef = db.collection("pincodes").doc();
        await pincodeRef.set(pincodeData);
        const deliveryFee = state == "Tamil Nadu" ? 100 : 150;
        return res.status(400).json({
          status: false,
          message: "Not deliverable",
          state,
          deliveryFee,
        });
      }
    } else {
      return res
        .status(400)
        .json({ status: false, message: "Invalid PinCode" });
    }
    return res
      .status(200)
      .json({ status: true, message: " Delivery Available" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching pincode data" });
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

exports.viewOrder = async (req, res) => {
  const { inputdate } = req.body;
  try {
    const sql = `SELECT order_id, received_date, processing_date, shipped_date, delivered_date , address, name , order_status
    FROM customer_orders
    WHERE DATE(received_date) = ?
     OR DATE(processing_date) = ?
     OR DATE(shipped_date) = ?
     OR DATE(delivered_date) = ? `;
    console.log(sql);
    const selectResult = await new Promise((resolve, reject) => {
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
    return res.status(200).json({ status: true, result: selectResult });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: "Error in updating order status",
    });
  }
};

exports.downloadReport = async (req, res) => {
  const { inputdate } = req.body;
  try {
    const sql = `SELECT order_id, received_date, processing_date, shipped_date, delivered_date , address, name , order_status
    FROM customer_orders
    WHERE DATE(received_date) = ?
     OR DATE(processing_date) = ?
     OR DATE(shipped_date) = ?
     OR DATE(delivered_date) = ? `;
    console.log(sql);
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

    // Add rows to the worksheet
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

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="orders-report.xlsx"'
    );

    // Write the Excel file to the response
    workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: "Error in updating order status",
    });
  }
};
