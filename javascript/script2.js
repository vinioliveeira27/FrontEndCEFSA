// ===== Elementos do DOM =====
const campoTarefa = document.getElementById('nova-tarefa');
const botaoAdicionar = document.getElementById('adicionar-tarefa');
const listaTarefas = document.getElementById('lista-tarefas');
const contadorTarefas = document.getElementById('contador');
const botaoLimparConcluidas = document.getElementById('limpar-concluidas');
const botoesFiltro = document.querySelectorAll('button.filtro');

// ===== Estado da aplicação =====
let tarefas = carregarTarefas();
let filtroAtual = 'todos'; // 'todos' | 'pendentes' | 'concluidas'

// ===== Armazenamento (localStorage) =====
function carregarTarefas() {
    try {
        // JSON.parse transforma o texto salvo de volta em array de objetos
        const salvas = JSON.parse(localStorage.getItem('tarefas'));
        if (!Array.isArray(salvas)) return [];

        // Garante que toda tarefa tenha id (tarefas antigas podem não ter)
        return salvas.map((tarefa, indice) => ({
            id: tarefa.id ?? Date.now() + indice,
            texto: String(tarefa.texto ?? ''),
            concluida: Boolean(tarefa.concluida),
        }));
    } catch (erro) {
        // Se o conteúdo salvo estiver corrompido, começa com lista vazia
        return [];
    }
}

function salvarTarefas() {
    // JSON.stringify transforma o array de objetos em texto
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
}

// ===== Ações sobre as tarefas =====
function adicionarTarefa() {
    const textoTarefa = campoTarefa.value.trim();

    // Não permite tarefa vazia
    if (textoTarefa === '') {
        alert('O campo de tarefa não pode estar vazio.');
        return;
    }

    tarefas.push({
        id: Date.now(), // identificador único
        texto: textoTarefa,
        concluida: false,
    });

    campoTarefa.value = '';
    campoTarefa.focus();

    atualizar();
}

function alternarConclusao(id) {
    const tarefa = tarefas.find((item) => item.id === id);
    if (!tarefa) return;

    tarefa.concluida = !tarefa.concluida;
    atualizar();
}

function excluirTarefa(id) {
    tarefas = tarefas.filter((item) => item.id !== id);
    atualizar();
}

function limparConcluidas() {
    // Mantém só as tarefas que ainda não foram concluídas
    tarefas = tarefas.filter((tarefa) => !tarefa.concluida);
    atualizar();
}

function definirFiltro(novoFiltro) {
    filtroAtual = novoFiltro;
    renderizarTarefas();
}

// ===== Renderização =====
function obterTarefasFiltradas() {
    return tarefas.filter((tarefa) => {
        if (filtroAtual === 'concluidas') return tarefa.concluida;
        if (filtroAtual === 'pendentes') return !tarefa.concluida;
        return true; // 'todos'
    });
}

function criarItemTarefa(tarefa) {
    const item = document.createElement('li');
    if (tarefa.concluida) {
        item.classList.add('concluida');
    }

    const texto = document.createElement('span');
    texto.textContent = tarefa.texto;

    const botaoConcluir = document.createElement('button');
    botaoConcluir.textContent = tarefa.concluida ? 'Reabrir' : 'Concluir';
    botaoConcluir.addEventListener('click', () => alternarConclusao(tarefa.id));

    const botaoExcluir = document.createElement('button');
    botaoExcluir.textContent = 'Excluir';
    botaoExcluir.addEventListener('click', () => excluirTarefa(tarefa.id));

    const grupoBotoes = document.createElement('div');
    grupoBotoes.append(botaoConcluir, ' ', botaoExcluir);

    item.append(texto, grupoBotoes);
    return item;
}

function atualizarContador() {
    const total = tarefas.length;
    const concluidas = tarefas.filter((tarefa) => tarefa.concluida).length;
    contadorTarefas.textContent = `${concluidas} de ${total} tarefas concluídas`;
}

function atualizarBotoesFiltro() {
    botoesFiltro.forEach((botao) => {
        botao.classList.toggle('ativo', botao.dataset.filtro === filtroAtual);
    });
}

function renderizarTarefas() {
    // Limpa a lista antes de redesenhar, senão os itens se acumulam
    listaTarefas.innerHTML = '';

    obterTarefasFiltradas().forEach((tarefa) => {
        listaTarefas.appendChild(criarItemTarefa(tarefa));
    });

    atualizarContador();
    atualizarBotoesFiltro();
}

// Salva e redesenha: usado após qualquer alteração nas tarefas
function atualizar() {
    salvarTarefas();
    renderizarTarefas();
}

// ===== Eventos =====
botaoAdicionar.addEventListener('click', adicionarTarefa);
botaoLimparConcluidas.addEventListener('click', limparConcluidas);

campoTarefa.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        adicionarTarefa();
    }
});

botoesFiltro.forEach((botao) => {
    botao.addEventListener('click', () => definirFiltro(botao.dataset.filtro));
});

// ===== Início =====
renderizarTarefas();