const amqp = require("amqplib");

async function connectRabbit() {
    // URL CORRECTA
    const RABBIT_URL = process.env.RABBIT_URL || "amqp://admin:admin@chat-broker:5672";

    let retries = 60;
    const delay = ms => new Promise(res => setTimeout(res, ms));

    while (retries > 0) {
        try {
            console.log(`[Rabbit] Trying to connect... (${61 - retries}/60)`);

            const connection = await amqp.connect(RABBIT_URL);
            const channel = await connection.createChannel();

            console.log("[Rabbit] Connected!");
            return channel;

        } catch (err) {
            console.log("[Rabbit] RabbitMQ not ready or invalid login, retrying...");
            retries--;
            await delay(1000);
        }
    }

    throw new Error("RabbitMQ could not be reached after many attempts");
}

module.exports = { connectRabbit };
