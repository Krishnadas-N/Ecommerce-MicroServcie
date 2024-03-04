const { client } = require('../Grpc-Clients/checkUserBlocker');
const blockMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return next()
    }
    const userId = req.user._id;

    client.checkUserBlocked({ userId }, (err, response) => {
      if (err) {
        console.log('Error from server', err);
        return next(err); // Forward the error to the error handling middleware
      } else if (response.isUserBlocked) {
        console.log('User is blocked');
        return res.status(403).json({ success: false, data: { msg: "This account is blocked." } });
      }
      next();
    });
  } catch (err) {
    console.error(err);
    next(err); // Forward the error to the error handling middleware
  }
};

module.exports = blockMiddleware;
