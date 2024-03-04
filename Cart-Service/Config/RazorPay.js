const Razorpay = require('razorpay')
require('dotenv').config();

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEYID,
    key_secret: process.env.RAZORPAY_KEYSECRET
})


const createRazorpayOrder = async (options) => {
    return new Promise((resolve, reject) => {
        instance.orders.create(options, (err, order) => {
            if (err) {
                reject(err);
            } else {
                resolve(order);
            }
        });
    });
};

module.exports = {
    createRazorpayOrder
};

// API signature