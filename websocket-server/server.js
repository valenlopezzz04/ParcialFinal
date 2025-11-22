const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { connectRabbit } = require("./rabbit");
const { joinRoom, leaveRoom, broadcast } = require("./rooms");
const { PORT, BACKEND_URL, JWT_SECRET } = require("./config");

async function startServer() {
    const wss = new WebSocket.Server({ port: PORT });
    const channel = await connectRabbit();

    const EXCHANGE = "chat_exchange";
    await channel.assertExchange(EXCHANGE, "topic", { durable: false });

    console.log(`[WS] WebSocket server running on port ${PORT}`);

    wss.on("connection", (ws, req) => {

        const token = req.url.split("token=")[1];
        if (!token) {
            ws.send(JSON.stringify({ error: "Missing token" }));
            return ws.close();
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            ws.send(JSON.stringify({ error: "Invalid token" }));
            return ws.close();
        }

        const username = decoded.sub || decoded.username;
        ws.userId = decoded.userId;

        // LOG para verificar userId
        console.log(`WS Connected → userId=${ws.userId} username=${username}`);

        ws.on("message", async (msg) => {
            let data;

            try {
                data = JSON.parse(msg);
            } catch {
                return ws.send(JSON.stringify({ error: "Invalid JSON" }));
            }

            // join_room
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

                broadcast(data.roomId, {
                    event: "user_joined",
                    userId: ws.userId,
                    user: username
                });

                ws.send(JSON.stringify({ status: "ok", message: "Joined room" }));
                return;
            }

            // send_message
            if (data.event === "send_message") {

                try {
                    await axios.get(
                        `${BACKEND_URL}/api/rooms/${ws.roomId}/messages`,
                        { params: { userId: ws.userId, page: 0, size: 1 } }
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

                channel.publish(
                    EXCHANGE,
                    `room.${ws.roomId}`,
                    Buffer.from(JSON.stringify(payload))
                );

                try {
                    await axios.post(
                        `${BACKEND_URL}/api/rooms/${ws.roomId}/messages`,
                        { content: data.content, userId: ws.userId }
                    );
                } catch (err) {
                    console.log("Error saving message", err.message);
                }

                return;
            }
        });

        ws.on("close", () => {
            if (ws.roomId) {
                leaveRoom(ws.roomId, ws);
                broadcast(ws.roomId, {
                    event: "user_left",
                    userId: ws.userId,
                    user: username
                });
            }
        });
    });

    const q = await channel.assertQueue("", { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE, "room.*");

    channel.consume(
        q.queue,
        (msg) => {
            const payload = JSON.parse(msg.content.toString());
            broadcast(payload.roomId, payload);
        },
        { noAck: true }
    );
}

startServer();
