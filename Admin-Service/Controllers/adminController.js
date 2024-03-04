const Admin = require('../Models/adminModel');

const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken')


const adminSignupPost = async (req, res,next) => {
    try {
      const { firstName, lastName, email, mobile, password } = req.body;
  
      // Check if an admin with the same email already exists
      const existingAdmin = await Admin.findOne({ email });
  
      if (existingAdmin) {
        return res.status(400).json({ error: 'Admin with this email already exists. Please login again.' });
      }
  
      // Create a new admin instance
      const newAdmin = new Admin({
        name: `${firstName} ${lastName}`,
        email,
        mobile,
        password,
      });
  
      // Save the admin to the database
      const savedAdmin = await newAdmin.save();
  
      res.status(201).json({success:true,data:{msg:'Admin Created successfully,',Admin:savedAdmin}}); // Respond with the saved admin data
    } catch (err) {
      console.error(err);
      next(err)
    }
  };

  const adminLoginPost = async (req, res,next) => {
    try {
      const { email, password } = req.body;
  
      const admin = await Admin.findOne({ email });
     
      console.log(admin+"   2323");
     
     
      if (!admin) {
        const error= new Error('Admin not found. Please check your username and password');
        error.status=404;
        throw error;
      }
  
      const passwordMatch = await bcrypt.compare(password, admin.password);
  
      if (!passwordMatch) {
        const error= new Error('Invalid password. Please check your username and password');
        error.status=404;
        throw error;
      }

      const userId = user._id;

      const token = jwt.sign(
        { _id: userId, email: email,role:'Admin' },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
  
      res.status(200).json({success:true,data:{msg:'Admin logged Successfully',token:token}});
    } catch (err) {
      console.error(err);
      next(err)
    }
  };
  

module.exports={
    adminLoginPost,
    adminSignupPost
}