import api from "../api/client";

/*  helpers */
function setAuthHeader(access) {
  if (access) {
    api.defaults.headers.common.Authorization = `Bearer ${access}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

function normErr(err) {
  const d = err?.response?.data;
  if (!d) return err;
  const lines = Object.entries(d).flatMap(([k, v]) =>
    Array.isArray(v)
      ? v.map((m) => `${k}: ${m}`)
      : typeof v === "string"
      ? [`${k}: ${v}`]
      : [`${k}: ${JSON.stringify(v)}`]
  );
  const e = new Error(lines.join("\n"));
  e.raw = d;
  return e;
}

/*  Логін */
export async function login(username, password) {
  const { data } = await api.post("/token/", { username, password });
  setTokens({ access: data.access, refresh: data.refresh });
  return data;
}
/* Рефреш токена */
export async function refreshToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) throw new Error("No refresh token found");
  try {
    const res = await api.post("/token/refresh/", { refresh });
    const { access } = res.data || {};
    localStorage.setItem("access", access);
    setAuthHeader(access);
    return res.data;
  } catch (err) {
    throw normErr(err);
  }
}

/* Логаут */
export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("username");
  setAuthHeader(null);
}

/* Підтягування токена у заголовки при старті */
export function loadToken() {
  const access = localStorage.getItem("access");
  setAuthHeader(access);
}

/* Плейсхолдер для майбутньої реєстрації */
export async function register() {
  throw new Error("Реєстрація тимчасово недоступна (немає /api/register/).");
}
