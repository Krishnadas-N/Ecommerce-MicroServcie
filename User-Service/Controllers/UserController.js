const User = require("../Models/userSchema");
const otpModel = require("../Models/otpModel");
const { transporter } = require("../Config/otpGenerator");
const uuidv4 = require("uuid").v4;
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken");
const Wallet = require("../Models/WalletModel");
require("dotenv").config();
const generateOTP = () => {
  // Define a character set containing only numeric characters (0-9)
  const numericCharacterSet = "0123456789";

  // Generate a random OTP of a specified length using the numeric character set
  const otpLength = 6; // You can adjust the length as needed
  let otp = "";

  for (let i = 0; i < otpLength; i++) {
    const randomIndex = Math.floor(Math.random() * numericCharacterSet.length);
    otp += numericCharacterSet.charAt(randomIndex);
  }

  return otp;
};

const sendOTPByEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is: ${otp}`,
    };

    // Send OTP email
    await transporter.sendMail(mailOptions);

    // Save OTP in the database
    const otpDocument = await otpModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          otp: otp,
          attempts: 1 // Reset attempts counter
        }
      },
      { upsert: true, new: true } // Upsert ensures a new document is created if not found
    );

    console.log("OTP document:", otpDocument);

  } catch (err) {
    console.error("Error sending OTP:", err);
    throw new Error("Error in OTP generation");
  }
};

const UserDetials = async (req, res, next) => {
  try {
    if (!req.user) {
      const error = new Error("No user logged in");
      error.status = 401; // Set the status code to 401
      throw error;
    }
    const UserId = req.user._id;
    console.log(req.user)
    let UserData = await User.findOne({ _id:UserId });
    if (!UserData || UserData._id != UserId) {
      const error =new Error("User Data is Not FOund");
      error.status = 403; // Set the status code to 401
      throw error;
    } else {
      const UserDetails = {
        firstname: UserData.firstName,
        lastname: UserData.lastName,
        email: UserData.email,
        gender: UserData.gender,
        isBlocked: UserData.isBlocked,
        mobile: UserData.mobile,
      };
      return res.status(201).json({ success: true, data: UserDetails });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const UserSignup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, gender, mobile, password } = req.body;

    console.log(req.body);
    console.log("///////////////////////////////////////////////////");

    const existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      if (existingUser.isVerified) {
        const error = new Error(
          "User with this email already exists and is verified. Please login again."
        );
        error.status = 400;
        throw error;
      } else {
        // If user exists but is not verified, resend verification message
        const otp = generateOTP();
        console.log(otp);

        await sendOTPByEmail(req.body.email, otp);
        return res.status(200).json({ success: true, data: { msg: "Otp Send to User Email", email: req.body.email } });
      }
    }

    // If user doesn't exist, create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      gender,
      mobile,
      password,
    });
    await newUser.save();
    const otp = generateOTP();
    console.log(otp);

    await sendOTPByEmail(req.body.email, otp);
    res.status(201).json({ success: true, data: { msg: "Otp Send to User Email", email: req.body.email } });
  } catch (err) {
    console.error(err);
    next(err);
  }
};


const verifyuserSigin = async (req, res, next) => {
  try {
    const email =req.body.email;
    const otp = req.body.otp;
    const otpDoc = await otpModel.findOne({ email });

    if (!otpDoc) {
      const error = new Error("OTP not found");
      error.status = 404; // Set the status code to 401
      throw error;
    }

    if (otpDoc.otp === otp && otpDoc.status === "UNUSED") {
      // Mark OTP as used
      otpDoc.status = "USED";
      await otpDoc.save();
      const newUser = await User.findOne({ email: email });
      newUser.isVerified = true;

      const newWallet = new Wallet({
        user: newUser._id,
      });
      await newWallet.save();

      newUser.wallet = newWallet._id;
      await newUser.save();

      return res
        .status(200)
        .json({ success: true, message: "User Created successfully" });
    } else {
      const error = new Error("The otp is already used");
      error.status = 409; // Set the status code to 401
      throw error;
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User  not found with this email address");
      error.status = 404; // Set the status code to 401
      throw error;
    }
    if (user.isBlocked) {
      const error = new Error("User is Blocked by Adminstrators");
      error.status = 403; // Set the status code to 401
      throw error;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error("Invalid password. Please check your password");
      error.status = 403; // Set the status code to 401
      throw error;
    } else {
      const userId = user._id;

      const token = jwt.sign(
        { _id: userId, email: email,role:'User' },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.status(200).json({ success: true, data: token });
    }
  } catch (err) {
    next(err);
  }
};

const mobileUniqueCheck = async (req, res, next) => {
  const mobileNumber = req.body.mobile;

  try {
    // Check if the mobile number exists in the database
    const existingUser = await User.findOne({ mobile: mobileNumber });

    res.status(200).json({ success: true, data: !existingUser });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const resendOtpSiginin = async (req, res) => {
  try {
    const email = req.session.PendingVerifyEmail;
    const existingOTP = await otpModel.findOne({ email });
    console.log(email, existingOTP);
    if (existingOTP !== undefined || existingOTP.status !== "USED") {
      const otp = generateOTP();
      console.log(otp);
      if (existingOTP) {
        existingOTP.otp = otp;
        existingOTP.status = "UNUSED";
        await existingOTP.save();
      } else {
        await otpModel.create({ email, otp, status: "UNUSED" });
      }
      await sendOTPByEmail(email, otp);
      return res
        .status(200)
        .json({ success: true, data: "OTP resent successfully" });
    } else {
      const error = new Error("OTP resend is not allowed at this time");
      error.status = 400; // Set the status code to 401
      throw error;
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const forgotPasswordPost = async (req, res, next) => {
  try {
    console.log(req.body);
    const email = req.body.email;
    console.log(email);
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("User is not found");
      error.status = 404; // Set the status code to 401
      throw error;
    }
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    await User.updateOne(
      { email },
      {
        $set: {
          resetToken: token,
          resetTokenExpiration: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes in milliseconds
        },
      }
    );

    const mailOptions = {
      to: email,
      subject: "Password Reset Request",
      text: `Click the following link to reset your password: ${req.protocol}://${req.headers.host}/reset-password/${token}`,
      html: `<h5>Click the following link to reset your password:</p><p><a href=${req.protocol}://${req.headers.host}/reset-password/${token}>http://localhost:3000/reset-password/${token}</a></h5>`,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(201)
      .json({
        success: true,
        message: "Reset password link is sent successfully",
      });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const userDetails = await User.findOne({ _id: userId });
    if (!userDetails) {
      const error = new Error("User is not found");
      error.status = 404; // Set the status code to 401
      throw error;
    }
    const email = userDetails.email;
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          resetToken: token,
          resetTokenExpiration: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes in milliseconds
        },
      }
    );

    const mailOptions = {
      to: email,
      subject: "Password Reset Request",
      text: `Click the following link to reset your password: http://localhost:3000/reset-password/${token}`,
      html: `<p>Click the following link to reset your password:</p><p><a href="http://localhost:3000/reset-password/${token}">http://localhost:3000/reset-password/${token}</a></p>`,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(201)
      .json({
        success: true,
        data: "Reset password link is sent successfully",
      });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const resetPasswordPost = async (req, res, next) => {
  try {
    console.log(req.body);
    const token = req.body.token;
    const password = req.body.newPassword;
    const confirm_password = req.body.confirmnewPassword;
    if (password !== confirm_password) {
      const error = new Error(
        "The confirm password and  password must be same"
      );
      error.status = 404; // Set the status code to 401
      throw error;
    }
    const user = await User.findOne({ resetToken: token });
    console.log(user);
    if (!user) {
      const error = new Error("User doesnt exist");
      error.status = 404; // Set the status code to 401
      throw error;
    }
    user.password = password;
    user.resetToken = null; // Optionally, clear the reset token
    user.resetTokenExpiration = null;
    await user.save();
    // return res.status(200).json({status:true,message: 'Password reset successful' });
    return res
      .status(200)
      .json({ success: true, data: "Sucesfully Password Changed" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  resetPasswordPost,
  changePassword,
  forgotPasswordPost,
  resendOtpSiginin,
  mobileUniqueCheck,
  UserLogin,
  UserSignup,
  verifyuserSigin,
  UserDetials,
};
