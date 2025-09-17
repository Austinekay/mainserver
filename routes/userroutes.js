const express = require('express')


const userRouter = express.Router();

userRouter.get('/',(req,res)=>{
    res.send("all users");
});

// Current user route
userRouter.get('/me',(req,res)=>{
    res.send("current user");
});

// User specific routes
userRouter.get('/:id',(req,res)=>{
    res.send(`user with id ${req.params.id}`);
});

userRouter.put('/:id',(req,res)=>{
    res.send(`update user with id ${req.params.id}`);
});

userRouter.delete('/:id',(req,res)=>{
    res.send(`delete user with id ${req.params.id}`);
});

module.exports = { userRouter };
