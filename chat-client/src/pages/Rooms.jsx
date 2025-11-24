import { useEffect, useState } from "react";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    // por ahora NO usamos backend real
    // simulamos rooms disponibles
    setRooms([
      { id: 1, name: "General", type: "public" },
      { id: 2, name: "Universidad", type: "public" },
      { id: 3, name: "Privado VIP", type: "private" },
    ]);
  }, []);

  const handleEnterRoom = (room) => {
    console.log("Entrando a sala:", room);
    window.location.href = `/chat/${room.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Salas disponibles</h1>

      <div className="space-y-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white shadow p-4 rounded flex justify-between items-center"
          >
            <div>
              <h2 className="text-lg font-semibold">{room.name}</h2>
              <p className="text-gray-500 text-sm">
                {room.type === "public" ? "Pública" : "Privada"}
              </p>
            </div>

            <button
              onClick={() => handleEnterRoom(room)}
              className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700"
            >
              Entrar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
