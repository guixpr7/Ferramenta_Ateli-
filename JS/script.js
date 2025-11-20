/* ===========================================================
   CONFIGURAÇÕES DO SISTEMA
=========================================================== */
const PHONE = "5599999999999";
const PLANILHA_API_URL = "https://script.google.com/macros/s/AKfycbzaAs_5qnX_I_axXnU9zTw8mIIinUl66ShD6LFLIakVB4meFuP_VvOIUww0ilyU9Tn2hQ/exec"; // <-- coloque aqui a URL do seu Apps Script (web app)
const HOURS = ["09:00","10:30","11:30","13:00","14:30","15:30","16:30"];
const ADMIN_PASSWORD = "aurora123";

/* ===========================================================
   LOCALSTORAGE — RESERVAS
=========================================================== */
function loadBooked() {
  try { return JSON.parse(localStorage.getItem("atelier_booked") || "{}"); }
  catch (e) { return {}; }
}
function saveBooked(obj) {
  localStorage.setItem("atelier_booked", JSON.stringify(obj));
}

/* ===========================================================
   UTILIDADES DE DATA
=========================================================== */
function formatKey(dateObj, hour) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}_${hour}`;
}
function formatDateBR(dateObj) {
  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
}
function isDayFullyBooked(dateObj) {
  const booked = loadBooked();
  return HOURS.every(h => booked[formatKey(dateObj, h)]);
}

/* ===========================================================
   SELECTORS
=========================================================== */
const calendarContainer = document.getElementById("calendarContainer");
const hoursPanel = document.getElementById("hoursPanel");
const hoursList = document.getElementById("hoursList");
const selectedDayTitle = document.getElementById("selectedDayTitle");
const modalRoot = document.getElementById("bookingModal");
const modalTitle = document.getElementById("modalTitle");

/* ===========================================================
   CALENDÁRIO
=========================================================== */
function generateCalendars() {
  if (!calendarContainer) return;
  const today = new Date();
  const month1 = new Date(today.getFullYear(), today.getMonth(), 1);
  const month2 = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  calendarContainer.innerHTML = "";
  calendarContainer.appendChild(createCalendarBox(month1));
  calendarContainer.appendChild(createCalendarBox(month2));
}
function createCalendarBox(dateObj) {
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();
  const box = document.createElement("div");
  box.className = "calendar-box";
  const monthName = dateObj.toLocaleString("pt-BR", { month: "long" });
  box.innerHTML = `<h3>${monthName.toUpperCase()} ${year}</h3>`;
  const grid = document.createElement("div");
  grid.className = "calendar-grid";
  const daysCount = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysCount; d++) {
    const day = new Date(year, month, d);
    const weekday = day.getDay();
    if (weekday >= 1 && weekday <= 5) {
      const btn = document.createElement("button");
      btn.className = "day-btn";
      btn.textContent = d;
      const fullBooked = isDayFullyBooked(day);
      if (fullBooked) {
        btn.classList.add("booked");
        btn.onclick = () => {};
      } else {
        btn.onclick = () => openHoursPanel(day);
      }
      grid.appendChild(btn);
    }
  }
  box.appendChild(grid);
  return box;
}

/* ===========================================================
   HORÁRIOS
=========================================================== */
function openHoursPanel(dateObj) {
  const dateBR = formatDateBR(dateObj);
  selectedDayTitle.textContent = `Horários do dia ${dateBR}`;
  hoursList.innerHTML = "";
  const booked = loadBooked();
  HOURS.forEach(h => {
    const btn = document.createElement("button");
    btn.className = "hour-btn";
    btn.textContent = h;
    const key = formatKey(dateObj, h);
    const isBooked = Boolean(booked[key]);
    if (isBooked) {
      btn.classList.add("booked");
      btn.onclick = () => {};
    } else {
      btn.onclick = () => openBookingModal(dateObj, h);
    }
    hoursList.appendChild(btn);
  });
  hoursPanel.style.display = "block";
}
function closeHoursPanel() {
  if (hoursPanel) hoursPanel.style.display = "none";
}

/* ===========================================================
   UTIL - submit via hidden form+iframe (evita CORS/preflight)
   Usa campos simples (form-urlencoded) — compatível com Apps Script
=========================================================== */
function submitToSheetViaForm(payload) {
  // envia em background via form+iframe (não bloqueia UI, evita CORS)
  return new Promise((resolve, reject) => {
    if (!PLANILHA_API_URL || PLANILHA_API_URL.indexOf("script.google.com") === -1) {
      console.warn("PLANILHA_API_URL não configurada corretamente.");
      reject(new Error("API URL inválida"));
      return;
    }

    let iframe = document.getElementById("gsheet_hidden_iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.name = "gsheet_hidden_iframe";
      iframe.id = "gsheet_hidden_iframe";
      document.body.appendChild(iframe);
    }

    const form = document.createElement("form");
    form.action = PLANILHA_API_URL;
    form.method = "POST";
    form.target = iframe.name;
    form.style.display = "none";
    form.enctype = "application/x-www-form-urlencoded";

    for (const key in payload) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = payload[key];
      form.appendChild(input);
    }

    document.body.appendChild(form);
    try {
      form.submit();
    } catch (e) {
      console.warn("Erro ao submeter o form:", e);
    }

    // remover form (não podemos ler resposta do iframe por segurança)
    setTimeout(() => {
      try { form.remove(); } catch (e) {}
      resolve({ status: "OK", method: "form" });
    }, 900);
  });
}

/* ===========================================================
   MODAL - RESERVA
=========================================================== */
function openBookingModal(dateObj, hour) {
  const key = formatKey(dateObj, hour);
  const booked = loadBooked()[key];
  if (booked) { alert("Este horário já está reservado e não pode ser alterado."); return; }

  modalRoot.style.display = "flex";
  modalRoot.setAttribute("aria-hidden", "false");
  const dateBR = formatDateBR(dateObj);
  modalTitle.textContent = `Reserva — ${dateBR} às ${hour}`;

  // limpa inputs (com checagem)
  if (document.getElementById("mname")) document.getElementById("mname").value = "";
  if (document.getElementById("mphone")) document.getElementById("mphone").value = "";
  if (document.getElementById("mmsg")) document.getElementById("mmsg").value = "";

  if (document.getElementById("closeBtn")) document.getElementById("closeBtn").onclick = () => closeModal();

  if (document.getElementById("localBtn")) {
    document.getElementById("localBtn").onclick = () => {
      const all = loadBooked();
      all[key] = {
        name: document.getElementById("mname").value.trim() || "—",
        phone: document.getElementById("mphone").value.trim() || "—",
        msg: document.getElementById("mmsg").value.trim() || "",
        hour,
        date: dateBR,
        created: Date.now()
      };
      saveBooked(all);
      alert("Reserva salva localmente!");
      closeModal();
      generateCalendars();
      openHoursPanel(dateObj);
    };
  }

  if (document.getElementById("confirmBtn")) {
    document.getElementById("confirmBtn").onclick = () => {
      // pegando valores
      const name = (document.getElementById("mname") && document.getElementById("mname").value.trim()) || "—";
      const phone = (document.getElementById("mphone") && document.getElementById("mphone").value.trim()) || "—";
      const msg = (document.getElementById("mmsg") && document.getElementById("mmsg").value.trim()) || "";

      const payload = {
        nome: name,
        telefone: phone,
        horario: hour,
        data: dateBR,
        observacoes: msg
      };

      // --------------- ENVIO PARA PLANILHA (FIRE-AND-FORGET via form) ---------------
      // não aguardamos aqui: enviamos em background e atualizamos UI imediatamente
      submitToSheetViaForm(payload).catch(e => {
        console.warn("Envio para planilha falhou (background):", e);
        // NOTA: mesmo que falhe, já salvamos localmente para não perder a reserva
      });

      // --------------- SALVA LOCALMENTE E ATUALIZA UI IMEDIATAMENTE ---------------
      const all = loadBooked();
      all[formatKey(dateObj, hour)] = { name, phone, msg, hour, date: dateBR, created: Date.now() };
      saveBooked(all);

      // abre whatsapp com resumo
      const text = encodeURIComponent(
        `Reserva • Ateliê Aurora\nNome: ${name}\nTelefone: ${phone}\nData: ${dateBR}\nHorário: ${hour}\nObs: ${msg}`
      );
      window.open(`https://wa.me/${PHONE}?text=${text}`, "_blank");

      // fecha modal e atualiza calendários (rápido)
      closeModal();
      generateCalendars();
      openHoursPanel(dateObj);
    };
  }
}

function closeModal() {
  modalRoot.style.display = "none";
  modalRoot.setAttribute("aria-hidden", "true");
}

/* ===========================================================
   PAINEL ADMINISTRATIVO
   (mantenho suas funções — não alterei a lógica)
=========================================================== */
function adminLogin() {
  const pass = document.getElementById("adminPass").value.trim();
  if (pass === ADMIN_PASSWORD) {
    document.getElementById("adminLogin").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    adminLoadMonths();
  } else {
    alert("Senha incorreta.");
  }
}
function adminLoadMonths() {
  const sel = document.getElementById("adminMonth");
  sel.innerHTML = "";
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const opt = document.createElement("option");
    opt.value = `${d.getFullYear()}-${d.getMonth()}`;
    opt.textContent = d.toLocaleString("pt-BR", { month: "long", year: "numeric" });
    sel.appendChild(opt);
  }
  sel.onchange = adminLoadDays;
  adminLoadDays();
}
function adminLoadDays() {
  const selMonth = document.getElementById("adminMonth").value;
  const selDay = document.getElementById("adminDay");
  selDay.innerHTML = "";
  const [y, m] = selMonth.split("-").map(Number);
  const days = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const dateObj = new Date(y, m, d);
    if (dateObj.getDay() >= 1 && dateObj.getDay() <= 5) {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      selDay.appendChild(opt);
    }
  }
  adminLoadHours();
}
function adminLoadHours() {
  const selHour = document.getElementById("adminHour");
  selHour.innerHTML = "";
  HOURS.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = h;
    const [y, m] = document.getElementById("adminMonth").value.split("-").map(Number);
    const d = Number(document.getElementById("adminDay").value);
    const key = formatKey(new Date(y, m, d), h);
    if (!loadBooked()[key]) opt.style.color = "green";
    else opt.style.color = "red";
    selHour.appendChild(opt);
  });
}
function adminFreeSelected() {
  const selHours = Array.from(document.getElementById("adminHour").selectedOptions).map(o => o.value);
  if (selHours.length === 0) { alert("Selecione pelo menos 1 horário."); return; }
  const [y, m] = document.getElementById("adminMonth").value.split("-").map(Number);
  const d = Number(document.getElementById("adminDay").value);
  const all = loadBooked();
  selHours.forEach(h => { const key = formatKey(new Date(y, m, d), h); delete all[key]; });
  saveBooked(all);
  document.getElementById("adminStatus").textContent = "Horários liberados!";
  adminLoadHours();
  generateCalendars();
}
function adminFreeAll() {
  if (!confirm("Liberar TODOS os horários deste dia?")) return;
  const [y, m] = document.getElementById("adminMonth").value.split("-").map(Number);
  const d = Number(document.getElementById("adminDay").value);
  const all = loadBooked();
  HOURS.forEach(h => { const key = formatKey(new Date(y, m, d), h); delete all[key]; });
  saveBooked(all);
  document.getElementById("adminStatus").textContent = "Dia totalmente liberado!";
  adminLoadHours();
  generateCalendars();
}

/* ===========================================================
   INICIALIZAÇÃO
=========================================================== */
generateCalendars();





fetch("https://script.google.com/macros/s/AKfycbzaAs_5qnX_I_axXnU9zTw8mIIinUl66ShD6LFLIakVB4meFuP_VvOIUww0ilyU9Tn2hQ/exec", {
  method: "POST",
  mode: "no-cors",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    date: dataSelecionada,
    time: horarioSelecionado,
    name: nomeCliente,
    phone: telefoneCliente,
    obs: observacoesCliente
  })
})
.then(() => {
  console.log("Enviado para a planilha!");
})
.catch(err => console.error("Erro:", err));