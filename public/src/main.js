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
import {cenaRacaoStandart } from "./cenas/cenaRacaoStandart.js";
import {cenaRacaoSuperPremium } from "./cenas/cenaRacaoSuperPremium.js";


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
        banho: {caramelo: false, heroi: false},
        lazer: {caramelo: false, heroi: false},
        cuidado: {caramelo: false, heroi: false},
        alimentacao: {caramelo: false, heroi: false}
    },
    pets: {
        cachorroCaramelo: true,
        cachorroHeroi: false
    },
    // --- NOVAS VARIÁVEIS ---
    progressoCachorro: 0, // 0 = Caramelo, 1 = Herói
    aguardandoEvolucao: false, 
    // -----------------------
    pulga: true,
    trocar: false
};

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
        cenaRacaoStandart,
        cenaLazer,
        ficha,
        cenaRacaoSuperPremium
    ]
};

// Inicializa o jogo
const game = new Phaser.Game(config);
