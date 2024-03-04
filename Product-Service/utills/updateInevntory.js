const amqp = require('amqplib');
const Product = require("../Models/productModel");
const processInventoryUpdate = async () => {
    try {
        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queueName = 'inventory-update';

        await channel.assertQueue(queueName, { durable: true });

        console.log('Inventory update service is waiting for messages...');

        // Consume messages from the queue
        channel.consume(queueName, async (msg) => {
            try {
                if (msg !== null) {
                    const productsOrdered = JSON.parse(msg.content.toString());

                    // Process each product and quantity
                    for (const product of productsOrdered) {
                        await updateInventory(product.productId, product.quantity);
                    }

                    console.log('Inventory updated successfully.');

                    // Acknowledge the message
                    channel.ack(msg);
                }
            } catch (error) {
                console.error('Error processing inventory update:', error.message);

                // Reject the message (put it back in the queue for reprocessing)
                channel.reject(msg, false);
            }
        });
    } catch (error) {
        console.error('Error in AMQP:', error);
    }
};

const updateInventory = async (productId, quantity) => {
    const updateQuantity = Math.abs(quantity);

    const updateProduct = await Product.findOneAndUpdate(
        { _id: productId },
        { $inc: { countInStock: -1 * updateQuantity } },
        { new: true }
    );

    if (!updateProduct) {
        throw new Error(`Product with ID ${productId} not found.`);
    }

    return updateProduct;
};


module.exports = {
    processInventoryUpdate
};
