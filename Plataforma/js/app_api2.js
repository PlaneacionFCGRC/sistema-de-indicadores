//  app_api2.js  (VERSIÓN ULTRA-RÁPIDA CON CACHE)
//  ✅ Carga INSTANTÁNEA desde localStorage
//  ✅ Sincroniza con backend en segundo plano

const API_URL = "https://sistema-de-indicadores.onrender.com/api/indicadores";
const LS_KEY = "indicadores_local";
const LS_TIMESTAMP_KEY = "indicadores_timestamp";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Normaliza registros
function normalizeRecord(r) {
  return {
    ...r,
    fechaCreacion: r.fechaCreacion || new Date().toISOString()
  };
}

// 🚀 CARGA INSTANTÁNEA: Devuelve cache + actualiza en background
async function fetchWithCache() {
  const cached = localStorage.getItem(LS_KEY);
  const timestamp = localStorage.getItem(LS_TIMESTAMP_KEY);
  const now = Date.now();

  // ✅ RETORNO INMEDIATO si hay cache
  if (cached) {
    const cachedData = JSON.parse(cached).map(normalizeRecord);
    
    // Verificar si el cache es reciente
    const cacheAge = timestamp ? now - parseInt(timestamp) : Infinity;
    
    if (cacheAge < CACHE_DURATION) {
      console.log("⚡ Cargando desde cache (instantáneo)");
      return cachedData;
    }
  }

  // 🔄 Actualizar en segundo plano (solo si cache es viejo o no existe)
  try {
    console.log("🔄 Actualizando datos desde backend...");
    const resp = await fetch(API_URL);
    
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    
    const data = await resp.json();
    let registros = [];

    if (Array.isArray(data)) {
      registros = data.map(normalizeRecord);
    } else if (data?.data) {
      registros = Array.isArray(data.data)
        ? data.data.map(normalizeRecord)
        : [normalizeRecord(data.data)];
    }

    // Guardar en cache
    localStorage.setItem(LS_KEY, JSON.stringify(registros));
    localStorage.setItem(LS_TIMESTAMP_KEY, now.toString());
    
    console.log("✅ Cache actualizado desde backend");
    return registros;

  } catch (err) {
    console.warn("⚠ Backend no disponible → usando cache local");
    
    if (cached) {
      return JSON.parse(cached).map(normalizeRecord);
    }
    
    return [];
  }
}

// Fetch seguro para operaciones de escritura
async function safeFetch(endpoint = "", method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const resp = await fetch(`${API_URL}${endpoint}`, config);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = await resp.json();
    let result = [];

    if (Array.isArray(data)) {
      result = data.map(normalizeRecord);
    } else if (data?.data) {
      result = Array.isArray(data.data)
        ? data.data.map(normalizeRecord)
        : [normalizeRecord(data.data)];
    } else {
      result = [normalizeRecord(data)];
    }

    // Invalida cache después de escritura
    if (method !== "GET") {
      localStorage.removeItem(LS_TIMESTAMP_KEY);
    }

    return { data: result };

  } catch (err) {
    console.warn("⚠ Operación offline → usando localStorage");

    // POST local
    if (method === "POST") {
      const list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const nuevo = normalizeRecord({
        ...body,
        _id: `local_${Date.now()}`
      });
      list.unshift(nuevo);
      localStorage.setItem(LS_KEY, JSON.stringify(list));
      localStorage.removeItem(LS_TIMESTAMP_KEY);
      return { data: nuevo };
    }

    // PUT local
    if (method === "PUT") {
      const list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const id = endpoint.replace(/\//g, "");
      const idx = list.findIndex(r => r._id === id);
      
      if (idx >= 0) {
        list[idx] = normalizeRecord({ ...list[idx], ...body });
        localStorage.setItem(LS_KEY, JSON.stringify(list));
        localStorage.removeItem(LS_TIMESTAMP_KEY);
        return { data: list[idx] };
      }
      throw new Error("Registro no encontrado");
    }

    // DELETE local
    if (method === "DELETE") {
      const list = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      const id = endpoint.replace(/\//g, "");
      const newList = list.filter(r => r._id !== id);
      localStorage.setItem(LS_KEY, JSON.stringify(newList));
      localStorage.removeItem(LS_TIMESTAMP_KEY);
      return { data: { ok: true } };
    }

    return { data: [] };
  }
}

// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
export async function apiListarRegistros() {
  return await fetchWithCache();
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