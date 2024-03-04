// errorMiddleware.js

function errorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  res.status(statusCode).json({success:false, error: err.message });
  
  }
  
  module.exports = errorHandler;
  