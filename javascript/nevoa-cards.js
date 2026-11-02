// Névoa nos cards: a própria capa do álbum, ampliada e desfocada, vai à deriva atrás do texto.
// Usa a mesma classe .fluido do cabeçalho e do rodapé (o desfoque e a opacidade vêm do CSS).
// Funciona nas duas versões do site (roxa e marrom), porque não usa nenhuma cor: só a imagem.
(function () {
    const DOIS_PI = Math.PI * 2;
    const ESCALA = 0.25;    // o card já é muito borrado, então desenhar pequeno não faz diferença e economiza bateria
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const aleatorio = (min, max) => min + Math.random() * (max - min);

    function iniciarNevoa(card) {
        const capa = card.querySelector('.capa img');
        if (!capa) return;

        const canvas = document.createElement('canvas');
        canvas.className = 'fluido';
        canvas.setAttribute('aria-hidden', 'true');
        card.prepend(canvas);   // fica atrás do texto, por cima da capa desfocada estática (::before)

        const ctx = canvas.getContext('2d');

        // Duas camadas da mesma imagem, em tamanhos e sentidos diferentes.
        // A de cima é meio transparente: é ela que mistura e cria a névoa.
        function criarCamada(zoom, alpha, espelho) {
            return {
                zoom,                                   // tamanho da imagem em relação ao card
                alpha,
                espelho,                                // 1 normal, -1 invertida na horizontal
                velX: aleatorio(0.12, 0.3) * (Math.random() < 0.5 ? -1 : 1),
                velY: aleatorio(0.12, 0.3) * (Math.random() < 0.5 ? -1 : 1),
                velA: aleatorio(0.08, 0.2),
                faseX: aleatorio(0, DOIS_PI),
                faseY: aleatorio(0, DOIS_PI),
                faseA: aleatorio(0, DOIS_PI),
                ampX: aleatorio(0.1, 0.18),             // quanto anda para os lados (fração da largura)
                ampY: aleatorio(0.1, 0.18),
                ampA: aleatorio(0.2, 0.5)               // quanto gira (em radianos)
            };
        }

        const camadas = [
            criarCamada(1.8, 1, 1),
            criarCamada(2.3, 0.55, -1)
        ];

        let w = 0, h = 0;

        function ajustar() {
            w = canvas.clientWidth;
            h = canvas.clientHeight;
            canvas.width = Math.round(w * ESCALA);
            canvas.height = Math.round(h * ESCALA);
            ctx.setTransform(ESCALA, 0, 0, ESCALA, 0, 0);
        }

        const imagem = new Image();
        let pronta = false;

        function desenharCamada(c, t) {
            const cx = w / 2 + Math.sin(t * c.velX + c.faseX) * w * c.ampX;
            const cy = h / 2 + Math.sin(t * c.velY + c.faseY) * h * c.ampY;
            const angulo = Math.sin(t * c.velA + c.faseA) * c.ampA;
            const lado = Math.max(w, h) * c.zoom;       // a capa é quadrada; grande o bastante para cobrir o card girando

            ctx.save();
            ctx.globalAlpha = c.alpha;
            ctx.translate(cx, cy);
            ctx.rotate(angulo);
            ctx.scale(c.espelho, 1);
            ctx.drawImage(imagem, -lado / 2, -lado / 2, lado, lado);
            ctx.restore();
        }

        function desenhar(agora) {
            const t = agora / 1000;
            ctx.clearRect(0, 0, w, h);
            camadas.forEach(c => desenharCamada(c, t));

            // escurece (igual ao brightness(.5) da capa estática) para o texto continuar legível
            ctx.fillStyle = 'rgba(0, 0, 0, .45)';
            ctx.fillRect(0, 0, w, h);
        }

        // Só anima enquanto o card está na tela (economiza bateria)
        let visivel = false;
        let rodando = false;

        function loop(agora) {
            desenhar(agora);
            if (visivel && !reduzido) {
                requestAnimationFrame(loop);
            } else {
                rodando = false;
            }
        }

        function iniciar() {
            if (!rodando && pronta) {
                rodando = true;
                requestAnimationFrame(loop);
            }
        }

        imagem.onload = () => {
            pronta = true;
            desenhar(performance.now());
            if (visivel) iniciar();
        };
        imagem.src = capa.currentSrc || capa.src;

        new IntersectionObserver(([entrada]) => {
            visivel = entrada.isIntersecting;
            if (visivel) iniciar();
        }).observe(canvas);

        // o card muda de altura quando abre o "Ler mais"
        new ResizeObserver(() => {
            ajustar();
            if (pronta) desenhar(performance.now());
        }).observe(canvas);
    }

    document.querySelectorAll('.musica').forEach(iniciarNevoa);
})();
