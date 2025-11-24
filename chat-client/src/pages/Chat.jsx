import { useEffect, useState, useRef } from "react";

function Chat() {
  const ws = useRef(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const roomId = "global"; 

  useEffect(() => {
    const token = localStorage.getItem("token");

    ws.current = new WebSocket(`ws://localhost:3001/?token=${token}`);

    ws.current.onopen = () => {
      console.log("WS connected ✔");

      ws.current.send(JSON.stringify({
        event: "join_room",
        roomId
      }));
    };

    ws.current.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      console.log("WS message:", data);

      if (data.event === "new_message") {
        setMessages(prev => [...prev, data]);
      }

      if (data.event === "user_joined") {
        setMessages(prev => [...prev, { system: true, content: `${data.user} se unió` }]);
      }

      if (data.event === "user_left") {
        setMessages(prev => [...prev, { system: true, content: `${data.user} salió` }]);
      }
    };

    return () => {
      ws.current.close();
    };
  }, []);

  function sendMessage() {
    ws.current.send(JSON.stringify({
      event: "send_message",
      content: newMsg
    }));
    setNewMsg("");
  }

  return (
    <div className="flex flex-col p-4 gap-2 h-full">
      <div className="border p-2 flex-1 overflow-auto">
        {messages.map((m, i) => (
          <div key={i} className={`${m.system ? "text-gray-500 italic" : "text-black"}`}>
            {m.system
              ? m.content
              : `${m.user}: ${m.content}`}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border flex-1 p-2"
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-3">
          ➤
        </button>
      </div>
    </div>
  );
}

export default Chat;
