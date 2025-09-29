const express = require('express');
const router = express.Router();
const { UserDispatchAddress } = require('../models/UserDispatchAddress');

// GET all dispatch addresses for a user
router.get('/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const addresses = await UserDispatchAddress.find({ userCid: cid }).sort({ createdAt: -1 });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create a new user dispatch address
router.post('/', async (req, res) => {
  try {
    const { userCid, title, icon, dzongkhag, gewog, place, isDefault } = req.body;

    if (!userCid || !title || !dzongkhag || !gewog || !place) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // If this is set as default, remove default from other addresses
    if (isDefault) {
      await UserDispatchAddress.updateMany(
        { userCid },
        { $set: { isDefault: false } }
      );
    }

    const newAddress = new UserDispatchAddress({
      userCid,
      title,
      icon: icon || 'location',
      dzongkhag,
      gewog,
      place,
      isDefault: isDefault || false,
    });

    const savedAddress = await newAddress.save();
    res.status(201).json(savedAddress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update a user dispatch address
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, icon, dzongkhag, gewog, place, isDefault } = req.body;

    const address = await UserDispatchAddress.findById(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If this is set as default, remove default from other addresses
    if (isDefault && !address.isDefault) {
      await UserDispatchAddress.updateMany(
        { userCid: address.userCid, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    const updatedAddress = await UserDispatchAddress.findByIdAndUpdate(
      id,
      { title, icon, dzongkhag, gewog, place, isDefault },
      { new: true, runValidators: true }
    );

    res.json(updatedAddress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE a user dispatch address
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const address = await UserDispatchAddress.findById(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await UserDispatchAddress.findByIdAndDelete(id);
    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT set default dispatch address
router.put('/:id/default', async (req, res) => {
  try {
    const { id } = req.params;
    
    const address = await UserDispatchAddress.findById(id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Remove default from all other addresses for this user
    await UserDispatchAddress.updateMany(
      { userCid: address.userCid },
      { $set: { isDefault: false } }
    );

    // Set this address as default
    const updatedAddress = await UserDispatchAddress.findByIdAndUpdate(
      id,
      { $set: { isDefault: true } },
      { new: true }
    );

    res.json(updatedAddress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
