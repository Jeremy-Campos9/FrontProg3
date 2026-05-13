// SACR – Lógica de interfaz completa
document.addEventListener("DOMContentLoaded", () => {

  /* ══════════════════════════════════════════
     1. Sidebar: resaltar enlace activo
  ══════════════════════════════════════════ */
  const path = window.location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll(".sidebar .nav-link").forEach(a => {
    const href = a.getAttribute("href");
    if (href && href.endsWith(path)) a.classList.add("active");
  });

  /* ══════════════════════════════════════════
     1b. Cerrar sesión: doble verificación
  ══════════════════════════════════════════ */
  document.querySelectorAll("a.nav-link").forEach(a => {
    const href = a.getAttribute("href") || "";
    if (!/login\.html$/i.test(href)) return;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const ok1 = confirm("¿Deseas cerrar sesión?");
      if (!ok1) return;
      const ok2 = confirm("Confirmación final: ¿Cerrar sesión ahora?");
      if (!ok2) return;
      window.location.href = href;
    });
  });

  /* ══════════════════════════════════════════
     2. Helpers de modal
  ══════════════════════════════════════════ */
  function openModal(sel) {
    const m = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (m) m.classList.add("show");
  }
  function closeModal(sel) {
    const m = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (m) m.classList.remove("show");
  }

  function downloadFile({ filename, mime, content }) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Exportación simple compatible con Excel (HTML + .xls)
  function exportToExcel({ filename, sheets }) {
    const safeSheets = (sheets || []).filter(Boolean);
    const body = safeSheets.map(s => `
      <table border="1">
        <tr><th colspan="${Math.max(1, (s.headers || []).length)}" style="text-align:left">${String(s.name || "Hoja").replaceAll("<", "&lt;")}</th></tr>
        ${(s.headers || []).length ? `<tr>${s.headers.map(h => `<th>${String(h).replaceAll("<", "&lt;")}</th>`).join("")}</tr>` : ""}
        ${(s.rows || []).map(r => `<tr>${(r || []).map(v => `<td>${String(v ?? "").replaceAll("<", "&lt;")}</td>`).join("")}</tr>`).join("")}
      </table>
      <br />
    `).join("\n");

    const html = `<!DOCTYPE html>
      <html><head><meta charset="UTF-8"></head><body>${body}</body></html>`;
    downloadFile({
      filename,
      mime: "application/vnd.ms-excel;charset=utf-8",
      content: html,
    });
  }

  function parseMoney(str) {
    if (typeof str !== "string") return 0;
    const cleaned = str.replace(/[^0-9.,-]/g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMoneyUSD(n) {
    const v = Number(n);
    const safe = Number.isFinite(v) ? v : 0;
    return `$ ${safe.toFixed(2)}`;
  }

  function ddmmyyyyToISO(ddmmyyyy) {
    if (!ddmmyyyy) return "";
    const m = String(ddmmyyyy).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return "";
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  function isoToDDMMYYYY(iso) {
    if (!iso) return "";
    const m = String(iso).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "";
    const [, yyyy, mm, dd] = m;
    return `${dd}/${mm}/${yyyy}`;
  }

  // Cerrar al hacer clic fuera o en [data-close]
  document.querySelectorAll(".modal").forEach(m => {
    m.addEventListener("click", e => {
      if (e.target === m || e.target.hasAttribute("data-close")) closeModal(m);
    });
  });

  /* ══════════════════════════════════════════
     3. PÁGINA CLIENTES
  ══════════════════════════════════════════ */
  const tablaClientes = document.querySelector("#tablaClientes");
  if (tablaClientes) {

    let clientes = [
      { id: 1, nombres: "Lucía",  apellidos: "Fernández", tipoDoc: "DNI",       numDoc: "71234567",   nacionalidad: "Peruana",   fechaNac: "1990-05-12", correo: "lucia@mail.com",    contacto: "987654321",        registro: "02/03/2026" },
      { id: 2, nombres: "James",  apellidos: "Carter",    tipoDoc: "PASAPORTE", numDoc: "X1234567",   nacionalidad: "EE.UU.",    fechaNac: "1985-03-20", correo: "jcarter@mail.com",  contacto: "+1 555 0199",      registro: "10/03/2026" },
      { id: 3, nombres: "Marta",  apellidos: "Ríos",      tipoDoc: "DNI",       numDoc: "40998877",   nacionalidad: "Peruana",   fechaNac: "1992-11-08", correo: "marta.r@mail.com",  contacto: "998877665",        registro: "15/03/2026" },
      { id: 4, nombres: "Pedro",  apellidos: "Núñez",     tipoDoc: "CE",        numDoc: "002233445",  nacionalidad: "Argentina", fechaNac: "1978-07-30", correo: "pnunez@mail.com",   contacto: "+54 11 5555 0123", registro: "20/03/2026" },
    ];
    let clienteEditandoId = null;

    function renderClientes(lista) {
      const tbody = tablaClientes.querySelector("tbody");
      if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:2rem">No se encontraron clientes.</td></tr>`;
        return;
      }
      tbody.innerHTML = lista.map(c => `
        <tr data-id="${c.id}">
          <td>${c.id}</td>
          <td>${c.nombres} ${c.apellidos}</td>
          <td>${c.tipoDoc}</td>
          <td>${c.numDoc}</td>
          <td>${c.nacionalidad}</td>
          <td>${c.correo}</td>
          <td>${c.contacto}</td>
          <td>${c.registro}</td>
          <td class="actions">
            <button class="btn btn-sm btn-reservas-cliente">Reservas</button>
            <button class="btn btn-sm btn-editar-cliente">Editar</button>
          </td>
        </tr>
      `).join("");

      tbody.querySelectorAll(".btn-editar-cliente").forEach(btn => {
        btn.addEventListener("click", () => {
          abrirEdicionCliente(+btn.closest("tr").dataset.id);
        });
      });

      tbody.querySelectorAll(".btn-reservas-cliente").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = +btn.closest("tr").dataset.id;
          const c = clientes.find(x => x.id === id);
          if (!c) return;
          const q = encodeURIComponent(`${c.nombres} ${c.apellidos}`);
          window.location.href = `reservas.html?cliente=${q}`;
        });
      });
    }

    function abrirEdicionCliente(id) {
      const c = clientes.find(x => x.id === id);
      if (!c) return;
      clienteEditandoId = id;
      const modal = document.querySelector("#modalCliente");
      modal.querySelector("#cl-nombres").value      = c.nombres;
      modal.querySelector("#cl-apellidos").value    = c.apellidos;
      modal.querySelector("#cl-tipoDoc").value      = c.tipoDoc;
      modal.querySelector("#cl-numDoc").value       = c.numDoc;
      modal.querySelector("#cl-nacionalidad").value = c.nacionalidad;
      modal.querySelector("#cl-fechaNac").value     = c.fechaNac;
      modal.querySelector("#cl-correo").value       = c.correo;
      modal.querySelector("#cl-contacto").value     = c.contacto;
      modal.querySelector("#cl-titulo").textContent = "Editar cliente";
      openModal("#modalCliente");
    }

    document.querySelector("#btnNuevoCliente").addEventListener("click", () => {
      clienteEditandoId = null;
      const modal = document.querySelector("#modalCliente");
      modal.querySelectorAll("input").forEach(i => i.value = "");
      modal.querySelector("#cl-tipoDoc").value = "DNI";
      modal.querySelector("#cl-titulo").textContent = "Nuevo cliente";
      openModal("#modalCliente");
    });

    document.querySelector("#btnGuardarCliente").addEventListener("click", () => {
      const modal = document.querySelector("#modalCliente");
      const datos = {
        nombres:      modal.querySelector("#cl-nombres").value.trim(),
        apellidos:    modal.querySelector("#cl-apellidos").value.trim(),
        tipoDoc:      modal.querySelector("#cl-tipoDoc").value,
        numDoc:       modal.querySelector("#cl-numDoc").value.trim(),
        nacionalidad: modal.querySelector("#cl-nacionalidad").value.trim(),
        fechaNac:     modal.querySelector("#cl-fechaNac").value,
        correo:       modal.querySelector("#cl-correo").value.trim(),
        contacto:     modal.querySelector("#cl-contacto").value.trim(),
      };
      if (!datos.nombres || !datos.apellidos || !datos.numDoc) {
        alert("Completa los campos obligatorios: Nombres, Apellidos y N° de documento.");
        return;
      }
      if (clienteEditandoId !== null) {
        const idx = clientes.findIndex(x => x.id === clienteEditandoId);
        clientes[idx] = { ...clientes[idx], ...datos };
      } else {
        const nuevoId = clientes.length ? Math.max(...clientes.map(x => x.id)) + 1 : 1;
        const hoy = new Date();
        const registro = `${String(hoy.getDate()).padStart(2,"0")}/${String(hoy.getMonth()+1).padStart(2,"0")}/${hoy.getFullYear()}`;
        clientes.push({ id: nuevoId, registro, ...datos });
      }
      renderClientes(filtrarClientes());
      closeModal("#modalCliente");
    });

    function filtrarClientes() {
      const q = (document.querySelector("#buscarCliente")?.value || "").toLowerCase();
      if (!q) return clientes;
      return clientes.filter(c =>
        `${c.nombres} ${c.apellidos}`.toLowerCase().includes(q) ||
        c.numDoc.toLowerCase().includes(q) ||
        c.correo.toLowerCase().includes(q) ||
        c.contacto.toLowerCase().includes(q) ||
        c.nacionalidad.toLowerCase().includes(q)
      );
    }

    document.querySelector("#buscarCliente")?.addEventListener("input", () => {
      renderClientes(filtrarClientes());
    });

    renderClientes(clientes);
  }

  /* ══════════════════════════════════════════
     4. PÁGINA USUARIOS
  ══════════════════════════════════════════ */
  const tablaUsuarios = document.querySelector("#tablaUsuarios");
  if (tablaUsuarios) {

    let usuarios = [
      { id: 1, nombres: "María",  apellidos: "Alarcón", tipoDoc: "DNI", numDoc: "71234567",  correo: "m.alarcon@sacr.pe", telefono: "987000001", tipo: "Administrador", estado: "Activo"   },
      { id: 2, nombres: "Carlos", apellidos: "Rojas",   tipoDoc: "DNI", numDoc: "40987654",  correo: "c.rojas@sacr.pe",   telefono: "987000002", tipo: "Analista",       estado: "Activo"   },
      { id: 3, nombres: "Lucía",  apellidos: "Vega",    tipoDoc: "DNI", numDoc: "44556677",  correo: "l.vega@sacr.pe",    telefono: "987000003", tipo: "Operador",       estado: "Activo"   },
      { id: 4, nombres: "Diego",  apellidos: "Mendoza", tipoDoc: "CE",  numDoc: "002233445", correo: "d.mendoza@sacr.pe", telefono: "987000004", tipo: "Operador",       estado: "Inactivo" },
    ];
    let usuarioEditandoId = null;

    function renderUsuarios(lista) {
      const tbody = tablaUsuarios.querySelector("tbody");
      if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">No se encontraron usuarios.</td></tr>`;
        return;
      }
      tbody.innerHTML = lista.map((u, idx) => `
        <tr data-id="${u.id}">
          <td>${idx + 1}</td>
          <td>${u.nombres} ${u.apellidos}</td>
          <td>${u.tipoDoc}</td>
          <td>${u.numDoc}</td>
          <td>${u.correo}</td>
          <td>${u.tipo}</td>
          <td><span class="badge ${u.estado === 'Activo' ? 'activo' : 'inactivo'}">${u.estado}</span></td>
          <td class="actions">
            <button class="btn btn-sm btn-editar-usuario">Editar</button>
            <button class="btn btn-sm btn-danger btn-eliminar-usuario">Eliminar</button>
          </td>
        </tr>
      `).join("");

      tbody.querySelectorAll(".btn-editar-usuario").forEach(btn => {
        btn.addEventListener("click", () => {
          abrirEdicionUsuario(+btn.closest("tr").dataset.id);
        });
      });

      tbody.querySelectorAll(".btn-eliminar-usuario").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = +btn.closest("tr").dataset.id;
          const u = usuarios.find(x => x.id === id);
          if (confirm(`¿Eliminar a ${u.nombres} ${u.apellidos}? Esta acción no se puede deshacer.`)) {
            usuarios = usuarios.filter(x => x.id !== id);
            renderUsuarios(filtrarUsuarios());
          }
        });
      });
    }

    function abrirEdicionUsuario(id) {
      const u = usuarios.find(x => x.id === id);
      if (!u) return;
      usuarioEditandoId = id;
      const modal = document.querySelector("#modalUsuario");
      modal.querySelector("#us-nombres").value   = u.nombres;
      modal.querySelector("#us-apellidos").value = u.apellidos;
      modal.querySelector("#us-tipoDoc").value   = u.tipoDoc;
      modal.querySelector("#us-numDoc").value    = u.numDoc;
      modal.querySelector("#us-correo").value    = u.correo;
      modal.querySelector("#us-telefono").value  = u.telefono;
      modal.querySelector("#us-tipo").value      = u.tipo;
      modal.querySelector("#us-estado").value    = u.estado;
      modal.querySelector("#us-titulo").textContent = "Editar usuario";
      openModal("#modalUsuario");
    }

    document.querySelector("#btnNuevoUsuario").addEventListener("click", () => {
      usuarioEditandoId = null;
      const modal = document.querySelector("#modalUsuario");
      modal.querySelectorAll("input").forEach(i => i.value = "");
      modal.querySelector("#us-tipoDoc").value = "DNI";
      modal.querySelector("#us-tipo").value    = "Operador";
      modal.querySelector("#us-estado").value  = "Activo";
      modal.querySelector("#us-titulo").textContent = "Nuevo usuario";
      openModal("#modalUsuario");
    });

    document.querySelector("#btnGuardarUsuario").addEventListener("click", () => {
      const modal = document.querySelector("#modalUsuario");
      const datos = {
        nombres:   modal.querySelector("#us-nombres").value.trim(),
        apellidos: modal.querySelector("#us-apellidos").value.trim(),
        tipoDoc:   modal.querySelector("#us-tipoDoc").value,
        numDoc:    modal.querySelector("#us-numDoc").value.trim(),
        correo:    modal.querySelector("#us-correo").value.trim(),
        telefono:  modal.querySelector("#us-telefono").value.trim(),
        tipo:      modal.querySelector("#us-tipo").value,
        estado:    modal.querySelector("#us-estado").value,
      };
      if (!datos.nombres || !datos.apellidos || !datos.correo) {
        alert("Completa los campos obligatorios: Nombres, Apellidos y Correo.");
        return;
      }
      if (usuarioEditandoId !== null) {
        const idx = usuarios.findIndex(x => x.id === usuarioEditandoId);
        usuarios[idx] = { ...usuarios[idx], ...datos };
      } else {
        const nuevoId = usuarios.length ? Math.max(...usuarios.map(x => x.id)) + 1 : 1;
        usuarios.push({ id: nuevoId, ...datos });
      }
      renderUsuarios(filtrarUsuarios());
      closeModal("#modalUsuario");
    });

    function filtrarUsuarios() {
      const q    = (document.querySelector("#buscarUsuario")?.value || "").toLowerCase();
      const tipo = document.querySelector("#filtroTipoUsuario")?.value || "Todos los tipos";
      return usuarios.filter(u => {
        const matchQ = !q ||
          `${u.nombres} ${u.apellidos}`.toLowerCase().includes(q) ||
          u.correo.toLowerCase().includes(q) ||
          u.numDoc.toLowerCase().includes(q);
        const matchTipo = tipo === "Todos los tipos" || u.tipo === tipo;
        return matchQ && matchTipo;
      });
    }

    document.querySelector("#buscarUsuario")?.addEventListener("input", () => {
      renderUsuarios(filtrarUsuarios());
    });

    document.querySelector("#filtroTipoUsuario")?.addEventListener("change", () => {
      renderUsuarios(filtrarUsuarios());
    });

    renderUsuarios(usuarios);
  }

  /* ══════════════════════════════════════════
     5c. DASHBOARD (KPIs coherentes con tabla)
  ══════════════════════════════════════════ */
  const dashKpiReservas = document.querySelector("#dashKpiReservas");
  const dashKpiVentas = document.querySelector("#dashKpiVentas");
  const dashKpiReclPend = document.querySelector("#dashKpiReclamosPend");
  const dashKpiInc = document.querySelector("#dashKpiIncidencias");
  if (dashKpiReservas && dashKpiVentas && dashKpiReclPend && dashKpiInc) {
    const ultimasReservasTable = document.querySelector(".card table.table");
    const rows = Array.from(ultimasReservasTable?.querySelectorAll("tbody tr") || []);
    const reservasCount = rows.length;
    const ventasTotal = rows.reduce((sum, tr) => {
      const montoTxt = tr.children[4]?.textContent?.trim() || "";
      return sum + parseMoney(montoTxt);
    }, 0);

    // En dashboard no hay tabla de reclamos, pero sí el bloque "Reclamos por estado".
    const pend = Number(document.querySelector("#dashReclPend")?.textContent || 0);
    const atn = Number(document.querySelector("#dashReclAtn")?.textContent || 0);
    const proc = Number(document.querySelector("#dashReclProc")?.textContent || 0);
    const noProc = Number(document.querySelector("#dashReclNoProc")?.textContent || 0);
    const reclamosTotal = pend + atn + proc + noProc;

    dashKpiReservas.textContent = String(reservasCount);
    dashKpiVentas.textContent = formatMoneyUSD(ventasTotal);
    dashKpiReclPend.textContent = String(pend);

    const incid = reservasCount > 0 ? Math.round((pend / reservasCount) * 100) : 0;
    dashKpiInc.textContent = `${incid}%`;
  }

  /* ══════════════════════════════════════════
     5. REPORTE DE VENTAS (Exportar solo Excel)
  ══════════════════════════════════════════ */
  const btnExportarVentasExcel = document.querySelector("#btnExportarVentasExcel");
  if (btnExportarVentasExcel) {
    function extractTableData(table) {
      if (!table) return { headers: [], rows: [] };
      const headers = Array.from(table.querySelectorAll("thead th")).map(th => th.textContent.trim());
      const rows = Array.from(table.querySelectorAll("tbody tr")).map(tr =>
        Array.from(tr.children).map(td => td.textContent.trim())
      );
      return { headers, rows };
    }

    function getCardTitleForTable(table) {
      return table?.closest(".card")?.querySelector(".card-header h3")?.textContent?.trim() || "";
    }

    btnExportarVentasExcel.addEventListener("click", () => {
      const tables = Array.from(document.querySelectorAll(".page table.table"));
      const detalleTable = tables.find(t => /detalle/i.test(getCardTitleForTable(t))) || tables[tables.length - 1];
      const topServiciosTable = tables.find(t => /top\s+servicios/i.test(getCardTitleForTable(t)));

      const detalle = extractTableData(detalleTable);
      const topServicios = extractTableData(topServiciosTable);

      // Si la tabla no trae thead, aplicamos headers básicos
      const topHeaders = (topServicios.headers && topServicios.headers.length) ? topServicios.headers : ["Servicio", "Monto"];
      const detalleHeaders = (detalle.headers && detalle.headers.length) ? detalle.headers : ["Reserva", "Cliente", "Servicio", "Fecha", "Pax", "Monto"];

      exportToExcel({
        filename: `reporte-ventas-${new Date().toISOString().slice(0, 10)}.xls`,
        sheets: [
          { name: "Detalle", headers: detalleHeaders, rows: detalle.rows },
          ...(topServiciosTable ? [{ name: "Top servicios", headers: topHeaders, rows: topServicios.rows }] : []),
        ],
      });
    });
  }

  /* ══════════════════════════════════════════
     5b. AUDITORÍA (Filtros de fecha + búsqueda)
  ══════════════════════════════════════════ */
  const audBuscar = document.querySelector("#audBuscar");
  const audFechaInicio = document.querySelector("#audFechaInicio");
  const audFechaFin = document.querySelector("#audFechaFin");
  const auditoriaTable = audBuscar ? document.querySelector(".page table.table") : null;
  if (auditoriaTable && audBuscar && audFechaInicio && audFechaFin) {
    const tbody = auditoriaTable.querySelector("tbody");
    const allRows = Array.from(tbody.querySelectorAll("tr"));

    function parseAuditDateTime(text) {
      const m = String(text || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
      if (!m) return null;
      const [, dd, mm, yyyy, hh, mi] = m;
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi), 0, 0);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    function isoDateStart(iso) {
      if (!iso) return null;
      const d = new Date(`${iso}T00:00:00`);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    function isoDateEnd(iso) {
      if (!iso) return null;
      const d = new Date(`${iso}T23:59:59.999`);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    function ensureNoResultsRow(show) {
      const existing = tbody.querySelector("tr[data-no-results='true']");
      if (show) {
        if (existing) return;
        const tr = document.createElement("tr");
        tr.dataset.noResults = "true";
        tr.innerHTML = `<td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No se encontraron registros.</td>`;
        tbody.appendChild(tr);
      } else {
        existing?.remove();
      }
    }

    function applyAuditFilters() {
      const q = audBuscar.value.trim().toLowerCase();
      const start = isoDateStart(audFechaInicio.value);
      const end = isoDateEnd(audFechaFin.value);

      let visibleCount = 0;
      allRows.forEach(tr => {
        // Estructura: #, Fecha, Usuario, Comando, Descripción, Ubicación
        const fechaTxt = tr.children[1]?.textContent?.trim() || "";
        const fecha = parseAuditDateTime(fechaTxt);

        const matchText = !q || tr.textContent.toLowerCase().includes(q);
        let matchDate = true;
        if ((start || end)) {
          if (!fecha) matchDate = false;
          if (start && fecha && fecha < start) matchDate = false;
          if (end && fecha && fecha > end) matchDate = false;
        }

        const show = matchText && matchDate;
        tr.style.display = show ? "" : "none";
        if (show) visibleCount += 1;
      });

      ensureNoResultsRow(visibleCount === 0);
    }

    [audBuscar, audFechaInicio, audFechaFin].forEach(el => {
      el.addEventListener("input", applyAuditFilters);
      el.addEventListener("change", applyAuditFilters);
    });
  }

  /* ══════════════════════════════════════════
     6. PÁGINA RESERVAS (Ver / Modificar)
  ══════════════════════════════════════════ */
  const tablaReservas = document.querySelector("#tablaReservas");
  if (tablaReservas) {
    const modal = document.querySelector("#modalReserva");
    const btnNuevaReserva = document.querySelector("#btnNuevaReserva");
    const btnGuardar = document.querySelector("#btnGuardarReserva");

    const $codigo = modal.querySelector("#res-codigo");
    const $servicio = modal.querySelector("#res-servicio");
    const $cliente = modal.querySelector("#res-cliente");
    const $pax = modal.querySelector("#res-pax");
    const $fecha = modal.querySelector("#res-fecha");
    const $monto = modal.querySelector("#res-monto");
    const $estado = modal.querySelector("#res-estado");
    const $titulo = modal.querySelector("#res-titulo");

    let modoReserva = "ver"; // ver | editar | nuevo
    let reservaEditandoCodigo = null;

    function getReservaFromRow(tr) {
      const tds = tr.querySelectorAll("td");
      const codigo = tds[0]?.textContent.trim() || "";
      const cliente = tds[1]?.textContent.trim() || "";
      const servicio = tds[2]?.textContent.trim() || "";
      const fechaServicio = tds[3]?.textContent.trim() || "";
      const pax = Number(tds[4]?.textContent.trim() || 0);
      const monto = parseMoney(tds[5]?.textContent.trim() || "");
      const estadoTxt = tr.querySelector(".badge")?.textContent.trim() || "";

      let estado = "PENDIENTE";
      if (/confirm/i.test(estadoTxt)) estado = "CONFIRMADA";
      else if (/anulad/i.test(estadoTxt)) estado = "ANULADA";

      return {
        codigo,
        cliente,
        servicio,
        fechaServicio,
        pax: Number.isFinite(pax) ? pax : 0,
        monto,
        estado,
      };
    }

    let reservas = Array.from(tablaReservas.querySelectorAll("tbody tr")).map(getReservaFromRow);

    const resBuscar = document.querySelector("#resBuscar");
    const resFiltroEstado = document.querySelector("#resFiltroEstado");
    const resFiltroFecha = document.querySelector("#resFiltroFecha");
    const resKpiTotal = document.querySelector("#resKpiTotal");
    const resKpiConfirmadas = document.querySelector("#resKpiConfirmadas");
    const resKpiPendientes = document.querySelector("#resKpiPendientes");
    const resKpiAnuladas = document.querySelector("#resKpiAnuladas");

    function badgeClassForEstado(estado) {
      if (estado === "CONFIRMADA") return "confirmada";
      if (estado === "ANULADA") return "anulada";
      return "pendiente";
    }

    function labelForEstado(estado) {
      if (estado === "CONFIRMADA") return "Confirmada";
      if (estado === "ANULADA") return "Anulada";
      return "Pendiente";
    }

    function computeKpisFromList(list) {
      const total = list.length;
      const confirmadas = list.filter(r => r.estado === "CONFIRMADA").length;
      const anuladas = list.filter(r => r.estado === "ANULADA").length;
      const pendientes = total - confirmadas - anuladas;
      if (resKpiTotal) resKpiTotal.textContent = String(total);
      if (resKpiConfirmadas) resKpiConfirmadas.textContent = String(confirmadas);
      if (resKpiPendientes) resKpiPendientes.textContent = String(pendientes);
      if (resKpiAnuladas) resKpiAnuladas.textContent = String(anuladas);
    }

    function getReservasFiltradas() {
      const q = (resBuscar?.value || "").trim().toLowerCase();
      const estadoSel = resFiltroEstado?.value || "Todos los estados";
      const fechaIso = resFiltroFecha?.value || "";

      return reservas.filter(r => {
        const matchQ = !q ||
          r.codigo.toLowerCase().includes(q) ||
          r.cliente.toLowerCase().includes(q) ||
          r.servicio.toLowerCase().includes(q);

        const matchEstado = estadoSel === "Todos los estados" || r.estado === estadoSel;

        const matchFecha = !fechaIso || ddmmyyyyToISO(r.fechaServicio) === fechaIso;

        return matchQ && matchEstado && matchFecha;
      });
    }

    function renderReservas(list) {
      const tbody = tablaReservas.querySelector("tbody");
      tbody.innerHTML = list.map(r => {
        const badgeClass = badgeClassForEstado(r.estado);
        const estadoLabel = labelForEstado(r.estado);
        const acciones = r.estado === "ANULADA"
          ? `<button class="btn btn-sm btn-ver-reserva" data-open="#modalReserva">Ver</button>`
          : `
            <button class="btn btn-sm btn-ver-reserva" data-open="#modalReserva">Ver</button>
            <button class="btn btn-sm btn-modificar-reserva">Modificar</button>
            <button class="btn btn-sm btn-danger btn-anular-reserva">Anular</button>
          `;

        return `
          <tr data-codigo="${r.codigo}">
            <td><b>${r.codigo}</b></td>
            <td>${r.cliente}</td>
            <td>${r.servicio}</td>
            <td>${r.fechaServicio}</td>
            <td>${r.pax}</td>
            <td>${formatMoneyUSD(r.monto)}</td>
            <td><span class="badge ${badgeClass}">${estadoLabel}</span></td>
            <td class="actions">${acciones}</td>
          </tr>
        `;
      }).join("");

      computeKpisFromList(list);
    }

    function setReservaFormDisabled(disabled) {
      [$codigo, $servicio, $cliente, $pax, $fecha, $monto, $estado].forEach(el => {
        if (!el) return;
        el.disabled = disabled;
      });
      if (btnGuardar) btnGuardar.style.display = disabled ? "none" : "";
    }

    function fillReservaForm(r) {
      $codigo.value = r.codigo || "";
      $servicio.value = r.servicio || $servicio.value;
      $cliente.value = r.cliente || "";
      $pax.value = r.pax ?? "";
      $fecha.value = ddmmyyyyToISO(r.fechaServicio);
      $monto.value = r.monto ?? "";
      $estado.value = r.estado || "PENDIENTE";
    }

    function resetReservaForm() {
      $codigo.value = "";
      $cliente.value = "";
      $pax.value = "";
      $fecha.value = "";
      $monto.value = "";
      $estado.value = "CONFIRMADA";
    }

    function openReservaModal({ modo, codigo }) {
      modoReserva = modo;
      reservaEditandoCodigo = codigo || null;

      if (modo === "nuevo") {
        $titulo.textContent = "Nueva reserva";
        resetReservaForm();
        setReservaFormDisabled(false);
        openModal(modal);
        return;
      }

      const r = reservas.find(x => x.codigo === codigo);
      if (!r) return;
      fillReservaForm(r);
      if (modo === "ver") {
        $titulo.textContent = "Detalle de reserva";
        setReservaFormDisabled(true);
      } else {
        $titulo.textContent = "Modificar reserva";
        setReservaFormDisabled(false);
        $codigo.disabled = true; // el código es la llave
      }
      openModal(modal);
    }

    btnNuevaReserva?.addEventListener("click", (e) => {
      // Evita el handler genérico data-open para poder configurar modo
      e.stopImmediatePropagation();
      openReservaModal({ modo: "nuevo" });
    });

    tablaReservas.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const tr = btn.closest("tr");
      const codigo = tr?.dataset.codigo || tr?.querySelector("td")?.textContent.trim();
      if (!codigo) return;

      if (btn.classList.contains("btn-ver-reserva")) {
        e.stopImmediatePropagation();
        openReservaModal({ modo: "ver", codigo });
      }
      if (btn.classList.contains("btn-modificar-reserva")) {
        openReservaModal({ modo: "editar", codigo });
      }
      if (btn.classList.contains("btn-anular-reserva")) {
        if (confirm(`¿Anular la reserva ${codigo}?`)) {
          reservas = reservas.map(r => r.codigo === codigo ? { ...r, estado: "ANULADA" } : r);
          renderReservas(getReservasFiltradas());
        }
      }
    });

    btnGuardar?.addEventListener("click", () => {
      const datos = {
        codigo: $codigo.value.trim(),
        servicio: $servicio.value,
        cliente: $cliente.value.trim(),
        pax: Number($pax.value || 0),
        fechaServicio: isoToDDMMYYYY($fecha.value),
        monto: Number($monto.value || 0),
        estado: $estado.value,
      };

      if (!datos.codigo || !datos.cliente) {
        alert("Completa los campos obligatorios: Código y Cliente.");
        return;
      }
      if (!Number.isFinite(datos.pax) || datos.pax <= 0) {
        alert("Pax debe ser un número mayor a 0.");
        return;
      }

      if (modoReserva === "nuevo") {
        if (reservas.some(r => r.codigo === datos.codigo)) {
          alert("Ya existe una reserva con ese código.");
          return;
        }
        reservas = [datos, ...reservas];
      } else if (modoReserva === "editar" && reservaEditandoCodigo) {
        reservas = reservas.map(r => r.codigo === reservaEditandoCodigo ? { ...r, ...datos, codigo: r.codigo } : r);
      }

      renderReservas(getReservasFiltradas());
      closeModal(modal);
    });

    // Pre-filtro desde Clientes
    const params = new URLSearchParams(window.location.search);
    const clienteFromQuery = params.get("cliente");
    if (clienteFromQuery && resBuscar) resBuscar.value = clienteFromQuery;

    [resBuscar, resFiltroEstado, resFiltroFecha].forEach(el => {
      if (!el) return;
      el.addEventListener("input", () => renderReservas(getReservasFiltradas()));
      el.addEventListener("change", () => renderReservas(getReservasFiltradas()));
    });

    renderReservas(getReservasFiltradas());
  }

  /* ══════════════════════════════════════════
     7. PÁGINA SERVICIOS (Editar / Eliminar)
  ══════════════════════════════════════════ */
  const listaServicios = document.querySelector("#listaServicios");
  if (listaServicios) {
    const modal = document.querySelector("#modalServicio");
    const btnNuevo = document.querySelector("#btnNuevoServicio");
    const btnGuardar = document.querySelector("#btnGuardarServicio");
    const $titulo = modal.querySelector("#sv-titulo");
    const $nombre = modal.querySelector("#sv-nombre");
    const $descripcion = modal.querySelector("#sv-descripcion");
    const $precio = modal.querySelector("#sv-precio");
    const $duracion = modal.querySelector("#sv-duracion");
    const $capacidad = modal.querySelector("#sv-capacidad");
    const $idioma = modal.querySelector("#sv-idioma");
    const $ciudad = modal.querySelector("#sv-ciudad");
    const $recojo = modal.querySelector("#sv-recojo");

    let servicioEditandoId = null;

    function parseServicioFromCard(card, id) {
      const nombre = card.querySelector("h3")?.textContent.trim() || "";
      const precioTxt = card.querySelector(".badge")?.textContent.trim() || "";
      const precio = parseMoney(precioTxt);
      const descripcion = card.querySelector("p")?.textContent.trim() || "";
      const chips = Array.from(card.querySelectorAll("div[style*='flex-wrap'] span")).map(s => s.textContent.trim());
      const ciudad = (chips.find(x => x.startsWith("📍")) || "").replace("📍", "").trim();
      const duracion = Number(((chips.find(x => x.includes("h")) || "").replace(/[^0-9.]/g, "")) || 0);
      const capacidad = Number(((chips.find(x => x.includes("pax")) || "").replace(/[^0-9]/g, "")) || 0);
      const idioma = (chips.find(x => x.startsWith("🗣")) || "").replace("🗣", "").trim();
      return {
        id,
        nombre,
        descripcion,
        precio,
        duracion,
        capacidad,
        idioma,
        ciudad,
        recojo: "Sí",
      };
    }

    let servicios = Array.from(listaServicios.querySelectorAll(":scope > .card")).map((card, idx) => parseServicioFromCard(card, idx + 1));

    function renderServicios() {
      listaServicios.innerHTML = servicios.map(s => `
        <div class="card" data-id="${s.id}">
          <div style="height:120px;background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:10px 10px 0 0;display:grid;place-items:center;color:white;font-size:2rem">🧭</div>
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:.5rem"><h3 style="margin:0">${s.nombre}</h3><span class="badge activo">$ ${Number(s.precio || 0).toFixed(0)}</span></div>
            <p style="color:var(--text-muted);font-size:.85rem;margin:.5rem 0">${s.descripcion}</p>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;font-size:.78rem;color:var(--text-muted);margin-bottom:.75rem"><span>📍 ${s.ciudad || ""}</span><span>⏱ ${Number(s.duracion || 0)} h</span><span>👥 ${Number(s.capacidad || 0)} pax</span><span>🗣 ${s.idioma || ""}</span></div>
            <div style="display:flex;gap:.4rem">
              <button class="btn btn-sm btn-editar-servicio" data-open="#modalServicio">Editar</button>
              <button class="btn btn-sm btn-danger btn-eliminar-servicio">Eliminar</button>
            </div>
          </div>
        </div>
      `).join("");
    }

    function resetServicioForm() {
      $nombre.value = "";
      $descripcion.value = "";
      $precio.value = "";
      $duracion.value = "";
      $capacidad.value = "";
      $idioma.value = "";
      $ciudad.value = "";
      $recojo.value = "Sí";
    }

    function fillServicioForm(s) {
      $nombre.value = s.nombre || "";
      $descripcion.value = s.descripcion || "";
      $precio.value = s.precio ?? "";
      $duracion.value = s.duracion ?? "";
      $capacidad.value = s.capacidad ?? "";
      $idioma.value = s.idioma || "";
      $ciudad.value = s.ciudad || "";
      $recojo.value = s.recojo || "Sí";
    }

    btnNuevo?.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      servicioEditandoId = null;
      $titulo.textContent = "Nuevo servicio";
      resetServicioForm();
      openModal(modal);
    });

    listaServicios.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const card = btn.closest(".card");
      const id = Number(card?.dataset.id || 0);
      if (!id) return;

      if (btn.classList.contains("btn-editar-servicio")) {
        e.stopImmediatePropagation();
        const s = servicios.find(x => x.id === id);
        if (!s) return;
        servicioEditandoId = id;
        $titulo.textContent = "Editar servicio";
        fillServicioForm(s);
        openModal(modal);
      }

      if (btn.classList.contains("btn-eliminar-servicio")) {
        const s = servicios.find(x => x.id === id);
        if (confirm(`¿Eliminar el servicio ${s?.nombre || ""}?`)) {
          servicios = servicios.filter(x => x.id !== id);
          renderServicios();
        }
      }
    });

    btnGuardar?.addEventListener("click", () => {
      const datos = {
        nombre: $nombre.value.trim(),
        descripcion: $descripcion.value.trim(),
        precio: Number($precio.value || 0),
        duracion: Number($duracion.value || 0),
        capacidad: Number($capacidad.value || 0),
        idioma: $idioma.value.trim(),
        ciudad: $ciudad.value.trim(),
        recojo: $recojo.value,
      };
      if (!datos.nombre) {
        alert("El nombre del servicio es obligatorio.");
        return;
      }

      if (servicioEditandoId) {
        servicios = servicios.map(s => s.id === servicioEditandoId ? { ...s, ...datos } : s);
      } else {
        const nuevoId = servicios.length ? Math.max(...servicios.map(x => x.id)) + 1 : 1;
        servicios = [{ id: nuevoId, ...datos }, ...servicios];
      }

      renderServicios();
      closeModal(modal);
    });

    renderServicios();
  }

  /* ══════════════════════════════════════════
     8. PÁGINA RECLAMOS (Atender -> Atendido)
  ══════════════════════════════════════════ */
  const tablaReclamos = document.querySelector("#tablaReclamos");
  if (tablaReclamos) {
    const modal = document.querySelector("#modalReclamo");
    const btnGuardar = document.querySelector("#btnGuardarReclamo");
    const $titulo = modal.querySelector("#rc-titulo");
    const $reserva = modal.querySelector("#rc-reserva");
    const $cliente = modal.querySelector("#rc-cliente");
    const $descripcion = modal.querySelector("#rc-descripcion");
    const $procedencia = modal.querySelector("#rc-procedencia");
    const $fechaResolucion = modal.querySelector("#rc-fechaResolucion");
    const $motivo = modal.querySelector("#rc-motivo");

    let reclamoEditandoN = null;
    let modoReclamo = "ver"; // ver | atender

    function readReclamoFromRow(tr) {
      const tds = tr.querySelectorAll("td");
      const n = Number(tds[0]?.textContent.trim() || 0);
      const reserva = tds[1]?.textContent.trim() || "";
      const cliente = tds[2]?.textContent.trim() || "";
      const fecha = tds[3]?.textContent.trim() || "";
      const descripcion = tds[4]?.textContent.trim() || "";
      const estadoTxt = tr.querySelector(".badge")?.textContent.trim() || "";
      let estado = "PENDIENTE";
      if (/atenci/i.test(estadoTxt)) estado = "EN_ATENCION";
      if (/procede/i.test(estadoTxt)) estado = "PROCEDE";
      if (/no\s*procede/i.test(estadoTxt)) estado = "NO_PROCEDE";
      if (/atendid/i.test(estadoTxt)) estado = "ATENDIDO";
      return { n, reserva, cliente, fecha, descripcion, estado, fechaResolucion: "", motivo: "", procedencia: estado };
    }

    let reclamos = Array.from(tablaReclamos.querySelectorAll("tbody tr")).map(readReclamoFromRow);

    const rcBuscar = document.querySelector("#rcBuscar");
    const rcFiltroEstado = document.querySelector("#rcFiltroEstado");
    const rcKpiPend = document.querySelector("#rcKpiPend");
    const rcKpiAtn = document.querySelector("#rcKpiAtn");
    const rcKpiProc = document.querySelector("#rcKpiProc");
    const rcKpiNoProc = document.querySelector("#rcKpiNoProc");

    function badgeForReclamoEstado(estado) {
      if (estado === "ATENDIDO") return { cls: "confirmada", label: "Atendido" };
      if (estado === "EN_ATENCION") return { cls: "atencion", label: "En atención" };
      if (estado === "PROCEDE") return { cls: "procede", label: "Procede" };
      if (estado === "NO_PROCEDE") return { cls: "no-procede", label: "No procede" };
      return { cls: "pendiente", label: "Pendiente" };
    }

    function computeReclamosKpisFromList(list) {
      const pend = list.filter(r => r.estado === "PENDIENTE").length;
      const atn = list.filter(r => r.estado === "EN_ATENCION").length;
      const proc = list.filter(r => r.estado === "PROCEDE").length;
      const noProc = list.filter(r => r.estado === "NO_PROCEDE").length;
      if (rcKpiPend) rcKpiPend.textContent = String(pend);
      if (rcKpiAtn) rcKpiAtn.textContent = String(atn);
      if (rcKpiProc) rcKpiProc.textContent = String(proc);
      if (rcKpiNoProc) rcKpiNoProc.textContent = String(noProc);
      // Guardar KPIs en localStorage para que otras páginas (ej. dashboard) puedan leerlos
      try {
        const payload = { pend, atn, proc, noProc, total: list.length };
        localStorage.setItem('sacr_reclamos_kpis', JSON.stringify(payload));
      } catch (e) {
        // silencioso si storage no está disponible
      }
    }

    function getReclamosFiltrados() {
      const q = (rcBuscar?.value || "").trim().toLowerCase();
      const estadoSel = rcFiltroEstado?.value || "Todos";
      return reclamos.filter(r => {
        const matchQ = !q ||
          r.reserva.toLowerCase().includes(q) ||
          r.cliente.toLowerCase().includes(q) ||
          r.descripcion.toLowerCase().includes(q);
        const matchEstado = estadoSel === "Todos" || r.estado === estadoSel;
        return matchQ && matchEstado;
      });
    }

    function renderReclamos(list) {
      const tbody = tablaReclamos.querySelector("tbody");
      tbody.innerHTML = list.map(r => {
        const b = badgeForReclamoEstado(r.estado);
        const actionLabel = (r.estado === "PENDIENTE" || r.estado === "EN_ATENCION") ? "Atender" : "Ver";
        return `
          <tr data-n="${r.n}">
            <td>${r.n}</td>
            <td>${r.reserva}</td>
            <td>${r.cliente}</td>
            <td>${r.fecha}</td>
            <td>${r.descripcion}</td>
            <td><span class="badge ${b.cls}">${b.label}</span></td>
            <td><button class="btn btn-sm btn-accion-reclamo" data-open="#modalReclamo">${actionLabel}</button></td>
          </tr>
        `;
      }).join("");

      computeReclamosKpisFromList(list);
    }

    function setReclamoDisabled(disabled) {
      [$reserva, $cliente, $descripcion, $procedencia, $fechaResolucion, $motivo].forEach(el => {
        if (el) el.disabled = disabled;
      });
      if (btnGuardar) btnGuardar.style.display = disabled ? "none" : "";
    }

    function fillReclamoForm(r) {
      $reserva.value = r.reserva || "";
      $cliente.value = r.cliente || "";
      $descripcion.value = r.descripcion || "";
      $procedencia.value = r.procedencia || "PENDIENTE";
      $fechaResolucion.value = r.fechaResolucion || "";
      $motivo.value = r.motivo || "";
    }

    tablaReclamos.addEventListener("click", (e) => {
      const btn = e.target.closest("button.btn-accion-reclamo");
      if (!btn) return;
      e.stopImmediatePropagation();
      const tr = btn.closest("tr");
      const n = Number(tr?.dataset.n || 0);
      const r = reclamos.find(x => x.n === n);
      if (!r) return;

      reclamoEditandoN = n;
      modoReclamo = btn.textContent.trim() === "Atender" ? "atender" : "ver";
      $titulo.textContent = modoReclamo === "atender" ? "Atender reclamo" : "Detalle de reclamo";
      fillReclamoForm(r);
      setReclamoDisabled(modoReclamo !== "atender");
      openModal(modal);
    });

    btnGuardar?.addEventListener("click", () => {
      if (!reclamoEditandoN) return;
      const datos = {
        reserva: $reserva.value.trim(),
        cliente: $cliente.value.trim(),
        descripcion: $descripcion.value.trim(),
        procedencia: $procedencia.value,
        fechaResolucion: $fechaResolucion.value,
        motivo: $motivo.value.trim(),
      };
      if (!datos.motivo) {
        alert("Ingresa el motivo de resolución.");
        return;
      }

      reclamos = reclamos.map(r => {
        if (r.n !== reclamoEditandoN) return r;
        return {
          ...r,
          ...datos,
          estado: "ATENDIDO",
        };
      });
      renderReclamos(getReclamosFiltrados());
      closeModal(modal);
    });

    [rcBuscar, rcFiltroEstado].forEach(el => {
      if (!el) return;
      el.addEventListener("input", () => renderReclamos(getReclamosFiltrados()));
      el.addEventListener("change", () => renderReclamos(getReclamosFiltrados()));
    });

    renderReclamos(getReclamosFiltrados());
  }

  /* ══════════════════════════════════════════
     9. PÁGINA NOTIFICACIONES (Marcar todas como leídas)
  ══════════════════════════════════════════ */
  const btnMarcarTodasLeidas = document.querySelector("#btnMarcarTodasLeidas");
  if (btnMarcarTodasLeidas) {
    btnMarcarTodasLeidas.addEventListener("click", () => {
      const items = document.querySelectorAll(".notif-item");
      items.forEach(it => {
        it.dataset.leida = "true";
        // Quitar resaltado de no leída (se mantiene borde/layout)
        it.style.removeProperty("background");
      });
    });
  }

  document.querySelectorAll(".btn-atender-notif").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const item = btn.closest(".notif-item");
      if (item) {
        item.dataset.leida = "true";
        item.style.removeProperty("background");
      }
      // Lleva al usuario a la gestión de reclamos
      window.location.href = "reclamos.html";
    });
  });

  /* ══════════════════════════════════════════
     9. PÁGINA REPORTE CALIDAD (Filtro de servicio)
  ══════════════════════════════════════════ */
  const filtroServicio = document.querySelector("#filtroServicio");
  const tablaCalidad = document.querySelector(".page .table");
  if (filtroServicio && tablaCalidad) {
    // Capturar datos originales de la tabla
    let datosOriginales = Array.from(tablaCalidad.querySelectorAll("tbody tr")).map(tr => {
      const celdas = tr.querySelectorAll("td");
      return {
        numero: celdas[0]?.textContent.trim() || "",
        reserva: celdas[1]?.textContent.trim() || "",
        servicio: celdas[2]?.textContent.trim() || "",
        fecha: celdas[3]?.textContent.trim() || "",
        procedenciaHTML: celdas[4]?.innerHTML || "",
        resolucion: celdas[5]?.textContent.trim() || "",
      };
    });

    function renderTablaCalidad(datos) {
      const tbody = tablaCalidad.querySelector("tbody");
      if (!datos.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No hay reclamos para el servicio seleccionado.</td></tr>`;
        return;
      }
      tbody.innerHTML = datos.map(d => `
        <tr>
          <td>${d.numero}</td>
          <td>${d.reserva}</td>
          <td>${d.servicio}</td>
          <td>${d.fecha}</td>
          <td>${d.procedenciaHTML}</td>
          <td>${d.resolucion}</td>
        </tr>
      `).join("");
    }

    filtroServicio.addEventListener("change", () => {
      const servicioSeleccionado = filtroServicio.value;
      let datosFiltrados;
      
      if (servicioSeleccionado === "") {
        datosFiltrados = datosOriginales;
      } else {
        datosFiltrados = datosOriginales.filter(d => d.servicio === servicioSeleccionado);
      }
      
      renderTablaCalidad(datosFiltrados);
    });
  }

  /* ══════════════════════════════════════════
     5. Modales genéricos (otras páginas)
  ══════════════════════════════════════════ */
  /* ══════════════════════════════════════════
     DASHBOARD: leer KPIs de reclamos desde localStorage y renderizar gráfico
  ══════════════════════════════════════════ */
  (function renderDashboardReclamosFromStorage() {
    const elPend = document.querySelector('#dashReclPend');
    const elAtn = document.querySelector('#dashReclAtn');
    const elProc = document.querySelector('#dashReclProc');
    const elNoProc = document.querySelector('#dashReclNoProc');
    const elBarPend = document.querySelector('#dashBarPend');
    const elBarAtn = document.querySelector('#dashBarAtn');
    const elBarProc = document.querySelector('#dashBarProc');
    const elBarNoProc = document.querySelector('#dashBarNoProc');

    if (!elPend && !elAtn && !elProc && !elNoProc) return; // no estamos en dashboard

    let payload = null;
    try {
      const raw = localStorage.getItem('sacr_reclamos_kpis');
      if (raw) payload = JSON.parse(raw);
    } catch (e) {
      payload = null;
    }

    // Si no hay payload, dejar 0s
    const pend = payload?.pend || 0;
    const atn = payload?.atn || 0;
    const proc = payload?.proc || 0;
    const noProc = payload?.noProc || 0;

    if (elPend) elPend.textContent = String(pend);
    if (elAtn) elAtn.textContent = String(atn);
    if (elProc) elProc.textContent = String(proc);
    if (elNoProc) elNoProc.textContent = String(noProc);

    // Renderizar barras proporcionalmente
    const max = Math.max(1, pend, atn, proc, noProc);
    if (elBarPend) elBarPend.style.height = `${Math.round((pend / max) * 100)}%`;
    if (elBarAtn) elBarAtn.style.height = `${Math.round((atn / max) * 100)}%`;
    if (elBarProc) elBarProc.style.height = `${Math.round((proc / max) * 100)}%`;
    if (elBarNoProc) elBarNoProc.style.height = `${Math.round((noProc / max) * 100)}%`;
  })();

  document.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => {
      openModal(btn.getAttribute("data-open"));
    });
  });

});
