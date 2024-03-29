const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  description:{
    type:String
  }
  // Add any other fields you need to track for transactions
}, {
  timestamps: true,
});

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  transactions: [transactionSchema],
}, {
  timestamps: true,
});

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet
