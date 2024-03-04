const express = require('express');
const orderRouter = express.Router();
const orderController=require('../Controllers/orderController')
const { requireJWTAuthentication} =  require('../middlewares/auth')

const blockMiddleware = require('../middlewares/checkBlocked');

orderRouter.post('/razorpay-verify',requireJWTAuthentication,blockMiddleware,orderController.razorpayVerify);

orderRouter.get('/razorpay-payment-failed',requireJWTAuthentication,blockMiddleware,orderController.razorpayFailed);

orderRouter.get('/order-confirmation',requireJWTAuthentication,blockMiddleware,orderController.orderConfirmation)

orderRouter.get('/get-userorder',requireJWTAuthentication,blockMiddleware,orderController.getOrders)

module.exports=orderRouter