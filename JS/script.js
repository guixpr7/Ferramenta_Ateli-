/* ===========================================================
   CONFIGURAÇÕES DO SISTEMA
=========================================================== */
const PHONE = "5599999999999";
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
   MODAL - RESERVA (SEM ENVIO À PLANILHA)
=========================================================== */
function openBookingModal(dateObj, hour) {
  const key = formatKey(dateObj, hour);
  const booked = loadBooked()[key];
  if (booked) { alert("Este horário já está reservado."); return; }

  modalRoot.style.display = "flex";
  modalRoot.setAttribute("aria-hidden", "false");
  const dateBR = formatDateBR(dateObj);
  modalTitle.textContent = `Reserva — ${dateBR} às ${hour}`;

  // limpa inputs
  document.getElementById("mname").value = "";
  document.getElementById("mphone").value = "";
  document.getElementById("mmsg").value = "";

  document.getElementById("closeBtn").onclick = () => closeModal();

  document.getElementById("confirmBtn").onclick = () => {
    const name = document.getElementById("mname").value.trim() || "—";
    const phone = document.getElementById("mphone").value.trim() || "—";
    const msg = document.getElementById("mmsg").value.trim() || "";

    // salva LOCAL
    const all = loadBooked();
    all[key] = { name, phone, msg, hour, date: dateBR, created: Date.now() };
    saveBooked(all);

    // WhatsApp
    const text = encodeURIComponent(
      `Reserva • Ateliê Aurora\nNome: ${name}\nTelefone: ${phone}\nData: ${dateBR}\nHorário: ${hour}\nObs: ${msg}`
    );
    window.open(`https://wa.me/${PHONE}?text=${text}`, "_blank");

    closeModal();
    generateCalendars();
    openHoursPanel(dateObj);
  };
}

function closeModal() {
  modalRoot.style.display = "none";
  modalRoot.setAttribute("aria-hidden", "true");
}

/* ===========================================================
   PAINEL ADMINISTRATIVO (inalterado)
=========================================================== */
function adminLogin() {
  const pass = document.getElementById("adminPass").value.trim();
  if (pass === ADMIN_PASSWORD) {
    document.getElementById("adminLogin").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    adminLoadMonths();
  } else alert("Senha incorreta.");
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



async function salvarAgendamento(dados) {
    const { error } = await supabase
        .from("agendamentos")
        .insert([{
            nome: dados.nome,
            telefone: dados.telefone,
            data: dados.data,
            horario: dados.horario,
            status: "ocupado"
        }]);

    if (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar agendamento!");
        return false;
    }

    return true;
}







// 👉 CONFIGURAÇÃO SUPABASE
const SUPABASE_URL = "https://dwnrfbferkeeuovqalys.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bnJmYmZlcmtlZXVvdnFhbHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTE3MTgsImV4cCI6MjA3OTA2NzcxOH0.TA4s0cTByFcOExYVzK69F-9S-li-1fokOVdCtdVTCCk";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 👉 FORMULÁRIO
document.getElementById("form-agendar").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value;
    const telefone = document.getElementById("telefone").value;
    const dia = document.getElementById("dia").value;
    const hora = document.getElementById("hora").value;

    const { error } = await supabase
        .from("agendamentos")
        .insert([{ nome, telefone, dia, hora }]);

    const msg = document.getElementById("msg");
    if (error) {
        msg.textContent = "Erro ao agendar!";
        msg.style.color = "red";
    } else {
        msg.textContent = "Agendamento concluído!";
        msg.style.color = "green";
    }
});
