let controlador = null;
let timer = null;
let pendente = null;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
    console.log('1. API do Spotify carregou');

    const elemento = document.getElementById('player-spotify');
    const primeiro = document.querySelector('.tocar-trecho');

    IFrameAPI.createController(
        elemento,
        { width: '100%', height: 80, uri: primeiro.dataset.uri },
        (ctrl) => {
            controlador = ctrl;
            console.log('2. Player criado');

            ctrl.addListener('ready', () => console.log('3. Player pronto'));

            ctrl.addListener('playback_update', (e) => {
                console.log('update:', e.data.isPaused ? 'pausado' : 'tocando', e.data.position);

                if (pendente && !e.data.isPaused) {
                    const { inicio, duracao } = pendente;
                    pendente = null;
                    ctrl.seek(inicio);
                    timer = setTimeout(() => ctrl.pause(), duracao * 1000);
                }
            });
        }
    );
};

document.querySelectorAll('.tocar-trecho').forEach((botao) => {
    botao.addEventListener('click', () => {
        console.log('clique:', botao.dataset.uri);

        if (!controlador) {
            console.log('O player ainda não existe');
            return;
        }

        clearTimeout(timer);
        pendente = {
            inicio: Number(botao.dataset.inicio),
            duracao: Number(botao.dataset.duracao)
        };

        controlador.loadUri(botao.dataset.uri);
        controlador.play();
    });
});