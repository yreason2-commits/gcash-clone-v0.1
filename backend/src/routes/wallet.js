const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/wallet/balance
// @desc    Get user's current balance
// @access  Private
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('balance phoneNumber');
    
    res.status(200).json({
      balance: user.balance,
      phoneNumber: user.phoneNumber,
      formatted: `₱${user.balance.toFixed(2)}`
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve balance',
      detail: error.message 
    });
  }
});

// @route   GET /api/wallet/summary
// @desc    Get wallet summary (balance, recent transactions, stats)
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('balance phoneNumber isVerified createdAt');
    
    // Get recent transactions (last 5)
    const recentTransactions = await Transaction.find({
      $or: [
        { sender: req.user._id },
        { recipient: req.user._id }
      ]
    })
      .populate('sender', 'phoneNumber')
      .populate('recipient', 'phoneNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate monthly stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlySent = await Transaction.aggregate([
      {
        $match: {
          sender: user._id,
          type: 'send_money',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const monthlyReceived = await Transaction.aggregate([
      {
        $match: {
          recipient: user._id,
          type: 'send_money',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const formattedTransactions = recentTransactions.map(tx => ({
      id: tx._id,
      type: tx.type,
      amount: tx.amount,
      referenceNumber: tx.referenceNumber,
      sender: tx.sender?.phoneNumber || 'N/A',
      recipient: tx.recipient?.phoneNumber || 'N/A',
      isSent: tx.sender._id.toString() === user._id.toString(),
      timestamp: tx.createdAt,
    }));

    res.status(200).json({
      balance: user.balance,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
      memberSince: user.createdAt,
      recentTransactions: formattedTransactions,
      monthlyStats: {
        sent: monthlySent[0]?.total || 0,
        received: monthlyReceived[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get wallet summary error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve wallet summary',
      detail: error.message 
    });
  }
});

// @route   GET /api/wallet/verify/:phoneNumber
// @desc    Verify if a phone number is registered
// @access  Private
router.get('/verify/:phoneNumber', protect, async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;
    
    // Clean phone number
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    let cleanPhone = digitsOnly;
    if (digitsOnly.startsWith('63') && digitsOnly.length >= 12) {
      cleanPhone = digitsOnly.slice(2);
    } else if (digitsOnly.startsWith('0') && digitsOnly.length === 11) {
      cleanPhone = digitsOnly.slice(1);
    }

    const user = await User.findOne({ phoneNumber: cleanPhone }).select('phoneNumber isVerified');
    
    if (!user) {
      return res.status(404).json({ 
        exists: false,
        message: 'Phone number not registered' 
      });
    }

    res.status(200).json({
      exists: true,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified
    });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({ 
      message: 'Failed to verify phone number',
      detail: error.message 
    });
  }
});

module.exports = router;
