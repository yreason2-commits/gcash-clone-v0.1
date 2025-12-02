const { body, validationResult } = require('express-validator');

// Validation middleware to check for errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

// Phone number validation rules
const validatePhoneNumber = [
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(63|0)?9\d{9}$/).withMessage('Invalid Philippine phone number format'),
  validate
];

// MPIN validation rules
const validateMpin = [
  body('mpin')
    .trim()
    .notEmpty().withMessage('MPIN is required')
    .isLength({ min: 6, max: 6 }).withMessage('MPIN must be exactly 6 digits')
    .isNumeric().withMessage('MPIN must contain only numbers'),
  validate
];

// Transaction validation rules
const validateTransaction = [
  body('recipientPhone')
    .trim()
    .notEmpty().withMessage('Recipient phone number is required')
    .matches(/^(63|0)?9\d{9}$/).withMessage('Invalid recipient phone number'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 1 }).withMessage('Amount must be at least 1')
    .isFloat({ max: 50000 }).withMessage('Amount cannot exceed 50,000'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Message cannot exceed 200 characters'),
  validate
];

// Cash in validation rules
const validateCashIn = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 100 }).withMessage('Minimum cash in amount is 100')
    .isFloat({ max: 100000 }).withMessage('Maximum cash in amount is 100,000'),
  body('method')
    .notEmpty().withMessage('Cash in method is required')
    .isIn(['7-eleven', 'bank_transfer', 'gcash_partner']).withMessage('Invalid cash in method'),
  validate
];

module.exports = {
  validate,
  validatePhoneNumber,
  validateMpin,
  validateTransaction,
  validateCashIn
};
