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










// 👉 CONFIGURAÇÃO SUPABASE
const SUPABASE_URL = "https://dwnrfbferkeeuovqalys.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bnJmYmZlcmtlZXVvdnFhbHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTE3MTgsImV4cCI6MjA3OTA2NzcxOH0.TA4s0cTByFcOExYVzK69F-9S-li-1fokOVdCtdVTCCk";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 👉 CARREGAR AGENDAMENTOS
async function carregar() {
    const { data } = await supabase
        .from("agendamentos")
        .select("*")
        .order("dia", { ascending: true });

    const lista = document.getElementById("lista");
    lista.innerHTML = "";

    data.forEach(item => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${item.nome}</td>
            <td>${item.telefone}</td>
            <td>${item.dia}</td>
            <td>${item.hora}</td>
            <td>
                <button onclick="remover(${item.id})">Excluir</button>
            </td>
        `;

        lista.appendChild(tr);
    });
}

carregar();

// 👉 REMOVER HORÁRIO
async function remover(id) {
    await supabase.from("agendamentos").delete().eq("id", id);
    carregar();
}
