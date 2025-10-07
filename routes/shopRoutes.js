const express = require('express');
const { createShop, getShops, getShopById, getShopsByOwner, updateShop, deleteShop, searchShopsByLocation } = require('../controllers/shopController');
const { auth } = require('../middlewares/auth.JS');
const { requireAdmin } = require('../middlewares/adminMiddleware');

const shopRouter = express.Router();

shopRouter.get('/', getShops);
shopRouter.get('/search', searchShopsByLocation);
shopRouter.get('/owner/:id', getShopsByOwner);
shopRouter.get('/:id', getShopById);
shopRouter.post('/', auth, createShop);
shopRouter.put('/:id', auth, updateShop);
shopRouter.delete('/:id', auth, deleteShop);

module.exports = { shopRouter };
