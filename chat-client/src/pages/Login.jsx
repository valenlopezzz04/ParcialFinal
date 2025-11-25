import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:8080";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

    const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const token = await res.text();

    if (!token || token === "Invalid credentials") {
      alert("Credenciales inválidas");
      return;
    }

    localStorage.setItem("token", token);
    navigate("/rooms");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-md rounded p-8 w-96 flex flex-col gap-4"
      >
        <h1 className="text-xl font-semibold text-center">Iniciar Sesión</h1>

        <input
          type="text"
          placeholder="Usuario"
          className="border p-2 rounded focus:outline-blue-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="border p-2 rounded focus:outline-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          Entrar
        </button>
      </form>
    </div>
  );
}