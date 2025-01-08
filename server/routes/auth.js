const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { Pool } = require('pg'); // Assuming you're using PostgreSQL

// Initialize PostgreSQL Pool
const pool = new Pool({
    user: 'your_db_user',
    host: 'localhost',
    database: 'your_db_name',
    password: 'your_db_password',
    port: 5432,
});

// Send OTP
router.post('/send-otp', async (req, res) => {
    const { email, otp } = req.body;

    // Store OTP in the database
    await pool.query('INSERT INTO otps (email, otp) VALUES ($1, $2)', [email, otp]);

    // Configure Nodemailer to send OTP to email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-email-password'
        }
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send({ success: true, message: 'OTP sent successfully!' });
    } catch (error) {
        res.status(500).send({ success: false, message: 'Error sending OTP.' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    const result = await pool.query('SELECT * FROM otps WHERE email = $1 AND otp = $2', [email, otp]);

    if (result.rows.length > 0) {
        res.status(200).send({ success: true, message: 'OTP verified successfully!' });
    } else {
        res.status(400).send({ success: false, message: 'Invalid OTP.' });
    }
});

module.exports = router;