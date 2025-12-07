// app2.js - versión completa con dashboard dinámico y navegación
import {
  apiListarRegistros,
  apiGuardarRegistro,
  apiEditarRegistro,
} from "./app_api2.js";

/* ---------------------------
   REFS DOM
----------------------------*/
const sidebar = document.getElementById("sidebar");
const subNav = document.getElementById("subNav");

const inicioPantalla = document.getElementById("inicioPantalla");
const dashboard = document.getElementById("dashboard");

const btnResultados = document.getElementById("btnResultados");
const btnReporteInfo = document.getElementById("btnReporteInfo");

const reporteBtn = document.getElementById("reporteBtn");
const dashboardBtn = document.getElementById("dashboardBtn");

const btnVolverFormulario = document.getElementById("btnVolverFormulario");

const anioReporteEl = document.getElementById("anioReporte");
const municipioSeleccionadoEl = document.getElementById("municipioSeleccionado");

const municipioListSidebar = document.getElementById("municipioListSidebar");
const searchMunicipioSidebar = document.getElementById("searchMunicipioSidebar");

const poblacionEl = document.getElementById("poblacion");
const estrategiaEl = document.getElementById("estrategia");
const despliegueEl = document.getElementById("despliegue");
const sujetoEl = document.getElementById("sujeto");
const cantidadEl = document.getElementById("cantidad");
const observacionesEl = document.getElementById("observaciones");

const guardarBtn = document.getElementById("guardarBtn");
const cancelarEdicionBtn = document.getElementById("cancelarEdicion");

const formWrap = document.getElementById("formWrap");
const tableWrap = document.getElementById("tableWrap");
const totalsContainer = document.getElementById("totalsContainer");
const tablaBody = document.querySelector("#tablaRegistros tbody");

const totalDirectaPersonasEl = document.getElementById("totalDirectaPersonas");
const totalIndirectaPersonasEl = document.getElementById("totalIndirectaPersonas");
const totalAcumuladoEl = document.getElementById("totalAcumulado");

const btnConsolidado = document.getElementById("btnConsolidado");

// Dashboard refs
const filtroAnioDashboard = document.getElementById("filtroAnioDashboard");
const filtroMunicipioDashboard = document.getElementById("filtroMunicipioDashboard");
const filtroPoblacionDashboard = document.getElementById("filtroPoblacionDashboard");
const filtroSujetoDashboard = document.getElementById("filtroSujetoDashboard");

const kpiValorSujeto = document.getElementById("kpiValorSujeto");
const kpiDirecta = document.getElementById("kpiDirecta");
const kpiIndirecta = document.getElementById("kpiIndirecta");
const kpiRegistros = document.getElementById("kpiRegistros");

const tablaEstrategiaBody = document.querySelector("#tablaEstrategiaSujeto tbody");

/* ---------------------------
   CONSTANTES / DATOS
----------------------------*/
const municipios = [
  "BUGALAGRANDE","CALI","CALOTO","CANDELARIA","CORINTO","FLORIDA",
  "GUACHENÉ","JAMUNDÍ","MIRANDA","OBANDO","PADILLA","PALMIRA","POPAYÁN",
  "PRADERA","PUERTO TEJADA","ROLDANILLO","SANTANDER DE QUILICHAO",
  "TULUÁ","VILLA RICA","YUMBO","ZARZAL"
];

const sujetos = [
  "PERSONAS PARTICIPANTES","INSTITUCIONES EDUCATIVAS CON SEMILLEROS",
  "JÓVENES EN SEMILLEROS","LÍDERES DESTACADOS","ORGANIZACIONES",
  "SERVIDORES PÚBLICOS","FAMILIAS",
  "UNIDADES PRODUCTIVAS/ ORGANIZACIONES"
];

const estrategiasDefault = [
  "ESCUELA DE LIDERAZGO","REDES COMUNITARIAS","AGENDA CIUDADANA",
  "ASISTENCIA ENTES TERRITORIALES","AGRICULTURA FAMILIAR",
  "PROCESOS EMPRESARIALES"
];

const opcionesDespliegue = {
  "REDES COMUNITARIAS": [
    "RED AYUDA HUMANITARIA","RED EMPRESARIAL","RED JÓVENES","RED PIIA",
    "RED PRODUCTORES","RED HUERTEROS"
  ],
  "ASISTENCIA ENTES TERRITORIALES": ["CTP","COMPOS","CMJ","CDMR","CIDEA"],
  "AGRICULTURA FAMILIAR": ["HUERTAS","SISTEMAS PRODUCTIVOS"],
  "PROCESOS EMPRESARIALES": ["ZASCA","AFLORA","OTROS PROCESOS EMPRESARIALES"]
};

let registros = [];
let editId = null;

/* ---------------------------
   CHARTS (guardamos instancias)
----------------------------*/
let chartEstrategias = null;
let chartPoblacion = null;
let chartSujetos = null;

/* ---------------------------
   INIT UI
----------------------------*/
function initUI() {
  municipioListSidebar.innerHTML = municipios.map(m => `<li tabindex="0">${m}</li>`).join("");
  sujetoEl.innerHTML = `<option value="">Seleccione...</option>` + sujetos.map(s => `<option>${s}</option>`).join("");
  estrategiaEl.innerHTML = `<option value="">Seleccione...</option>` + estrategiasDefault.map(e => `<option>${e}</option>`).join("");

  // dashboard filters: populate municipios & sujetos list
  filtroMunicipioDashboard.innerHTML = `<option value="">Todos</option>` + municipios.map(m => `<option>${m}</option>`).join("");
  filtroSujetoDashboard.innerHTML = `<option value="">Todos</option>` + sujetos.map(s => `<option>${s}</option>`).join("");

  hideAllViews();
}
initUI();

/* ---------------------------
   VISTAS / NAVEGACIÓN
----------------------------*/
function hideAllViews() {
  inicioPantalla.classList.remove("hidden"); // show inicio
  formWrap.classList.add("hidden");
  tableWrap.classList.add("hidden");
  totalsContainer.classList.add("hidden");
  sidebar.classList.add("hidden");
  subNav.classList.add("hidden");
  dashboard.classList.add("hidden");

  // dashboard button hidden on startup
  dashboardBtn.classList.add("hidden");
  document.querySelector('.main-area').classList.remove('with-sidebar');
}

btnResultados.addEventListener("click", () => {
  // Show dashboard (from inicio)
  inicioPantalla.classList.add("hidden");
  dashboard.classList.remove("hidden");

  // hide form & sidebar
  formWrap.classList.add("hidden");
  tableWrap.classList.add("hidden");
  totalsContainer.classList.add("hidden");
  sidebar.classList.add("hidden");
  subNav.classList.add("hidden");

  dashboardBtn.classList.remove("hidden");
  
  document.querySelector('.main-area').classList.remove('with-sidebar');
  
  updateDashboard();
});

// ✅ MODIFICADO: Mostrar formulario directo al hacer clic en "Reporte de Información"
btnReporteInfo.addEventListener("click", () => {
  inicioPantalla.classList.add("hidden");
  dashboard.classList.add("hidden");

  // Mostrar sidebar, formulario y tabla directamente
  sidebar.classList.remove("hidden");
  subNav.classList.remove("hidden");
  formWrap.classList.remove("hidden");
  tableWrap.classList.remove("hidden");
  totalsContainer.classList.remove("hidden");

  // Agregar clase with-sidebar para que se vea correctamente
  document.querySelector('.main-area').classList.add('with-sidebar');

  // MOBILE FIX: Asegurar que todo sea visible en móvil
  if (window.innerWidth <= 768) {
    // Remover with-sidebar en móvil
    document.querySelector('.main-area').classList.remove('with-sidebar');
    
    // Forzar visibilidad
    formWrap.style.display = 'block';
    tableWrap.style.display = 'block';
    totalsContainer.style.display = 'flex';
    
    // Asegurar que el sidebar esté en posición correcta
    sidebar.style.position = 'fixed';
    sidebar.style.top = 'calc(var(--header-h) + var(--subnav-h))';
  }

  dashboardBtn.classList.add("hidden");
  
  // Renderizar tabla con todos los registros (sin filtro de municipio)
  renderTabla();
});

dashboardBtn.addEventListener("click", () => {
  // from subnav, user wants Dashboard
  formWrap.classList.add("hidden");
  tableWrap.classList.add("hidden");
  totalsContainer.classList.add("hidden");
  sidebar.classList.add("hidden");

  dashboard.classList.remove("hidden");
  dashboardBtn.classList.remove("hidden");
  
  document.querySelector('.main-area').classList.remove('with-sidebar');
  
  updateDashboard();
});

// ✅ MODIFICADO: Volver al formulario con todo visible
btnVolverFormulario.addEventListener("click", () => {
  dashboard.classList.add("hidden");
  
  // Mostrar todo: sidebar, formulario y tabla
  subNav.classList.remove("hidden");
  sidebar.classList.remove("hidden");
  formWrap.classList.remove("hidden");
  tableWrap.classList.remove("hidden");
  totalsContainer.classList.remove("hidden");

  dashboardBtn.classList.add("hidden");
  
  document.querySelector('.main-area').classList.add('with-sidebar');
  
  // Renderizar tabla con el filtro actual (si hay municipio seleccionado)
  renderTabla();
});

/* ---------------------------
   SIDEBAR -> seleccionar municipio
   (la barra queda fija; NO la ocultamos al seleccionar)
----------------------------*/
municipioListSidebar.addEventListener("click", e => {
  if (e.target.tagName === "LI") {
    seleccionarMunicipio(e.target.textContent.trim());
  }
});

function seleccionarMunicipio(nombre) {
  municipioSeleccionadoEl.textContent = nombre;
  editId = null;
  cancelarEdicionBtn.classList.add("hidden");

  // show form & table (sidebar stays visible)
  formWrap.classList.remove("hidden");
  tableWrap.classList.remove("hidden");
  totalsContainer.classList.remove("hidden");
  
  document.querySelector('.main-area').classList.add('with-sidebar');

  // render tabla con filtrado por municipio seleccionado
  renderTabla();
}

/* buscador de municipio */
searchMunicipioSidebar.addEventListener("input", function () {
  const q = this.value.toUpperCase();
  Array.from(municipioListSidebar.children).forEach(li => {
    li.style.display = li.textContent.toUpperCase().includes(q) ? "" : "none";
  });
});

/* ---------------------------
   FORM
----------------------------*/
poblacionEl.addEventListener("change", () => {
  if (poblacionEl.value === "INDIRECTA") {
    estrategiaEl.innerHTML = `
      <option value="">Seleccione...</option>
      <option>DONACIONES (PIÑA, MERCADOS, ETC)</option>
      <option>ASISTENCIAS CDBC</option>
      <option>TALLERES ICP</option>
      <option>FOROS, EVENTOS MASIVOS</option>
    `;

    despliegueEl.classList.add("hidden");
    despliegueEl.innerHTML = "";
  } else {
    estrategiaEl.innerHTML =
      `<option value="">Seleccione...</option>` +
      estrategiasDefault.map(e => `<option>${e}</option>`).join("");

    estrategiaEl.dispatchEvent(new Event("change"));
  }
});

estrategiaEl.addEventListener("change", () => {
  if (poblacionEl.value === "INDIRECTA") return despliegueEl.classList.add("hidden");

  const v = estrategiaEl.value;
  if (opcionesDespliegue[v]) {
    despliegueEl.classList.remove("hidden");
    despliegueEl.innerHTML = `<option value="">Seleccione...</option>` +
      opcionesDespliegue[v].map(o => `<option>${o}</option>`).join("");
  } else {
    despliegueEl.classList.add("hidden");
    despliegueEl.innerHTML = "";
  }

  validateFormForConsolidado();
});

sujetoEl.addEventListener("change", validateFormForConsolidado);
anioReporteEl.addEventListener("change", validateFormForConsolidado);
cantidadEl.addEventListener("input", validateFormForConsolidado);

function isFormMandatoryComplete() {
  // Permitir ver consolidado si ya existe al menos un registro
  if (registros.length > 0) return true;

  // Si no hay registros, validar el formulario
  const anio = anioReporteEl.value;
  const muni = municipioSeleccionadoEl.textContent.trim();
  const poblacion = poblacionEl.value;
  const sujeto = sujetoEl.value;
  const estrategia = estrategiaEl.value;
  const cantidad = Number(cantidadEl.value) || 0;

  return anio && muni && muni !== "—" && poblacion && sujeto && estrategia && cantidad > 0;
}

function validateFormForConsolidado() {
  if (isFormMandatoryComplete()) btnConsolidado.removeAttribute("disabled");
  else btnConsolidado.setAttribute("disabled", "true");
}

/* ---------------------------
   CRUD & TABLA
----------------------------*/
async function cargarRegistros() {
  const res = await apiListarRegistros();
  registros = Array.isArray(res) ? res : [];
  renderTabla();
  updateDashboard();
}

function renderTabla() {
  tablaBody.innerHTML = "";

  const muni = municipioSeleccionadoEl.textContent.trim();
  let filtrados = [];

  // if no municipio selected or placeholder, show all records
  if (!muni || muni === "—") filtrados = registros.slice();
  else filtrados = registros.filter(r => r.municipio === muni);

  filtrados.forEach(reg => {
    const fecha = reg.fechaCreacion ? new Date(reg.fechaCreacion).toLocaleString() : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${reg.anio || ""}</td>
      <td>${reg.municipio || ""}</td>
      <td>${reg.sujeto || ""}</td>
      <td>${reg.poblacion || ""}</td>
      <td>${reg.estrategia || ""}</td>
      <td>${reg.despliegue || "-"}</td>
      <td>${reg.cantidad || 0}</td>
      <td>${fecha}</td>
      <td>
        <button class="btn-edit" data-id="${reg._id}">Editar</button>
      </td>
    `;
    tablaBody.appendChild(tr);
  });

  tablaBody.querySelectorAll(".btn-edit").forEach(b => b.addEventListener("click", onEditar));
  tablaBody.querySelectorAll(".btn-delete").forEach(b => b.addEventListener("click", onEliminar));

  actualizarTotales(filtrados);
}

function actualizarTotales(filtrados) {
  const total = filtrados
    .filter(r => r.sujeto === "PERSONAS PARTICIPANTES")
    .reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);

  const directa = filtrados
    .filter(r => r.poblacion === "DIRECTA" && r.sujeto === "PERSONAS PARTICIPANTES")
    .reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);

  const indirecta = filtrados
    .filter(r => r.poblacion === "INDIRECTA" && r.sujeto === "PERSONAS PARTICIPANTES")
    .reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);

  totalAcumuladoEl.textContent = total;
  totalDirectaPersonasEl.textContent = directa;
  totalIndirectaPersonasEl.textContent = indirecta;
}

/* EDITAR */
function onEditar(e) {
  const id = e.currentTarget.dataset.id;
  const reg = registros.find(r => r._id === id);
  if (!reg) return;

  municipioSeleccionadoEl.textContent = reg.municipio;

  poblacionEl.value = reg.poblacion;
  poblacionEl.dispatchEvent(new Event("change"));

  estrategiaEl.value = reg.estrategia;
  estrategiaEl.dispatchEvent(new Event("change"));

  if (reg.despliegue) despliegueEl.value = reg.despliegue;

  sujetoEl.value = reg.sujeto;
  cantidadEl.value = reg.cantidad;
  observacionesEl.value = reg.observaciones;
  anioReporteEl.value = reg.anio;

  editId = id;
  cancelarEdicionBtn.classList.remove("hidden");

  formWrap.classList.remove("hidden");
  tableWrap.classList.remove("hidden");
  totalsContainer.classList.remove("hidden");
}

/* ELIMINAR */
async function onEliminar(e) {
  if (!confirm("¿Eliminar este registro?")) return;
  const id = e.currentTarget.dataset.id;
  await apiEliminarRegistro(id);
  await cargarRegistros();
}

/* GUARDAR */
guardarBtn.addEventListener("click", async () => {
  const municipio = municipioSeleccionadoEl.textContent.trim();
  
  // Validar que se haya seleccionado un municipio
  if (!municipio || municipio === "—") {
    return alert("Por favor selecciona un municipio de la lista antes de guardar.");
  }

  const registro = {
    anio: anioReporteEl.value,
    municipio: municipio,
    poblacion: poblacionEl.value,
    sujeto: sujetoEl.value,
    estrategia: estrategiaEl.value,
    despliegue: (poblacionEl.value === "INDIRECTA") ? "-" : (despliegueEl.classList.contains("hidden") ? "-" : despliegueEl.value),
    cantidad: Number(cantidadEl.value),
    observaciones: observacionesEl.value
  };

  if (!registro.anio || !registro.poblacion || !registro.sujeto || !registro.estrategia || !registro.cantidad) {
    return alert("Por favor completa todos los campos obligatorios.");
  }

  if (editId) {
    await apiEditarRegistro(editId, registro);
    editId = null;
    cancelarEdicionBtn.classList.add("hidden");
  } else {
    await apiGuardarRegistro(registro);
  }

  await cargarRegistros();
  limpiarFormulario();
});

btnConsolidado.removeAttribute("disabled");

cancelarEdicionBtn.addEventListener("click", () => {
  editId = null;
  limpiarFormulario();
  cancelarEdicionBtn.classList.add("hidden");
});

function limpiarFormulario() {
  anioReporteEl.value = "";
  poblacionEl.value = "";
  estrategiaEl.value = "";
  despliegueEl.innerHTML = "";
  despliegueEl.classList.add("hidden");
  sujetoEl.value = "";
  cantidadEl.value = "";
  observacionesEl.value = "";
  btnConsolidado.setAttribute("disabled", "true");
}

/* ---------------------------
   VER CONSOLIDADO -> abre DASHBOARD
----------------------------*/
btnConsolidado.addEventListener("click", () => {
  if (!isFormMandatoryComplete()) return alert("Completa los campos obligatorios para ver el consolidado.");

  formWrap.classList.add("hidden");
  tableWrap.classList.add("hidden");
  totalsContainer.classList.add("hidden");
  sidebar.classList.add("hidden");
  subNav.classList.add("hidden");

  dashboard.classList.remove("hidden");
  dashboardBtn.classList.remove("hidden");

  document.querySelector('.main-area').classList.remove('with-sidebar');

  filtroAnioDashboard.value = anioReporteEl.value || "";
  filtroMunicipioDashboard.value = municipioSeleccionadoEl.textContent.trim() || "";
  filtroPoblacionDashboard.value = poblacionEl.value || "";
  filtroSujetoDashboard.value = sujetoEl.value || "";

  updateDashboard();
});

/* ---------------------------
   DASHBOARD: filtros -> actualizar
----------------------------*/
[filtroAnioDashboard, filtroMunicipioDashboard, filtroPoblacionDashboard, filtroSujetoDashboard].forEach(el =>
  el.addEventListener("change", updateDashboard)
);

/* ---------------------------
   FUNCIONES DE FILTRADO PARA DASHBOARD
----------------------------*/
function applyDashboardFilters(records) {
  let res = records.slice();

  const a = filtroAnioDashboard.value;
  const m = filtroMunicipioDashboard.value;
  const p = filtroPoblacionDashboard.value;
  const s = filtroSujetoDashboard.value;

  if (a) res = res.filter(r => r.anio === a);
  if (m) res = res.filter(r => r.municipio === m);
  if (p) res = res.filter(r => r.poblacion === p);
  if (s) res = res.filter(r => r.sujeto === s);

  return res;
}

/* ---------------------------
   UPDATE DASHBOARD (KPIs + charts + tabla %)
----------------------------*/
function updateDashboard() {
  const all = registros.slice();
  const filtered = applyDashboardFilters(all);

  let totalSujeto = 0;
  if (filtroSujetoDashboard.value) {
    totalSujeto = filtered.filter(r => r.sujeto === filtroSujetoDashboard.value).reduce((a,b)=>a+(Number(b.cantidad)||0),0);
    document.getElementById("kpiTituloSujeto").textContent = `Total (${filtroSujetoDashboard.value})`;
  } else {
    totalSujeto = filtered.reduce((a,b)=>a+(Number(b.cantidad)||0),0);
    document.getElementById("kpiTituloSujeto").textContent = `Total Sujeto`;
  }
  kpiValorSujeto.textContent = totalSujeto;

  const directa = filtered.filter(r => r.poblacion === "DIRECTA").reduce((a,b)=>a+(Number(b.cantidad)||0),0);
  kpiDirecta.textContent = directa;

  const indirecta = filtered.filter(r => r.poblacion === "INDIRECTA").reduce((a,b)=>a+(Number(b.cantidad)||0),0);
  kpiIndirecta.textContent = indirecta;

  kpiRegistros.textContent = filtered.length;

  renderChartEstrategias(filtered);
  renderChartPoblacion(filtered);
  renderChartSujetos(filtered);

  renderTablaPorcentajeEstrategias(filtered);
  
  // ✅ NUEVO: Actualizar título de la tabla según filtro de sujeto
  actualizarTituloTablaEstrategias();
}

// ✅ NUEVA FUNCIÓN: Actualizar título dinámico de la tabla
function actualizarTituloTablaEstrategias() {
  const tituloTabla = document.getElementById('tituloTablaEstrategia');
  if (tituloTabla) {
    const sujetoSeleccionado = filtroSujetoDashboard.value;
    if (sujetoSeleccionado) {
      tituloTabla.textContent = `% (${sujetoSeleccionado})`;
    } else {
      tituloTabla.textContent = `% (porcentaje según filtros)`;
    }
  }
}

/* ---------------------------
   RENDER TABLA % ESTRATEGIAS
----------------------------*/
function renderTablaPorcentajeEstrategias(filtered) {
  tablaEstrategiaBody.innerHTML = "";

  const totalCantidad = filtered.reduce((a,b)=>a+(Number(b.cantidad)||0),0);

  const sums = {};
  filtered.forEach(r => {
    const key = r.estrategia || "Sin estrategia";
    sums[key] = (sums[key] || 0) + (Number(r.cantidad)||0);
  });

  const rows = Object.entries(sums).sort((a,b)=>b[1]-a[1]);

  if (rows.length === 0) {
    tablaEstrategiaBody.innerHTML = `<tr><td colspan="2">No hay datos</td></tr>`;
    return;
  }

  rows.forEach(([estr, val]) => {
    const pct = totalCantidad > 0 ? ((val / totalCantidad) * 100) : 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${estr}</td><td>${pct.toFixed(1)}%</td>`;
    tablaEstrategiaBody.appendChild(tr);
  });
}

/* ---------------------------
   CHARTS: Estrategias, Poblacion, Sujetos
----------------------------*/
function renderChartEstrategias(filtered) {
  const sums = {};
  filtered.forEach(r => {
    const key = r.estrategia || "Sin estrategia";
    sums[key] = (sums[key] || 0) + (Number(r.cantidad)||0);
  });

  const labels = Object.keys(sums);
  const data = Object.values(sums);

  const pairs = labels.map((l,i)=>[l,data[i]]).sort((a,b)=>b[1]-a[1]);
  const sortedLabels = pairs.map(p=>p[0]);
  const sortedData = pairs.map(p=>p[1]);

  const ctx = document.getElementById("chartEstrategias").getContext("2d");

  if (chartEstrategias) chartEstrategias.destroy();

  chartEstrategias = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedLabels,
      datasets: [{
        label: 'Participantes',
        data: sortedData,
        backgroundColor: sortedLabels.map(()=> 'rgba(180,0,0,0.85)')
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero:true, ticks:{precision:0} },
        y: { ticks:{autoSkip:false} }
      },
      plugins: {
        legend:{ display:false },
        tooltip:{ enabled:true }
      }
    }
  });
}

function renderChartPoblacion(filtered) {
  const directa = filtered.filter(r => r.poblacion === "DIRECTA").reduce((a,b)=>a+(Number(b.cantidad)||0),0);
  const indirecta = filtered.filter(r => r.poblacion === "INDIRECTA").reduce((a,b)=>a+(Number(b.cantidad)||0),0);

  const ctx = document.getElementById("chartPoblacion").getContext("2d");
  if (chartPoblacion) chartPoblacion.destroy();

  chartPoblacion = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Directa', 'Indirecta'],
      datasets: [{
        data: [directa, indirecta],
        backgroundColor: ['rgba(180,0,0,0.85)', 'rgba(97, 109, 107, 0.55)']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { enabled: true }
      }
    }
  });
}

function renderChartSujetos(filtered) {
  const sums = {};
  filtered.forEach(r => {
    const key = r.sujeto || "Sin sujeto";
    sums[key] = (sums[key] || 0) + (Number(r.cantidad)||0);
  });

  const pairs = Object.entries(sums).sort((a,b)=>b[1]-a[1]);
  const labels = pairs.map(p=>p[0]);
  const data = pairs.map(p=>p[1]);

  const ctx = document.getElementById("chartSujetos").getContext("2d");
  if (chartSujetos) chartSujetos.destroy();

  chartSujetos = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Participantes',
        data,
        backgroundColor: labels.map(()=> 'rgba(180,0,0,0.85)')
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { beginAtZero:true, ticks:{precision:0} },
        y: { ticks:{autoSkip:false} }
      },
      plugins: { legend:{display:false} }
    }
  });
}

/* ---------------------------
   CARGA INICIAL
----------------------------*/
async function initLoad() {
  await cargarRegistros();
  populateFilterYears();
}

function populateFilterYears() {
  const yearsSet = new Set(registros.map(r=>r.anio).filter(Boolean));
  const arr = Array.from(yearsSet).sort();
  filtroAnioDashboard.innerHTML = `<option value="">Todos</option>` + arr.map(y=>`<option>${y}</option>`).join("");
}

document.addEventListener("DOMContentLoaded", initLoad);

/* =====================================================
   HAMBURGUESA – MOBILE MENU (MEJORADO)
===================================================== */

const hamburgerBtn = document.getElementById("hamburgerBtn");
const listaSidebar = document.getElementById("municipioListSidebar");
const buscadorSidebar = document.getElementById("searchMunicipioSidebar");

if (hamburgerBtn) {
  // Inicializar texto del botón
  hamburgerBtn.textContent = "🔍 Buscar";
  
  hamburgerBtn.addEventListener("click", () => {
    const isVisible = buscadorSidebar.style.display === "block";

    if (isVisible) {
      buscadorSidebar.style.display = "none";
      hamburgerBtn.textContent = "🔍 Buscar";
    } else {
      buscadorSidebar.style.display = "block";
      hamburgerBtn.textContent = "❌ Cerrar";
      buscadorSidebar.focus();
    }
  });
}