const Product = require("../Models/productModel");
const mongoose = require("mongoose");
const { wishlistClient } = require("../grpcClient/getWishlsit");






const ProductDetailedView = async (req, res, next) => {
    try {
        const productId = req.params.productId;

        const product = await Product.findById(productId);
  
        if (!product) {
            const error = new Error("Product not found");
            error.status = 404;
            throw error;
        }

        let isInWishlist = false;
        if (req.user && req.user._id) {
            const userId = req.user._id;

            const userWishlistResponse = await new Promise((resolve, reject) => {
                wishlistClient.GetUserWishlist({ userId }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            });

            const userWishlistProductIds = userWishlistResponse.productIds;
            isInWishlist = userWishlistProductIds.includes(productId);
        }
  
        res.status(200).json({
            success:true,
            data:{product,isInWishlist}
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
};


const getAllProducts = async (req, res, next) => {
    try {
        const itemsPerPage = 9;
        const selectedPage = req.query.page || 1;
        const selectedCategory = req.query.category || null;
        const selectedSort = req.query.sort || 'priceLowToHigh';

        let query = { isFeatured: true };

        if (selectedCategory) {
            query.category = selectedCategory;
        }

        let products = await Product.find(query);

        // Apply sorting based on the selected criteria
        if (selectedSort === 'priceLowToHigh') {
            products.sort((a, b) => a.price - b.price);
        } else if (selectedSort === 'priceHighToLow') {
            products.sort((a, b) => b.price - a.price);
        } else if (selectedSort === 'releaseDate') {
            products.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }

        // Paginate products
        const startIndex = (selectedPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedProducts = products.slice(startIndex, endIndex);

        const totalProducts = products.length;

        const newProducts = await Product.find({ isFeatured: true }).sort({ createdAt: -1 }).limit(3);

        let productInWishlist = {};

        if (UserExist) {
            const userId = req.user._id;

            const userWishlistResponse = await new Promise((resolve, reject) => {
                wishlistClient.GetUserWishlist({ userId }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response);
                    }
                });
            });

            const userWishlistProductIds = userWishlistResponse.productIds;
            paginatedProducts.forEach((product) => {
                productInWishlist[product._id] = userWishlistProductIds.includes(product._id) || false;
            });
        } 

        res.status(201).json({
            success:true,
            data:{
            products: paginatedProducts,
            newProducts,
            currentPage: selectedPage,
            totalPages: Math.ceil(totalProducts / itemsPerPage),
            countProducts: totalProducts,
            sort: selectedSort,
            productInWishlist
            }
        });
    } catch (err) {
        console.error(err);
        next(err);
    }
};

  

module.exports={
    ProductDetailedView,
    getAllProducts
}