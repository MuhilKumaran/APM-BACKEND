require("dotenv").config({ path: "../config.env" });
const express = require("express");
const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();

// Sample order data
const sampleOrder = {
  orderId: "ANP001",
  orderDate: "2024-10-13",
  paymentMethod: "Credit Card",
  preOrderDate: "2024-10-15",
  customerName: "John Doe",
  customerAddress: "1234 Elm Street, Springfield, IL",
  customerMobile: "9876543210",
  customerEmail: "muhilkumaran@gmail.com",
  orderItems: [
    { name: "Mithai Box", quantity: 2, price: 500 },
    { name: "Rasgulla", quantity: 1, price: 150 },
    { name: "Test2", quantity: 2, price: 500 },
    { name: "Test", quantity: 1, price: 150 },
    { name: "Test2", quantity: 2, price: 500 },
    { name: "Test", quantity: 1, price: 150 },
    { name: "Test2", quantity: 2, price: 500 },
    { name: "Test", quantity: 1, price: 150 },
    { name: "Test2", quantity: 2, price: 500 },
    { name: "Test", quantity: 1, price: 150 },
    { name: "Mithai Box", quantity: 2, price: 500 },
    { name: "Rasgulla", quantity: 1, price: 150 },
    { name: "Test2", quantity: 2, price: 500 },
    { name: "Test", quantity: 1, price: 150 },
    { name: "Test2", quantity: 2, price: 500 },
    { name: "Test", quantity: 1, price: 150 },
    { name: "Test2", quantity: 2, price: 500 },
    { name: "Test", quantity: 1, price: 150 },
    { name: "Test2", quantity: 2, price: 500 },
    { name: "Test", quantity: 1, price: 150 },
  ],
  itemTotal: 650,
  gst: 78,
  delivery: 50,
  finalAmount: 778,
};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // Your email
    pass: process.env.GMAIL_PASS, // Your email password or app password
  },
});

// Route to generate PDF and send via email
app.get("/send-pdf", async (req, res) => {
  try {
    // Render EJS template with sample data
    const html = await ejs.renderFile(
      path.join(__dirname, "views", "bill.ejs"),
      { order: sampleOrder }
    );

    // Launch Puppeteer browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set HTML content to Puppeteer page
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF from the page content
    const pdfBuffer = await page.pdf({
      format: "A5",
      printBackground: false,
    });

    // Close Puppeteer browser
    await browser.close();

    // Define email options
    const mailOptions = {
      from: process.env.GMAIL_USER, // Sender's email address
      to: sampleOrder.customerEmail, // Receiver's email address
      subject: "Your Invoice from Annapoorna Mithai",
      text: `Dear ${sampleOrder.customerName},\n\nPlease find your invoice attached.\n\nThank you for your order!\n\nRegards,\nAnnapoorna Mithai`,
      attachments: [
        {
          filename: "invoice.pdf",
          content: pdfBuffer, // PDF buffer from Puppeteer
          contentType: "application/pdf",
        },
      ],
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        res.status(500).send("Error sending email");
      } else {
        console.log("Email sent: " + info.response);
        res.status(200).send("PDF generated and sent via email successfully!");
      }
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
});

app.listen(8001, () => {
  console.log("Server running on port 8001");
});
