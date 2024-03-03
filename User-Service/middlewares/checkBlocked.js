const User = require("../Models/userSchema"); // Import the User model

const blockMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({success:false, data: "You are not logged in." });
    }
    const userid = req.user._id;
    const user = await User.findOne({ _id: userid }); // Assuming you have the user data in req.user

    // Check if the user is blocked
    if (user.isBlocked) {
      console.log("uSER IS BLOCKED!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      return res
        .status(403)
        .json({ success: false, data: "You are Blocked by Administrators" });
    }
    return next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

module.exports = blockMiddleware;
