
const OrderModel = require('../Models/OrderModel')
require('dotenv').config();

const { publishCartUpdate ,publishInventoryUpdate} = require('../utils/consumersamqp');

exports.razorpayVerify = async (req, res,next) => {
    try {
      console.log("VERIFY EYE/////////////////////////////");
      const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
      console.log(body);
      
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEYSECRET)
        .update(body.toString())
        .digest('hex');
  
      if (expectedSignature === req.body.razorpay_signature) {
        console.log("Corrected Verify");
  
        // Find the previously stored record using orderId
        const updatedOrder = await OrderModel.findOneAndUpdate(
          { orderId: req.body.razorpay_order_id },
          {
            paymentId: req.body.razorpay_payment_id,
            signature: req.body.razorpay_signature,
            paymentStatus: "Success",
          },
          { new: true }
        );
          console.log(updatedOrder)
        if (updatedOrder) {
        
        
            // Render the payment success page
            return res.json({ success: true, data:{message: 'Order Successfully Placed', updatedOrder }});

        } else {
          // Handle the case where the order couldn't be updated
          return res.json({
            success:false,
            message:'Order Failed Please try Again'
          })
        }
      } else {
        // Handle the case where the signature does not match
        return res.json({
          success:false,
          message:'Order Failed Please try Again'
        })
      }
    } catch (err) {
      console.log(err);
      // Handle errors
      return res.render('paymentFailed', {
        title: "Error",
        error: "An error occurred during payment verification",
      });
    }
  };
  

  exports.razorpayFailed = async (req, res) => {
    try {
      console.log("PAYMENT FAILED ===========================================================>");
      const orderId = req.query.orderId;
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        console.error('Invalid orderId');
        const error = new Error('Invalid order Id');
        error.status=400;
        throw error;
      }
  
      const order = await OrderModel.findById(orderId);
  
      console.log(order)
      if (!order) {
        const error = new Error(`No order with id ${orderId} was found`);
        error.status=400;
        throw error;
      }
       if (order.status === 'Pending' && order.paymentStatus === 'Pending') {
        order.status = 'Failed';
        order.paymentStatus = 'Failed';
        await order.save();
        console.log('Order status and payment status updated to "Failed" successfully');
  
        console.log("Payment failed and order status updated successfully");
        return res.status(200).json({success:true,data:{msg:'Payment Failed'}})
      } else {
        console.warn(`Order with id ${orderId} is not in pending status`);
        const error = new Error(`Order with id ${orderId} is not in pending status`);
        error.status=400;
        throw error;
      }
  
    } catch (err) {
      console.error('An unexpected error occurred:', err);
      next(err)
    }
  };
  

  exports.orderConfirmation = async(req,res,next)=>{
    const orderId = req.params.orderId;
     if (!mongoose.Types.ObjectId.isValid(orderId)) {
        const error = new Error(`No order with id ${orderId} was found`);
        error.status=400;
        throw error;
     }

    try{
        
        let orderDetails=await OrderModel.findById(orderId)
        if(!orderDetails){
            const error = new Error(`No order with id ${orderId} was found`);
            error.status=400;
            throw error;
        }
        const productsOrdered = orderDetails.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        }));
        console.log(productsOrdered);

        await publishCartUpdate(req.user._id, updatedCart);
        await publishInventoryUpdate(productsOrdered);

        res.status(200).json({success:true,data:{msg:'Order Confirmed',orderDetails}});
    } catch(error){
      console.error(error);
      console.log(error);
      next(error);
    }
}



exports.getOrders = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const orders = await OrderModel.find({ user: userId }).exec();

        if (!orders || orders.length === 0) {
            return res.status(404).json({ success: false, message: 'No orders found for this user' });
        }

        res.status(200).json({ success: true, orders });
    } catch (error) {
        next(error);
    }
};



