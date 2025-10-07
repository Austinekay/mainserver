const express = require('express');
const { register, login, verify, googleAuth, googleCallback } = require('../controllers/authController');
const { auth } = require('../middlewares/auth.JS');

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/verify', auth, verify);
authRouter.get('/google', googleAuth);
authRouter.get('/google/callback', googleCallback);

module.exports = { authRouter };
