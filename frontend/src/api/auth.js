import api from "../api/client";

/* ====================== HELPERS ====================== */

function setAuthHeader(access) {
  if (access) {
    api.defaults.headers.common.Authorization = `Bearer ${access}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

function normErr(err) {
  const resp = err?.response;
  const d = resp?.data;
  if (!d) return err; // якщо нема відповіді сервера — лишаємо як є (мережа)

  const lines = Object.entries(d).flatMap(([k, v]) =>
    Array.isArray(v)
      ? v.map((m) => `${k}: ${m}`)
      : typeof v === "string"
      ? [`${k}: ${v}`]
      : [`${k}: ${JSON.stringify(v)}`]
  );

  const e = new Error(lines.join("\n") || "Request failed");
  // ГОЛОВНЕ: зберігаємо всю відповідь, щоб фронт бачив status (401 тощо)
  e.response = resp;
  e.status = resp?.status;
  e.raw = d;          // дубль для зручності
  e.data = d;
  e.code = err?.code;
  return e;
}

function setTokens({ access, refresh }) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
  setAuthHeader(access);
}

/* ====================== AUTH ====================== */

// Реєстрація нового користувача
export async function register({ username, email, password, password2 }) {
  try {
    const { data } = await api.post("/register/", {
      username,
      email,
      password,
      password2,
    });
    if (data.tokens) {
      setTokens({ access: data.tokens.access, refresh: data.tokens.refresh });
    }
    if (data.user?.username) {
      localStorage.setItem("username", data.user.username);
    }
    return data.user;
  } catch (err) {
    throw normErr(err);
  }
}

// Логін користувача
export async function login({ username, password }) {
  try {
    const { data } = await api.post("/token/", { username, password });
    setTokens({ access: data.access, refresh: data.refresh });
    localStorage.setItem("username", username);
    return true;
  } catch (err) {
    throw normErr(err);
  }
}

// Оновлення access-токена
export async function refreshToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) throw new Error("No refresh token found");
  try {
    const { data } = await api.post("/token/refresh/", { refresh });
    if (data.access) {
      localStorage.setItem("access", data.access);
      setAuthHeader(data.access);
    }
    return data;
  } catch (err) {
    throw normErr(err);
  }
}

// Логаут користувача
export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("username");
  setAuthHeader(null);
}

// Підтягування токена при старті фронтенду
export function loadToken() {
  const access = localStorage.getItem("access");
  setAuthHeader(access);
}

/** Перевіряє, чи користувач залогінений */
export function isAuthed() {
  const token = localStorage.getItem("access");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    // Якщо токен не має exp — вважаємо його валідним
    return !payload.exp || payload.exp > now;
  } catch {
    return false;
  }
}

/** Отримує username з localStorage або з JWT */
export function getUsername() {
  const stored = localStorage.getItem("username");
  if (stored) return stored;

  const token = localStorage.getItem("access");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username || payload.user || payload.sub || null;
  } catch {
    return null;
  }
}

export default {
  register,
  login,
  logout,
  loadToken,
  setTokens,
  refreshToken,
  getUsername,
  isAuthed
};