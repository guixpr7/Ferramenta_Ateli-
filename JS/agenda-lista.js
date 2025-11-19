// --- CONFIGURAÇÃO SUPABASE ---
const supabaseUrl = "https://dwnrfbferkeeuovqalys.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bnJmYmZlcmtlZXVvdnFhbHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTE3MTgsImV4cCI6MjA3OTA2NzcxOH0.TA4s0cTByFcOExYVzK69F-9S-li-1fokOVdCtdVTCCk";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// DOM
const listaContainer = document.getElementById("lista-container");

// --- CARREGAR AGENDAMENTOS ---
async function carregarAgendamentos() {
    const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .order("data", { ascending: true })
        .order("horario", { ascending: true });

    if (error) {
        listaContainer.innerHTML = "<p>Erro ao carregar agendamentos.</p>";
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        listaContainer.innerHTML = "<p>Nenhum agendamento encontrado.</p>";
        return;
    }

    listaContainer.innerHTML = "";

    data.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
            <h3>${item.nome}</h3>
            <p><strong>Telefone:</strong> ${item.telefone}</p>
            <p><strong>Data:</strong> ${item.data}</p>
            <p><strong>Horário:</strong> ${item.horario}</p>
            <p><strong>Obs:</strong> ${item.observacao || "Nenhuma"}</p>
        `;

        listaContainer.appendChild(card);
    });
}

// --- REALTIME (atualiza sozinho quando alguém agenda/desmarca) ---
supabase
    .channel("agendamentos-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "agendamentos" }, () => {
        carregarAgendamentos();
    })
    .subscribe();

// Carregar ao abrir a página
carregarAgendamentos();
