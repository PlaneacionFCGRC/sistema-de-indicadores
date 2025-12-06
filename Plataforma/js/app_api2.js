//  app_api2.js  (VERSIÓN CORREGIDA Y MEJORADA)
//  Backend Render + fallback localStorage SIN PERDER registros.

// URL del backend Render
const API_URL = "https://sistema-de-indicadores.onrender.com/api/indicadores";

// Normaliza para asegurarnos que siempre haya fecha
function normalizeRecord(r) {
  return {
    ...r,
    fechaCreacion: r.fechaCreacion || new Date().toISOString()
  };
}

// KEY del localStorage
const LS_KEY = "indicadores_local";

// -----------------------------------------------------
// FETCH SEGURO CON FALLBACK
// -----------------------------------------------------
async function safeFetch(endpoint = "", method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const resp = await fetch(`${API_URL}${endpoint}`, config);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = await resp.json();

    let registrosNormalizados = [];

    // Normaliza backend: {data: [...] } o [...]
    if (Array.isArray(data)) {
      registrosNormalizados = data.map(normalizeRecord);
    } else if (data?.data) {
      registrosNormalizados = Array.isArray(data.data)
        ? data.data.map(normalizeRecord)
        : [normalizeRecord(data.data)];
    } else {
      registrosNormalizados = [normalizeRecord(data)];
    }

    // ⭐ SINCRONIZA localStorage con MongoDB
    if (method === "GET") {
      localStorage.setItem(LS_KEY, JSON.stringify(registrosNormalizados));
    }

    return { data: registrosNormalizados };
  } catch (err) {
    console.warn("⚠ Backend NO disponible → usando localStorage");

    // ---------- GET ----------
    if (method === "GET") {
      const raw = localStorage.getItem(LS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return { data: list.map(normalizeRecord) };
    }

    // ---------- POST ----------
    if (method === "POST") {
      const list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");

      const nuevo = normalizeRecord({
        ...body,
        _id: `local_${Date.now()}`
      });

      list.unshift(nuevo);
      localStorage.setItem(LS_KEY, JSON.stringify(list));

      return { data: nuevo };
    }

    // ---------- PUT ----------
    if (method === "PUT") {
      const list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const id = endpoint.replace(/\//g, "");

      const idx = list.findIndex(r => r._id === id);
      if (idx >= 0) {
        list[idx] = normalizeRecord({ ...list[idx], ...body });
        localStorage.setItem(LS_KEY, JSON.stringify(list));
        return { data: list[idx] };
      }
      throw new Error("Registro no encontrado en localStorage");
    }

    // ---------- DELETE ----------
    if (method === "DELETE") {
      const list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const id = endpoint.replace(/\//g, "");

      const newList = list.filter(r => r._id !== id);
      localStorage.setItem(LS_KEY, JSON.stringify(newList));

      return { data: { ok: true } };
    }
  }
}

// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
export async function apiListarRegistros() {
  const res = await safeFetch("", "GET");
  return res.data;
}

export async function apiGuardarRegistro(body) {
  const res = await safeFetch("", "POST", body);
  return res.data;
}

export async function apiEditarRegistro(id, body) {
  const res = await safeFetch(`/${id}`, "PUT", body);
  return res.data;
}

export async function apiEliminarRegistro(id) {
  const res = await safeFetch(`/${id}`, "DELETE");
  return res.data;
}
