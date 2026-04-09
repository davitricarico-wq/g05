// Importa todas as telas (cenas) e componentes de UI que compõem o jogo.
// O Phaser precisa que todas as classes de cenas sejam passadas para sua configuração inicial.
import { jogoAlimentacao } from "./cenas/jogoAlimentacao.js";
import { cenaInicial } from "./cenas/cenaInicial.js";
import { cenaBanho } from "./cenas/cenaBanho.js";
import { cenaConfiguracoes } from "./cenas/cenaConfiguracoes.js";
import { cenaComida } from "./cenas/cenaComida.js";
import { cenaTutorial } from "./cenas/cenaTutorial.js";
import { cenaPrincipal } from "./cenas/cenaPrincipal.js";
import { jogoLazer } from "./cenas/jogoLazer.js";
import { cenaLazer } from "./cenas/cenaLazer.js";
import { HUD } from "./componentes/HUD.js";
import { cenaCuidado } from "./cenas/cenaCuidado.js";
import { ficha } from "./componentes/ficha.js";
import { cenaCarregamento } from "./cenas/cenaCarregamento.js";
import { cenaVeterinario } from "./cenas/cenaVeterinario.js";
import { cenaEstanteRacao } from "./cenas/cenaEstanteRacao.js";

/**
 * @object gameState
 * @description Objeto global exportado para todas as cenas. 
 * Funciona como o "Cérebro" do jogo, guardando o progresso do jogador, 
 * dinheiro, status do pet e configurações do sistema.
 */
export let gameState = {
    // Níveis de necessidade do pet (Máximo presumido de 11)
    barras: {
        comida: 11,
        lazer: 11,
        limpeza: 11,
        saude: 11
    },
    
    // Economia do jogo
    cobasiCoins: 20,
    
    // Rastreador de conquistas/atividades concluídas para cada fase da vida do cachorro
    recompensas: {
        banho: { caramelo: false, heroi: false, joao: false },
        lazer: { caramelo: false, heroi: false, joao: false },
        cuidado: { caramelo: false, heroi: false, joao: false },
        alimentacao: { caramelo: false, heroi: false, joao: false }
    },
    
    // Flags booleanas indicando qual cachorro está ativo no momento
    pets: {
        cachorroCaramelo: true,
        cachorroHeroi: false,
        cachorroJoao: false
    },
    
    // 0 = Caramelo (Filhote), 1 = Herói (Adulto), 2 = João (Sênior)
    progressoCachorro: 0, 
    // Flag de controle de transição/evolução entre as fases da vida
    aguardandoEvolucao: false, 
    
    pulga: true,           // Indica se o cachorro precisa de cuidados médicos
    trocar: false,         // Flag genérica (possivelmente para trocas de UI/Itens)
    superPremium: false,   // Tipos de ração desbloqueadas/compradas
    premium: false,
    standard: false,
    
    // Mapeamento de quais músicas estão desbloqueadas ou devem tocar
    musicas: {
        menuPrincipal: false,
        musicaCutscene: false,
        novoHorizonte: false,
        lazerDespreocupado: false,
        pegadasCrescidas: false
    },
    musicaLigada: true,        // Preferência do usuário (Mute / Unmute)
    musica: null,              // Instância do objeto de áudio do Phaser tocando atualmente
    chaveMusicaAtual: null     // String com o nome da música atual para evitar recarregamentos
};

// Playlist de músicas dinâmicas para o gameplay geral
const musicasAleatorias = ['novoHorizonte', 'lazerDespreocupado', 'pegadasCrescidas'];

/**
 * @function iniciarMusica
 * @description Toca uma faixa de áudio específica. Gerencia paradas e configurações de mudo.
 * @param {Phaser.Scene} scene - O contexto da cena atual solicitando a música.
 * @param {string} chaveMusica - O nome do asset de áudio carregado.
 * @param {boolean} loop - Define se a música deve se repetir infinitamente.
 */
export function iniciarMusica(scene, chaveMusica, loop = true) {
    // Se o jogo estiver mutado, apenas salva qual música deveria estar tocando e para a atual
    if (!gameState.musicaLigada) {
        if (gameState.musica && gameState.musica.isPlaying) {
            gameState.musica.stop();
        }
        gameState.chaveMusicaAtual = chaveMusica;
        return;
    }

    // Impede sobreposição de áudios parando a música anterior
    if (gameState.musica && gameState.musica.isPlaying) {
        gameState.musica.stop();
    }
    
    // Adiciona e reproduz a nova música
    gameState.musica = scene.sound.add(chaveMusica, { loop: loop });
    gameState.musica.play();
    gameState.chaveMusicaAtual = chaveMusica;
}

/**
 * @function iniciarMusicaAleatoria
 * @description Escolhe uma música da playlist ao acaso. Quando a música acaba, 
 * chama a si mesma para criar um loop contínuo e variado de músicas (efeito rádio).
 * @param {Phaser.Scene} scene - O contexto da cena atual.
 */
export function iniciarMusicaAleatoria(scene) {
    // Checagem de mudo
    if (!gameState.musicaLigada) {
        if (gameState.musica && gameState.musica.isPlaying) {
            gameState.musica.stop();
        }
        return;
    }

    if (gameState.musica && gameState.musica.isPlaying) {
        gameState.musica.stop();
    }
    
    // Pega uma string aleatória do array de playlist usando o utilitário nativo do Phaser
    const chaveAleatoria = Phaser.Utils.Array.GetRandom(musicasAleatorias);
    
    // Adiciona a música com loop desligado, pois queremos trocar de faixa ao final
    gameState.musica = scene.sound.add(chaveAleatoria, { loop: false });
    gameState.musica.play();
    gameState.chaveMusicaAtual = chaveAleatoria;
    
    // Listener de Evento: Quando a música terminar ('complete'), roda a função novamente
    gameState.musica.on('complete', () => {
        iniciarMusicaAleatoria(scene);
    });
}

// CONFIGURAÇÃO DO MOTOR PHASER (ENGINE CONFIG)
const config = {
    // Phaser.AUTO deixa o motor decidir entre WebGL (preferencial por performance) ou Canvas API
    type: Phaser.AUTO,

    // Define a largura e altura iniciais baseadas no tamanho da janela do navegador
    width: window.innerWidth,
    height: window.innerHeight,

    scale: {
        // RESIZE faz com que o canvas do jogo ocupe o espaço disponível dinamicamente
        mode: Phaser.Scale.RESIZE,          
        // Garante que o canvas fique sempre centralizado no elemento pai (HTML)
        autoCenter: Phaser.Scale.CENTER_BOTH 
    },

    // Configurações do contexto de áudio nativo do navegador
    audio: {
        disableWebAudio: false,
        noAudio: false
    },

    // Configuração do motor de física
    physics: {
        default: "arcade", // Arcade Physics é o motor padrão, leve e focado em colisões AABB
        arcade: {
            gravity: { y: 0 }, // Gravidade zero (Ideal para jogos Top-Down ou Minigames de interface)
            debug: false       // Troque para true se precisar ver as caixas de colisão
        }
    },

    // O array de cenas registradas no jogo. 
    // IMPORTANTE: O Phaser sempre inicia o jogo automaticamente pela PRIMEIRA cena deste array.
    // Neste caso, 'cenaCarregamento' será o boot do jogo.
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

// Inicializa a instância principal do jogo passando as configurações acima
const game = new Phaser.Game(config);