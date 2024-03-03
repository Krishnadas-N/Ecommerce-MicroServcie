const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({

    name: {
       type: String,
       required: true,
    },

    description: {
      type: String,
      required: true
    },
    images:[{
      type:String,
    }],
    brand:{
      type:String
    },
    productOffer: {
      percentageDiscount: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      isActive: {
        type: Boolean,
        default: false,
      },
    },
    countInStock:{
      type: Number,
      required: true,
     
    },
    isFeatured:{
      type:Boolean,
      default:false
    },
    sizes: [{
      type: String,
      enum: ["S", "M", "L", "XL", "P"], // Restrict sizes to predefined values
  }],
    category: {
       type: String,
       required: true
    },
    price: {
       type: Number,
       required: true,
       default:0,

    },
    isCategoryBlocked: {
      type: Boolean,
      default: false,
   },
    }, {
    timestamps: true
    })

const Product = mongoose.model('Product',productSchema);

module.exports = Product;