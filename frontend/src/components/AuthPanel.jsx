// frontend/src/components/AuthPanel.jsx
import { useState } from "react";
import { register, login, logout, isAuthed, getUsername } from "../api/auth";

export default function AuthPanel() {
  const [tab, setTab] = useState("login"); // 'login' | 'register'
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState("");

  if (isAuthed()) {
    const name = getUsername?.() || "user";
    return (
      <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md flex items-center justify-between">
        <div>
          <div className="font-semibold">Logged in as: {name}</div>
          <div className="text-sm text-gray-300">JWT active</div>
        </div>
        <button
          onClick={() => { logout(); window.location.reload(); }}
          className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded"
        >
          Logout
        </button>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      if (tab === "register") {
        if (password !== password2) {
          setMsg("Passwords do not match.");
          return;
        }
        await register({ username, email, password, password2 });
        setMsg("Registration successful! You are logged in.");
        setUsername(""); setEmail(""); setPassword(""); setPassword2("");
        // опційно: window.location.reload();
      } else {
        await login({ username, password });
        setMsg("Login successful!");
        // опційно: window.location.reload();
      }
    } catch (err) {
  const resp = err.response || { status: err.status, data: err.data || err.raw };
  if (!resp) {
    setMsg("❌ Немає зв’язку із сервером. Перевірте підключення.");
    return;
  }

  const status = resp.status;
  const data = resp.data;
  let message = "";

  if (status === 401) {
    message = "Невірне ім’я користувача або пароль.";
  } else if (status >= 500) {
    message = "Помилка сервера. Спробуйте пізніше.";
  }

  const translations = {
    "This field is required.": "Це поле є обов’язковим.",
    "A user with that username already exists.": "Користувач із таким іменем вже існує.",
    "Enter a valid email address.": "Введіть коректний Email.",
    "Passwords do not match.": "Паролі не співпадають.",
    "This password is too short.": "Пароль занадто короткий (мінімум 8 символів).",
    "This password is too common.": "Пароль надто простий.",
    "This password is entirely numeric.": "Пароль не повинен складатись лише з цифр.",
    "No active account found with the given credentials.": "Невірне ім’я користувача або пароль.",
    "Unable to log in with provided credentials.": "Невірне ім’я користувача або пароль.",
  };
  const t = (msg) => {
    const hit = Object.keys(translations).find((k) => msg?.includes?.(k));
    return hit ? msg.replace(hit, translations[hit]) : msg;
  };

  if (!message && data) {
    if (typeof data === "string") message = t(data);
    else if (data.detail) message = t(data.detail);
    else if (Array.isArray(data.non_field_errors)) message = data.non_field_errors.map(t).join("\n");
    else if (typeof data === "object") {
      const lines = [];
      for (const [field, val] of Object.entries(data)) {
        const arr = Array.isArray(val) ? val : [String(val)];
        const label =
          field === "password2" ? "Повтор пароля" :
          field === "password"  ? "Пароль" :
          field === "username"  ? "Ім’я користувача" :
          field === "email"     ? "Email" : field;
        lines.push(`${label}: ${arr.map(t).join(", ")}`);
      }
      message = lines.join("\n");
    }
  }

  if (!message) message = "Сталася невідома помилка. Спробуйте пізніше.";
  setMsg("❌ " + message);
}

  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md">
      {/* Вкладки */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-2 rounded ${tab === "login" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
          onClick={() => { setTab("login"); setMsg(""); }}
          type="button"
        >
          Login
        </button>
        <button
          className={`px-3 py-2 rounded ${tab === "register" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
          onClick={() => { setTab("register"); setMsg(""); }}
          type="button"
        >
          Register
        </button>
      </div>

      {/* Форма */}
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 rounded bg-gray-700 text-white"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {tab === "register" && (
          <input
            type="email"
            placeholder="Email (optional)"
            className="w-full p-2 rounded bg-gray-700 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded bg-gray-700 text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {tab === "register" && (
          <input
            type="password"
            placeholder="Repeat password"
            className="w-full p-2 rounded bg-gray-700 text-white"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition"
        >
          {tab === "register" ? "Create account" : "Sign in"}
        </button>
      </form>

      {msg && <p className="mt-3 text-sm text-yellow-300">{msg}</p>}
    </div>
  );
}
