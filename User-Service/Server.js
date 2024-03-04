const express = require('express');
const http = require('http');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const session = require('express-session');
const db = require('./Config/database')
const usersRouter = require('./routes/userRoutes');

const errorHandler = require('./middlewares/errorHandler');
const grpcServer = require('./grpcServices/checkUserisBlocked');


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

app.use('/user', usersRouter);

app.use((req, res, next) => {
  next(createError(404));
});

app.use(errorHandler);

server.on('error', onError);

server.on('listening', onListening);

const port = normalizePort(process.env.PORT || '5001');
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

// Function to handle HTTP server "listening" event
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}
