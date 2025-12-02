const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { validateTransaction } = require('../middleware/validate');
const mongoose = require('mongoose');

const router = express.Router();

// @route   POST /api/transactions/send-money
// @desc    Send money to another user
// @access  Private
router.post('/send-money', protect, validateTransaction, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { recipientPhone, amount, message, mpin } = req.body;

    // Clean phone number
    const digitsOnly = recipientPhone.replace(/\D/g, '');
    let cleanPhone = digitsOnly;
    if (digitsOnly.startsWith('63') && digitsOnly.length >= 12) {
      cleanPhone = digitsOnly.slice(2);
    } else if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
      cleanPhone = digitsOnly.slice(1);
    }

    // Verify MPIN
    const sender = await User.findById(req.user._id).session(session);
    const isValidMpin = await sender.compareMpin(mpin);
    if (!isValidMpin) {
      await session.abortTransaction();
      return res.status(401).json({ message: 'Invalid MPIN' });
    }

    // Check if sender has sufficient balance
    const numAmount = parseFloat(amount);
    const fee = 0; // No fee for send money
    const totalAmount = numAmount + fee;

    if (sender.balance < totalAmount) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Insufficient balance',
        required: totalAmount,
        available: sender.balance
      });
    }

    // Find recipient
    const recipient = await User.findOne({ phoneNumber: cleanPhone }).session(session);
    if (!recipient) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Cannot send to yourself
    if (sender._id.toString() === recipient._id.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot send money to yourself' });
    }

    // Store balances before transaction
    const senderBalanceBefore = sender.balance;
    const recipientBalanceBefore = recipient.balance;

    // Update balances
    sender.balance -= totalAmount;
    recipient.balance += numAmount;

    await sender.save({ session });
    await recipient.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      sender: sender._id,
      recipient: recipient._id,
      type: 'send_money',
      amount: numAmount,
      fee: fee,
      totalAmount: totalAmount,
      message: message || '',
      status: 'completed',
      senderBalanceBefore,
      senderBalanceAfter: sender.balance,
      recipientBalanceBefore,
      recipientBalanceAfter: recipient.balance,
    });

    await transaction.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      message: 'Money sent successfully',
      transaction: {
        referenceNumber: transaction.referenceNumber,
        amount: transaction.amount,
        recipient: {
          phoneNumber: recipient.phoneNumber,
        },
        newBalance: sender.balance,
        timestamp: transaction.createdAt,
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Send money error:', error);
    res.status(500).json({ 
      message: 'Failed to send money',
      detail: error.message 
    });
  } finally {
    session.endSession();
  }
});

// @route   POST /api/transactions/cash-in
// @desc    Cash in money
// @access  Private
router.post('/cash-in', protect, async (req, res) => {
  try {
    const { amount, method } = req.body;

    const user = await User.findById(req.user._id);
    const numAmount = parseFloat(amount);

    // Store balance before transaction
    const balanceBefore = user.balance;

    // Update balance
    user.balance += numAmount;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      sender: user._id,
      recipient: user._id,
      type: 'cash_in',
      amount: numAmount,
      fee: 0,
      totalAmount: numAmount,
      status: 'completed',
      senderBalanceBefore: balanceBefore,
      senderBalanceAfter: user.balance,
      recipientBalanceBefore: balanceBefore,
      recipientBalanceAfter: user.balance,
      metadata: {
        method: method || 'unknown'
      }
    });

    await transaction.save();

    res.status(200).json({
      message: 'Cash in successful',
      transaction: {
        referenceNumber: transaction.referenceNumber,
        amount: transaction.amount,
        method: method,
        newBalance: user.balance,
        timestamp: transaction.createdAt,
      }
    });
  } catch (error) {
    console.error('Cash in error:', error);
    res.status(500).json({ 
      message: 'Failed to cash in',
      detail: error.message 
    });
  }
});

// @route   GET /api/transactions/history
// @desc    Get transaction history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    })
      .populate('sender', 'phoneNumber')
      .populate('recipient', 'phoneNumber')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Transaction.countDocuments({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    });

    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      fee: tx.fee,
      totalAmount: tx.totalAmount,
      status: tx.status,
      referenceNumber: tx.referenceNumber,
      message: tx.message,
      sender: tx.sender?.phoneNumber || 'N/A',
      recipient: tx.recipient?.phoneNumber || 'N/A',
      isSent: tx.sender._id.toString() === req.user._id.toString(),
      timestamp: tx.createdAt,
      metadata: tx.metadata,
    }));

    res.status(200).json({
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve transaction history',
      detail: error.message 
    });
  }
});

// @route   GET /api/transactions/:referenceNumber
// @desc    Get transaction details by reference number
// @access  Private
router.get('/:referenceNumber', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ 
      referenceNumber: req.params.referenceNumber 
    })
      .populate('sender', 'phoneNumber')
      .populate('recipient', 'phoneNumber');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if user is part of the transaction
    const isAuthorized = 
      transaction.sender._id.toString() === req.user._id.toString() ||
      transaction.recipient._id.toString() === req.user._id.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.status(200).json({
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        fee: transaction.fee,
        totalAmount: transaction.totalAmount,
        status: transaction.status,
        referenceNumber: transaction.referenceNumber,
        message: transaction.message,
        sender: transaction.sender.phoneNumber,
        recipient: transaction.recipient.phoneNumber,
        timestamp: transaction.createdAt,
        metadata: transaction.metadata,
      }
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve transaction',
      detail: error.message 
    });
  }
});

module.exports = router;
