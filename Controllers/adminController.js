const { default: axios } = require("axios");
const db = require("../Modules/mysql");
const bcrypt = require("bcrypt");
const Razorpay = require("razorpay");
const nodemailer = require("nodemailer");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
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
const sendOrderProcessingEmail = async (messageData) => {
  try {
    // The HTML content of your email
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .email-header {
              text-align: center;
              padding: 10px;
              border-radius: 8px 8px 0 0;
            }
            .email-header h1 {
              color: #fc5757;
              margin: 0;
            }
            .email-body {
              padding: 20px;
              line-height: 1.6;
            }
            .email-body p {
              margin: 0 0 10px;
            }
            .email-footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #888888;
            }
            .btn {
              display: inline-block;
              background-color: #007bff;
              color: #ffffff;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Annapoorna Mithai</h1>
            </div>
            <div class="email-body">
              <p>Hi <strong>${messageData.userName}</strong>,</p>
              <p>
                Your order with Order ID: <strong>${messageData.order_id}</strong> is now being
                processed.
              </p>
              <p>
                You can check the details of your order by clicking the button below:
              </p>
              <p><a href="https://www.annapoornamithai.com/orders" class="btn">View Order Details</a></p>
              <p>
                Thank you for your patience and for choosing
                <strong>Annapoorna Mithai</strong>!
              </p>
            </div>
            <div class="email-footer">
              <p>If you have any questions, feel free to reach out.</p>
              <p>&copy; 2024 Annapoorna Mithai</p>
            </div>
          </div>
        </body>
      </html>
      `;

    // Email options
    const mailOptions = {
      from: process.env.GMAIL_USER, // Sender's email address
      to: messageData.email, // Receiver's email address
      subject: "Order Update: Your Order is Being Processed!",
      html: emailHtml, // HTML body of the email
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Order processing email sent successfully");
  } catch (error) {
    console.error("Error sending order processing email:", error);
  }
};
const sendOrderShippedEmail = async (messageData) => {
  try {
    // The HTML content of your email
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .email-header {
              text-align: center;
              padding: 10px;
              border-radius: 8px 8px 0 0;
            }
            .email-header h1 {
              color: #fc5757;
              margin: 0;
            }
            .email-body {
              padding: 20px;
              line-height: 1.6;
            }
            .email-body p {
              margin: 0 0 10px;
            }
            .email-footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #888888;
            }
            .btn {
              display: inline-block;
              background-color: #007bff;
              color: #ffffff;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Annapoorna Mithai</h1>
            </div>
            <div class="email-body">
              <p>Hi <strong>${messageData.userName}</strong>,</p>
              <p>Good News! Your order with Order ID: <strong>${messageData.order_id}</strong> has been shipped and is on its way!</p>
              <p>Thank you for choosing <strong>Annapoorna Mithai</strong>!</p>
            </div>
            <div class="email-footer">
              <p>If you have any questions, feel free to reach out.</p>
              <p>&copy; 2024 Annapoorna Mithai</p>
            </div>
          </div>
        </body>
      </html>
      `;

    // Email options
    const mailOptions = {
      from: process.env.GMAIL_USER, // Sender's email address
      to: messageData.email, // Receiver's email address
      subject: "Your Order is On the Way!",
      html: emailHtml, // HTML body of the email
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Order shipped email sent successfully");
  } catch (error) {
    console.error("Error sending order shipped email:", error);
  }
};

const sendOrderDeliveredEmail = async (messageData) => {
  try {
    // The HTML content of your email
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .email-header {
              text-align: center;
              padding: 10px;
              border-radius: 8px 8px 0 0;
            }
            .email-header h1 {
              color: #fc5757;
              margin: 0;
            }
            .email-body {
              padding: 20px;
              line-height: 1.6;
            }
            .email-body p {
              margin: 0 0 10px;
            }
            .email-footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #888888;
            }
            .btn {
              display: inline-block;
              background-color: #007bff;
              color: #ffffff;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Annapoorna Mithai</h1>
            </div>
            <div class="email-body">
              <p>Hi <strong>${messageData.userName}</strong>,</p>
              <p>
                We’re pleased to inform you that your order with Order ID:
                <strong>${messageData.order_id}</strong> has been delivered successfully!
              </p>
              <p>
                We’d love it if you could rate us on Google by clicking the button below:
              </p>
              <p>
                <a href="https://g.page/r/CTnQnXTmaaGVEBM/review" class="btn">Rate Us on Google</a>
              </p>
              <p>
                Thank you for choosing <strong>Annapoorna Mithai</strong>!
              </p>
            </div>
            <div class="email-footer">
              <p>If you have any questions, feel free to reach out.</p>
              <p>&copy; 2024 Annapoorna Mithai</p>
            </div>
          </div>
        </body>
      </html>
      `;

    // Email options
    const mailOptions = {
      from: process.env.GMAIL_USER, // Sender's email address
      to: messageData.email, // Receiver's email address
      subject: "Your Order Has Been Delivered Successfully!",
      html: emailHtml, // HTML body of the email
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Order delivered email sent successfully");
  } catch (error) {
    console.error("Error sending order delivered email:", error);
  }
};

const sendOrderRejectedEmail = async (messageData) => {
  try {
    // The HTML content of your email
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .email-header {
              text-align: center;
              padding: 10px;
              border-radius: 8px 8px 0 0;
            }
            .email-header h1 {
              color: #fc5757;
              margin: 0;
            }
            .email-body {
              padding: 20px;
              line-height: 1.6;
            }
            .email-body p {
              margin: 0 0 10px;
            }
            .email-footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #888888;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Annapoorna Mithai</h1>
            </div>
            <div class="email-body">
              <p>Hi <strong>${messageData.userName}</strong>,</p>
              <p>
                We regret to inform you that your order with Order ID:
                <strong>${messageData.order_id}</strong> has been rejected.
              </p>
              <p>Your refund will be initiated soon.</p>
              <p>
                If you have any questions or need assistance, please feel free to
                reach out at <a href="mailto:support@annapoornamithai.com">support@annapoornamithai.com</a>.
              </p>
              <p>
                Thank you for your understanding and for choosing
                <strong>Annapoorna Mithai</strong>.
              </p>
            </div>
            <div class="email-footer">
              <p>&copy; 2024 Annapoorna Mithai</p>
            </div>
          </div>
        </body>
      </html>
      `;

    // Email options
    const mailOptions = {
      from: process.env.GMAIL_USER, // Sender's email address
      to: messageData.email, // Receiver's email address
      subject: "Your Order Has Been Rejected",
      html: emailHtml, // HTML body of the email
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Order rejected email sent successfully");
  } catch (error) {
    console.error("Error sending order rejected email:", error);
  }
};

const orderProcessedMessage = async (messageData) => {
  console.log(messageData);
  const { mobile, userName, order_id } = messageData;

  const data = {
    apiKey: process.env.AISENSY_KEY,
    campaignName: "apm_order_processed_v2",
    destination: String("+91" + mobile), // Ensure mobile is a string
    userName: String(userName), // Ensure userName is a string
    templateParams: [
      String(userName),
      String(order_id), // Ensure the items are properly formatted as a single string
    ], // Array of template parameters must all be strings
    media: {
      url: "https://raw.githubusercontent.com/Warlord09/annapoorna-images/refs/heads/main/order_processed.png",
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
    console.log("Order Processed Message:");
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
    campaignName: "apm_order_shipped_v2",
    destination: String("+91" + mobile), //  mobile is a string
    userName: String(userName), //  userName is a string
    templateParams: [String(userName), String(order_id)], // Array of template parameters must all be strings
    media: {
      url: "https://raw.githubusercontent.com/Warlord09/annapoorna-images/refs/heads/main/order_shipped.png",
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
    console.log("Order Shipped message:");
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
    campaignName: "apm_order_rejected_v2",
    destination: String("+91" + mobile), //  mobile is a string
    userName: String(userName), //  userName is a string
    templateParams: [String(userName), String(order_id)], // Array of template parameters must all be strings
    media: {
      url: "https://raw.githubusercontent.com/Warlord09/annapoorna-images/refs/heads/main/order_rejected.png",
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
    console.log("Order rejected message:");
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
    campaignName: "apm_order_delivered_v2",
    destination: String("+91" + mobile), //  mobile is a string
    userName: String(userName), //  userName is a string
    templateParams: [String(userName), String(order_id)], // Array of template parameters must all be strings
    media: {
      url: "https://raw.githubusercontent.com/Warlord09/annapoorna-images/refs/heads/main/order_delivered.png",
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
    console.log("Order delevired message:");
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
    const dateField = {
      processing: "processing_date",
      shipped: "shipped_date",
      delivered: "delivered_date",
    };
    const date_update = dateField[delivery_status];
    const cancellation = 0;

    const currentDate = new Date();
    // const currentDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

    // Extract the day, month, and year

    const sql = `UPDATE customer_orders SET order_status = ?,customer_cancellation = ?,${date_update} = ? WHERE order_id = ?`;
    console.log(sql);
    const updateResult = await new Promise((resolve, reject) => {
      db.query(
        sql,
        [delivery_status, cancellation, currentDate, order_id],
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
      email: orderResult.email,
    };
    if (delivery_status === "processing") {
      orderProcessedMessage(messageData);
      // sendOrderProcessingEmail(messageData);
    } else if (delivery_status === "shipped") {
      orderShippedMessage(messageData);
      //  sendOrderShippedEmail(messageData);
    } else if (delivery_status === "delivered") {
      orderDeliveredMessage(messageData);
      // sendOrderDeliveredEmail(messageData);
    } else {
      orderCancelledMessage(messageData);
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
    campaignName: "apm_refund_initiated_v2",
    destination: String("+91" + mobile), //  mobile is a string
    userName: String(userName), //  userName is a string
    templateParams: [String(userName), String(order_id)], // Array of template parameters must all be strings
    media: {
      url: "https://raw.githubusercontent.com/Warlord09/annapoorna-images/refs/heads/main/refund_initiated.png",
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
    console.log("Refund Initiated message:");
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
        "https://www.annapoornamithai.com/admin/refund-order",
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
        email: orderResult.email,
      };
      orderRejectedMessage(messageData);
      refundInitiatedMessage(messageData);
      //  sendOrderRejectedEmail(messageData);

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
