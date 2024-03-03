const express = require('express');
const admin_router = express.Router();
const {
    categoryManagementGet,
    categoryManagementCreate,
    categoryManagementEdit,
    categoryManagementUnlist,
  } =require('../Controllers/adminCategoryController');
const { requireJWTAuthentication ,isAdmin} = require('../middlewares/auth');
  

//Category ManageMent

admin_router.get('/',requireJWTAuthentication,isAdmin,categoryManagementGet);

admin_router.post('/add-category',requireJWTAuthentication,isAdmin,categoryManagementCreate)

admin_router.post('/edit-category/:categoryId',requireJWTAuthentication,isAdmin,categoryManagementEdit)

admin_router.patch('/update-status/:categoryId',requireJWTAuthentication,isAdmin,categoryManagementUnlist)

module.exports = admin_router;