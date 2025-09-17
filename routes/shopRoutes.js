const express = require('express');

const shopRouter = express.Router();

// GET /shops - Get all shops
shopRouter.get('/', (req, res) => {
    res.send('Get all shops');
});

// GET /shops/owner/:id - Get all shops by a specific owner
shopRouter.get('/owner/:id', (req, res) => {
    res.send(`Get shops for owner with ID ${req.params.id}`);
});

// GET /shops/:id - Get a specific shop by ID
shopRouter.get('/:id', (req, res) => {
    res.send(`Get shop with ID ${req.params.id}`);
});

// POST /shops - Create a new shop
shopRouter.post('/', (req, res) => {
    res.send('Create a new shop');
});

// PUT /shops/:id - Update a shop
shopRouter.put('/:id', (req, res) => {
    res.send(`Update shop with ID ${req.params.id}`);
});

// DELETE /shops/:id - Delete a shop
shopRouter.delete('/:id', (req, res) => {
    res.send(`Delete shop with ID ${req.params.id}`);
});

module.exports = { shopRouter };
