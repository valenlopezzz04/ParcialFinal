import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserFromToken } from "../utils/auth";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [passwords, setPasswords] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    fetch("/api/rooms", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setRooms)
      .catch((e) => console.error("Error cargando rooms:", e));
  }, [navigate]);

  const enterRoom = async (room) => {
    const token = localStorage.getItem("token");
    const user = getUserFromToken();

    if (!user?.userId) {
      alert("Token sin userId. Vuelve a loguearte.");
      navigate("/");
      return;
    }

    let url = `/api/rooms/${room.id}/join?userId=${user.userId}`;

    if ((room.roomType || "").toLowerCase() === "private") {
      const pw = passwords[room.id] || "";
      url += `&password=${encodeURIComponent(pw)}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.message || "No se pudo unir a la sala");
      return;
    }

    navigate(`/chat/${room.id}`);
  };

  const createRoom = async () => {
    const token = localStorage.getItem("token");
    const name = prompt("Nombre de la sala:");
    if (!name) return;

    const roomType = prompt("Tipo (public/private):", "public") || "public";
    const password =
      roomType.toLowerCase() === "private"
        ? prompt("Password de la sala:")
        : null;

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, roomType, password }),
    });

    if (!res.ok) {
      alert("No se pudo crear sala");
      return;
    }

    const newRoom = await res.json();
    setRooms((prev) => [...prev, newRoom]);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Salas</h2>
        <button
          className="bg-green-600 text-white px-3 py-1 rounded"
          onClick={createRoom}
        >
          + Crear sala
        </button>
      </div>

      {rooms.map((r) => (
        <div key={r.id} className="border p-2 flex justify-between items-center">
          <div>
            <div className="font-semibold">{r.name}</div>
            <div className="text-sm text-gray-500">
              {r.roomType === "private" ? "Privada" : "Pública"}
            </div>

            {r.roomType === "private" && (
              <input
                className="border p-1 mt-1"
                placeholder="Password"
                value={passwords[r.id] || ""}
                onChange={(e) =>
                  setPasswords((prev) => ({ ...prev, [r.id]: e.target.value }))
                }
              />
            )}
          </div>

          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => enterRoom(r)}
          >
            Entrar
          </button>
        </div>
      ))}
    </div>
  );
}