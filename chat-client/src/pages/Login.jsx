import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  console.log("LOGIN:", username, password);

  const token = btoa(JSON.stringify({ username, userId: 1 }));

  console.log("TOKEN QUE SE VA A GUARDAR:", token);

  localStorage.setItem("token", token);

  console.log("TOKEN GUARDADO EN STORAGE:", localStorage.getItem("token"));

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
