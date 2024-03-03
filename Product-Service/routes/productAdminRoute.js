const express = require('express');
const admin_router = express.Router();
const multer = require('multer');
const {
    productManagementGet,
    productManagementCreate,
    productManagementEdit,
    productManagementEditGet,
    productManagementPublish,
    productManagementremoveImages,
  } = require('../Controllers/AdminproductController');
const { isAdmin, requireJWTAuthentication } = require('../middlewares/auth');



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); // Define the upload directory (create it if it doesn't exist)
    },
    filename: function (req, file, cb) {
        req.body.Imagename= Date.now() + '-' + file.originalname
        cb(null, Date.now() + '-' + file.originalname); // Define the filename
    }
});

const upload = multer({ storage: storage });




admin_router.get('/get-products',requireJWTAuthentication,isAdmin,productManagementGet)

admin_router.post('/add-product',requireJWTAuthentication,isAdmin,upload.fields([{ name: 'images' }]),productManagementCreate)

admin_router.get('/edit-product/:Id',requireJWTAuthentication,isAdmin,productManagementEditGet)

admin_router.post('/edit-product/:Id',requireJWTAuthentication,isAdmin,upload.fields([{ name: 'images' }]),productManagementEdit);


admin_router.put('/change-status/:productId',requireJWTAuthentication,isAdmin,productManagementPublish);


admin_router.delete('/:productId/removeImage/:index',requireJWTAuthentication,isAdmin,productManagementremoveImages);

module.exports=admin_router