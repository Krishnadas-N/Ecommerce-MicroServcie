const express = require('express');
const user_router = express.Router();
const {
    categoryManagementGet
}=require( '../Controllers/userCategoryController')  ;


user_router.get('/get-categories',categoryManagementGet);

module.exports=user_router;