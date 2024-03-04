const amqp = require('amqplib');
const Order = require('../Models/OrderModel');

const consumeOrders = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queueName = "orders";

        await channel.assertQueue(queueName, { durable: true });
        console.log("Order service is waiting for messages...");

        channel.consume(queueName, async (msg) => {
            try {
                if (msg !== null) {
                    const orderData = JSON.parse(msg.content.toString());

                    // Process the order
                    await processOrder(orderData);

                    // Acknowledge the message
                    channel.ack(msg);
                    console.log("Order processed successfully:", orderData.orderId);
                }
            } catch (error) {
                console.error("Error processing order:", error.message);
                // Reject the message (put it back in the queue for reprocessing)
                channel.reject(msg, false);
            }
        });
    } catch (error) {
        console.error("Error in AMQP:", error);
    }
}

const processOrder = async (orderData) => {
    try {
        // Example: Store the order data in the database
        const order = new Order(orderData);
        await order.save();
        console.log("Order saved to database:", orderData.orderId);
    } catch (error) {
        console.error("Error processing order:", error.message);
        throw error;
    }
}

module.exports = {
    consumeOrders
};
