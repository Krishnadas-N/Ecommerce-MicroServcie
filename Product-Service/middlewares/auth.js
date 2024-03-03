const jwt = require('jsonwebtoken');
require('dotenv').config()

exports.requireJWTAuthentication = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({success:false, data: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = decoded;
    next();
  });
}


exports.isAdmin=(req, res, next) => {
  if(req.user.role==='Admin'){
    next();
  }else{
    return res.status(403).json({success:false,data})
  }
}


exports.CommonRouteAuthentication = (req, res, next) => {
  if(req.headers['authorization']){
    const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({success:false, data: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = decoded;
    next();
  });
  }else{
  next();

  }
};






















// const jwt = require('jsonwebtoken');

// const User = require('../models/userModel');

// require('dotenv').config();

// const auth = async(req,res,next) =>{
//     try{
//         const token = req.header('Authorization').replace('Bearer ','');
//         const decoded = jwt.verify(token,process.env.JWT_SECRET);
//         const user = await User.findOne({ _id: decoded._id, 'tokens.token':token });

//         if(!user){
//             throw new Error;
//         }
//         req.token = token;
//         req.user = user;
//         next();
//     }catch(error){
//         res.status(401).send({error: "Authentication required"})
//     }
// }

// module.exports =auth;