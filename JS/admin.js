/* ===========================================================
    CONFIGURAÇÃO
=========================================================== */
const ADMIN_PASSWORD = "1230";  // <<< TROQUE AQUI SUA SENHA
const HOURS = ["09:00","10:30","11:30","13:00","14:30","15:30","16:30"];

/* ===========================================================
    LOGIN
=========================================================== */
document.getElementById("loginBtn").onclick = () => {
  const pass = document.getElementById("adminPass").value;

  if (pass === ADMIN_PASSWORD) {
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
  } else {
    alert("Senha incorreta!");
  }
};

/* ===========================================================
    LOCAL STORAGE
=========================================================== */
function loadBooked() {
  try { return JSON.parse(localStorage.getItem("atelier_booked") || "{}"); }
  catch { return {}; }
}

function saveBooked(obj) {
  localStorage.setItem("atelier_booked", JSON.stringify(obj));
}

/* ===========================================================
    MONTAR LISTA DE HORÁRIOS
=========================================================== */
document.getElementById("adminDate").onchange = () => {
  buildHourButtons();
};

function buildHourButtons() {
  const container = document.getElementById("hourList");
  container.innerHTML = "";

  const date = document.getElementById("adminDate").value;
  if (!date) return;

  HOURS.forEach(h => {
    const btn = document.createElement("button");
    btn.textContent = h;
    btn.onclick = () => clearSingleHour(date, h);
    container.appendChild(btn);
  });
}

/* ===========================================================
    LIBERAR HORÁRIO ESPECÍFICO
=========================================================== */
function clearSingleHour(date, hour) {
  const all = loadBooked();
  const key = `${date}_${hour}`;

  if (all[key]) {
    delete all[key];
    saveBooked(all);
    alert(`Horário ${hour} liberado!`);
  } else {
    alert("Este horário já estava livre.");
  }
}

/* ===========================================================
    LIBERAR TODOS OS HORÁRIOS DO DIA
=========================================================== */
document.getElementById("clearDayBtn").onclick = () => {
  const date = document.getElementById("adminDate").value;
  if (!date) return alert("Selecione uma data!");

  const all = loadBooked();

  HOURS.forEach(h => {
    const k = `${date}_${h}`;
    delete all[k];
  });

  saveBooked(all);
  alert("Todos os horários deste dia foram liberados!");
};

/* ===========================================================
    APAGAR TODAS AS RESERVAS
=========================================================== */
document.getElementById("clearAllBtn").onclick = () => {
  if (!confirm("Tem certeza que deseja APAGAR TODAS as reservas?")) return;

  localStorage.removeItem("atelier_booked");
  alert("Todas as reservas foram apagadas!");
};

/* ===========================================================
    LOGOUT
=========================================================== */
document.getElementById("logoutBtn").onclick = () => {
  location.reload();
};












// --- INTEGRAÇÃO GOOGLE SHEETS ADMIN (Adicione ao final do arquivo) ---
const SHEET_URL_ADMIN = "https://script.google.com/macros/s/AKfycbx4w5LENd7A7OO_ODK2zA3Tbh3Tvyl-Ptd2pmNuOo9k9-0nsmvymOyyzJXNw5zj_u4zKA/exec";

function removerDaPlanilha(dataAgendamento, horarioAgendamento) {
    
    const payload = {
        action: "cancelar",
        data: dataAgendamento,     // Ex: "03/11/2025" tem que ser IGUAL ao que foi salvo
        horario: horarioAgendamento // Ex: "09:00"
    };

    fetch(SHEET_URL_ADMIN, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log("Pedido de cancelamento enviado.");
        alert("Agendamento removido da planilha com sucesso!");
    })
    .catch(error => console.error("Erro ao remover da planilha:", error));
}