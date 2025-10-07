const express = require('express');
const { getAllUsers, getCurrentUser, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { auth } = require('../middlewares/auth.JS');
const { requireAdmin } = require('../middlewares/adminMiddleware');

const userRouter = express.Router();

userRouter.get('/', auth, requireAdmin, getAllUsers);
userRouter.post('/', auth, requireAdmin, createUser);
userRouter.get('/me', auth, getCurrentUser);
userRouter.get('/:id', auth, getUserById);
userRouter.put('/:id', auth, updateUser);
userRouter.delete('/:id', auth, requireAdmin, deleteUser);

module.exports = { userRouter };
