const express = require('express');

const cartRouter = express.Router();
require('dotenv').config();
// const Auth = require('../middlewares/auth')
const cartController = require('../Controllers/cartController');
const checkoutController= require('../Controllers/checkoutCart')

const { requireJWTAuthentication} =  require('../middlewares/auth')

const blockMiddleware = require('../middlewares/checkBlocked');




cartRouter.get('/',requireJWTAuthentication,blockMiddleware,cartController.cartGet);


cartRouter.post('/add-to-cart/:productId',requireJWTAuthentication,blockMiddleware,cartController.cartAdd);

cartRouter.put('/update-cart-quantity/:productId',requireJWTAuthentication,blockMiddleware,cartController.cartPut)

cartRouter.delete('/remove-product/:productId',requireJWTAuthentication,blockMiddleware,cartController.cartRemove)


function nocache(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
}


cartRouter.get('/checkout',requireJWTAuthentication,blockMiddleware,nocache,checkoutController.checkoutGet);

cartRouter.post('/checkout',requireJWTAuthentication,blockMiddleware,nocache,checkoutController.checkoutPost);



module.exports = cartRouter;



