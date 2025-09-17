const express = require('express');

const authRouter = express.Router();

// POST /auth/register
authRouter.post('/register', (req, res) => {
    res.send('Register a new user');
});

// POST /auth/login
authRouter.post('/login', (req, res) => {
    res.send('Log in user');
});

// GET /auth/verify
authRouter.get('/verify', (req, res) => {
    res.send('Verify user token/session');
});

module.exports = { authRouter };
