// ===== Elementos da página =====
const campoTarefa = document.getElementById("campoTarefa");
const btnAdicionar = document.getElementById("btnAdicionar");
const listaTarefas = document.getElementById("listaTarefas");
const contador = document.getElementById("contador");
const btnLimpar = document.getElementById("btnLimpar");
const botoesFiltro = document.querySelectorAll(".filtro");

// ===== Constantes =====
const CHAVE_STORAGE = "tarefas";

// Cada filtro é uma função que diz se a tarefa deve aparecer.
// Trocar vários "if" por um objeto deixa fácil criar filtros novos.
const filtros = {
    todas: () => true,
    pendentes: (tarefa) => !tarefa.concluida,
    concluidas: (tarefa) => tarefa.concluida,
};

// ===== Estado =====
let tarefas = carregarTarefas();
let filtroAtual = "todas";

// ===== Armazenamento =====
function gerarId() {
    // Date.now() sozinho pode repetir se duas tarefas forem criadas
    // no mesmo milissegundo; o trecho aleatório evita isso.
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function carregarTarefas() {
    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE_STORAGE));

        // Se não houver nada salvo (null) ou o formato estiver errado,
        // começa com a lista vazia em vez de quebrar a página.
        if (!Array.isArray(dados)) {
            return [];
        }

        return dados
            .filter((t) => t && typeof t.texto === "string")
            .map((t) => ({
                id: String(t.id ?? gerarId()),
                texto: t.texto,
                concluida: Boolean(t.concluida),
            }));
    } catch {
        // JSON corrompido ou localStorage indisponível.
        return [];
    }
}

function salvarTarefas() {
    try {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(tarefas));
    } catch {
        // Pode falhar em aba anônima ou com o armazenamento cheio.
        // O app continua funcionando, só não persiste.
    }
}

// ===== Interface =====
function criarItem(tarefa) {
    const item = document.createElement("li");
    item.dataset.id = tarefa.id;
    item.classList.toggle("concluida", tarefa.concluida);

    // textContent insere texto puro, sem interpretar HTML.
    const texto = document.createElement("span");
    texto.textContent = tarefa.texto;

    const btnConcluir = document.createElement("button");
    btnConcluir.type = "button";
    btnConcluir.dataset.acao = "alternar";
    btnConcluir.textContent = tarefa.concluida ? "Reabrir" : "Concluir";

    const btnExcluir = document.createElement("button");
    btnExcluir.type = "button";
    btnExcluir.dataset.acao = "excluir";
    btnExcluir.textContent = "Excluir";

    const botoes = document.createElement("div");
    botoes.append(btnConcluir, " ", btnExcluir);

    item.append(texto, botoes);
    return item;
}

function atualizarContador() {
    const total = tarefas.length;
    const pendentes = tarefas.filter(filtros.pendentes).length;

    if (total === 0) {
        contador.textContent = "Nenhuma tarefa";
        return;
    }

    contador.textContent =
        `${pendentes} ${pendentes === 1 ? "pendente" : "pendentes"} de ${total}`;
}

function renderizarTarefas() {
    const filtro = filtros[filtroAtual] ?? filtros.todas;
    const visiveis = tarefas.filter(filtro);

    // replaceChildren troca todo o conteúdo da lista de uma vez.
    listaTarefas.replaceChildren(...visiveis.map(criarItem));

    if (visiveis.length === 0) {
        const vazio = document.createElement("li");
        vazio.classList.add("vazio");
        vazio.textContent = "Nenhuma tarefa por aqui.";
        listaTarefas.append(vazio);
    }

    // Mantém o destaque do filtro sempre coerente com o estado.
    botoesFiltro.forEach((botao) => {
        botao.classList.toggle("ativo", botao.dataset.filtro === filtroAtual);
    });

    // Só habilita "Limpar" se existir alguma tarefa concluída.
    btnLimpar.disabled = !tarefas.some(filtros.concluidas);

    atualizarContador();
}

// ===== Ações =====
function adicionarTarefa() {
    const texto = campoTarefa.value.trim();

    if (texto === "") {
        // Mensagem nativa do navegador, sem o alert() que trava a tela.
        campoTarefa.setCustomValidity("Digite uma tarefa antes de adicionar.");
        campoTarefa.reportValidity();
        return;
    }

    tarefas.push({
        id: gerarId(),
        texto,
        concluida: false,
    });

    salvarTarefas();
    campoTarefa.value = "";
    campoTarefa.focus();
    renderizarTarefas();
}

function alternarTarefa(id) {
    const tarefa = tarefas.find((t) => t.id === id);

    if (tarefa) {
        tarefa.concluida = !tarefa.concluida;
        salvarTarefas();
        renderizarTarefas();
    }
}

function excluirTarefa(id) {
    tarefas = tarefas.filter((t) => t.id !== id);
    salvarTarefas();
    renderizarTarefas();
}

function limparConcluidas() {
    tarefas = tarefas.filter(filtros.pendentes);
    salvarTarefas();
    renderizarTarefas();
}

// ===== Eventos =====
btnAdicionar.addEventListener("click", adicionarTarefa);

campoTarefa.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
        adicionarTarefa();
    }
});

// Ao digitar, remove a mensagem de erro anterior.
campoTarefa.addEventListener("input", () => {
    campoTarefa.setCustomValidity("");
});

// Delegação de eventos: um único listener na lista atende
// todos os botões, inclusive os criados depois.
listaTarefas.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-acao]");
    const item = evento.target.closest("li[data-id]");

    if (!botao || !item) {
        return;
    }

    const id = item.dataset.id;

    if (botao.dataset.acao === "alternar") {
        alternarTarefa(id);
    } else if (botao.dataset.acao === "excluir") {
        excluirTarefa(id);
    }
});

botoesFiltro.forEach((botao) => {
    botao.addEventListener("click", () => {
        filtroAtual = botao.dataset.filtro;
        renderizarTarefas();
    });
});

btnLimpar.addEventListener("click", limparConcluidas);

// ===== Início =====
renderizarTarefas();