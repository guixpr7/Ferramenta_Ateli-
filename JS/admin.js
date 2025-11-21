/* ===========================================================
    CONFIGURAÇÃO
=========================================================== */
const ADMIN_PASSWORD = "1230";  // <<< TROQUE AQUI SUA SENHA
const HOURS = ["09:00","10:30","11:30","13:00","14:30","15:30","16:30"];

// URL DA SUA PLANILHA (Verifique se é a mesma do script.js)
const SHEET_URL_ADMIN = "https://script.google.com/macros/s/AKfycbx4w5LENd7A7OO_ODK2zA3Tbh3Tvyl-Ptd2pmNuOo9k9-0nsmvymOyyzJXNw5zj_u4zKA/exec";

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

  // OBS: O Admin usa data YYYY-MM-DD nos inputs, mas no LocalStorage
  // a chave pode estar diferente dependendo de como foi salva.
  // Vamos focar em apagar da PLANILHA usando a data formatada BR.

  // 1. Apaga do LocalStorage (Site)
  if (all[key]) {
    delete all[key];
    saveBooked(all);
  } 
  // (Mesmo que não tenha no LocalStorage, tentamos apagar da planilha por garantia)
  
  // 2. Apaga da Planilha Google
  const dataFormatada = formatarDataBR(date); // Converte 2025-11-03 para 03/11/2025
  removerDaPlanilha(dataFormatada, hour);
}

/* ===========================================================
    LIBERAR TODOS OS HORÁRIOS DO DIA
=========================================================== */
document.getElementById("clearDayBtn").onclick = () => {
  const date = document.getElementById("adminDate").value;
  if (!date) return alert("Selecione uma data!");

  const all = loadBooked();
  const dataFormatada = formatarDataBR(date);

  HOURS.forEach(h => {
    // 1. Apaga do LocalStorage
    const k = `${date}_${h}`;
    delete all[k];

    // 2. Apaga da Planilha (chama para cada horário)
    removerDaPlanilha(dataFormatada, h);
  });

  saveBooked(all);
  alert(`Todos os horários de ${dataFormatada} foram liberados e removidos da planilha!`);
};

/* ===========================================================
    APAGAR TODAS AS RESERVAS (Cuidado: Isso limpa só o site)
=========================================================== */
document.getElementById("clearAllBtn").onclick = () => {
  if (!confirm("Tem certeza que deseja APAGAR TODAS as reservas do SITE?\n(Isso não limpa a planilha inteira, apenas o site visualmente)")) return;

  localStorage.removeItem("atelier_booked");
  alert("Todas as reservas locais foram apagadas!");
};

/* ===========================================================
    LOGOUT
=========================================================== */
document.getElementById("logoutBtn").onclick = () => {
  location.reload();
};


/* ===========================================================
    FUNÇÕES AUXILIARES E INTEGRAÇÃO
=========================================================== */

// Converte "2025-11-03" (Input HTML) para "03/11/2025" (Planilha)
function formatarDataBR(dataISO) {
    if (!dataISO) return "";
    const partes = dataISO.split("-"); // [2025, 11, 03]
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function removerDaPlanilha(dataAgendamento, horarioAgendamento) {
    const payload = {
        action: "cancelar",
        data: dataAgendamento,     
        horario: horarioAgendamento 
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
        console.log(`Solicitação de cancelamento enviada: ${dataAgendamento} - ${horarioAgendamento}`);
    })
    .catch(error => console.error("Erro ao remover da planilha:", error));
}