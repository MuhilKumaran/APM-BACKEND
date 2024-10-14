const nodemailer = require("nodemailer");
require("dotenv").config({ path: "./config.env" });
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASS, 
    },
  });

  // Define email message options
  const mailOptions = {
    from: process.env.MAIL_ID,
    to: "717821p257@kce.ac.in",
    subject: "Test Email",
    html: `
          <div style="width:auto;
          height:auto;
          background-color:white;
          text-align: center;
          border-radius: 10px;">
          <div><img src="http://surl.li/gsqyu" style="width:100px;height:100px"></div><br>
              <div><h3>Here is your one-time password</h3></div>
              <h1>124567</h1>
              <br>
              <div style="color:red">Don't share OTP with anyone!</div>
          </div>
      `,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
  transporter.close();

