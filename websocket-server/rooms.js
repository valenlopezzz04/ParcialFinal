const rooms = {};

function joinRoom(roomId, ws, username) {
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ ws, username });
}

function leaveRoom(roomId, ws) {
    if (!rooms[roomId]) return;
    rooms[roomId] = rooms[roomId].filter(u => u.ws !== ws);
}

function broadcast(roomId, message) {
    if (!rooms[roomId]) return;
    rooms[roomId].forEach(u => {
        u.ws.send(JSON.stringify(message));
    });
}

module.exports = {
    joinRoom,
    leaveRoom,
    broadcast
};
