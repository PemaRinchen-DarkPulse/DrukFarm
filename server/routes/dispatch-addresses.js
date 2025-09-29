const express = require('express');
const router = express.Router();
const { DispatchAddress } = require('../models/DispatchAddress');

// POST a new dispatch address (a whole Dzongkhag with its Gewogs)
router.post('/', async (req, res) => {
  try {
    const { dzongkhag, gewogs } = req.body;

    if (!dzongkhag || !gewogs) {
      return res.status(400).json({ message: 'Dzongkhag and gewogs are required.' });
    }

    const newDispatchAddress = new DispatchAddress({
      dzongkhag,
      gewogs,
    });

    const savedAddress = await newDispatchAddress.save();
    res.status(201).json(savedAddress);
  } catch (error) {
    // Handle potential duplicate key error for dzongkhag
    if (error.code === 11000) {
      return res.status(409).json({ message: `Dzongkhag '${error.keyValue.dzongkhag}' already exists.` });
    }
    res.status(500).json({ message: error.message });
  }
});

// GET all dispatch addresses (all Dzongkhags and their Gewogs)
router.get('/', async (req, res) => {
  try {
    const addresses = await DispatchAddress.find().sort({ dzongkhag: 1 });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all Gewogs for a specific Dzongkhag
router.get('/:dzongkhag', async (req, res) => {
  try {
    const { dzongkhag } = req.params;
    const address = await DispatchAddress.findOne({ dzongkhag: { $regex: new RegExp(`^${dzongkhag}$`, 'i') } });
    if (!address) {
      return res.status(404).json({ message: 'Dzongkhag not found' });
    }
    res.json(address.gewogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all villages for a specific Gewog in a Dzongkhag
router.get('/:dzongkhag/:gewog', async (req, res) => {
  try {
    const { dzongkhag, gewog } = req.params;
    const address = await DispatchAddress.findOne(
      { dzongkhag: { $regex: new RegExp(`^${dzongkhag}$`, 'i') } },
      { gewogs: { $elemMatch: { name: { $regex: new RegExp(`^${gewog}$`, 'i') } } } }
    );

    if (!address || !address.gewogs || address.gewogs.length === 0) {
      return res.status(404).json({ message: 'Gewog not found in the specified Dzongkhag' });
    }
    res.json(address.gewogs[0].villages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = { router };
