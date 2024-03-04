const express = require('express');
const http = require('http');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const session = require('express-session');
const db = require('./Config/database');
const orderRoute = require('./routes/orderRoute');

const errorHandler = require('./middlewares/errorHandler');
const { consumeOrders } = require('./utils/ampqSetup');

require('dotenv').config();

const app = express();

const server = http.createServer(app);

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use(cors({
  credentials: true,
  origin: '*', // Allow requests from any origin (replace with your specific origins)
  optionsSuccessStatus: 200,
}));

app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

app.use('/order', orderRoute);

app.use((req, res, next) => {
  next(createError(404));
});

app.use(errorHandler);

server.on('error', onError);

server.on('listening', () => {
  console.log('Server listening on port', server.address().port);
  // Call consumeOrders function here
  consumeOrders().catch(error => {
    console.error('Failed to start order service:', error);
    process.exit(1); // Exit the process if there's an error
  });
});

const port = normalizePort(process.env.PORT || '5005');
app.set('port', port);

server.listen(port);

// Function to normalize port
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
}

// Function to handle HTTP server errors
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
