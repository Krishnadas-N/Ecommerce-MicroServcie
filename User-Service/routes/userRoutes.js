const express = require("express");
const {
  UserDetials,
  UserSignup,
  verifyuserSigin,
  UserLogin,
  mobileUniqueCheck,
  resendOtpSiginin,
  changePassword,
  forgotPasswordPost,
  resetPasswordPost,
} = require("../Controllers/UserController");


const {
  requireJWTAuthentication
} = require("../middlewares/auth");
const blockMiddleware = require("../middlewares/checkBlocked");
const {
  userAddAddress,
  userEditAddress,
  userdeleteAddress,
  GetAddress,
  GetSingleAddress
} = require("../Controllers/AddressController");
const router = express.Router();

router.get("/get-user", requireJWTAuthentication, blockMiddleware, UserDetials);

router.post("/register", UserSignup);

router.post("/verify-register", verifyuserSigin);

router.post("/login", UserLogin);

router.get("/check-user-mobile", mobileUniqueCheck);

router.post("/resend-otp", resendOtpSiginin);

router.get("/forgot-password", forgotPasswordPost);

router.get("/change-password", requireJWTAuthentication, blockMiddleware, changePassword);

router.post("/reset-password", resetPasswordPost);

router.get('/address',requireJWTAuthentication,blockMiddleware,GetAddress);

router.get('/single-address',requireJWTAuthentication,blockMiddleware,GetSingleAddress);

router.post('/add-address',requireJWTAuthentication,blockMiddleware,userAddAddress);

router.put('/edit-address',requireJWTAuthentication,blockMiddleware,userEditAddress);

router.delete('/delete-address',requireJWTAuthentication,blockMiddleware,userdeleteAddress)

module.exports = router
