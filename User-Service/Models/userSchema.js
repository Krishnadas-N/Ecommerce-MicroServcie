const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const validator = require('validator');
require('dotenv').config();
const bcrypt = require('bcrypt');


// Declare the Schema of the Mongo model
const userSchema = new mongoose.Schema({
    profile:{
        type:String,

    },
    firstName:{
        type:String,
        required:true,
    },
    lastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase: true,
        validate( value ) {
           if( !validator.isEmail( value )) {
                throw new Error( 'Email is invalid' )
                 }
            }
    },
    gender:{
        type:String,
        required:true
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet', // Reference to the 'Wallet' model
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    mobile:{
        type:Number,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    resetToken: {
        type: String,
      },
      resetTokenExpiration: {
        type: Date,
      },
      }, {
      timestamps: true
});


// Hash plain password before saving
userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        console.log(user.password)
        user.password = await bcrypt.hash(user.password, 10);
        console.log(user.password)
    }

    // Call next to continue with the saving process
    next();
});
const  User = mongoose.model('User', userSchema);
module.exports = User;