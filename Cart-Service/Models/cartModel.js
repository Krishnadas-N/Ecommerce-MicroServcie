const mongoose = require('mongoose');
const ObjectID = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema({
    owner : {
  type: String,
   required: true,
 },

 items: [{
    productId: {
      type: String,
      required: true
    },
    productPrice:{
      type:Number,
      required:true
    },
    quantity: {
      type: Number,
      required: true,
      min:[1, 'Quantity can not be less then 1.'],
      default: 1
      },
    price: {
      type:Number
    },
    selected: {
      type: Boolean, // Add a selected field to mark whether the item is selected
      default: false, // Inaitialize as not selected
  },
    }],
 
billTotal: {
    type: Number,
    required: true,
   default: 0
  }
}, {
timestamps: true
})

const Cart = mongoose.model('Cart',cartSchema);

module.exports=Cart;