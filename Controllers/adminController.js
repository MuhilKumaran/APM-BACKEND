const { default: axios } = require("axios");
const db = require("../Modules/mysql");
const bcrypt = require("bcrypt");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Promise-based query execution
    const sql = "SELECT email,password FROM admins WHERE email = ?";

    const result = await new Promise((resolve, reject) => {
      db.query(sql, [email], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    if (result.length === 0) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }
    const adminData = result[0];
    // const match = await bcrypt.compare(password, adminData.password);
    const match = password === adminData.password;
    if (!match) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid Password" });
    }

    return res
      .status(200)
      .json({ status: "success", message: "Login Successful" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "fail", message: "Error in Finding User" });
  }
};

exports.logoutAdmin = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
  });
};

exports.updateMenu = async (req, res) => {
  try {
    const { product_name, shelf_life } = req.body;
    // SQL query to update the shelf_life of the menu item
    const sql =
      "UPDATE menu_items SET product_info = JSON_SET(product_info, '$.shelf_life', ?) WHERE product_name = ?";

    const result = await new Promise((resolve, reject) => {
      db.query(sql, [shelf_life, product_name], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    if (result.affectedRows > 0) {
      return res
        .status(200)
        .json({ status: true, message: "Shelf life updated successfully" });
    } else {
      return res
        .status(404)
        .json({ status: false, message: "Menu item not found" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: "Error in updating menu item" });
  }
};
const orderProcessedMessage = async (messageData) => {
  console.log(messageData);
  const { mobile, userName, order_id } = messageData;

  const data = {
    apiKey: process.env.AISENSY_KEY,
    campaignName: "order_processed",
    destination: String("+91" + mobile), // Ensure mobile is a string
    userName: String(userName), // Ensure userName is a string
    templateParams: [
      String(userName),
      String(order_id), // Ensure the items are properly formatted as a single string
    ], // Array of template parameters must all be strings
    media: {
      url: "https://aisensy-project-media-library-stg.s3.ap-south-1.amazonaws.com/IMAGE/5f450b00f71d36faa1d02bc4/9884334_graffiti%20dsdjpg",
      filename: "APM",
    },
  };

  try {
    const response = await axios.post(
      "https://backend.aisensy.com/campaign/t1/api/v2",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
};

const orderShippedMessage = async (messageData) => {
  console.log(messageData);
  const { mobile, userName, order_id } = messageData;

  const data = {
    apiKey: process.env.AISENSY_KEY,
    campaignName: "order_shipped",
    destination: String("+91" + mobile), //  mobile is a string
    userName: String(userName), //  userName is a string
    templateParams: [String(userName), String(order_id)], // Array of template parameters must all be strings
    media: {
      url: "https://aisensy-project-media-library-stg.s3.ap-south-1.amazonaws.com/IMAGE/5f450b00f71d36faa1d02bc4/9884334_graffiti%20dsdjpg",
      filename: "APM",
    },
  };

  try {
    const response = await axios.post(
      "https://backend.aisensy.com/campaign/t1/api/v2",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
};

const orderRejectedMessage = async (messageData) => {
  console.log(messageData);
  const { mobile, userName, order_id } = messageData;

  const data = {
    apiKey: process.env.AISENSY_KEY,
    campaignName: "order_rejected",
    destination: String("+91" + mobile), //  mobile is a string
    userName: String(userName), //  userName is a string
    templateParams: [String(userName), String(order_id)], // Array of template parameters must all be strings
    media: {
      url: "https://aisensy-project-media-library-stg.s3.ap-south-1.amazonaws.com/IMAGE/5f450b00f71d36faa1d02bc4/9884334_graffiti%20dsdjpg",
      filename: "APM",
    },
  };

  try {
    const response = await axios.post(
      "https://backend.aisensy.com/campaign/t1/api/v2",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
};
const orderDeliveredMessage = async (messageData) => {
  console.log(messageData);
  const { mobile, userName, order_id } = messageData;

  const data = {
    apiKey: process.env.AISENSY_KEY,
    campaignName: "order_delivered",
    destination: String("+91" + mobile), //  mobile is a string
    userName: String(userName), //  userName is a string
    templateParams: [String(userName), String(order_id)], // Array of template parameters must all be strings
    media: {
      url: "https://aisensy-project-media-library-stg.s3.ap-south-1.amazonaws.com/IMAGE/5f450b00f71d36faa1d02bc4/9884334_graffiti%20dsdjpg",
      filename: "APM",
    },
  };

  try {
    const response = await axios.post(
      "https://backend.aisensy.com/campaign/t1/api/v2",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
};
exports.manageOrder = async (req, res) => {
  try {
    const { order_id, delivery_status } = req.body;
    const cancellation = 0;
    const sql = `UPDATE customer_orders SET order_status = ?,customer_cancellation = ? WHERE order_id = ?`;
    const updateResult = await new Promise((resolve, reject) => {
      db.query(
        sql,
        [delivery_status, cancellation, order_id],
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });

    const selectsql = "SELECT * FROM customer_orders WHERE order_id = ?";
    const result = await new Promise((resolve, reject) => {
      db.query(selectsql, [order_id], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
    const orderResult = result[0];
    console.log(orderResult);

    const messageData = {
      order_id,
      mobile: orderResult.mobile,
      userName: orderResult.name,
    };
    if (delivery_status === "processing") {
      orderProcessedMessage(messageData);
    } else if (delivery_status === "shipped") {
      orderShippedMessage(messageData);
    } else {
      orderDeliveredMessage(messageData);
    }

    return res.status(200).json({
      status: true,
      message: "Order status updated successfully",
      orderData: updateResult, // Return the updated order data
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      status: false,
      error: "Error in updating order status",
    });
  }
};
exports.getOrdersByDeliveryStatus = async (req, res) => {
  const { deliveryStatus } = req.body;
  try {
    const sql = "SELECT * FROM customer_orders WHERE order_status = ?";
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [deliveryStatus], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    // Return the fetched orders
    return res.status(200).json({
      status: true,
      message: "Orders by status retrieved successfully",
      result: result,
    });
  } catch (error) {
    console.error("Error retrieving orders:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to retrieve orders",
    });
  }
};

exports.getCancelOrders = async (req, res) => {
  try {
    const sql =
      "SELECT * FROM customer_orders WHERE order_status = 'cancelled'";
    const result = await new Promise((resolve, reject) => {
      db.query(sql, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
    return res.status(200).json({ status: true, result: result });
  } catch (error) {
    console.error("Error canceling orders:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to retrieve cancel-orders",
    });
  }
};
const refundInitiatedMessage = async (messageData) => {
  console.log(messageData);
  const { mobile, userName, order_id } = messageData;

  const data = {
    apiKey: process.env.AISENSY_KEY,
    campaignName: "refund_initiated",
    destination: String("+91" + mobile), //  mobile is a string
    userName: String(userName), //  userName is a string
    templateParams: [String(userName), String(order_id)], // Array of template parameters must all be strings
    media: {
      url: "https://aisensy-project-media-library-stg.s3.ap-south-1.amazonaws.com/IMAGE/5f450b00f71d36faa1d02bc4/9884334_graffiti%20dsdjpg",
      filename: "APM",
    },
  };

  try {
    const response = await axios.post(
      "https://backend.aisensy.com/campaign/t1/api/v2",
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
};
exports.cancelOrder = async (req, res) => {
  const { order_id } = req.body;
  try {
    const updateSQL =
      "UPDATE customer_orders SET order_status = ?,customer_cancellation=? WHERE order_id = ?";
    const result = await new Promise((resolve, reject) => {
      db.query(updateSQL, ["cancelled", 0, order_id], (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
    if (result.affectedRows > 0) {
      const response = axios.post(
        "https://annapoorna-test-backend.onrender.com/admin/refund-order",
        { order_id }
      );
      if ((await response).status === 200) {
        return res.status(200).json({
          status: true,
          message: "Order cancelled and refunded successfully",
        });
      } else {
        return res
          .status(400)
          .json({ status: false, message: "Refund Failed" });
      }
    }
    return res.status(404).json({ status: false, message: "Order Not Found" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "Error in Cancelling Order" });
  }
};

exports.refundOrder = async (req, res) => {
  const { order_id } = req.body;
  try {
    const refundSQL =
      "SELECT razorpay_payment_id, total_price , name, mobile FROM customer_orders WHERE order_id = ?";

    // Query to get the payment ID and total price
    const refundResult = await new Promise((resolve, reject) => {
      db.query(refundSQL, [order_id], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    // Ensure refundResult has data
    if (refundResult.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "Order not found" });
    }

    const orderResult = refundResult[0]; // Corrected this line
    const razorpayPaymentId = orderResult.razorpay_payment_id;
    const refundAmount = Math.floor(orderResult.total_price) * 100; // Amount in paise
    console.log("original amount : " + orderResult.total_price);
    console.log("refund Amount : " + refundAmount);
    if (razorpayPaymentId) {
      const refund = await razorpay.payments.refund(razorpayPaymentId, {
        amount: refundAmount,
        notes: { reason: "Order canceled by admin" },
      });
      const messageData = {
        order_id,
        mobile: orderResult.mobile,
        userName: orderResult.name,
      };
      orderRejectedMessage(messageData);
      refundInitiatedMessage(messageData);
      return res.status(200).json({
        message: " Refunded successfully",
        refund,
      });
    } else {
      return res
        .status(400)
        .json({ status: false, message: "Payment ID not found" });
    }
  } catch (error) {
    console.error("Error during refund:", error);
    return res
      .status(500)
      .json({ status: false, message: "Error in Refunding" });
  }
};
