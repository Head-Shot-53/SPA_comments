import { useState } from "react";
import { login, logout } from "../api/auth";

export default function AuthPanel() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(!!localStorage.getItem("access"));

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(identifier, password);
      setIsAuthed(true);
      alert("Успішний вхід!");
    } catch (err) {
      alert(err.message || "Помилка входу");
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthed(false);
  };

  return (
    <div className="p-4 bg-neutral-900 rounded-xl">
      {isAuthed ? (
        <>
          <p className="text-green-400">Ви залогінені ✅</p>
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded"
          >
            Вийти
          </button>
        </>
      ) : (
        <form onSubmit={handleLogin} className="flex gap-2">
          <input
            type="text"
            placeholder="Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="p-2 rounded bg-neutral-800 border border-neutral-700"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 rounded bg-neutral-800 border border-neutral-700"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded"
          >
            Увійти
          </button>
        </form>
      )}
    </div>
  );
}
