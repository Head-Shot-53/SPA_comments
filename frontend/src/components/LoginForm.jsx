// frontend/src/components/LoginBar.jsx
import { useEffect, useState } from "react";
import { login, logout, register as apiRegister, isAuthed, getUsername } from "../api/auth";

export default function LoginBar() {
  const [username, setU] = useState(localStorage.getItem("username") || "");
  const [password, setP] = useState("");
  const [email, setE] = useState("");
  const [password2, setP2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showReg, setShowReg] = useState(false);
  const [authed, setAuthed] = useState(isAuthed());
  const [displayName, setDisplayName] = useState(getUsername() || "користувачу");

  useEffect(() => {
    function onLogin() {
      setAuthed(true);
      setDisplayName(getUsername() || username || "користувачу");
    }
    function onLogout() {
      setAuthed(false);
      setDisplayName("користувачу");
    }
    window.addEventListener("auth:login", onLogin);
    window.addEventListener("auth:logout", onLogout);
    return () => {
      window.removeEventListener("auth:login", onLogin);
      window.removeEventListener("auth:logout", onLogout);
    };
  }, [username]);

  async function handleLogin(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      // ВАЖЛИВО: наш login приймає окремі аргументи
      await login(username, password);
      setP("");
      window.dispatchEvent(new Event("auth:login"));
      // Якщо хочеш жорстко перезавантажувати UI:
      // window.location.reload();
    } catch (e) {
      setErr(e.message || "Невірні дані для входу");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      // Якщо бек вимагає тільки username+password, зайві поля проігноруються бекендом
      await apiRegister({ username, email, password, password2 });
      // багато беків логінять автоматично після реєстрації; якщо ні — можна викликати login тут
      // await login(username, password);
      window.dispatchEvent(new Event("auth:login"));
      setShowReg(false);
      setP("");
      setP2("");
    } catch (e) {
      setErr(e.message || "Помилка реєстрації");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    window.dispatchEvent(new Event("auth:logout"));
    // window.location.reload();
  }

  if (authed) {
    return (
      <div className="flex items-center gap-3 p-4">
        <span>Вітаю, {displayName}!</span>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-gray-600 underline"
        >
          Вийти
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      {!showReg ? (
        <form onSubmit={handleLogin} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setU(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setP(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <div className="flex gap-2">
            <button
              disabled={loading}
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {loading ? "..." : "Увійти"}
            </button>
            <button
              type="button"
              className="text-sm text-gray-600 underline"
              onClick={() => { setShowReg(true); setErr(""); }}
            >
              Реєстрація
            </button>
          </div>
          {err && <p className="text-red-500">{err}</p>}
        </form>
      ) : (
        <form onSubmit={handleRegister} className="flex flex-col gap-2">
          <input
            placeholder="Username (лат/цифри)"
            value={username}
            onChange={(e) => setU(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setE(e.target.value)}
            className="border p-2 rounded"
          />
          <input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setP(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            placeholder="Повтор пароля"
            type="password"
            value={password2}
            onChange={(e) => setP2(e.target.value)}
            className="border p-2 rounded"
          />
          <div className="flex gap-2">
            <button
              disabled={loading}
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {loading ? "..." : "Створити"}
            </button>
            <button
              type="button"
              className="text-sm text-gray-600 underline"
              onClick={() => setShowReg(false)}
            >
              Скасувати
            </button>
          </div>
          {err && <p className="text-red-500">{err}</p>}
        </form>
      )}
    </div>
  );
}
