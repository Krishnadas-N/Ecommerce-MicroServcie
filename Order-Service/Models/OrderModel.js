const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  user: {
    type: String,
    required: true,
  },
  cart: {
    type: String,
  },
  
  items: [
    {
      productId: {
        type: String,
        required: true,
      },
      productPrice: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity can not be less than 1.'],
        default: 1,
      },
      price: {
        type: Number,
        required: true,
      },
    
    },
  ],
  orderId:{
    type: String,
		required: true
  },
  billTotal: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Success', 'Failed'],
    default: 'Pending',
  },
  paymentId:{
    type:String,

  },
  status: {
    type: String,
    enum:['Pending','Processing', 'Shipped', 'Delivered','Canceled','Failed','Returned'],
    default: 'Pending'
},
  signature: {
		type: String,
	},
  deliveryAddress: {
    type: {
      addressType: String,
      HouseNo: String,
      Street: String,
      Landmark: String,
      pincode: Number,
      city: String,
      district: String,
      State: String,
      Country: String,
    },
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  requests: [
    {
      type: {
        type: String,
        enum: ['Cancel', 'Return'],
      },
      status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected'],
        default: 'Pending',
      },
      reason: String,
      // Add other fields as needed for your specific use case
    },
  ],


},
{
    timestamps:true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
