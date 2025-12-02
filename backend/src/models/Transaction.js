const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['send_money', 'cash_in', 'cash_out', 'bills_payment'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  fee: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    maxlength: 200,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
  },
  referenceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  senderBalanceBefore: {
    type: Number,
    required: true,
  },
  senderBalanceAfter: {
    type: Number,
    required: true,
  },
  recipientBalanceBefore: {
    type: Number,
  },
  recipientBalanceAfter: {
    type: Number,
  },
  metadata: {
    method: String,
    billerName: String,
    accountNumber: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate unique reference number
transactionSchema.pre('save', async function(next) {
  if (!this.referenceNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.referenceNumber = `GC${timestamp}${random}`;
  }
  next();
});

// Index for faster queries
transactionSchema.index({ sender: 1, createdAt: -1 });
transactionSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
