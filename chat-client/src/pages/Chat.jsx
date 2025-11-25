import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

export default function Chat() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const wsRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    if (wsRef.current) return; // guard

    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    const ws = new WebSocket(`ws://localhost:3001/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WS connected ✔");
      ws.send(JSON.stringify({ event: "join_room", roomId: Number(roomId) }));
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      console.log("WS message:", data);

      if (data.event === "new_message") {
        setMessages((prev) => [...prev, data]);
      }
      if (data.event === "user_joined") {
        setMessages((prev) => [...prev, { system: true, content: `${data.user} se unió` }]);
      }
      if (data.event === "user_left") {
        setMessages((prev) => [...prev, { system: true, content: `${data.user} salió` }]);
      }
    };

    ws.onerror = (e) => {
      console.log("WS error", e);
      if (wsRef.current === ws) wsRef.current = null;
    };

    ws.onclose = (e) => {
      console.log("WS closed", e.code, e.reason);
      if (wsRef.current === ws) wsRef.current = null;
    };

    return () => {
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [roomId, navigate]);

  const sendMessage = () => {
    if (!newMsg.trim()) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log("WS not open");
      return;
    }

    wsRef.current.send(JSON.stringify({
      event: "send_message",
      roomId: Number(roomId),
      content: newMsg.trim()
    }));

    setNewMsg("");
  };

  return (
    <div className="flex flex-col p-4 gap-2 h-full">
      <div className="border p-2 flex-1 overflow-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.system ? "text-gray-500 italic" : "text-black"}
          >
            {m.system ? m.content : `${m.user}: ${m.content}`}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border flex-1 p-2"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-3"
        >
          ➤
        </button>
      </div>
    </div>
  );
}