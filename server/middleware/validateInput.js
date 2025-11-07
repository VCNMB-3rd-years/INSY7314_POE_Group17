const { validationResult } = require('express-validator');

const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

module.exports = validateInput;

// References:
//DigitalOcean. (2023). How to Handle Form Inputs Efficiently with Express-Validator in Express.js. [online] Available at: https://www.digitalocean.com/community/tutorials/how-to-handle-form-inputs-efficiently-with-express-validator-in-express-js [Accessed 3 Oct. 2025]