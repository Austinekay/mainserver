const express = require('express');
const { getAIRecommendations } = require('../controllers/recommendationController');

const router = express.Router();

router.post('/recommend', getAIRecommendations);

module.exports = { recommendationRouter: router };