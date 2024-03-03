const { client } = require('../Grpc-Clients/checkProduct');
const Cart = require('../Models/cartModel');
const razorpayInstance = require('../config/RazorPay');
const crypto = require('crypto')
require('dotenv').config();



exports.cartAdd = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const checkProductExistencePromise = new Promise((resolve, reject) => {
      client.CheckProductExistence({ productId }, (err, response) => {
        if (err) {
          console.error("Error:", err.message);
          reject(new Error("Internal Server Error"));
          return;
        }
        if (!response || !response.exists) {
          reject(new Error("Product does not exist"));
          return;
        }
        resolve(true);
      });
    });

    // Await the result of the checkProductExistencePromise
    const productExists = await checkProductExistencePromise;

    if (!productExists) {
      const error = new Error("Product Does not Exist!");
      error.statusCode = 404;
      throw error;
    }
    const productDetailsPromise = new Promise((resolve, reject) => {
      productServiceClient.GetProductDetailsById(
        { productId },
        (err, response) => {
          if (err) {
            console.error(
              `Error fetching product details for product ID ${productId}:`,
              err
            );
            reject(new Error("Internal Server Error"));
            return;
          }
          resolve(response);
        }
      );
    });

    const product = await productDetailsPromise;

    if (product.stock_count === 0) {
      const error = new Error("Product is out of stock!");
      error.statusCode = 404;
      throw error;
    }
    const userId = req.user._id;
    let cart = await Cart.findOne({ owner: userId });
    if (!cart) {
      cart = new Cart({
        owner: userId,
        items: [],
        billTotal: 0,
      });
    }

    const cartItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (cartItem) {
      if (cartItem.quantity + 1 > product.stock_count) {
        const error = new Error("Insufficient stock quantity!");
        error.statusCode = 404;
        throw error;
      }

      cartItem.productPrice = product.price;
      cartItem.quantity += 1;
      cartItem.price = cartItem.quantity * product.price;
    } else {
      cart.items.push({
        productId: productId,
        productPrice: product.price,
        quantity: 1,
        price: product.price,
      });
    }

    cart.items.forEach((item) => {
        if (item.selected) {
            total += item.productPrice * item.quantity;
        }
    });
    await cart.save();

    res.status(200).json({ success: true, message: "Item added to cart" });
  } catch (err) {
    console.log(err);
    next(err);
  }
};


exports.cartGet = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ owner: userId });

        if (!cart) {
            const error = new Error("This user doesn't have a cart");
            error.statusCode = 404;
            throw error;
        }

        if (cart.items.length > 0) {
            const promises = cart.items.map(item => {
                return new Promise((resolve, reject) => {
                    client.GetProductDetailsById({ productId: item.productId }, (err, response) => {
                        if (err) {
                            console.error(`Error fetching product details for product ID ${item.productId}:`, err);
                            resolve(null); // Resolve with null if an error occurs
                        } else {
                            resolve({ ...item.toObject(), productDetails: response }); // Add product details to the item object
                        }
                    });
                });
            });
            const cartItemsWithData = await Promise.all(promises);
            return res.status(200).json({ success: true, data: { cart: cartItemsWithData } });
        } else {
            return res.status(200).json({ success: true, data: { cart: cart } });
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};


exports.cartPut = async (req, res, next) => {
    try {
        const productId = req.params.productId;
        const newQuantity = req.body.quantity;
        const userId = req.user._id;

        const cart = await Cart.findOne({ owner: userId });

        if (!cart) {
            const error = new Error("This user doesn't have a cart");
            error.statusCode = 404;
            throw error;
        }

        const cartItem = cart.items.find((item) => item.productId.toString() === productId);

        if (!cartItem) {
            const error = new Error("Product not found in cart");
            error.statusCode = 404;
            throw error;
        }

        const productDetailsPromise = new Promise((resolve, reject) => {
            productServiceClient.GetProductDetailsById({ productId }, (err, response) => {
                if (err) {
                    console.error(`Error fetching product details for product ID ${productId}:`, err);
                    reject(new Error("Internal Server Error"));
                } else {
                    resolve(response);
                }
            });
        });

        const product = await productDetailsPromise;

        if (newQuantity > product.stock_count) {
            const error = new Error("Insufficient stock quantity!");
            error.statusCode = 400;
            throw error;
        }

        cartItem.quantity = newQuantity;
        cartItem.price = newQuantity * cartItem.productPrice;

        // Recalculate the cart's billTotal based on selected items
        let total = 0;
        cart.items.forEach((item) => {
            if (item.selected) {
                total += item.productPrice * item.quantity;
            }
        });

        cart.billTotal = total;

        await cart.save(); // Save the updated cart

        return res.status(200).json({ success: true, data: { msg: 'Quantity updated successfully', stock: product.stock_count } });
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.cartRemove = async(req,res,next)=>{
    try{
        const productId = req.params.productId;
        const userId = req.user._id;

        const cart = await Cart.findOne({owner:userId});

        if(!cart){
            const error = new Error("Cart not found in cart");
            error.statusCode = 404;
            throw error;
        }

        const productIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
       
        if(productIndex === -1){
            const error = new Error("Product not found in cart");
            error.statusCode = 404;
            throw error;
        }

        if (cart.items[productIndex].selected) {
            cart.billTotal -= cart.items[productIndex].price;
        }


        cart.items.splice(productIndex,1);

        await cart.save();
        return res.status(200).json({ success: true,data:{ msg: 'Product removed from the cart' }});

    }catch(err){
        console.log(err);
        next(err)
    }
}

exports.SelectProduct = async (req, res, next) => {
    try {
        const selectedProductId = req.body.selectedProductId;
        const userId = req.user._id;

        const cart = await Cart.findOne({ owner: userId });

        if (!cart) {
            const error = new Error("Cart not found for the user");
            error.statusCode = 404;
            throw error;
        }

        const selectedProduct = cart.items.find((item) => item.productId.toString() === selectedProductId);
        if (!selectedProduct) {
            const error = new Error("Selected product not found in the cart");
            error.statusCode = 404;
            throw error;
        }

        selectedProduct.selected = true;

        let total = 0;
        cart.items.forEach((item) => {
            if (item.selected) {
                total += item.productPrice * item.quantity;
            }
        });
        cart.billTotal = total;

        await cart.save();

        res.status(200).json({ success: true, data: { msg: 'Successfully updated billTotal', billTotal: cart.billTotal } });
    } catch (err) {
        console.error(err);
        next(err);
    }
};




