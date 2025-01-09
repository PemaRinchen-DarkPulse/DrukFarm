const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const mongoose=require('mongoose')
require('dotenv').config()

const app = express();
const port = 3000;
app.use(bodyParser.json());


mongoose.connect(process.env.MONGO_URL)
.then(()=>{
  console.log("Mongo Connected")
})


const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // SMTP login email
    pass: process.env.EMAIL_PASS  // SMTP password
  },
  tls: {
    rejectUnauthorized: false // Ignore self-signed certificates
  },
  debug: true,
  logger: true
});

app.post("/send-email", async (req, res) => {
  const { to, subject, text } = req.body;
  if (!to || !subject || !text) {
    return res.status(400).json({ 
      message: "Missing required fields: 'to', 'subject', or 'text'" 
    });
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_SENDER,
      to,
      subject,
      text
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info);
    res.status(200).json({ 
      message: "Email sent successfully!",
      messageId: info.messageId
    });

  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ 
      message: "Failed to send email.",
      error: error.message,
      details: error.response || error.stack
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Email backend running on http://localhost:${port}`);
});
