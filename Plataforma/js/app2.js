// js/app2.js — Parte 1/4
import { apiListarRegistros, apiGuardarRegistro, apiEditarRegistro, apiEliminarRegistro } from "./app_api2.js";

/* -----------------------
   REFS
------------------------*/
const reporteBtn = document.getElementById("reporteBtn");
const sidebar = document.getElementById("sidebar");
const dashboardBtn = document.getElementById("dashboardBtn"); // <-- botón Dashboard (puede no existir en algunas versiones)

const anioReporteEl = document.getElementById("anioReporte");

// Dashboard & filtros
const dashboardEl = document.getElementById("dashboard");
const filtroAnioDashboard = document.getElementById("filtroAnioDashboard");
const filtroMunicipioDashboard = document.getElementById("filtroMunicipioDashboard");
const filtroPoblacionDashboard = document.getElementById("filtroPoblacionDashboard");
const filtroSujetoDashboard = document.getElementById("filtroSujetoDashboard");

// KPI dinámico (título y valor)
const kpiTituloSujeto = document.getElementById("kpiTituloSujeto");
const kpiValorSujeto = document.getElementById("kpiValorSujeto");

// Otros KPIs
const kpiDirecta = document.getElementById("kpiDirecta");
const kpiIndirecta = document.getElementById("kpiIndirecta");
const kpiRegistros = document.getElementById("kpiRegistros");

// Titulos dinámicos para Directa / Indirecta
const kpiTituloDirecta = document.getElementById("kpiTituloDirecta");
const kpiTituloIndirecta = document.getElementById("kpiTituloIndirecta");

// Tabla estrategia vs sujeto (dashboard)
const tablaEstrategiaSujeto = document.querySelector("#tablaEstrategiaSujeto tbody");

// Canvas contexts
const chartEstrategiasCtx = document.getElementById("chartEstrategias");
const chartPoblacionCtx = document.getElementById("chartPoblacion");
const chartSujetosCtx = document.getElementById("chartSujetos");

// Form view & list
const formWrap = document.getElementById("formWrap");
const totalsContainer = document.getElementById("totalsContainer");
const tableWrap = document.getElementById("tableWrap");

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

const tablaBody = document.querySelector("#tablaRegistros tbody");

const totalDirectaPersonasEl = document.getElementById("totalDirectaPersonas");
const totalIndirectaPersonasEl = document.getElementById("totalIndirectaPersonas");
const totalAcumuladoEl = document.getElementById("totalAcumulado");
// js/app2.js — Parte 2/4
/* -----------------------
   DATA y estado
------------------------*/
let registros = []; // todos los registros
let editId = null;

let chartEstrategia = null;
let chartPoblacion = null;
let chartSujetos = null;

/* Valores por defecto */
const municipiosStatic = [
  "BUGALAGRANDE","CALI","CALOTO","CANDELARIA","CORINTO","FLORIDA","GUACHENÉ",
  "JAMUNDÍ","MIRANDA","OBANDO","PADILLA","PALMIRA","POPAYÁN","PRADERA",
  "PUERTO TEJADA","ROLDANILLO","SANTANDER DE QUILICHAO","TULUÁ","VILLA RICA",
  "YUMBO","ZARZAL"
];

const sujetosStatic = [
  "PERSONAS PARTICIPANTES","INSTITUCIONES EDUCATIVAS CON SEMILLEROS",
  "JÓVENES EN SEMILLEROS","LÍDERES DESTACADOS","ORGANIZACIONES",
  "SERVIDORES PÚBLICOS","FAMILIAS","UNIDADES PRODUCTIVAS/ ORGANIZACIONES"
];

const estrategiasDefault = [
  "ESCUELA DE LIDERAZGO","REDES COMUNITARIAS","AGENDA CIUDADANA",
  "ASISTENCIA ENTES TERRITORIALES","AGRICULTURA FAMILIAR",
  "PROCESOS EMPRESARIALES"
];

/* -----------------------
   UTILIDADES
------------------------*/
function uniqueSorted(arr) {
  return Array.from(new Set(arr)).sort();
}
function formatNumber(n) {
  return Number(n || 0).toLocaleString();
}

/* -----------------------
   Inicialización UI
------------------------*/
function initUI() {
  // sidebar municipios (estático)
  if (municipioListSidebar) {
    municipioListSidebar.innerHTML = municipiosStatic.map(m => `<li tabindex="0">${m}</li>`).join("");
  }

  // llenar selects de formulario
  if (sujetoEl) sujetoEl.innerHTML = `<option value="">Seleccione...</option>` + sujetosStatic.map(s => `<option>${s}</option>`).join("");
  if (estrategiaEl) estrategiaEl.innerHTML = `<option value="">Seleccione...</option>` + estrategiasDefault.map(e => `<option>${e}</option>`).join("");

  // filtro sujeto dashboard
  if (filtroSujetoDashboard) {
    filtroSujetoDashboard.innerHTML = `<option value="">Todos</option>` + sujetosStatic.map(s => `<option value="${s}">${s}</option>`).join("");
  }

  // filtro poblacion
  if (filtroPoblacionDashboard) {
    filtroPoblacionDashboard.innerHTML = `<option value="">Todos</option>
      <option value="DIRECTA">DIRECTA</option>
      <option value="INDIRECTA">INDIRECTA</option>`;
  }

  // reporteBtn / sidebar toggles
  if (reporteBtn) {
    reporteBtn.addEventListener("click", () => {
      if (anioReporteEl && anioReporteEl.value) sidebar.classList.toggle("hidden");
    });
    reporteBtn.addEventListener("mouseover", () => {
      if (anioReporteEl && anioReporteEl.value) sidebar.classList.remove("hidden");
    });
  }
  if (sidebar) sidebar.addEventListener("mouseleave", () => sidebar.classList.add("hidden"));

  // search sidebar
  if (searchMunicipioSidebar) {
    searchMunicipioSidebar.addEventListener("input", function () {
      const q = this.value.toUpperCase();
      Array.from(municipioListSidebar.children).forEach(li => {
        li.style.display = li.textContent.toUpperCase().includes(q) ? "" : "none";
      });
    });
  }

  // click en municipio lateral
  if (municipioListSidebar) {
    municipioListSidebar.addEventListener("click", e => {
      if (e.target.tagName === "LI") seleccionarMunicipio(e.target.textContent.trim());
    });
  }

  // comportamiento de poblacion -> estrategia/despliegue
  if (poblacionEl) {
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
        estrategiaEl.innerHTML = `<option value="">Seleccione...</option>` + estrategiasDefault.map(e => `<option>${e}</option>`).join("");
        estrategiaEl.dispatchEvent(new Event("change"));
      }
    });
  }

  if (estrategiaEl) {
    estrategiaEl.addEventListener("change", () => {
      if (poblacionEl && poblacionEl.value === "INDIRECTA") return despliegueEl.classList.add("hidden");
      const v = estrategiaEl.value;
      if (v && v.length && opcionesDespliegue[v]) {
        desplegarOpcionesDespliegue(v);
      } else {
        despliegueEl.classList.add("hidden");
        despliegueEl.innerHTML = "";
      }
    });
  }

  // dashboardBtn: inicialmente oculto si existe
  if (dashboardBtn) dashboardBtn.classList.add("hidden");

  // dashboardBtn click -> navegar a dashboard (comportamiento centralizado)
  if (dashboardBtn) {
    dashboardBtn.addEventListener("click", () => {
      const anio = anioReporteEl ? anioReporteEl.value : "";
      if (!anio) {
        alert("Seleccione un año antes de ir al Dashboard.");
        document.getElementById("anio").scrollIntoView({ behavior: "smooth" });
        return;
      }
      // mostrar dashboard y ajustar filtros
      showDashboard();
      if (filtroAnioDashboard) filtroAnioDashboard.value = anio;
      updateDashboard();
      // ocultar boton mientras estamos en dashboard
      dashboardBtn.classList.add("hidden");
      // scroll
      if (dashboardEl) dashboardEl.scrollIntoView({ behavior: "smooth" });
    });
  }
}

/* opciones despliegue */
const opcionesDespliegue = {
  "REDES COMUNITARIAS": ["RED AYUDA HUMANITARIA","RED EMPRESARIAL","RED JÓVENES","RED PIIA","RED PRODUCTORES","RED HUERTEROS"],
  "ASISTENCIA ENTES TERRITORIALES": ["CTP","COMPOS","CMJ","CDMR","CIDEA"],
  "AGRICULTURA FAMILIAR": ["HUERTAS","SISTEMAS PRODUCTIVOS"],
  "PROCESOS EMPRESARIALES": ["ZASCA","AFLORA","OTROS PROCESOS EMPRESARIALES"]
};
function desplegarOpcionesDespliegue(v) {
  if (!opcionesDespliegue[v]) {
    despliegueEl.classList.add("hidden");
    despliegueEl.innerHTML = "";
    return;
  }
  despliegueEl.classList.remove("hidden");
  despliegueEl.innerHTML = `<option value="">Seleccione...</option>` + opcionesDespliegue[v].map(o => `<option>${o}</option>`).join("");
}
// js/app2.js — Parte 3/4
/* -----------------------
   EVENTOS: selección de año (tarjeta principal)
------------------------*/
if (anioReporteEl) {
  anioReporteEl.addEventListener("change", () => {
    if (anioReporteEl.value) {
      // ocultar tarjeta de año y mostrar dashboard automáticamente
      document.getElementById("anio").classList.add("hidden");
      showDashboard();

      // si el filtro de año existe, setearlo
      if (filtroAnioDashboard) {
        const opt = Array.from(filtroAnioDashboard.options).find(o => o.value === anioReporteEl.value);
        if (opt) filtroAnioDashboard.value = anioReporteEl.value;
        else filtroAnioDashboard.value = anioReporteEl.value;
      }
      updateDashboard();
    }
  });
}

/* Escuchar cambios en segmentadores */
[filtroAnioDashboard, filtroMunicipioDashboard, filtroPoblacionDashboard, filtroSujetoDashboard].forEach(el => {
  if (!el) return;
  el.addEventListener("change", updateDashboard);
});

/* Mostrar / Ocultar vistas */
function showDashboard() {
  if (dashboardEl) dashboardEl.classList.remove("hidden");
  if (formWrap) formWrap.classList.add("hidden");
  if (totalsContainer) totalsContainer.classList.add("hidden");
  if (tableWrap) tableWrap.classList.add("hidden");
  if (sidebar) sidebar.classList.add("hidden");
  // ocultar dashboardBtn cuando estamos en dashboard
  if (dashboardBtn) dashboardBtn.classList.add("hidden");
}
function showFormForMunicipio() {
  if (dashboardEl) dashboardEl.classList.add("hidden");
  if (formWrap) formWrap.classList.remove("hidden");
  if (totalsContainer) totalsContainer.classList.remove("hidden");
  if (tableWrap) tableWrap.classList.remove("hidden");
  // mostrar dashboardBtn sólo si hay municipio seleccionado y existe el botón
  const muni = (municipioSeleccionadoEl && municipioSeleccionadoEl.textContent || "").trim();
  if (dashboardBtn) {
    if (muni) {
      dashboardBtn.classList.remove("hidden");
    } else {
      dashboardBtn.classList.add("hidden");
    }
  }
}

/* -----------------------
   CRUD: cargar registros (desde API)
------------------------*/
async function cargarRegistros() {
  try {
    const res = await apiListarRegistros();
    registros = Array.isArray(res) ? res : (res && res.data ? res.data : res) || [];

    // asegurar fechaCreacion en los items (compatibilidad)
    registros = registros.map(r => ({ ...r, fechaCreacion: r.fechaCreacion || new Date().toISOString() }));

    populateFiltersFromData();
    populateSidebarMunicipios();

    // refrescar vistas si están visibles
    if (document.getElementById("anio") && document.getElementById("anio").classList.contains("hidden")) {
      if (dashboardEl && !dashboardEl.classList.contains("hidden")) updateDashboard();
      if (formWrap && !formWrap.classList.contains("hidden")) renderTablaMunicipio();
    }
  } catch (err) {
    console.error("Error cargando registros:", err);
  }
}

/* Poblar filtros con datos unicos */
function populateFiltersFromData() {
  const años = uniqueSorted(registros.map(r => r.anio).filter(Boolean));
  if (filtroAnioDashboard) {
    filtroAnioDashboard.innerHTML = `<option value="">Todos</option>` + años.map(a => `<option value="${a}">${a}</option>`).join("");
    if (anioReporteEl && anioReporteEl.value) {
      const sel = Array.from(filtroAnioDashboard.options).find(o => o.value === anioReporteEl.value);
      if (sel) filtroAnioDashboard.value = anioReporteEl.value;
    }
  }

  const municipios = uniqueSorted(registros.map(r => r.municipio).filter(Boolean));
  if (filtroMunicipioDashboard) {
    filtroMunicipioDashboard.innerHTML = `<option value="">Todos</option>` + municipios.map(m => `<option value="${m}">${m}</option>`).join("");
  }

  const sujetos = uniqueSorted(registros.map(r => r.sujeto).filter(Boolean));
  if (filtroSujetoDashboard) {
    filtroSujetoDashboard.innerHTML = `<option value="">Todos</option>` + sujetos.map(s => `<option value="${s}">${s}</option>`).join("");
  }

  // asegurar poblacion options
  if (filtroPoblacionDashboard && !Array.from(filtroPoblacionDashboard.options).some(o => o.value === "DIRECTA")) {
    filtroPoblacionDashboard.innerHTML = `<option value="">Todos</option>
      <option value="DIRECTA">DIRECTA</option>
      <option value="INDIRECTA">INDIRECTA</option>`;
  }
}

/* Sidebar municipios (estático) */
function populateSidebarMunicipios() {
  if (municipioListSidebar) {
    municipioListSidebar.innerHTML = municipiosStatic.map(m => `<li tabindex="0">${m}</li>`).join("");
  }
}
// js/app2.js — Parte 4/4
/* -----------------------
   Dashboard: actualización completa
------------------------*/
function updateDashboard() {
  const filtroA = filtroAnioDashboard ? filtroAnioDashboard.value : "";
  const filtroM = filtroMunicipioDashboard ? filtroMunicipioDashboard.value : "";
  const filtroP = filtroPoblacionDashboard ? filtroPoblacionDashboard.value : "";
  const filtroS = filtroSujetoDashboard ? filtroSujetoDashboard.value : "";


  // ----- Actualizar títulos de Directa / Indirecta según sujeto seleccionado -----
  if (kpiTituloDirecta && kpiTituloIndirecta) {
    if (!filtroS) {
      kpiTituloDirecta.textContent = "N° Sujeto de intervención Directo";
      kpiTituloIndirecta.textContent = "N° Sujeto de intervención Indirecto";
    } else {
      kpiTituloDirecta.textContent = `N° - ${filtroS} Directo`;
      kpiTituloIndirecta.textContent = `N° - ${filtroS} Indirecto`;
    }
  }

  // base = registros filtrados por año/municipio/poblacion (NO filtramos por sujeto aún)
  let base = registros.slice();
  if (filtroA) base = base.filter(r => String(r.anio) === String(filtroA));
  if (filtroM) base = base.filter(r => r.municipio === filtroM);
  if (filtroP) base = base.filter(r => r.poblacion === filtroP);

  // KPI dinámico
  let valorSujeto = 0;
  if (!filtroS) {
    // sumar todas las cantidades (sin importar sujeto)
    valorSujeto = base.reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);
    if (kpiTituloSujeto) kpiTituloSujeto.textContent = "N° Sujeto de intervención";
  } else {
    // sumar solo del sujeto seleccionado (respetando año/municipio/poblacion)
    valorSujeto = base.filter(r => r.sujeto === filtroS).reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);
    if (kpiTituloSujeto) kpiTituloSujeto.textContent = `N° - ${filtroS}`;
  }
  if (kpiValorSujeto) kpiValorSujeto.textContent = formatNumber(valorSujeto);

  // Actualizar el TH de la tabla (dinámico)
  (function actualizarTituloSujetoTabla(sujetoSeleccionado) {
    const th = document.getElementById("thSujetoTabla");
    if (!th) return;
    if (sujetoSeleccionado) {
      th.textContent = `N° - ${sujetoSeleccionado}`;
    } else {
      th.textContent = "N° SUJETO DE INTERVENCIÓN";
    }
  })(filtroS);

  // Otros KPIs (Directa / Indirecta / Registros) respetan todos los filtros (incluido sujeto)
  const totalDirecta = registros.filter(r => {
    if (filtroA && String(r.anio) !== String(filtroA)) return false;
    if (filtroM && r.municipio !== filtroM) return false;
    if (filtroP && r.poblacion !== filtroP) return false;
    if (filtroS && r.sujeto !== filtroS) return false;
    return (r.poblacion || "").toUpperCase() === "DIRECTA";
  }).reduce((a, r) => a + Number(r.cantidad || 0), 0);

  const totalIndirecta = registros.filter(r => {
    if (filtroA && String(r.anio) !== String(filtroA)) return false;
    if (filtroM && r.municipio !== filtroM) return false;
    if (filtroP && r.poblacion !== filtroP) return false;
    if (filtroS && r.sujeto !== filtroS) return false;
    return (r.poblacion || "").toUpperCase() === "INDIRECTA";
  }).reduce((a, r) => a + Number(r.cantidad || 0), 0);

  const totalRegistros = registros.filter(r => {
    if (filtroA && String(r.anio) !== String(filtroA)) return false;
    if (filtroM && r.municipio !== filtroM) return false;
    if (filtroP && r.poblacion !== filtroP) return false;
    if (filtroS && r.sujeto !== filtroS) return false;
    return true;
  }).length;

  if (kpiDirecta) kpiDirecta.textContent = formatNumber(totalDirecta);
  if (kpiIndirecta) kpiIndirecta.textContent = formatNumber(totalIndirecta);
  if (kpiRegistros) kpiRegistros.textContent = formatNumber(totalRegistros);

  // Charts: aplicar todos los filtros (incluido sujeto)
  const chartsData = filtroS ? base.filter(r => r.sujeto === filtroS) : base;

  // --- Render charts ---
  renderChartEstrategias(chartsData);
  renderChartPoblacion(chartsData);
  renderChartSujetos(chartsData);

  // Tabla estrategia vs sujeto (usa base; si hay sujeto, la función la filtrará)
  renderTablaEstrategiaSujeto(base, filtroS);
}

/* -----------------------
   Render charts (Chart.js)
------------------------*/
function ensureChartHeights() {
  try {
    if (chartEstrategiasCtx && chartEstrategiasCtx.parentElement) chartEstrategiasCtx.parentElement.style.height = "320px";
    if (chartPoblacionCtx && chartPoblacionCtx.parentElement) chartPoblacionCtx.parentElement.style.height = "320px";
    if (chartSujetosCtx && chartSujetosCtx.parentElement) chartSujetosCtx.parentElement.style.height = "340px";
  } catch (e) { /* ignore */ }
}

function renderChartEstrategias(data) {
  ensureChartHeights();
  // Agrupar por estrategia sumando cantidades (N° sujetos de intervención por estrategia)
  const grouped = data.reduce((acc, r) => {
    const k = r.estrategia || "SIN ESTRATEGIA";
    acc[k] = (acc[k] || 0) + (Number(r.cantidad) || 0);
    return acc;
  }, {});
  const labels = Object.keys(grouped);
  const values = Object.values(grouped);

  if (chartEstrategia) chartEstrategia.destroy();
  if (chartEstrategiasCtx) {
    chartEstrategia = new Chart(chartEstrategiasCtx, {
      type: 'bar', // BARRAS VERTICALES
      data: {
        labels,
        datasets: [{
          label: 'N° sujetos',
          data: values,
          backgroundColor: labels.map(()=> 'rgba(180,0,0,0.7)')
        }]
      },
      options: {
        indexAxis: 'y',  // HORIZONTAL
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 },
            grid: { display: true }
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        },
        // un poco de padding para que las etiquetas no choquen con el contenedor
        layout: { padding: { top: 8, right: 8, bottom: 16, left: 8 } }
      }
    });
  }
}

function renderChartPoblacion(data) {
  ensureChartHeights();
  const directa = data.filter(r => (r.poblacion || "").toUpperCase() === "DIRECTA").reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);
  const indirecta = data.filter(r => (r.poblacion || "").toUpperCase() === "INDIRECTA").reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);

  if (chartPoblacion) chartPoblacion.destroy();
  if (chartPoblacionCtx) {
    chartPoblacion = new Chart(chartPoblacionCtx, {
      type: 'doughnut',
      data: { labels: ['Directa','Indirecta'], datasets: [{ data: [directa, indirecta], backgroundColor: ['rgba(180,0,0,0.8)','rgba(120,120,120,0.6)'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
  }
}

function renderChartSujetos(data) {
  ensureChartHeights();
  const grouped = data.reduce((acc, r) => {
    const k = r.sujeto || "SIN SUJETO";
    acc[k] = (acc[k] || 0) + (Number(r.cantidad) || 0);
    return acc;
  }, {});
  const labels = Object.keys(grouped);
  const values = Object.values(grouped);

  if (chartSujetos) chartSujetos.destroy();
  if (chartSujetosCtx) {
    chartSujetos = new Chart(chartSujetosCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Cantidad',
          data: values,
          backgroundColor: labels.map(()=> 'rgba(100,100,100,0.6)')
        }]
      },
      options: {
        indexAxis: 'y',  // HORIZONTAL
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { autoSkip: false } },
          y: { ticks: { autoSkip: false } }
        }
      }
    });
  }
}

/* -----------------------
   TABLA Estrategia vs Sujeto
   ahora incluye porcentaje dinámico en relación al total según filtros
------------------------*/
function renderTablaEstrategiaSujeto(data, filtroSujeto) {
  if (!tablaEstrategiaSujeto) return;

  // calcular totales por estrategia (respeta filtroSujeto si se pasó)
  const estrategiasUnicas = Array.from(new Set([...estrategiasDefault, ...data.map(r=>r.estrategia).filter(Boolean)]));

  const filas = estrategiasUnicas.map(es => {
    const suma = data
      .filter(r => (r.estrategia || '') === es)
      .filter(r => filtroSujeto ? ((r.sujeto || '') === filtroSujeto) : true)
      .reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);
    return { estrategia: es, total: suma };
  });

  // total general (para porcentajes) — depende de los mismos filtros aplicados
  const totalGeneral = filas.reduce((acc, f) => acc + f.total, 0);

  tablaEstrategiaSujeto.innerHTML = filas.map(f => {
    const pct = totalGeneral > 0 ? ((f.total / totalGeneral) * 100).toFixed(1) : "0.0";
    // Mostrar número + porcentaje entre paréntesis, sin cambiar la cabecera (más compatible)
    return `
      <tr>
        <td>${f.estrategia}</td>
        <td style="text-align:right;font-weight:700">
          ${formatNumber(f.total)} <span style="font-weight:400;color:#666;margin-left:8px">(${pct}%)</span>
        </td>
      </tr>
    `;
  }).join("");
}

/* -----------------------
   Selección municipio (sidebar)
------------------------*/
function seleccionarMunicipio(nombre) {
  if (municipioSeleccionadoEl) municipioSeleccionadoEl.textContent = nombre;
  // Mostrar botón Dashboard cuando seleccionamos municipio (si existe)
  if (dashboardBtn) dashboardBtn.classList.remove("hidden");
  showFormForMunicipio();
  renderTablaMunicipio();
}

/* Render tabla de registros para municipio (form view) */
function renderTablaMunicipio() {
  const muni = (municipioSeleccionadoEl.textContent || '').trim();
  if (!tablaBody) return;
  tablaBody.innerHTML = "";

  if (!muni) {
    // si no hay municipio seleccionado, ocultar dashboardBtn
    if (dashboardBtn) dashboardBtn.classList.add("hidden");
    return;
  }

  const filtrados = registros.filter(r => (r.municipio || '') === muni);

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
        <button class="btn-delete" data-id="${reg._id}">Eliminar</button>
      </td>
    `;
    tablaBody.appendChild(tr);
  });

  tablaBody.querySelectorAll(".btn-edit").forEach(b => b.addEventListener("click", onEditar));
  tablaBody.querySelectorAll(".btn-delete").forEach(b => b.addEventListener("click", onEliminar));

  // Totales para PERSONAS PARTICIPANTES (form view)
  const totalPersonas = filtrados.filter(r => (r.sujeto || '').toUpperCase() === "PERSONAS PARTICIPANTES").reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);
  const directa = filtrados.filter(r => (r.sujeto || '').toUpperCase() === "PERSONAS PARTICIPANTES" && (r.poblacion || '').toUpperCase() === "DIRECTA").reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);
  const indirecta = filtrados.filter(r => (r.sujeto || '').toUpperCase() === "PERSONAS PARTICIPANTES" && (r.poblacion || '').toUpperCase() === "INDIRECTA").reduce((acc, r) => acc + (Number(r.cantidad) || 0), 0);

  if (totalAcumuladoEl) totalAcumuladoEl.textContent = formatNumber(totalPersonas);
  if (totalDirectaPersonasEl) totalDirectaPersonasEl.textContent = formatNumber(directa);
  if (totalIndirectaPersonasEl) totalIndirectaPersonasEl.textContent = formatNumber(indirecta);
}

/* -----------------------
   Editar/Eliminar/Guardar
------------------------*/
function onEditar(e) {
  const id = e.currentTarget.dataset.id;
  const reg = registros.find(r => r._id === id);
  if (!reg) return;

  if (municipioSeleccionadoEl) municipioSeleccionadoEl.textContent = reg.municipio || "";
  if (poblacionEl) poblacionEl.value = reg.poblacion || "";
  poblacionEl && poblacionEl.dispatchEvent(new Event("change"));

  if (estrategiaEl) estrategiaEl.value = reg.estrategia || "";
  estrategiaEl && estrategiaEl.dispatchEvent(new Event("change"));

  if (reg.despliegue && despliegueEl) despliegueEl.value = reg.despliegue;
  if (sujetoEl) sujetoEl.value = reg.sujeto || "";
  if (cantidadEl) cantidadEl.value = reg.cantidad || "";
  if (observacionesEl) observacionesEl.value = reg.observaciones || "";
  if (anioReporteEl) anioReporteEl.value = reg.anio || "";

  editId = id;
  if (cancelarEdicionBtn) cancelarEdicionBtn.classList.remove("hidden");
  showFormForMunicipio();
}

async function onEliminar(e) {
  if (!confirm("¿Eliminar este registro?")) return;
  const id = e.currentTarget.dataset.id;
  try {
    await apiEliminarRegistro(id);
    await cargarRegistros();
    if (formWrap && !formWrap.classList.contains("hidden")) renderTablaMunicipio();
  } catch (err) {
    console.error("Error eliminando:", err);
    alert("Error al eliminar registro.");
  }
}

/* Guardar registro (form) */
if (guardarBtn) {
  guardarBtn.addEventListener("click", async () => {
    const registro = {
      anio: anioReporteEl ? anioReporteEl.value : "",
      municipio: municipioSeleccionadoEl ? municipioSeleccionadoEl.textContent : "",
      poblacion: poblacionEl ? poblacionEl.value : "",
      sujeto: sujetoEl ? sujetoEl.value : "",
      estrategia: estrategiaEl ? estrategiaEl.value : "",
      despliegue: (poblacionEl && poblacionEl.value === "INDIRECTA") ? "-" :
                 (despliegueEl && despliegueEl.classList.contains("hidden") ? "-" : (despliegueEl ? despliegueEl.value : "-")),
      cantidad: cantidadEl ? Number(cantidadEl.value) : 0,
      observaciones: observacionesEl ? observacionesEl.value : ""
    };

    if (!registro.anio || !registro.municipio || !registro.poblacion || !registro.sujeto || !registro.estrategia || !registro.cantidad) {
      return alert("Por favor completa todos los campos obligatorios.");
    }

    try {
      if (editId) {
        await apiEditarRegistro(editId, registro);
        editId = null;
        if (cancelarEdicionBtn) cancelarEdicionBtn.classList.add("hidden");
      } else {
        await apiGuardarRegistro(registro);
      }
      await cargarRegistros();
      limpiarFormulario();
      if (formWrap && !formWrap.classList.contains("hidden")) renderTablaMunicipio();
    } catch (err) {
      console.error("Error guardando registro:", err);
      alert("Error al guardar.");
    }
  });
}

/* Cancelar edicion */
if (cancelarEdicionBtn) {
  cancelarEdicionBtn.addEventListener("click", () => {
    editId = null;
    limpiarFormulario();
    cancelarEdicionBtn.classList.add("hidden");
  });
}

function limpiarFormulario() {
  if (poblacionEl) poblacionEl.value = "";
  if (estrategiaEl) estrategiaEl.value = "";
  if (despliegueEl) { despliegueEl.innerHTML = ""; despliegueEl.classList.add("hidden"); }
  if (sujetoEl) sujetoEl.value = "";
  if (cantidadEl) cantidadEl.value = "";
  if (observacionesEl) observacionesEl.value = "";
}

/* -----------------------
   Inicializar todo
------------------------*/
initUI();
cargarRegistros();

/* Exponer función seleccionarMunicipio globalmente */
window.seleccionarMunicipio = seleccionarMunicipio;
