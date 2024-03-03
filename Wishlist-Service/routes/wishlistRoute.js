const express = require('express');
const { requireJWTAuthentication } = require('../middlewares/auth');
const router = express.Router();
const wishlistController = require('../Controllers/wishlistControllers');
const blockMiddleware = require('../middlewares/checkBlocked');


router.post('/:productId',requireJWTAuthentication,blockMiddleware,wishlistController.WishlistAdd)

router.get('/',requireJWTAuthentication,blockMiddleware,wishlistController.WishlistGet)

router.post('/remove/:productId',requireJWTAuthentication,blockMiddleware,wishlistController.wishlistItemDelete)

// router.post('/wishlist/moveTocart/:productId',requireJWTAuthentication,blockMiddleware,wishlistController.WishlistToCart)

module.exports=router; 