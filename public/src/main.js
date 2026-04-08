import { jogoAlimentacao } from "./cenas/jogoAlimentacao.js";
import { cenaInicial } from "./cenas/cenaInicial.js";
import { cenaBanho } from "./cenas/cenaBanho.js";
import { cenaConfiguracoes } from "./cenas/cenaConfiguracoes.js";
import { cenaComida } from "./cenas/cenaComida.js";
import { cenaTutorial } from "./cenas/cenaTutorial.js";
import { cenaPrincipal } from "./cenas/cenaPrincipal.js";
import { jogoLazer } from "./cenas/jogoLazer.js";
import {cenaLazer} from "./cenas/cenaLazer.js";
import { HUD } from "./componentes/HUD.js";
import { cenaCuidado } from "./cenas/cenaCuidado.js";
import { ficha } from "./componentes/ficha.js";
import { cenaCarregamento } from "./cenas/cenaCarregamento.js";
import {cenaVeterinario } from "./cenas/cenaVeterinario.js";
import {cenaEstanteRacao} from "./cenas/cenaEstanteRacao.js";



// Objeto global para armazenar estados do jogo
// No seu gameState dentro do main.js:
export let gameState = {

    barras: {
        comida: 11,
        lazer: 11,
        limpeza: 11,
        saude: 11
    },
    cobasiCoins: 20,
    recompensas: {
        banho: {caramelo: false, heroi: false, joao: false},
        lazer: {caramelo: false, heroi: false, joao: false},
        cuidado: {caramelo: false, heroi: false, joao: false},
        alimentacao: {caramelo: false, heroi: false, joao: false}
    },
    pets: {
        cachorroCaramelo: true,
        cachorroHeroi: false,
        cachorroJoao: false
    },
    // --- NOVAS VARIÁVEIS ---
    progressoCachorro: 0, // 0 = Caramelo, 1 = Herói, 2 = João
    aguardandoEvolucao: false, 
    // -----------------------
    pulga: true,
    trocar: false,
    superPremium: false,
    premium: false,
    standard: false,
    musicas:{
        menuPrincipal: false,
        musicaCutscene: false,
        novoHorizonte: false,
        lazerDespreocupado: false,
        pegadasCrescidas: false
    },
    musicaLigada: true,
    musica: null,
    chaveMusicaAtual: null
};

// Funções de gerenciamento de música
const musicasAleatorias = ['novoHorizonte', 'lazerDespreocupado', 'pegadasCrescidas'];

export function iniciarMusica(scene, chaveMusica, loop = true) {
    if (!gameState.musicaLigada) {
        if (gameState.musica && gameState.musica.isPlaying) {
            gameState.musica.stop();
        }
        gameState.chaveMusicaAtual = chaveMusica;
        return;
    }

    if (gameState.musica && gameState.musica.isPlaying) {
        gameState.musica.stop();
    }
    gameState.musica = scene.sound.add(chaveMusica, { loop: loop });
    gameState.musica.play();
    gameState.chaveMusicaAtual = chaveMusica;
}

export function iniciarMusicaAleatoria(scene) {
    if (!gameState.musicaLigada) {
        if (gameState.musica && gameState.musica.isPlaying) {
            gameState.musica.stop();
        }
        return;
    }

    if (gameState.musica && gameState.musica.isPlaying) {
        gameState.musica.stop();
    }
    const chaveAleatoria = Phaser.Utils.Array.GetRandom(musicasAleatorias);
    gameState.musica = scene.sound.add(chaveAleatoria, { loop: false });
    gameState.musica.play();
    gameState.chaveMusicaAtual = chaveAleatoria;
    // Quando acabar, tocar outra aleatória
    gameState.musica.on('complete', () => {
        iniciarMusicaAleatoria(scene);
    });
}

// Configuração principal do Phaser
const config = {
    type: Phaser.AUTO,

    width: window.innerWidth,

    // Altura sempre igual à altura total da janela
    height: window.innerHeight,

    scale: {
        mode: Phaser.Scale.RESIZE,          // ativa redimensionamento automático
        autoCenter: Phaser.Scale.CENTER_BOTH // centraliza o jogo na tela
    },

    audio: {
        disableWebAudio: false,
        noAudio: false
    },

    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },

    scene: [
        cenaCarregamento,
        cenaInicial,
        cenaTutorial,
        jogoAlimentacao,
        cenaConfiguracoes,
        cenaBanho,
        cenaComida,
        cenaCuidado,
        cenaVeterinario,
        cenaPrincipal,
        HUD,
        jogoLazer,
        cenaLazer,
        ficha,
        cenaEstanteRacao
    ]
};

// Inicializa o jogo
const game = new Phaser.Game(config);
