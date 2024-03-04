const amqp = require('amqplib')

const publishCartUpdate = async (userId, updatedCart) => {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queueName = 'update-cart';

    await channel.assertQueue(queueName, { durable: true });
    
    const message = Buffer.from(JSON.stringify({ userId, updatedCart }));
    await channel.sendToQueue(queueName, message, { persistent: true });

    await channel.close();
    await connection.close();
};

const publishInventoryUpdate = async (productsOrdered) => {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queueName = 'inventory-update';

    await channel.assertQueue(queueName, { durable: true });

    // Convert the productsOrdered array to a JSON string
    const message = JSON.stringify(productsOrdered);

    // Send the message to the queue
    await channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });

    console.log('Products and quantities sent to inventory-update queue.');

    await channel.close();
    await connection.close();
};


module.exports={
    publishCartUpdate,
    publishInventoryUpdate
}