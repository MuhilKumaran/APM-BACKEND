require("dotenv").config({ path: "../config.env" });
const db = require("../Modules/mysql");
const fs = require("fs");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;
const Razorpay = require("razorpay");
const pdf = require("html-pdf");
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");
// const { executablePath } = require("puppeteer");

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

exports.signupCustomer = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    const sql =
      "INSERT INTO customers (name,mobile,email,password) VALUES (?,?,?,?)";
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [name, mobile, email, hashPassword], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });

    return res.status(201).json({
      status: true,
      type: "Sign Up",
      message: "Sign Up Successful",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: false, message: "Error inserting customer details" });
  }
};
// Function to generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// exports.sendOTP = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const otp = generateOTP();
//     console.log(otp);

//     const sql = `INSERT INTO login_otp (email, otp)
//                  VALUES (?, ?)
//                  ON DUPLICATE KEY UPDATE
//                  otp = VALUES(otp)`;
//     const result = await new Promise((resolve, reject) => {
//       db.query(sql, [email, otp], (err, result) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(result);
//       });
//     });

//     // Configure the email transport
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.GMAIL_USER,
//         pass: process.env.GMAIL_PASS,
//       },
//     });

//     // Read the HTML template
//     const templatePath = path.join(__dirname, "otpTemplate.html");
//     let htmlTemplate = fs.readFileSync(templatePath, "utf-8");

//     htmlTemplate = htmlTemplate.replace("{{OTP}}", otp);

//     // Send email
//     const mailOptions = {
//       from: process.env.GMAIL_USER,
//       to: email,
//       subject: "Your OTP for Login to Annapoorna Mithai",
//       html: htmlTemplate,
//     };

//     await transporter.sendMail(mailOptions);

//     console.log("OTP sent successfully via email");

//     res.json({
//       status: true,
//       message: "OTP sent successfully",
//       otp: otp, // Optionally return the OTP for testing purposes, but remove this in production
//     });
//   } catch (error) {
//     console.error("Error sending OTP:", error.message);
//     res.status(500).json({
//       status: false,
//       message: "Error sending OTP.",
//     });
//   }
// };

exports.sendOTP = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res
      .status(400)
      .json({ status: false, message: "All Details Were Needed" });
  }
  try {
    const data = {
      template_id: process.env.MSG_91_OTP_TEMPLATE, // Confirm this is the correct template ID
      mobile: `91${mobile}`, // Ensure mobile includes country code (India: 91)
      authkey: process.env.MSG_91_AUTH, // Your Msg91 API key
      sender: process.env.MSG_91_SENDER, // Approved DLT sender ID (6 characters)                    // Use provided OTP or let Msg91 auto-generate
      otp_length: "6", // Optional: Default OTP length is 6
    };
    const response = await axios.post(
      "https://api.msg91.com/api/v5/otp",
      data,
      {
        headers: {
          "Content-Type": "application/json",
          authkey: process.env.MSG_91_AUTH,
        },
      }
    );
    if (response.status === 200) {
      return res.status(200).json({
        status: true,
        message: "OTP sent successfully",
        data: response.data,
      });
    } else {
      return res.status(response.status).json({
        status: false,
        message: "Failed to send OTP",
        error: response.data,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Error sending OTP.",
    });
  }
};
// exports.verifyOtp = async (req, res) => {
//   console.log("Incoming request:", req.body);

//   const { email, otp } = req.body;

//   try {
//     const sql = "SELECT * FROM login_otp WHERE email = ?";

//     const result = await new Promise((resolve, reject) => {
//       db.query(sql, [email], (err, result) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(result);
//       });
//     });

//     if (result.length === 0) {
//       return res.status(404).json({ status: false, message: "OTP not found" });
//     }

//     const userRecord = result[0];
//     // Validate the OTP
//     if (userRecord.otp !== otp) {
//       return res.status(400).json({ status: false, message: "Invalid OTP" });
//     }

//     // OTP is valid, generate JWT token
// const token = jwt.sign(
//   {
//     email: userRecord.email,
//   },
//   SECRET_KEY
// { expiresIn: "1h" } // Optionally set token expiration
// );
//     const deleteSQL = "DELETE FROM login_otp WHERE email = ?";
//     const deleteResult = await new Promise((resolve, reject) => {
//       db.query(deleteSQL, [email], (err, result) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve(result);
//       });
//     });

//     console.log("OTP verification successful:", userRecord);

//     // Send success response with JWT token
//     return res.status(200).json({
//       status: true,
//       message: "Login Successful",
//       token,
//       user: {
//         email: userRecord.email,
//       },
//     });
//   } catch (error) {
//     console.error("Error verifying OTP:", error.message);

//     // Send error response to client
//     return res.status(500).json({
//       status: false,
//       message: "OTP verification failed",
//       error: error.message,
//     });
//   }
// };

exports.verifyOtp = async (req, res) => {
  const { otp, mobile } = req.body;
  if (!otp || !mobile) {
    return res
      .status(400)
      .json({ status: false, message: "All Details Were Needed" });
  }
  try {
    const options = {
      method: "GET",
      url: "https://control.msg91.com/api/v5/otp/verify",
      params: {
        otp: otp, // OTP to verify
        mobile: `91${mobile}`, // Ensure mobile number has the correct country code
      },
      headers: {
        authkey: "432528AQaOjCQFNn67125dc2P1", // Your Msg91 API key
      },
    };
    const { data } = await axios.request(options);

    // Check if OTP is successfully verified
    if (data.type === "success") {
      const token = jwt.sign(
        {
          mobile,
        },
        SECRET_KEY
        // { expiresIn: "1h" } // Optionally set token expiration
      );
      return res.status(200).json({
        status: true,
        message: "OTP matched successfully",
        data: data,
        token,
        user: {
          mobile: mobile,
        },
      });
    } else {
      // If the OTP did not match or there's another issue
      return res.status(400).json({
        status: false,
        message: "OTP not Match",
        error: data,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "OTP verification failed",
      error: error.message,
    });
  }
};
exports.logoutCustomer = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
  });
  return res
    .status(200)
    .json({ status: true, message: "Logged out successfully" });
};

const orderReceivedMessage = async (messageData) => {
  console.log(messageData);
  const {
    mobile, // Customer's mobile number
    adminMobile, // Admin's mobile number
    userName, // Customer's name
    order_id,
  } = messageData;

  const commonData = {
    apiKey: process.env.AISENSY_KEY,
    campaignName: "apm_order_received_bill_v2",
    templateParams: [String(userName), String(order_id)],
    media: {
      url: "https://raw.githubusercontent.com/Warlord09/annapoorna-images/refs/heads/main/order_received.png",
      filename: "APM",
    },
  };

  // Send message to customer
  const customerData = {
    ...commonData,
    destination: String("+91" + mobile), // Customer's mobile number
    userName: String(userName), // Customer's name
  };

  // Send message to admin
  const adminData = {
    ...commonData,
    destination: String(adminMobile), // Admin's mobile number
    userName: "Admin", // Admin's name or identifier
  };

  try {
    // Send message to customer
    const customerResponse = await axios.post(
      "https://backend.aisensy.com/campaign/t1/api/v2",
      customerData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Order received message:");

    console.log(
      "Message sent to customer successfully:",
      customerResponse.data
    );

    // Send message to admin
    const adminResponse = await axios.post(
      "https://backend.aisensy.com/campaign/t1/api/v2",
      adminData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Message sent to admin successfully:", adminResponse.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
};

const sendOrderReceivedEmail = async (messageData) => {
  try {
    // HTML content of the email
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .email-header {
                  text-align: center;
                  background-color: #ff9800;
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
                  background-color: #ff9800;
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
                  <p>We're happy to let you know that we've received your order with the Order ID: <strong>${messageData.order_id}</strong>.</p>
                  <p>You can check the details of your order by clicking the button below:</p>
                  <p><a href="http://www.tst.annapoornamithai.com/orders" class="btn">View Order Details</a></p>
                  <p>Thank you for choosing <strong>Annapoorna Mithai</strong>! We truly appreciate your trust in us and are excited to serve you.</p>
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
      from: process.env.GMAIL_USER, // Sender address
      to: messageData.email, // Receiver's email
      subject: "Order Status Update: We’ve Received Your Order!",
      html: emailHtml, // HTML email body
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Order received email sent successfully");
  } catch (error) {
    console.error("Error sending order received email:", error);
  }
};

exports.createOrder = async (req, res) => {
  console.log("body in create order Route");
  console.log(req.body);
  console.log("user in create order Route");
  console.log(req.user);
  const { totalPrice } = req.body;

  if (!totalPrice)
    return res.status(400).json({ status: false, message: "Amount is Needed" });

  const options = {
    amount: Math.round(totalPrice * 100),
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    if (!order)
      return res
        .status(500)
        .json({ status: false, message: "Error in Creating Payment" });
    return res.status(201).json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, message: "Error placing order" });
  }
};

// exports.verifyOrder = async (req, res) => {
//   const {
//     orderId,
//     paymentId,
//     razorpayOrderId,
//     razorpaySignature,
//     orderItems,
//     totalAmount,
//     email,
//     userName,
//     address,
//     mobile,
//     gst,
//     delivery,
//     user_mobile,
//     preorderDate,
//   } = req.body;

//   console.log("body in verify order route:", req.body);
//   console.log(orderItems);
//   const generatedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//     .update(`${razorpayOrderId}|${paymentId}`)
//     .digest("hex");

//   const finalTotalAmount = Number(totalAmount) + Number(gst) + Number(delivery);

//   if (generatedSignature === razorpaySignature) {
//     try {
//       console.log("Hash verified");
//       const preOrderDate = preorderDate || null;
//       const currentDate = new Date();
//       // Fetch the number of documents in the 'orders' collection
//       const isCancel = true;
//       const cancellation = isCancel ? 1 : 0;
//       const sql =
//         "INSERT INTO customer_orders (transaction_id, name, mobile, address,order_items,total_price,created_at,preorder_date,payment_status,order_status,user_mobile,customer_cancellation,razorpay_payment_id,razorpay_order_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
//       const result = await new Promise((resolve, reject) => {
//         db.query(
//           sql,
//           [
//             orderId,
//             userName,
//             mobile,
//             address,
//             JSON.stringify(orderItems),
//             finalTotalAmount,
//             currentDate,
//             preOrderDate,
//             "paid",
//             "received",
//             user_mobile,
//             cancellation,
//             paymentId,
//             razorpayOrderId,
//           ],
//           (err, result) => {
//             if (err) {
//               return reject(err);
//             }
//             resolve(result);
//           }
//         );
//       });

//       const sqlId = `SELECT order_id FROM customer_orders WHERE transaction_id = ?`;
//       const resultId = await new Promise((resolve, reject) => {
//         db.query(sqlId, [orderId], (err, result) => {
//           if (err) {
//             return reject(err);
//           }
//           resolve(result);
//         });
//       });

//       const order_id = resultId[0].order_id;
//       const billData = {
//         orderIdrec: order_id,
//         orderDate: currentDate,
//         preOrderDate: preOrderDate,
//         paymentMethod: "Online",
//         customerName: userName,
//         customerAddress: address,
//         customerMobile: mobile,
//         customerEmail: email,
//         orderItems: orderItems,
//         itemTotal: totalAmount,
//         finalAmount: finalTotalAmount,
//       };
//       const {
//         orderIdrec,
//         orderDate,
//         paymentMethod,
//         customerName,
//         customerAddress,
//         customerMobile,
//         customerEmail,
//         itemTotal,
//         finalAmount,
//       } = billData;

//       console.log("bill data:", billData);
//       const recipt = ` <!DOCTYPE html>
//   <html lang="en">
//     <head>
//       <meta charset="UTF-8" />
//       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//       <title>Invoice</title>
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           margin: 0;
//           padding: 20px;
//           background-color: #f4f4f4;
//           font-size: 8px;
//         }
//         .invoice {
//           background-color: #fff;
//           padding: 15px;
//           margin: 0 auto;
//           max-width: 500px;
//           border-radius: 8px;
//           box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
//         }
//         .details-container {
//           display: flex;
//           justify-content: space-between;
//         }
//         .order-details {
//           width: 48%;
//         }
//         .order-summary table {
//           width: 100%;
//           border-collapse: collapse;
//         }
//         .line {
//           border-bottom: 1px solid #000;
//         }
//         .order-summary th,
//         .order-summary td {
//           padding: 6px;
//           text-align: left;
//         }
//         .order-summary tfoot td {
//           font-weight: bold;
//         }
//         .lineup {
//           border-top: 1px solid #000;
//         }
//         .order-summary tfoot tr:last-child td {
//           font-size: 1.1em;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="invoice">
//         <div class="company-details">
//           <h3>Annapoorna Mithai</h3>
//           <p>
//             Annapoorna Mithai, 12/2, Ramnagar, Bypass road, Madurai <br />
//             Contact: annapoornamithai@gmail.com "&nbsp;" "&nbsp;" GSTIN - 33BCTPA8028E2ZP
//           </p>
//         </div>
//         <hr />
//         <div class="details-container">
//           <div class="order-details">
//             <h3>Order details</h3>
//             <p>Order Id : ${orderIdrec}</p>
//             <p>Order Date : ${orderDate}</p>
//             <p>Payment: ${paymentMethod}</p>
//             ${preOrderDate ? `<p>Pre-Order Date: ${preOrderDate}</p>` : ""}
//           </div>
//           <div class="customer-details">
//             <h3>Customer details</h3>
//             <p>
//               Name: ${customerName}<br />
//               Address: ${customerAddress}<br />
//               Mobile: ${customerMobile}<br />
//               Email: ${customerEmail}
//             </p>
//           </div>
//         </div>
//         <div class="order-summary">
//           <h3>Order summary</h3>
//           <hr />
//           <table>
//             <thead>
//               <tr class="line">
//                 <th>Item</th>
//                 <th>Qty</th>
//                 <th>Price</th>
//                 <th>Total Amount</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${orderItems
//                 .map(
//                   (item) => `
//                 <tr>
//                   <td>${item.name}</td>
//                   <td>${item.quantity}</td>
//                   <td>₹${(Number(item.price) / item.quantity).toFixed(2)}</td>
//                   <td>₹${item.price}</td>
//                 </tr>
//               `
//                 )
//                 .join("")}
//             </tbody>
//             <tfoot>
//               <tr class="lineup">
//                 <td colspan="3">Item Total</td>
//                 <td>₹${itemTotal}</td>
//               </tr>
//               <tr class="line">
//                 <td colspan="3">GST(12%)</td>
//                 <td>₹${gst}</td>
//               </tr>
//               <tr class="line">
//                 <td colspan="3">Delivery</td>
//                 <td>₹${delivery}</td>
//               </tr>
//               <tr>
//                 <td colspan="3"><strong>Total</strong></td>
//                 <td><strong>₹${finalAmount}</strong></td>
//               </tr>
//             </tfoot>
//           </table>
//         </div>
//       </div>
//     </body>
//   </html>`;

//       // Configure Nodemailer for email sending
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: process.env.GMAIL_USER,
//           pass: process.env.GMAIL_PASS,
//         },
//       });

//       const mailOptions = {
//         from: process.env.GMAIL_USER,
//         to: [email, process.env.GMAIL_USER],
//         subject: `Invoice - Order ${orderIdrec}`,
//         text: `Dear ${userName},\n\n Please find attached the invoice for your recent purchase.\n\nThank you for shopping with us!`,
//         html: recipt,
//       };

//       // Send email with the PDF attachment
//       await new Promise((resolve, reject) => {
//         transporter.sendMail(mailOptions, (error, info) => {
//           if (error) return reject(error);
//           resolve(info);
//         });
//       });

//       const messageData = {
//         mobile,
//         adminMobile: process.env.ADMIN_MOBILE_AISENSY,
//         userName,
//         order_id,
//       };

//       orderReceivedMessage(messageData);
//       res
//         .status(200)
//         .json({ status: true, message: "Payment Successful and email sent" });
//     } catch (error) {
//       console.log("Error processing order:", error);
//       res.status(500).json({ status: false, error: "Failed to process order" });
//     }
//   } else {
//     res.status(400).json({ status: false, error: "Invalid Payment signature" });
//   }
// };

exports.verifyOrder = async (req, res) => {
  const {
    orderId,
    paymentId,
    razorpayOrderId,
    razorpaySignature,
    orderItems,
    totalAmount,
    email,
    userName,
    address,
    mobile,
    gst,
    delivery,
    user_mobile,
    preorderDate,
    sweetGST,
    savoriesGST,
    state,
  } = req.body;

  console.log("body in verify order route:", req.body);
  console.log(orderItems);
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest("hex");
  const finalTotalAmount = Number(totalAmount) + Number(gst) + Number(delivery);

  if (generatedSignature === razorpaySignature) {
    try {
      console.log("Hash verified");
      const preOrderDate = preorderDate || null;
      const currentDate = new Date();
      // Fetch the number of documents in the 'orders' collection
      const isCancel = true;
      const cancellation = isCancel ? 1 : 0;
      const sql =
        "INSERT INTO customer_orders (transaction_id, name, mobile, address,order_items,total_price,received_date,preorder_date,payment_status,order_status,user_mobile,customer_cancellation,razorpay_payment_id,razorpay_order_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      const result = await new Promise((resolve, reject) => {
        db.query(
          sql,
          [
            orderId,
            userName,
            mobile,
            address,
            JSON.stringify(orderItems),
            finalTotalAmount,
            currentDate,
            preOrderDate,
            "paid",
            "received",
            user_mobile,
            cancellation,
            paymentId,
            razorpayOrderId,
          ],
          (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          }
        );
      });

      const sqlId = `SELECT order_id FROM customer_orders WHERE transaction_id = ?`;
      const resultId = await new Promise((resolve, reject) => {
        db.query(sqlId, [orderId], (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        });
      });

      let totalQuantity = 0;
      orderItems.forEach((item) => {
        totalQuantity += item.quantity;
      });
      const billdate = currentDate.toISOString().split("T")[0];
      const billtime = currentDate.toTimeString().split(" ")[0];
      const order_id = resultId[0].order_id;
      const order = {
        orderIdrec: order_id,
        orderDate: currentDate,
        preOrderDate: preOrderDate,
        paymentMethod: "Paid",
        customerName: userName,
        customerAddress: address,
        customerMobile: mobile,
        customerEmail: email,
        orderItems: orderItems,
        itemTotal: totalAmount,
        finalAmount: finalTotalAmount,
        billdate,
        billtime,
        totalQuantity,
        sweetGST,
        savoriesGST,
        delivery,
        gst,
      };
      const firstPagehtml = await ejs.renderFile(
        path.join(__dirname, "views", "bill.ejs"),
        { order }
      );

      const secondData = {
        customerAddress: address,
        orderIdrec: order_id,
        customerName: userName,
        customerMobile: mobile,
      };
      console.log("secons page");
      console.log(secondData);
      const secondPageHtml = await ejs.renderFile(
        path.join(__dirname, "views", "addressPage.ejs"),
        { secondData }
      );

      const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_BIN, // specify the path to your local Chromium if in development
        headless: true,
        timeout: 60000,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--headless",
          "--disable-gpu",
        ], // additional arguments to help in some environments
      });

      const page = await browser.newPage();

      const combinedHtml = `
        ${firstPagehtml}
        <div style="page-break-after: always;"></div>
        ${secondPageHtml}
        `;
      // Set HTML content to Puppeteer page
      await page.setContent(combinedHtml, { waitUntil: "networkidle0" });

      // Generate PDF from the page content
      const pdfBuffer = await page.pdf({
        format: "A5",
        printBackground: false,
      });

      // Close Puppeteer browser
      await browser.close();

      // console.log("bill data:", billData);

      console.log("gereating receipt");
      // const billData = {
      //   orderIdrec: order_id,
      //   orderDate: currentDate,
      //   preOrderDate: preOrderDate,
      //   paymentMethod: "Online",
      //   customerName: userName,
      //   customerAddress: address,
      //   customerMobile: mobile,
      //   customerEmail: email,
      //   orderItems: orderItems,
      //   itemTotal: totalAmount,
      //   finalAmount: finalTotalAmount,
      // };
      // const {
      //   orderIdrec,
      //   orderDate,
      //   paymentMethod,
      //   customerName,
      //   customerAddress,
      //   customerMobile,
      //   customerEmail,
      //   itemTotal,
      //   finalAmount,
      // } = billData;

      // console.log("bill data:", billData);
      // console.log("Order Items");
      // console.log(orderItems);
      //     const receipt = ` <!DOCTYPE html>
      // <html lang="en">
      //   <head>
      //     <meta charset="UTF-8" />
      //     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      //     <title>Invoice</title>
      //     <style>
      //       body {
      //         font-family: Arial, sans-serif;
      //         margin: 0;
      //         padding: 20px;
      //         background-color: #f4f4f4;
      //         font-size: 8px;
      //       }
      //       .invoice {
      //         background-color: #fff;
      //         padding: 15px;
      //         margin: 0 auto;
      //         max-width: 500px;
      //         border-radius: 8px;
      //         box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      //       }
      //       .details-container {
      //         display: flex;
      //         gap:40px
      //       }
      //       .order-details {
      //         width: 40%;
      //       }
      //       .company-details {
      //         width: 50%;
      //       }
      //       .order-summary table {
      //         width: 100%;
      //         border-collapse: collapse;
      //       }
      //       .line {
      //         border-bottom: 1px solid #000;
      //       }
      //       .order-summary th,
      //       .order-summary td {
      //         padding: 6px;
      //         text-align: left;
      //       }
      //       .order-summary tfoot td {
      //         font-weight: bold;
      //       }
      //       .lineup {
      //         border-top: 1px solid #000;
      //       }
      //       .order-summary tfoot tr:last-child td {
      //         font-size: 1.1em;
      //       }
      //       .right-align {
      //          text-align: right;
      //       }
      //     </style>
      //   </head>
      //   <body>
      //     <div class="invoice">
      //       <div class="details-container">
      //         <div class="company-details">
      //           <h3>Annapoorna Mithai</h3>
      //           <p>
      //             Annapoorna Mithai, 12/2, Ramnagar, Bypass road, Madurai <br />
      //             Contact: annapoornamithai@gmail.com  <br/>
      //             GSTIN - 33BCTPA8028E2ZP
      //           </p>
      //         </div>
      //         <div class="order-details">
      //           <h3>Order details</h3>
      //           <p>Order Id : ${orderIdrec}</p>
      //           <p>Order Date : ${orderDate}</p>
      //           <p>Payment: ${paymentMethod}</p>
      //           ${preOrderDate ? `<p>Pre-Order Date: ${preOrderDate}</p>` : ""}
      //         </div>
      //       </div>
      //       <hr />
      //       <div >
      //         <div class="customer-details">
      //           <h3>Customer details</h3>
      //           <p>
      //             Name: ${customerName}<br />
      //             Address: ${customerAddress}<br />
      //             Mobile: ${customerMobile}<br />
      //             Email: ${customerEmail}
      //           </p>
      //         </div>
      //       </div>
      //       <div class="order-summary">
      //         <h3>Order summary</h3>
      //         <hr />
      //         <table>
      //           <thead>
      //             <tr class="line">
      //               <th>Item</th>
      //               <th>Qty</th>
      //               <th>Price/Qty</th>
      //               <th>GST</th>
      //               <th>Amount</th>
      //             </tr>
      //           </thead>
      //           <tbody>
      //             ${orderItems
      //               .map(
      //                 (item) => `
      //               <tr>
      //                 <td>${item.name}</td>
      //                 <td>${item.quantity}</td>
      //                 <td>₹${item.price}</td>
      //                 <td>₹${(item.price * item.quantity * item.gst) / 100}  (${
      //                   item.gst
      //                 }%)</td>
      //                 <td>₹${(
      //                   item.price * item.quantity +
      //                   (item.price * item.quantity * item.gst) / 100
      //                 ).toFixed(2)}</td>
      //               </tr>
      //             `
      //               )
      //               .join("")}
      //           </tbody>
      //           <tfoot>
      //             <tr class="lineup">
      //               <td>Total</td>
      //               <td colspan="2">${totalQuantity}</td>
      //               <td>₹${gst}</td>
      //               <td><strong>₹${(Number(finalAmount) - Number(delivery)).toFixed(
      //                 2
      //               )}</strong></td>
      //             </tr>
      //             <tr class="lineup">
      //               <td colspan="3"></td>
      //               <td >Sub Total</td>
      //               <td>${(
      //                 Number(finalAmount) -
      //                 Number(gst) -
      //                 Number(delivery)
      //               ).toFixed(2)}</td>
      //             </tr>
      //             <tr class="lineup">
      //               <td colspan="3"></td>
      //               <td>CGST @2.5%</td>
      //               <td>${(Number(sweetGST) / 2).toFixed(2)}</td>
      //             </tr>
      //             <tr class="lineup">
      //               <td colspan="3"></td>
      //               <td>SGST @2.5%</td>
      //               <td>${(Number(sweetGST) / 2).toFixed(2)}</td>
      //             </tr>
      //             <tr class="lineup">
      //               <td colspan="3"></td>
      //               <td>CGST @6%</td>
      //               <td>${(Number(savoriesGST) / 2).toFixed(2)}</td>
      //             </tr>
      //             <tr class="lineup">
      //               <td colspan="3"></td>
      //               <td>SGST @6%</td>
      //               <td>${(Number(savoriesGST) / 2).toFixed(2)}</td>
      //             </tr>
      //             <tr class="lineup">
      //             <td colspan="3"></td>
      //               <td>Delivery</td>
      //               <td>₹${delivery}</td>
      //             </tr>
      //             <tr class="lineup">
      //               <td colspan="3"></td>
      //               <td><strong>Total</strong></td>
      //               <td><strong>₹${Number(finalAmount).toFixed(2)}</strong></td>
      //             </tr>
      //           </tfoot>
      //         </table>
      //       </div>
      //     </div>
      //   </body>
      // </html>`;

      // const transporter = nodemailer.createTransport({
      //   service: "gmail",
      //   auth: {
      //     user: process.env.GMAIL_USER,
      //     pass: process.env.GMAIL_PASS,
      //   },
      // });

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: [email, process.env.GMAIL_USER],
        subject: `Invoice - Order ${order_id}`,
        text: `Dear ${userName},\n\n Please find attached the invoice for your recent purchase.\n\nThank you for shopping with us!`,
        attachments: [
          {
            filename: `invoice ${order_id}.pdf`, // File name to display in the email
            content: pdfBuffer, // PDF content read from the file
            contentType: "application/pdf", // MIME type for PDFs
          },
        ],
      };

      // Send email with the PDF attachment
      await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) return reject(error);
          resolve(info);
        });
      });

      const messageData = {
        mobile: mobile,
        adminMobile: process.env.ADMIN_MOBILE_AISENSY,
        userName,
        order_id,
        email,
      };
      orderReceivedMessage(messageData);
      sendOrderReceivedEmail(messageData);
      res
        .status(200)
        .json({ status: true, message: "Payment Successful and email sent" });
    } catch (error) {
      console.log("Error processing order:", error);
      res.status(500).json({ status: false, error: "Failed to process order" });
    }
  } else {
    res.status(400).json({ status: false, error: "Invalid Payment signature" });
  }
};

exports.sendContactUs = async (req, res) => {
  try {
    const { name, mobile, message } = req.body;
    if (!name || !mobile || !message) {
      return res
        .status(400)
        .json({ status: false, message: "All Details Were Needed" });
    }

    // Create a transport object with Gmail configuration
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.GMAIL_USER,
    //     pass: process.env.GMAIL_PASS,
    //   },
    // });

    // Define the HTML content for the email

    const htmlContent = `
      <html>
      <head>
        <style>
          .email-body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
          }
          .header {
            background-color: #f4f4f4;
            padding: 10px;
            text-align: center;
          }
          .content {
            margin: 20px;
          }
          .footer {
            text-align: center;
            font-size: 0.8em;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="email-body">
          <div class="header">
            <h2>FEEDBACK</h2>
          </div>
          <div class="content">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Mobile:</strong> ${mobile}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          </div>
          <div class="footer">
            <p>Thank you for reaching out!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: "Someone Tried To Contact You",
      html: htmlContent,
    };

    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) return reject(error);
        resolve(info);
      });
    });

    // Respond with success message
    return res
      .status(200)
      .json({ status: true, message: "Email Sent Successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "Failed to Send Email" });
  }
};

exports.webhook = async (req, res) => {
  const secret = "YOUR_WEBHOOK_SECRET";
  // Verify the webhook signature
  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (digest === req.headers["x-razorpay-signature"]) {
    // Handle the event based on its type
    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    if (event === "payment.captured") {
      const orderId = paymentEntity.order_id;
      try {
        const updateSQL =
          "UPDATE customer_orders SET payment_status = ? where transaction_id =?";
        const updateResult = await new Promise((resolve, reject) => {
          db.query(updateSQL, ["paid", orderId], (err, result) => {
            if (err) {
              return reject(err);
            }
            resolve(result);
          });
        });

        if (updateResult.affectedRows > 0) {
          const SQL = "SELECT * from customer_orders  where transaction_id =?";
          const result = await new Promise((resolve, reject) => {
            db.query(SQL, [orderId], (err, result) => {
              if (err) {
                return reject(err);
              }
              resolve(result);
            });
          });
          const orderData = result[0];
          sendWhatsAppOrderData(orderData);

          return res
            .status(200)
            .json({ status: true, message: "Payment updated to paid" });
        }
      } catch (err) {
        console.error("Failed to update order status:", err);
        res
          .status(500)
          .json({ status: false, message: "Database update failed" });
      }
    } else {
      res.status(400).json({ status: false, message: "event not handled" });
    }
  } else {
    res.status(400).json({ status: false, message: "invalid signature" });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { mobile } = req.query;
    console.log("In get order");
    console.log(req.query);
    console.log(mobile);

    // Check if email is provided
    if (!mobile) {
      return res.status(400).json({
        status: false,
        message: "mobile is required to fetch orders",
      });
    }

    const sql = `SELECT * FROM customer_orders WHERE user_mobile = ?`;
    // Check if there are no orders found

    const result = await new Promise((resolve, reject) => {
      db.query(sql, [mobile], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
    return res.status(200).json({ status: true, result: result });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "Error fetching orders" });
  }
};
const orderCancelledMessage = async (messageData) => {
  console.log(messageData);
  const { mobile, userName, order_id } = messageData;

  const data = {
    apiKey: process.env.AISENSY_KEY,
    campaignName: "apm_order_cancelled_v2",
    destination: String("+91" + mobile), //  mobile is a string
    userName: String(userName), //  userName is a string
    templateParams: [String(userName), String(order_id)], // Array of template parameters must all be strings
    media: {
      url: "https://raw.githubusercontent.com/Warlord09/annapoorna-images/refs/heads/main/order_cancelled.png",
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
    console.log("Order cancelled message:");

    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
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
    console.log("Refund initiated message:");

    console.log("Message sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
};
exports.cancelOrder = async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res
        .status(400)
        .json({ status: false, message: "All Details Were Needed" });
    }
    console.log("In cancel order");
    console.log(req.body);
    const cancelSQL =
      "UPDATE customer_orders SET order_status = ?,customer_cancellation = ? WHERE order_id = ?";
    const updateResult = await new Promise((resolve, reject) => {
      db.query(cancelSQL, ["cancelled", 0, order_id], (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
    if (updateResult.affectedRows > 0) {
      const authToken = req.headers.authorization;
      console.log(authToken);
      console.log("refund hit");
      const response = axios.post(
        "http://www.tst.annapoornamithai.com/customers/refund-order",
        { order_id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      if ((await response).status === 200) {
        console.log("refund success");
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
    return res.status(404).json({ status: false, message: "Order not Found" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: " Error in Cancelling Orders " });
  }
};

exports.refundOrder = async (req, res) => {
  console.log("in refund route");
  const { order_id } = req.body;
  if (!order_id) {
    return res
      .status(400)
      .json({ status: false, message: "All Details Were Needed" });
  }
  try {
    const refundSQL =
      "SELECT razorpay_payment_id, total_price, mobile, name FROM customer_orders WHERE order_id = ?";

    const refundResult = await new Promise((resolve, reject) => {
      db.query(refundSQL, [order_id], (err, result) => {
        if (err) {
          console.log("error in db");
          console.log(err);
          return reject(err);
        }
        resolve(result);
      });
    });

    if (refundResult.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "Order not found" });
    }
    const orderResult = refundResult[0]; // Corrected this line
    console.log(orderResult);
    const razorpayPaymentId = orderResult.razorpay_payment_id;
    const refundAmount = Math.floor(orderResult.total_price) * 100;
    console.log(refundAmount);
    if (razorpayPaymentId) {
      const refund = await razorpay.payments.refund(razorpayPaymentId, {
        // Corrected variable name
        amount: refundAmount,
        notes: { reason: "Order canceled by customer" },
      });
      const messageData = {
        order_id,
        mobile: orderResult.mobile,
        userName: orderResult.name,
      };
      orderCancelledMessage(messageData);
      refundInitiatedMessage(messageData);
      return res.status(200).json({
        message: "Order canceled and refunded successfully",
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
