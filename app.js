const express = require('express')
const cors = require('cors')
const bcrypt= require('bcrypt')
const moongoose = require('mongoose')

//routes
const {userRouter}= require('./routes/userroutes')
const {shopRouter}=require('./routes/shopRoutes')
const {authRouter}=require('./routes/authroutes')


const app = express();
app.use(cors())
app.use(express.json())

app.get('/',(req,res)=>{
    res.send("hello world")
    console.log("hello world")
})

app.use('/api/v1', userRouter);

app.listen(3000,()=>{
    console.log('server running on port 3000')
})