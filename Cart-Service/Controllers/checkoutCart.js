const { client } = require('../Grpc-Clients/checkProduct');
const Cart = require('../Models/cartModel');
const razorpayInstance = require('../config/RazorPay');
const crypto = require('crypto')
require('dotenv').config();


function generateRandomOrderId(length) {
    let result = '';
    const characters = '0123456789'; // Digits
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
  
    return 'OD_' + result;
  }


exports.checkoutGet = async (req, res, next) => {
    try {
        const cartCheckout = await Cart.findOne({ owner: req.user._id });
        const selectedItems = cartCheckout.items.filter(item => item.selected === true);
        if(!selectedItems  || selectedItems.length == 0){
            const error = new Error("Please select at least one product");
            error.statusCode = 422;
            throw error;
        }   
        const promises = selectedItems.map(item => {
            return new Promise((resolve, reject) => {
                client.GetProductDetailsById({ productId: item.productId }, (err, response) => {
                    if (err) {
                        console.error(`Error fetching product details for product ID ${item.productId}:`, err);
                        resolve(null); // Resolve with null if an error occurs
                    } else {
                        resolve({ ...item.toObject(), productDetails: response }); // Add product details to the item object
                    }
                });
            });
        });

        const itemsWithDetails = await Promise.all(promises);

        const billTotal = selectedItems.reduce((total, item) => total + item.price, 0);
        const itemCount = selectedItems.length;

        res.status(200).json({
            success: true,
            data: {
                items: itemsWithDetails,
                count: itemCount,
                totalAmount: billTotal
            }
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
}



exports.checkoutPost = async (req, res, next) => {
    try {
      if (!req.body.paymentOption || !req.body.addressType) {
        const error = new Error("Invalid data in the request");
        error.statusCode = 403;
        throw error;
      }
  
      console.log(req.body.paymentOption, req.body.addressType,"22222222222222222222");
  
      const cart = await Cart.findOne({ owner: req.user._id });
  
      if (!cart || cart.items.length === 0) {
        const error = new Error("Cart Not found or Cart didn't have an enough Products");
        error.statusCode = 403;
        throw error;
      }
  
      let selectedItems = cart.items.filter((item) => item.selected === true);
  
      const orderedItems = await OrderModel.find({
        user: req.user._id,
        items: {
          $elemMatch: {
            productId: { $in: selectedItems.map((item) => item.productId) },
          },
        },
      });
  
      if (orderedItems.length > 0) {
        selectedItems = selectedItems.filter(
          (item) =>
            !orderedItems.some((orderedItem) =>
              orderedItem.items.some(
                (orderedItemItem) => orderedItemItem.productId === item.productId
              )
            )
        );
      }
  
      const Address = await AddressModel.findOne({ user: req.user._id });
  
      if (!Address) {
        // Handle the case where the user has no address
        return res
          .status(400)
          .json({ success: false, error: "User has no address" });
      }
      console.log("Address" + Address);
      const deliveryAddress = Address.addresses.find(
        (item) => item.addressType === req.body.addressType
      );
  
      if (!deliveryAddress) {
        // Handle the case where the requested address type was not found
        return res
          .status(400)
          .json({ success: false, error: "Address not found" });
      }
      const orderAddress = {
        addressType: deliveryAddress.addressType,
        HouseNo: deliveryAddress.HouseNo,
        Street: deliveryAddress.Street,
        Landmark: deliveryAddress.Landmark,
        pincode: deliveryAddress.pincode,
        city: deliveryAddress.city,
        district: deliveryAddress.district,
        State: deliveryAddress.State,
        Country: deliveryAddress.Country,
      };
  
      let billTotal = selectedItems.reduce(
        (total, item) => total + item.price,
        0
      )
      
  
      console.log(billTotal, selectedItems);
  
     
  
  
            if (req.body.paymentOption === "cashOnDelivery") {
  
              console.log('billTotal'+billTotal)
              if(  req.session && req.session.discountedTotal && req.session.discountAmount && req.session.discountAmount!=null &&  req.session.discountedTotal!=null){
                billTotal = req.session.discountedTotal
              
                const coupon = await Coupon.findOne({ code: req.session.couponCode });
                coupon.usersUsed.push(req.user._id);
                await coupon.save();
                req.session.couponId = coupon._id;
               
              }
              console.log('billTotal'+billTotal)
              const orderIds = await generateRandomOrderId(6); 
            // Create a new order
                        const orderData  = new OrderModel({
                        user: req.user._id,
                        cart: cart._id,
                        items: selectedItems,
                        billTotal,
                        paymentStatus: "Success",
                        orderId: orderIds,
                        paymentId: null,
                        paymentMethod: req.body.paymentOption,
                        deliveryAddress: orderAddress,
                        discounts : req.session.discountedTotal ? [
                          {
                            code:req.session.couponCode,
                           amount:req.session.discountAmount,
                           discountType:'Coupon',
                           coupon:req.session.couponId?req.session.couponId: null,
                          }
                         ]:[]
                        // Add more order details as needed
                        });
  
                        for (const item of selectedItems) {
                          const product = await Product.findOne({ _id: item.productId });
                          if (product) {
                            // Ensure that the requested quantity is available in stock
                            if (product.countInStock >= item.quantity) {
                              // Decrease the countInStock by the purchased quantity
                              product.countInStock -= item.quantity;
                              await product.save();
                            } else {
                              // Handle the case where the requested quantity is not available
                              return res
                                .status(400)
                                .json({ success: false, error: "Not enough stock for some items" });
                            }
                          } else {
                            // Handle the case where the product was not found
                            return res
                              .status(400)
                              .json({ success: false, error: "Product not found" });
                          }
                        }
                        
                        const order = new OrderModel(orderData)
                        await order.save()
                          req.session.couponCode= null
                          req.session.discountAmount = null
                          req.session.discountedTotal =null
                          req.session.couponId=null
                     
  
  
                        // Remove selected items from the cart
                        cart.items = cart.items.filter((item) => !item.selected);
                        cart.billTotal = 0;
                        await cart.save();
  
                        // Get the order ID after saving it
                        const orderId = order._id;
                          // Deduct purchased items from inventory
                      
                        return res.status(201).json({success:true,message:'Cash on Delivery Sucess',orderId})
                        
          } else if (req.body.paymentOption === "Razorpay") {
  
            for (const item of selectedItems) {
              const product = await Product.findOne({ _id: item.productId });
              if (product) {
                // Ensure that the requested quantity is available in stock
                if (product.countInStock >= item.quantity) {
                  // Decrease the countInStock by the purchased quantity
                  product.countInStock -= item.quantity;
                  await product.save();
                } else {
                  // Handle the case where the requested quantity is not available
                  return res
                    .status(400)
                    .json({ success: false, error: "Not enough stock for some items" });
                }
              } else {
                // Handle the case where the product was not found
                return res
                  .status(400)
                  .json({ success: false, error: "Product not found" });
              }
            }
                // Handle Razorpay
                if(req.session.discountedTotal && req.session.discountAmount && req.session.discountAmount!=null &&  req.session.discountedTotal!=null){
                  billTotal = req.session.discountedTotal
                
                  const coupon = await Coupon.findOne({ code: req.session.couponCode });
                  coupon.usersUsed.push(req.user._id);
                  await coupon.save();
                  req.session.couponId = coupon._id;
                 
                }
  
                const amount = billTotal * 100; // Convert to paise or cents
                console.log('billTotal'+billTotal)
              
                const orderData  = {
                    user: req.user._id,
                    cart: cart._id,
                    items: selectedItems,
                    billTotal,
                    paymentStatus: "Pending",
                    orderId:null,
                    paymentId: null,
                    paymentMethod: req.body.paymentOption,
                    deliveryAddress: orderAddress,
                    discounts : req.session.discountedTotal ? [
                     {
                      code:req.session.couponCode,
                      amount:req.session.discountAmount,
                      discountType:'Coupon',
                      coupon:req.session.couponId?req.session.couponId: null,
                     }
                    ]:[]
                    // Add more order details as needed
                  };
                 
                // Create a new order
                const order = new OrderModel(orderData);
              
               
                // const orderId = order._id;
          
                // Create a Razorpay order and send the order details to the client
                const options = {
                  amount,
                  currency: 'INR',
                  receipt: 'razorUser@gmail.com', // Replace with your email
                };
          
                razorpayInstance.orders.create(options,async (err, razorpayOrder) => {
                  if (!err) {
                    order.orderId = razorpayOrder.id;
            
                    try {
                      await order.save(); // Save the order to the database
  
                      req.session.couponCode= null
                      req.session.discountAmount = null
                      req.session.discountedTotal =null
                      req.session.couponId=null
  
                      console.log("/.....................................");
                      console.log(order)
                      return res.status(200).json({
                        success: true,
                        msg: 'Order Created',
                        order,
                        amount,
                        key_id: process.env.RAZORPAY_KEYID,
                        contact: req.user.mobile, // Replace with user's mobile number
                        name: req.user.firstName + ' ' + req.user.lastName,
                        email: req.user.email,
                        address: `${orderAddress.addressType}\n${orderAddress.HouseNo} ${orderAddress.Street}\n${orderAddress.pincode} ${orderAddress.city} ${orderAddress.district}\n${orderAddress.State}`,
                      });
                    } catch (saveError) {
                      console.error('Error saving order to the database:', saveError);
                      return res.status(400).json({ success: false, msg: 'Failed to save order' });
                    }
                  } else {
                    console.error('Error creating Razorpay order:', err);
                    return res.status(400).json({ success: false, msg: 'Something went wrong!' });
                  }
                });
          }
          else if(req.body.paymentOption === "Wallet"){
  
            const wallet = await Wallet.findOne({ user:  req.user._id });
  
            if (!wallet) {
              return res.status(404).json({ success: false, msg: 'Wallet not found for the user' });
            }
             // Handle Razorpay
             for (const item of selectedItems) {
              const product = await Product.findOne({ _id: item.productId });
              if (product) {
                // Ensure that the requested quantity is available in stock
                if (product.countInStock >= item.quantity) {
                  // Decrease the countInStock by the purchased quantity
                  product.countInStock -= item.quantity;
                  await product.save();
                } else {
                  // Handle the case where the requested quantity is not available
                  return res
                    .status(400)
                    .json({ success: false, error: "Not enough stock for some items" });
                }
              } else {
                // Handle the case where the product was not found
                return res
                  .status(400)
                  .json({ success: false, error: "Product not found" });
              }
            }
             if(req.session.discountedTotal && req.session.discountAmount && req.session.discountAmount!=null &&  req.session.discountedTotal!=null){
              billTotal = req.session.discountedTotal
            
              const coupon = await Coupon.findOne({ code: req.session.couponCode });
              coupon.usersUsed.push(req.user._id);
              await coupon.save();
              req.session.couponId = coupon._id;
             
            }
  
            // Check if the wallet balance is sufficient
            if (wallet.balance < billTotal) {
              return res.status(400).json({ success: false, msg: 'Insufficient funds in the wallet' });
            }
            // Deduct the billTotal from the wallet balance
            wallet.balance -= billTotal;
  
            
              // Create a transaction entry for the order
              wallet.transactions.push({
                amount: -billTotal,
                type: 'debit',
                description:'Purchase'
              });
  
              // Deduct purchased items from inventory
              for (const item of selectedItems) {
                const product = await Product.findOne({ _id: item.productId });
                if (product) {
                  // Ensure that the requested quantity is available in stock
                  if (product.countInStock >= item.quantity) {
                    // Decrease the countInStock by the purchased quantity
                    product.countInStock -= item.quantity;
                    await product.save();
                  } else {
                    // Handle the case where the requested quantity is not available
                    return res
                      .status(400)
                      .json({ success: false, error: "Not enough stock for some items" });
                  }
                } else {
                  // Handle the case where the product was not found
                  return res
                    .status(400)
                    .json({ success: false, error: "Product not found" });
                }
              }
              // Save the wallet changes
              await wallet.save();
  
                  const orderIds = await generateRandomOrderId(6); 
                  const orderData  = {
                    user: req.user._id,
                    cart: cart._id,
                    items: selectedItems,
                    billTotal,
                    paymentStatus: "Success",
                    orderId: orderIds,
                    paymentId: null,
                    paymentMethod: req.body.paymentOption,
                    deliveryAddress: orderAddress,
                    discounts : req.session.discountedTotal ? [
                      {
                       code:req.session.couponCode,
                       amount:req.session.discountAmount,
                       discountType:'Coupon',
                       coupon:req.session.couponId?req.session.couponId: null,
                      }
                     ]:[]
                    // Add more order details as needed
                    };
  
                    const order = new OrderModel(orderData)
                    await order.save()
                      req.session.couponCode= null
                      req.session.discountAmount = null
                      req.session.discountedTotal =null
                      req.session.couponId=null
                 
  
  
                    // Remove selected items from the cart
                    cart.items = cart.items.filter((item) => !item.selected);
                    cart.billTotal = 0;
                    await cart.save();
  
                    const orderId = order._id;
  
                    
              return res.status(201).json({success:true,message:'Cash on Delivery Sucess',orderId})
  
          }
          else {
            // Handle other payment methods (e.g., Paypal)
            // You can add the implementation for other payment methods here
            return res.status(400).json({ success: false, error: 'Invalid payment option' });
          }
        
      // return res
      //   .status(201)
      //   .json({ success: true, message: "order placed successfully", orderId }); // Redirect to a confirmation page
    } catch (err) {
      console.error(err);
      next(err);
    }
  };