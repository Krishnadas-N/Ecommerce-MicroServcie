const { client } = require('../Grpc-Clients/checkProduct');
const Cart = require('../Models/cartModel');
const {createRazorpayOrder} = require('../config/RazorPay');
const crypto = require('crypto');
const { publishOrder } = require('../utils/ampqSetup');
require('dotenv').config();

function generateRandomOrderId(length) {
    let result = '';
    const characters = '0123456789'; // Digits
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
  
    return 'OD_' + result;
  }


  const getUsersAddress = (userId) => {
    return new Promise((resolve, reject) => {
        client.GetUserAddress({ user_id: userId }, (err, response) => {
            if (err) {
                reject(err);
            } else {
                resolve(response.addresses);
            }
        });
    });
};



exports.checkoutGet = async (req, res, next) => {
    try {
        const cartCheckout = await Cart.findOne({ owner: req.user._id });
        const selectedItems = cartCheckout.items.filter(item => item.selected === true);
        if(!selectedItems  || selectedItems.length == 0){
            const error = new Error("Please select at least one product");
            error.statusCode = 422;
            throw error;
        }   
        const promises = selectedItems.map(item => {
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

        const itemsWithDetails = await Promise.all(promises);

        const billTotal = selectedItems.reduce((total, item) => total + item.price, 0);
        const itemCount = selectedItems.length;

        res.status(200).json({
            success: true,
            data: {
                items: itemsWithDetails,
                count: itemCount,
                totalAmount: billTotal
            }
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
}



exports.checkoutPost = async (req, res, next) => {
  try {
    if (!req.body.paymentOption || !req.body.addressType) {
      const error = new Error("Invalid data in the request");
      error.statusCode = 403;
      throw error;
    }

    const cart = await Cart.findOne({
      owner: req.user._id
    });

    if (!cart || cart.items.length === 0) {
      const error = new Error("Cart not found or does not have enough products");
      error.statusCode = 403;
      throw error;
    }

    const selectedItems = cart.items.filter((item) => item.selected === true);
    if (selectedItems.length === 0) {
      const error = new Error("No items selected for checkout");
      error.statusCode = 400;
      throw error;
    }

    const addresses = await getUsersAddress(req.user._id);
    if (!addresses || addresses.length === 0) {
      const error = new Error("User has no address");
      error.statusCode = 400;
      throw error;
    }

    const deliveryAddress = addresses.find((item) => item.addressType === req.body.addressType);
    if (!deliveryAddress) {
      const error = new Error("Selected delivery address not found");
      error.statusCode = 400;
      throw error;
    }

    const orderAddress = {
      addressType: deliveryAddress.addressType,
      HouseNo: deliveryAddress.HouseNo,
      Street: deliveryAddress.Street,
      Landmark: deliveryAddress.Landmark,
      pincode: deliveryAddress.pincode,
      city: deliveryAddress.city,
      district: deliveryAddress.district,
      State: deliveryAddress.State,
      Country: deliveryAddress.Country,
    };

    const billTotal = selectedItems.reduce((total, item) => total + item.price, 0);
    console.log(billTotal, selectedItems);
    const newOrderId = generateRandomOrderId(6);

    let paymentStatus;
    let orderId;

    if (req.body.paymentOption === "cashOnDelivery") {
      paymentStatus = 'Success';
      orderId = newOrderId;
    } else if (req.body.paymentOption === "Razorpay") {
      // Create a Razorpay order
      const options = {
        amount: billTotal * 100, // Amount in paisa (Razorpay expects amount in smallest currency unit)
        currency: 'INR',
        receipt: 'razorUser@gmail.com', // Replace with your email
      };

      const razorpayOrder = await createRazorpayOrder(options);

      orderId = razorpayOrder.id;
      paymentStatus = 'Pending'; // As the payment is pending until the user completes it on Razorpay's checkout page
    }

    // Prepare order data
    const orderData = {
      user: req.user._id,
      cart: cart._id,
      items: selectedItems,
      billTotal,
      paymentStatus,
      orderId,
      paymentId: null,
      paymentMethod: req.body.paymentOption,
      deliveryAddress: orderAddress,
    };

    // Publish order data to message broker
    const orderPublished = await publishOrder(orderData);
    if (!orderPublished) {
      const error = new Error("Failed to publish order data");
      error.statusCode = 500;
      throw error;
    }

    // Return success response
    return res.status(201).json({
      success: true,
      data: {
        msg: 'Order placed successfully',
        orderDetails: orderData
      },
    });
  } catch (error) {
    next(error);
  }
};
