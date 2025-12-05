// ================================================================
//  app_api2.js  (versión PRO FINAL)
//  Wrapper de API con fallback automático a localStorage
//  Compatible 100% con tu backend Express + MongoDB
// ================================================================

const API_URL = "https://sistema-de-indicadores.onrender.com/api/indicadores";

// --------------------------------------------------------------
// Normaliza registro para asegurar fechaCreacion siempre presente
// --------------------------------------------------------------
function normalizeRecord(r) {
  return {
    ...r,
    fechaCreacion: r.fechaCreacion || new Date().toISOString()
  };
}

// --------------------------------------------------------------
// FETCH SEGURO CON FALLBACK
// --------------------------------------------------------------
async function safeFetch(endpoint = "", method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const resp = await fetch(`${API_URL}${endpoint}`, config);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = await resp.json();

    // ----------------------------------------------------------
    // El backend a veces retorna:
    //   { data: [...] }
    // Otras veces retorna directamente:
    //   [ ... ]
    // Ambas opciones se normalizan aquí.
    // ----------------------------------------------------------

    if (Array.isArray(data)) {
      return { data: data.map(normalizeRecord) };
    }

    if (data && typeof data === "object" && "data" in data) {
      if (Array.isArray(data.data)) {
        return { data: data.data.map(normalizeRecord) };
      }
      return { data: normalizeRecord(data.data) };
    }

    return { data };
  } catch (err) {
    console.warn("⚠ API NO DISPONIBLE → usando localStorage:", err.message);

    const LS_KEY = "indicadores_local";

    // ----------------------------------------------------------
    // GET → leer localStorage
    // ----------------------------------------------------------
    if (method === "GET") {
      const raw = localStorage.getItem(LS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return { data: list.map(normalizeRecord) };
    }

    // ----------------------------------------------------------
    // POST → crear nuevo registro local
    // ----------------------------------------------------------
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

    // ----------------------------------------------------------
    // PUT → actualizar registro local
    // ----------------------------------------------------------
    if (method === "PUT") {
      const list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const id = endpoint.replace(/\//g, "");

      const idx = list.findIndex(i => i._id === id);
      if (idx >= 0) {
        list[idx] = normalizeRecord({
          ...list[idx],
          ...body
        });
        localStorage.setItem(LS_KEY, JSON.stringify(list));
        return { data: list[idx] };
      }

      throw new Error("Registro no encontrado en localStorage");
    }

    // ----------------------------------------------------------
    // DELETE → eliminar registro local
    // ----------------------------------------------------------
    if (method === "DELETE") {
      const list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const id = endpoint.replace(/\//g, "");

      const filtered = list.filter(i => i._id !== id);
      localStorage.setItem(LS_KEY, JSON.stringify(filtered));

      return { data: { ok: true } };
    }
  }
}

// --------------------------------------------------------------
// EXPORTS SIMPLIFICADOS
// --------------------------------------------------------------
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
