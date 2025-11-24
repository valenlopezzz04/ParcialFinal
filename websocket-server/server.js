const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { connectRabbit } = require("./rabbit");
const { joinRoom, leaveRoom, broadcast, getActiveConnections } = require("./rooms");
const { PORT, BACKEND_URL, JWT_SECRET } = require("./config");

let metrics = {
    connections: 0,
    messagesReceived: 0,
    messagesSent: 0
};

async function startServer() {
    const wss = new WebSocket.Server({ port: PORT });
    const channel = await connectRabbit();

    const EXCHANGE = "chat_exchange";
    await channel.assertExchange(EXCHANGE, "topic", { durable: false });

    console.log(`[WS] WebSocket server running on port ${PORT}`);

    // METRICS — cada 15 segundos
    setInterval(() => {
        console.log(
            `[METRICS] active=${metrics.connections} ` +
            `received=${metrics.messagesReceived} sent=${metrics.messagesSent}`
        );
        metrics.messagesReceived = 0;
        metrics.messagesSent = 0;
    }, 15000);

    wss.on("connection", (ws, req) => {

        // JWT — validar token
        const token = req.url.split("token=")[1];
        if (!token) {
            ws.send(JSON.stringify({ error: "Missing token" }));
            return ws.close();
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            console.log("⚠ WARNING: accepting DEV token:", token);
            try {
                decoded = JSON.parse(Buffer.from(token, "base64").toString());
            } catch {
                console.error("DEV token not parseable");
                return ws.close();
            }
        }


        const username = decoded.sub || decoded.username;
        ws.userId = decoded.userId;

        metrics.connections++;
        console.log(`[WS] connection_open → user=${username} userId=${ws.userId}`);

        ws.on("message", async (msg) => {
            metrics.messagesReceived++;

            let data;
            try {
                data = JSON.parse(msg);
            } catch {
                return ws.send(JSON.stringify({ error: "Invalid JSON" }));
            }

            // EVENT — join_room
            if (data.event === "join_room") {
                try {
                    await axios.post(
                        `${BACKEND_URL}/api/rooms/${data.roomId}/join`,
                        {},
                        { params: { userId: ws.userId } }
                    );
                } catch (err) {
                    ws.send(JSON.stringify({
                        status: "error",
                        message: "Cannot join room",
                        details: err.response?.data || err.message
                    }));
                    return;
                }

                ws.roomId = data.roomId;
                joinRoom(data.roomId, ws, username);

                console.log(`[WS] user_joined → user=${username} room=${data.roomId}`);

                broadcast(data.roomId, {
                    event: "user_joined",
                    userId: ws.userId,
                    user: username
                });

                ws.send(JSON.stringify({ status: "ok", message: "Joined room" }));
                return;
            }

            // EVENT — send_message
            if (data.event === "send_message") {

                // PERMISSION — validar
                try {
                    await axios.get(
                        `${BACKEND_URL}/api/rooms/${ws.roomId}/messages`,
                        {
                            params: {
                                userId: ws.userId,
                                page: 0,
                                size: 1
                            }
                        }
                    );
                } catch (err) {
                    ws.send(JSON.stringify({
                        status: "error",
                        message: "Not allowed to send message",
                        details: err.response?.data || err.message
                    }));
                    return;
                }

                const payload = {
                    event: "new_message",
                    roomId: ws.roomId,
                    userId: ws.userId,
                    user: username,
                    content: data.content,
                    timestamp: new Date().toISOString()
                };

                console.log(`[WS] new_message → user=${username} room=${ws.roomId} "${data.content}"`);

                // MQ — publish
                try {
                    channel.publish(
                        EXCHANGE,
                        `room.${ws.roomId}`,
                        Buffer.from(JSON.stringify(payload))
                    );
                } catch (err) {
                    console.error("[WS] ERROR publishing to RabbitMQ:", err.message);
                }


                metrics.messagesSent++;

                // DB — persist
                try {
                    await axios.post(
                        `${BACKEND_URL}/api/rooms/${ws.roomId}/messages`,
                        {
                            content: data.content,
                            userId: ws.userId
                        }
                    );
                } catch (err) {
                    console.log("Error saving message", err.message);
                }

                return;
            }
        });

        // CLOSE — desconexión
        ws.on("close", () => {
            metrics.connections--;

            if (ws.roomId) {
                console.log(`[WS] user_left → user=${username} room=${ws.roomId}`);

                leaveRoom(ws.roomId, ws);
                broadcast(ws.roomId, {
                    event: "user_left",
                    userId: ws.userId,
                    user: username
                });
            }
        });
    });

    // MQ — consumer
    const q = await channel.assertQueue("", { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE, "room.*");

    channel.consume(
        q.queue,
        (msg) => {
            try {
                const payload = JSON.parse(msg.content.toString());
                broadcast(payload.roomId, payload);
            } catch (err) {
                console.error("[WS] ERROR consuming message:", err.message);
            }
        },
        { noAck: true }
    );
}

startServer();
