
const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.param,
      message: error.msg
    }));
    
    res.status(400).json({
      message: 'Validation failed',
      errors: formattedErrors
    });
    return;
  }
  
  next();
};

module.exports = {
  validateRequest,
};
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');