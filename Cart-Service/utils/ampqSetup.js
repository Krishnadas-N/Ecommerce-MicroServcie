const amqp = require('amqplib');
const Cart = require('./models/Cart');

const publishOrder = async (orderData) => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queueName = "orders";

        await channel.assertQueue(queueName, { durable: true });

        const message = Buffer.from(JSON.stringify(orderData));
        const publishPromise = channel.sendToQueue(queueName, message, { persistent: true });

        await publishPromise.then((ack) => {
            if (ack) {
                console.log('Order data published successfully and acknowledged.');
            } else {
                console.error('Order data publishing failed.');
            }
        });

        await channel.close();
        await connection.close();

    } catch (err) {
        console.log("Error in Ampq:", err);
        throw new Error(err);
    }
}

const startCartService = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queueName = 'update-cart';

        await channel.assertQueue(queueName, { durable: true });
        console.log('Cart Service is listening for messages...');

        channel.consume(queueName, async (msg) => {
            try {
                if (msg !== null) {
                    const { userId, updatedCart } = JSON.parse(msg.content.toString());

                    await UpdateCart(userId, updatedCart); // Await UpdateCart function
                    channel.ack(msg);
                    console.log('Cart updated successfully:', userId);
                }
            } catch (error) {
                console.error('Error updating cart:', error.message);
                // Reject the message (put it back in the queue for reprocessing)
                channel.reject(msg, false);
            }
        });
    } catch (error) {
        console.error('Error in AMQP:', error);
    }
};



async function UpdateCart(userId){
    try{
        const cart = await Cart.findOne({ owner: userId });

        if (!cart) {
            throw new Error(`Cart not found for user ${userId}`);
        }
        const updatedItems = cart.items.filter(item => !item.selected);
        const newBillTotal = updatedItems.reduce((total, item) => total + item.price, 0);

        // Update the cart with the filtered items and new bill total
        cart.items = updatedItems;
        cart.billTotal = newBillTotal;

        // Save the updated cart
        await cart.save();

        console.log('Selected items removed from cart:', userId);
    }catch(err){

    }
}

module.exports = {
    publishOrder,
    startCartService
};
