const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const createError = require('http-errors');
const {cartProxy, wishlistProxy, orderProxy, categoryProxy, productProxy, userProxy, adminProxy } = require('./routes/Routes');
const retry = require('retry');

const app = express();

const retryOptions = {
  retries: 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 10000,
  randomize: true,
};

// Middleware usage:
app.use(morgan('combined'));
app.use(cors({ 
  origin: '*', 
  credentials: true, 
  optionsSuccessStatus: 200,
}));

// Route definitions:
app.use('/user', userProxy);
app.use('/cart', cartProxy);
app.use('/product', productProxy);
app.use('/admin/product', productProxy);
app.use('/category', categoryProxy);
app.use('/admin/category', categoryProxy);
app.use('/order',orderProxy);
app.use('/wishlist',wishlistProxy);
app.use('/admin', adminProxy);



// Enhanced error handling middleware:
app.use((err, req, res, next) => {
  if (err instanceof createError.Unauthorized) {
    res.status(err.status).json({ error: 'Authentication failed' });
  } else if (err instanceof createError.ServiceUnavailable) {
    res.status(err.status).json({ error: 'Service temporarily unavailable' });
  } else {
    next(err);
  }
});

// Default error handler with logging:
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
