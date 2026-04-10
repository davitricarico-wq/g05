// Importa o estado global para persistência das configurações (ex: música ligada/desligada)
// e a função utilitária para gerenciar a trilha sonora principal
import { gameState, iniciarMusicaAleatoria } from "../main.js";

/**
 * @class cenaConfiguracoes
 * @extends Phaser.Scene
 * @description Cena responsável por exibir o menu de configurações (Música, Som, Vibração).
 * Foi projetada para funcionar como um "Modal/Popup", rodando em paralelo e sobrepondo 
 * a cena de gameplay atual (sem pausá-la ou destruí-la).
 */
export class cenaConfiguracoes extends Phaser.Scene {
    
    constructor() {
        // Define a chave de identificação única da cena no gerenciador do Phaser
        super({ key: 'cenaConfiguracoes' });
    }

    /**
     * @method create
     * @description Inicializa a interface do modal, botões interativos e listeners de responsividade.
     */
    create() {
        // Fundo semitransparente que escurece a cena anterior, focando a atenção no modal
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000
        ).setAlpha(0.6).setDepth(0);

        // Ícone/Painel decorativo central contendo as opções
        this.add.image(this.scale.width / 2, this.scale.height / 2, "configuracoes")
            .setScale(0.8)
            .setDepth(1);

        // Botão de fechamento do modal. Posicionado no canto superior direito do painel.
        const botaoFechar = this.add.image(
            this.scale.width / 2 + 65,
            this.scale.height / 2 - 145,
            "retornoInicio"
        )
            .setScale(0.3)
            .setInteractive({ useHandCursor: true })
            .setDepth(10);

        // Efeito visual de destaque (hover) ao passar o mouse sobre o botão de fechar
        botaoFechar.on('pointerover', () => {
            this.tweens.add({ targets: botaoFechar, scale: 0.36, duration: 150, ease: 'Power2' });
        });

        // Retorna o botão ao tamanho original ao retirar o mouse
        botaoFechar.on('pointerout', () => {
            this.tweens.add({ targets: botaoFechar, scale: 0.3, duration: 150, ease: 'Power2' });
        });

        // Lógica de fechamento: ao parar esta cena, a cena que estava por baixo volta a receber 
        // interações normalmente, mantendo seu estado intacto.
        botaoFechar.on('pointerdown', () => {
            this.scene.stop('cenaConfiguracoes');
        });

        // Configuração do botão de Música
        gameState.alternarMusica = this.criarAlternar(
            this.scale.width / 2 + 20, 
            this.scale.height / 2 - 85, 
            gameState.musicaLigada, // Estado inicial baseado na variável global
            () => {
                // Callback ao ligar: retoma a música pausada ou inicia uma nova
                gameState.musicaLigada = true;
                if (gameState.musica) {
                    if (gameState.musica.isPaused) { // CORREÇÃO AQUI
                        gameState.musica.resume();
                    }
                } else {
                    iniciarMusicaAleatoria(this);
                }
            },
            () => {
                // Callback ao desligar: pausa a música atual
                gameState.musicaLigada = false;
                if (gameState.musica && gameState.musica.isPlaying) {
                    gameState.musica.pause();
                }
            }
        );

        // Configuração do botão de Som (Efeitos Sonoros/SFX)
        gameState.alternarSom = this.criarAlternar(
            this.scale.width / 2 + 20, 
            this.scale.height / 2 - 35, 
            true, // TODO: Vincular a uma variável real em gameState (ex: gameState.somLigado)
            () => { console.log('Som ligado'); },
            () => { console.log('Som desligado'); }
        );

        // Configuração do botão de Vibração (Feedback Híptico em dispositivos móveis)
        gameState.alternarVibracao = this.criarAlternar(
            this.scale.width / 2 + 20, 
            this.scale.height / 2 + 15, 
            true, // TODO: Vincular a uma variável real em gameState
            () => { console.log('Vibracao ligada'); },
            () => { console.log('Vibracao desligada'); }
        );

        /**
         * @function handleResizeConfiguracoes
         * @description Realinha todos os elementos da interface caso a janela/tela sofra redimensionamento.
         */
        const handleResizeConfiguracoes = () => {
            // Atualiza o fundo semitransparente para cobrir 100% da nova área
            this.children.each((child) => {
                if (child.type === 'Rectangle') {
                    child.setPosition(this.scale.width / 2, this.scale.height / 2)
                         .setSize(this.scale.width, this.scale.height);
                }
            });

            // Re-centraliza o painel decorativo
            this.children.each((child) => {
                if (child.texture?.key === 'configuracoes') {
                    child.setPosition(this.scale.width / 2, this.scale.height / 2);
                }
            });

            // Reposiciona o botão de fechar (Nota: os valores fixos de offset podem precisar 
            // de cálculo percentual caso a escala do jogo seja muito flexível)
            this.children.each((child) => {
                if (child.texture?.key === 'retornoInicio') {
                    child.setPosition(this.scale.width / 2 + 260, this.scale.height / 2 - 320);
                }
            });

            // Reposiciona os pares de botões (On/Off) de cada configuração
            if (gameState.alternarMusica) {
                gameState.alternarMusica.botaoLigado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 - 85);
                gameState.alternarMusica.botaoDesligado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 - 85);
            }
            if (gameState.alternarSom) {
                gameState.alternarSom.botaoLigado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 - 35);
                gameState.alternarSom.botaoDesligado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 - 35);
            }
            if (gameState.alternarVibracao) {
                gameState.alternarVibracao.botaoLigado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 + 15);
                gameState.alternarVibracao.botaoDesligado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 + 15);
            }
        };

        // Escuta o evento global de redimensionamento da engine
        this.scale.on("resize", handleResizeConfiguracoes);

        // Limpeza de memória: remove o listener de resize quando o modal for fechado
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeConfiguracoes);
        });

        // Suaviza a entrada do modal na tela
        this.cameras.main.fadeIn(150, 0, 0, 0);
    }

    /**
     * @method criarAlternar
     * @description Cria um componente visual customizado de botão "Liga/Desliga" (Toggle).
     * Renderiza ambos os sprites e alterna a visibilidade e lógica entre eles ao clicar.
     * @param {number} x - Posição X central do botão.
     * @param {number} y - Posição Y central do botão.
     * @param {boolean} estadoInicial - Define qual botão deve aparecer primeiro (true = ligado).
     * @param {function} aoLigar - Callback executado quando o usuário muda para o estado ON.
     * @param {function} aoDesligar - Callback executado quando o usuário muda para o estado OFF.
     * @returns {Object} Um objeto contendo a referência para os dois sprites gerados `{ botaoLigado, botaoDesligado }`.
     */
    criarAlternar(x, y, estadoInicial, aoLigar, aoDesligar) {
        // Instancia o sprite representativo do estado LIGADO
        const botaoLigado = this.add.image(x, y, "botaoOn")
            .setScale(0.6).setInteractive({ useHandCursor: true }).setDepth(3);

        // Instancia o sprite representativo do estado DESLIGADO
        const botaoDesligado = this.add.image(x, y, "botaoOff")
            .setScale(0.6).setInteractive({ useHandCursor: true }).setDepth(3);

        // Aplica o estado visual inicial ocultando a imagem que não corresponde à configuração atual
        let ligado = estadoInicial;
        botaoLigado.setVisible(ligado);
        botaoDesligado.setVisible(!ligado);

        // Fluxo de Interação: Desligando
        botaoLigado.on('pointerdown', () => {
            ligado = false;
            botaoLigado.setVisible(false);
            botaoDesligado.setVisible(true);
            if (aoDesligar) aoDesligar();
        });

        // Fluxo de Interação: Ligando
        botaoDesligado.on('pointerdown', () => {
            ligado = true;
            botaoDesligado.setVisible(false);
            botaoLigado.setVisible(true);
            if (aoLigar) aoLigar();
        });

        // Retorna as referências caso a cena precise redimensionar/manipular esses elementos no futuro
        return { botaoLigado, botaoDesligado };
    }

    /**
     * @method update
     * @description Atualização contínua a cada frame da cena.
     * Atualmente não possui lógica em loop real-time, servindo apenas para atender ao ciclo de vida da cena.
     */
    update() {}
}