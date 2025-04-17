const { ethers } = require('ethers');

// Validate Ethereum address
const validateAddress = (req, res, next) => {
  const address = req.params.address || req.body.address;
  
  if (!address) {
    return res.status(400).json({
      error: "Address is required"
    });
  }
  
  if (!ethers.utils.isAddress(address)) {
    return res.status(400).json({
      error: "Invalid Ethereum address"
    });
  }
  
  next();
};

// Validate amount
const validateAmount = (req, res, next) => {
  const { amount } = req.body;
  
  if (!amount) {
    return res.status(400).json({
      error: "Amount is required"
    });
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      error: "Amount must be a positive number"
    });
  }
  
  next();
};

// Validate loan amount
const validateLoanAmount = (req, res, next) => {
  const { amount } = req.body;
  
  if (!amount) {
    return res.status(400).json({
      error: "Loan amount is required"
    });
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      error: "Loan amount must be a positive number"
    });
  }
  
  // Additional validation for maximum loan amount could be added here
  
  next();
};

module.exports = {
  validateAddress,
  validateAmount,
  validateLoanAmount
};