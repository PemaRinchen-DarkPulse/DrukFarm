const express = require('express')
const mongoose = require('mongoose')
const DropOffLocation = require('../models/DropOffLocation')

const router = express.Router()

// GET /api/drop-off-locations - Get all drop-off locations
router.get('/', async (req, res) => {
  try {
    const { dzongkhag, active } = req.query
    
    // Build filter query
    const filter = {}
    if (dzongkhag) {
      filter.dzongkhag = new RegExp(dzongkhag.trim(), 'i') // Case-insensitive search
    }
    if (active !== undefined) {
      filter.isActive = active === 'true'
    } else {
      filter.isActive = true // Default to only active locations
    }

    const locations = await DropOffLocation.find(filter).sort({ dzongkhag: 1 })
    
    res.json({
      success: true,
      count: locations.length,
      data: locations
    })
  } catch (err) {
    console.error('Get drop-off locations error:', err)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve drop-off locations' 
    })
  }
})

// GET /api/drop-off-locations/:id - Get a specific drop-off location
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid location ID' 
      })
    }

    const location = await DropOffLocation.findById(id)
    
    if (!location) {
      return res.status(404).json({ 
        success: false, 
        error: 'Drop-off location not found' 
      })
    }

    res.json({
      success: true,
      data: location
    })
  } catch (err) {
    console.error('Get drop-off location error:', err)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve drop-off location' 
    })
  }
})

// POST /api/drop-off-locations - Create a new drop-off location
router.post('/', async (req, res) => {
  try {
    const { dzongkhag, towns } = req.body

    // Validation
    if (!dzongkhag || typeof dzongkhag !== 'string' || !dzongkhag.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dzongkhag is required and must be a non-empty string' 
      })
    }

    if (!towns || !Array.isArray(towns) || towns.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Towns must be a non-empty array' 
      })
    }

    // Validate each town
    for (const town of towns) {
      if (!town || typeof town !== 'string' || !town.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'All towns must be non-empty strings' 
        })
      }
    }

    // Check if dzongkhag already exists
    const existingLocation = await DropOffLocation.findOne({ 
      dzongkhag: dzongkhag.trim() 
    })

    if (existingLocation) {
      return res.status(409).json({ 
        success: false, 
        error: 'Drop-off location for this dzongkhag already exists' 
      })
    }

    const newLocation = new DropOffLocation({
      dzongkhag: dzongkhag.trim(),
      towns: towns
    })

    const savedLocation = await newLocation.save()

    res.status(201).json({
      success: true,
      message: 'Drop-off location created successfully',
      data: savedLocation
    })
  } catch (err) {
    console.error('Create drop-off location error:', err)
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: errors 
      })
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        error: 'Drop-off location for this dzongkhag already exists' 
      })
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to create drop-off location' 
    })
  }
})

// PUT /api/drop-off-locations/:id - Update a drop-off location
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { dzongkhag, towns, isActive } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid location ID' 
      })
    }

    // Build update object
    const updateData = {}
    
    if (dzongkhag !== undefined) {
      if (!dzongkhag || typeof dzongkhag !== 'string' || !dzongkhag.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Dzongkhag must be a non-empty string' 
        })
      }
      updateData.dzongkhag = dzongkhag.trim()
    }

    if (towns !== undefined) {
      if (!Array.isArray(towns) || towns.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Towns must be a non-empty array' 
        })
      }

      // Validate each town
      for (const town of towns) {
        if (!town || typeof town !== 'string' || !town.trim()) {
          return res.status(400).json({ 
            success: false, 
            error: 'All towns must be non-empty strings' 
          })
        }
      }
      updateData.towns = towns
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive)
    }

    const updatedLocation = await DropOffLocation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!updatedLocation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Drop-off location not found' 
      })
    }

    res.json({
      success: true,
      message: 'Drop-off location updated successfully',
      data: updatedLocation
    })
  } catch (err) {
    console.error('Update drop-off location error:', err)
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ 
        success: false, 
        error: 'Validation error', 
        details: errors 
      })
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        error: 'Drop-off location for this dzongkhag already exists' 
      })
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to update drop-off location' 
    })
  }
})

// PATCH /api/drop-off-locations/:id/towns - Add towns to existing location
router.patch('/:id/towns', async (req, res) => {
  try {
    const { id } = req.params
    const { towns } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid location ID' 
      })
    }

    if (!towns || !Array.isArray(towns) || towns.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Towns must be a non-empty array' 
      })
    }

    // Validate each town
    for (const town of towns) {
      if (!town || typeof town !== 'string' || !town.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'All towns must be non-empty strings' 
        })
      }
    }

    const location = await DropOffLocation.findById(id)
    if (!location) {
      return res.status(404).json({ 
        success: false, 
        error: 'Drop-off location not found' 
      })
    }

    // Add new towns to existing ones (duplicates will be removed by pre-save middleware)
    const updatedTowns = [...location.towns, ...towns.map(t => t.trim())]
    
    const updatedLocation = await DropOffLocation.findByIdAndUpdate(
      id,
      { towns: updatedTowns },
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      message: 'Towns added successfully',
      data: updatedLocation
    })
  } catch (err) {
    console.error('Add towns error:', err)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add towns' 
    })
  }
})

// DELETE /api/drop-off-locations/:id - Delete a drop-off location
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid location ID' 
      })
    }

    const deletedLocation = await DropOffLocation.findByIdAndDelete(id)

    if (!deletedLocation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Drop-off location not found' 
      })
    }

    res.json({
      success: true,
      message: 'Drop-off location deleted successfully',
      data: deletedLocation
    })
  } catch (err) {
    console.error('Delete drop-off location error:', err)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete drop-off location' 
    })
  }
})

// GET /api/drop-off-locations/dzongkhag/:dzongkhag - Get towns for a specific dzongkhag
router.get('/dzongkhag/:dzongkhag', async (req, res) => {
  try {
    const { dzongkhag } = req.params

    const location = await DropOffLocation.findOne({ 
      dzongkhag: dzongkhag.trim(),
      isActive: true 
    })

    if (!location) {
      return res.status(404).json({ 
        success: false, 
        error: 'No active drop-off location found for this dzongkhag' 
      })
    }

    res.json({
      success: true,
      dzongkhag: location.dzongkhag,
      towns: location.towns,
      data: location
    })
  } catch (err) {
    console.error('Get dzongkhag towns error:', err)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve towns for dzongkhag' 
    })
  }
})

module.exports = router
