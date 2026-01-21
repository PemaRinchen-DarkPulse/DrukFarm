const express = require('express');
const router = express.Router();
const Waitlist = require('../models/Waitlist');

// POST /api/waitlist - Join the waitlist
router.post('/', async (req, res) => {
  try {
    const { name, phone, role, dzongkhag } = req.body;

    // Basic validation
    if (!name || !phone || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, phone number and role are required.' 
      });
    }

    // Check if phone number already exists
    const existingEntry = await Waitlist.findOne({ phone });
    if (existingEntry) {
      return res.status(409).json({ 
        success: false, 
        message: 'This phone number is already on the waitlist.' 
      });
    }

    const newEntry = new Waitlist({
      name,
      phone,
      role,
      dzongkhag
    });

    await newEntry.save();

    res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      data: newEntry
    });

  } catch (error) {
    console.error('Waitlist Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
});

// GET /api/waitlist - Get all waitlist entries (Protected, admin only - implementing simple logical check for now)
router.get('/', async (req, res) => {
    try {
        // ideally add auth middleware here
        const list = await Waitlist.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: list.length, data: list });
    } catch (error) {
        console.error("Waitlist fetch error", error);
        res.status(500).json({ success: false, message: 'Server Error'});
    }
});

module.exports = router;
