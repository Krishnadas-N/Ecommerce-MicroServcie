const express = require('express');
const admin_router = express.Router();

const{adminLoginPost ,
    adminSignupPost} = require('../Controllers/adminController')

admin_router.post('/signup', adminSignupPost);

admin_router.post('/login', adminLoginPost);//api/admin/login



module.exports = admin_router;