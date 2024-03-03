const { client } = require('../Grpc-Clients/checkProduct');
const Wishlist = require('../Models/wishlistModel')
const amqp = require('amqplib');

exports.WishlistAdd = async (req, res,next) => {
    try {
        const productId = req.params.productId;
        const userId = req.user._id;

        // Check if the product exists
        const checkProductExistencePromise = new Promise((resolve, reject) => {
            client.CheckProductExistence({ productId }, (err, response) => {
                if (err) {
                    console.error('Error:', err.message);
                    reject(new Error('Internal Server Error'));
                }
                resolve(response.exists);
            });
        });

        // Await the result of the checkProductExistencePromise
        const productExists = await checkProductExistencePromise;

        if (!productExists) {
            return res.status(404).json({success:false, data:{message: 'The Product is Not Found' }});
        }

        // Find the user's wishlist
        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            // If the wishlist doesn't exist, create a new one and add the product
            wishlist = new Wishlist({
                user: userId,
                products: [productId],
            });
            await wishlist.save();
            return res.status(200).json({ message: 'Product added to wishlist successfully' });
        }

        const productIndex = wishlist.products.indexOf(productId);

        if (productIndex !== -1) {
            // If the product is already in the wishlist, remove it
            wishlist.products.splice(productIndex, 1);
            await wishlist.save();
            return res.status(200).json({ message: 'Product removed from wishlist successfully' });
        } else {
            // If the product is not in the wishlist, add it
            wishlist.products.push(productId);
            await wishlist.save();
            return res.status(200).json({ message: 'Product added to wishlist successfully' });
        }
    } catch (err) {
        console.log(err);
        next(err)
    }
};

  
  
  
  exports.WishlistGet = async(req,res,next)=>{
    try{
    const page = parseInt(req.query.page) || 1;
    const perPage = 8 ;
      const userId = req.user._id;
      const totalWishlistItems = await Wishlist.aggregate([
        {
          $match: {
            user: userId,
          },
        },
        {
          $project: {
            numberOfWishlistItems: { $size: '$products' },
          },
        },
      ]);
      
      const countResult = totalWishlistItems[0];
      const numberOfItemsInWishlist = countResult ? countResult.numberOfWishlistItems : 0;
      
      console.log(totalWishlistItems);
      const totalPages = Math.ceil(numberOfItemsInWishlist / perPage);
      console.log(totalPages)
  
      const startIndex = (page - 1) * perPage;
  
      const Products = await Wishlist.findOne({user:userId}) .skip(startIndex)
      .limit(perPage);
      const productIds = Products.products;
      console.log(Products)
      const productPromises = productIds.map(productId => {
        return new Promise((resolve, reject) => {
            productServiceClient.GetProductDetailsById({ product_id: productId }, (err, response) => {
                if (err) {
                    console.error(`Error fetching product details for product ID ${productId}:`, err);
                    resolve(null);
                } else {
                    resolve(response);
                }
            });
        });
    });

    const products = await Promise.all(productPromises);

  
      const paginationInfo = {
        totalPages,
        currentPage: page,
      };
  
      return  res.status(201).json({success:true,data:{products,paginationInfo}})
   
    }
    catch(error){
      console.error(error);
      console.log(error);
      next(error);
    }
  }
  
  
  exports.wishlistItemDelete = async (req, res,next) => {
    try {
      const productId = req.params.productId; // The product ID to remove from the wishlist
      const userId = req.user._id; // The user ID
      console.log("wislist Delete")
      const wishlist = await Wishlist.findOne({ user: userId });
      console.log(wishlist)
      if (!wishlist) {
        const error = new Error('Wishlist not found');
        error.status=404;
        throw new error;
      }
  
      const productIndex = wishlist.products.indexOf(productId);
  
      if (productIndex === -1) {
        const error = new Error('prodcut  not found in wishlist');
        error.status=404;
        throw new error;
      }
  
      wishlist.products.splice(productIndex, 1);
  
      await wishlist.save();
  
      res.status(200).json({success:true,data:{ msg: 'Product removed from the wishlist'}});
    } catch (err) {
      console.log(err);
        next(err)
    }
  };
  
  
  
//   exports.WishlistToCart = async (req, res) => {
//     try {
//       console.log("move to cart")
//       const userId = req.user._id; // Assuming you have the user ID available
  
//       // Get the product ID you want to move from the request
//       const productId = req.params.productId; // Adjust this based on your route
  
//       // Retrieve the product details from the wishlist
//       const wishlistItem = await Wishlist.findOne({ user: userId, products: productId });
  
//       if (!wishlistItem) {
//         console.log("Product not found in the wishlist")
//         return res.status(404).json({ message: 'Product not found in the wishlist' });
//       }
  
//       // Check if the product is available in your product collection
//       const product = await Product.findById(productId);
  
//       if (!product) {
//         return res.status(404).json({ message: 'Product not found' });
//       }
  
//       if (product.quantity === 0) {
//         return res.status(400).json({ message: 'Product is out of stock' });
//       }
  
//       // Create or retrieve the user's cart
//       let cart = await Cart.findOne({ owner: userId });
      
//       if (!cart) {
//         // If the cart doesn't exist, create a new one
//         cart = new Cart({ owner: userId, items: [], billTotal: 0 });
//       }
  
//       const cartItem = cart.items.find((item)=>item.productId.toString() === productId)
      
//       if(cartItem){
//         cartItem.productPrice=product.price;
//         cartItem.quantity+=1;
//         cartItem.price = cartItem.quantity * product.price;
//     }else{
//         cart.items.push({
//             productId:productId,
//             name:product.name,
//             image:product.image,
//             productPrice:product.price,
//             quantity:1,
//             price:product.price
//         })
//     }
  
//       // Update the cart's bill total
//       cart.billTotal = cart.items.reduce((total, item) => total + item.price, 0);
  
//       // Save the cart
//       await cart.save();
  
//       // Remove the product from the wishlist
//       await Wishlist.updateOne(
//         { user: userId },
//         { $pull: { products: productId } }
//       );
  
//       return res.status(200).json({ message: 'Product moved from wishlist to cart successfully' });
//     } catch (err) {
//       console.log(err);
//       return res.status(500).json({ message: 'Internal Server Error' });
//     }
//   };