// Duas coisas neste arquivo:
//   1) Botão de trocar o tema roxo/marrom (a escolha fica salva no navegador)
//   2) Animação de entrada dos cards conforme você rola a página
//
// Ele vai no <head>, logo DEPOIS do <link rel="stylesheet"> do site, para o tema salvo
// ser aplicado antes de a página aparecer.
(function () {
    'use strict';

    // marca o <html> para o CSS abaixo esconder os cards até a hora de entrarem
    document.documentElement.classList.add('js');

    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // quando o JavaScript ainda está rodando no <head>, espera a página montar
    function quandoPronto(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    // ==========================================================
    // Estilos do botão e da animação (injetados aqui para não mexer nos CSS)
    // ==========================================================
    const estilo = document.createElement('style');
    estilo.textContent = `
        /* Animação de entrada dos cards */
        .js .musica:not(.entrou) {
            opacity: 0;
        }

        .musica.entrando {
            animation: card-entrada .65s ease backwards;
        }

        @keyframes card-entrada {
            from {
                opacity: 0;
                transform: translateY(32px) scale(.98);
            }
            to {
                opacity: 1;
                transform: none;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .musica.entrando {
                animation: none;
            }
        }

        /* Botão de trocar o tema (cores neutras, serve para os dois temas) */
        .tema-botao {
            position: fixed;
            left: calc(20px + env(safe-area-inset-left));
            bottom: calc(20px + env(safe-area-inset-bottom));
            z-index: 10;
            min-height: 44px;
            padding: 0 16px;

            display: flex;
            align-items: center;
            gap: 10px;

            font: inherit;
            font-size: .8rem;
            color: #fff;
            cursor: pointer;

            background: rgba(0, 0, 0, .55);
            border: 1px solid rgba(255, 255, 255, .3);
            border-radius: 999px;
            box-shadow: 0 6px 16px rgba(0, 0, 0, .4);
            -webkit-backdrop-filter: blur(8px);
            backdrop-filter: blur(8px);

            transition: background .2s ease;
        }

        .tema-botao:hover,
        .tema-botao:focus-visible {
            background: rgba(0, 0, 0, .75);
        }

        .tema-bolinha {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, .6);
        }

        @media (max-width: 560px) {
            .tema-botao {
                left: calc(14px + env(safe-area-inset-left));
                bottom: calc(14px + env(safe-area-inset-bottom));
            }
        }
    `;
    document.head.append(estilo);

    // ==========================================================
    // 1) Troca de tema
    // ==========================================================
    const CHAVE = 'tema-site';

    // Cada tema tem o seu CSS, a cor da barra do celular e as cores dos fundos animados
    // (cabeçalho e rodapé: [camada principal, camada que mistura]).
    const TEMAS = {
        roxo: {
            css: 'style_sitezaoRoxo.css',
            themeColor: '#160D26',
            cor: '#9747FF',
            cabecalho: ['#281442,#6425A8,#9747FF,#6425A8,#160D26', '#C69AFF,#6425A8,#281442,#9747FF'],
            rodape: ['#160D26,#281442,#6425A8,#9747FF,#281442', '#6425A8,#160D26,#9747FF,#281442']
        },
        marrom: {
            css: 'style_sitezao.css',
            themeColor: '#c8b6a1',
            cor: '#d74d2e',
            cabecalho: ['#922211,#d74d2e,#3d170d,#8f8477', '#3d170d,#d74d2e,#922211'],
            rodape: ['#3d170d,#922211,#d74d2e,#c8b6a1,#8f8477', '#d74d2e,#8f8477,#922211,#c8b6a1']
        }
    };

    const SELETOR_CSS = 'link[rel="stylesheet"][href*="style_sitezao"]';

    function lerSalvo() {
        try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
    }

    function salvar(tema) {
        try { localStorage.setItem(CHAVE, tema); } catch (e) { /* sem armazenamento: só não lembra */ }
    }

    const link = document.querySelector(SELETOR_CSS);

    if (link) {
        const caminho = link.getAttribute('href');
        const base = caminho.slice(0, caminho.lastIndexOf('/') + 1);   // ex.: "../css/"
        const temaDoHtml = /roxo/i.test(caminho) ? 'roxo' : 'marrom';  // o tema que este HTML já carrega

        let atual = temaDoHtml;
        let botao = null;

        // Carrega o CSS do outro tema e só tira o antigo quando o novo chegou (sem "piscar" sem estilo)
        function trocarCss(tema, depois) {
            const antigo = document.querySelector(SELETOR_CSS);
            const novo = document.createElement('link');
            novo.rel = 'stylesheet';
            novo.href = base + TEMAS[tema].css;
            novo.onload = () => { antigo.remove(); depois(true); };
            novo.onerror = () => { novo.remove(); depois(false); };   // arquivo não achado: fica no tema antigo
            antigo.after(novo);
        }

        // Os fundos animados leem as cores só ao começar, então recriamos os <canvas> com as cores novas
        function recolorirFluidos(tema) {
            const t = TEMAS[tema];

            [['.cabecalho .fluido', t.cabecalho], ['.rodape .fluido', t.rodape]].forEach(([seletor, cores]) => {
                const antigo = document.querySelector(seletor);
                if (!antigo) return;

                const novo = document.createElement('canvas');
                novo.className = 'fluido';
                novo.setAttribute('aria-hidden', 'true');
                novo.dataset.cores = cores[0];
                novo.dataset.cores2 = cores[1];
                antigo.replaceWith(novo);

                if (typeof iniciarFluido === 'function') iniciarFluido(novo);
            });
        }

        function atualizarBotao() {
            if (!botao) return;
            const alvo = atual === 'roxo' ? 'marrom' : 'roxo';
            botao.querySelector('.tema-bolinha').style.background = TEMAS[alvo].cor;
            botao.querySelector('.tema-texto').textContent = 'Tema ' + alvo;
            botao.setAttribute('aria-label', 'Trocar para o tema ' + alvo);
        }

        function aplicarTema(tema) {
            if (tema === atual) return;

            const anterior = atual;
            atual = tema;
            atualizarBotao();

            trocarCss(tema, ok => {
                if (!ok) {
                    atual = anterior;
                    atualizarBotao();
                    return;
                }

                salvar(tema);

                quandoPronto(() => {
                    recolorirFluidos(tema);
                    const meta = document.querySelector('meta[name="theme-color"]');
                    if (meta) meta.setAttribute('content', TEMAS[tema].themeColor);
                });
            });
        }

        // Tema que a pessoa escolheu da última vez
        const salvo = lerSalvo();
        if (salvo && TEMAS[salvo] && salvo !== temaDoHtml) {
            aplicarTema(salvo);
        }

        // Botão fixo no canto da tela
        quandoPronto(() => {
            botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'tema-botao';
            botao.innerHTML = '<span class="tema-bolinha"></span><span class="tema-texto"></span>';
            botao.addEventListener('click', () => aplicarTema(atual === 'roxo' ? 'marrom' : 'roxo'));
            document.body.append(botao);
            atualizarBotao();
        });
    }

    // ==========================================================
    // 2) Animação de entrada dos cards
    // ==========================================================
    quandoPronto(() => {
        const cards = document.querySelectorAll('.musica');

        // sem animação (ou navegador antigo): mostra tudo de uma vez
        if (reduzido || !('IntersectionObserver' in window)) {
            cards.forEach(card => card.classList.add('entrou'));
            return;
        }

        const observador = new IntersectionObserver(entradas => {
            let ordem = 0;

            entradas.forEach(entrada => {
                if (!entrada.isIntersecting) return;

                const card = entrada.target;

                // cards que aparecem juntos entram um depois do outro
                card.style.animationDelay = (ordem++ * 90) + 'ms';
                card.classList.add('entrou', 'entrando');

                // no fim, tira a animação para o efeito de subir ao passar o mouse voltar a funcionar
                card.addEventListener('animationend', evento => {
                    if (evento.target !== card) return;
                    card.classList.remove('entrando');
                    card.style.animationDelay = '';
                });

                observador.unobserve(card);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

        cards.forEach(card => observador.observe(card));
    });
})();
