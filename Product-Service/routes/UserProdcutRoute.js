const express = require('express');
const { ProductDetailedView, getAllProducts, } = require('../Controllers/userProductController');
const blockMiddleware = require('../middlewares/checkBlocked');
const { CommonRouteAuthentication } = require('../middlewares/auth');
const userRouter = express.Router();


userRouter.get('/get-allproducts',CommonRouteAuthentication,blockMiddleware,getAllProducts);

userRouter.get( '/get-product/:id',CommonRouteAuthentication, blockMiddleware,ProductDetailedView);



module.exports=userRouter
