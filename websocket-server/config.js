module.exports = {
    PORT: process.env.WS_PORT || 3001,
    RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://admin:admin@rabbitmq:5672",
    BACKEND_URL: process.env.BACKEND_URL || "http://chat-backend:8080",
    JWT_SECRET: process.env.JWT_SECRET || "mi-secreto-super-seguro"
};
