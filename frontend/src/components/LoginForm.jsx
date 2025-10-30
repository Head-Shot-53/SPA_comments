import { useState } from "react";
import { login, logout } from "../api/auth";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      window.location.reload();
    } catch {
      setError("Невірні дані для входу");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Увійти
      </button>
      {error && <p className="text-red-500">{error}</p>}
      <button
        type="button"
        className="text-sm text-gray-500 mt-2"
        onClick={() => {
          logout();
          window.location.reload();
        }}
      >
        Вийти
      </button>
    </form>
  );
}
