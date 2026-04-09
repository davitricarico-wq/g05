// Importa o objeto global gameState (que gerencia dados contínuos do jogador) 
// e a função de controle de áudio do arquivo principal.
import { gameState, iniciarMusicaAleatoria } from "../main.js";

/**
 * @class cenaInicial
 * @extends Phaser.Scene
 * @description Classe responsável pela tela principal (Menu Iniciar) do jogo.
 * Esta cena apresenta as opções primárias para o jogador: Iniciar Jogo, 
 * Configurações de áudio/tela e a opção de Sair.
 */
export class cenaInicial extends Phaser.Scene {
    constructor() {
        super({ key: "cenaInicial" });
        // Flag de controle (lock) para evitar que o jogador clique múltiplas vezes 
        // e acione eventos de mudança de cena simultâneos.
        this.transicao = false; 
    }

    /**
     * @method create
     * @description Método do ciclo de vida do Phaser disparado na inicialização da cena.
     * Monta todos os elementos visuais, eventos de clique e ajusta a responsividade.
     */
    create() {

        // Interrompe a cena HUD (Interface de Usuário) caso ela esteja rodando no fundo.
        // Isso garante que barras de vida, moedas ou botões do jogo não apareçam na tela de título.
        this.scene.stop("HUD");
        this.transicao = false;

        // Verifica a preferência do usuário no estado global antes de iniciar a música tema
        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        // Cria o fundo da cena inicial, fixando-o no centro da tela e forçando-o a 
        // preencher 100% das dimensões (width/height) do canvas atual.
        this.fundo = this.add
            .image(this.scale.width / 2, this.scale.height / 2, "bgInicial")
            .setDisplaySize(this.scale.width, this.scale.height);

        /**
         * @function criarBotao
         * @description Função utilitária (Factory) para padronizar a criação de botões.
         * Encapsula a lógica de interação (hover, clique) e animações suaves (Tweens).
         * @param {number} x - Posição horizontal
         * @param {number} y - Posição vertical
         * @param {string} texturaNormal - Imagem padrão do botão
         * @param {string} texturaSobre - Imagem quando o mouse está em cima (hover)
         * @param {string} texturaPressionado - Imagem quando o botão é clicado (active)
         * @param {number} escalaBase - Tamanho em repouso
         * @param {number} escalaAumentada - Tamanho expandido no hover
         * @param {number} escalaPressionada - Tamanho reduzido no clique
         * @param {function} callback - Ação executada ao soltar o clique no botão
         * @returns {Phaser.GameObjects.Image} A instância do botão criado
         */
        const criarBotao = (x, y, texturaNormal, texturaSobre, texturaPressionado, escalaBase, escalaAumentada, escalaPressionada, callback) => {
            const botao = this.add.image(x, y, texturaNormal)
                .setScale(escalaBase)
                .setInteractive({ useHandCursor: true });

            // Efeito Hover (passar o mouse): Altera textura e aumenta suavemente o tamanho
            botao.on("pointerover", () => {
                botao.setTexture(texturaSobre);
                this.tweens.add({ targets: botao, scale: escalaAumentada, duration: 150, ease: "Power2" });
            });

            // Efeito Out (tirar o mouse): Retorna à textura e escala originais
            botao.on("pointerout", () => {
                botao.setTexture(texturaNormal);
                this.tweens.add({ targets: botao, scale: escalaBase, duration: 150, ease: "Power2" });
            });

            // Efeito Down (segurar clique): Altera textura para feedback de "pressionado" e encolhe o botão
            botao.on("pointerdown", () => {
                botao.setTexture(texturaPressionado);
                this.tweens.add({ targets: botao, scale: escalaPressionada, duration: 100, ease: "Power2" });
            });

            // Efeito Up (soltar clique): Retorna à textura de hover, ajusta escala e dispara a ação (callback)
            botao.on("pointerup", () => {
                botao.setTexture(texturaSobre);
                this.tweens.add({ targets: botao, scale: escalaAumentada, duration: 100, ease: "Power2" });
                if (callback) callback();
            });

            return botao;
        };

        // Cálculos dinâmicos de escala utilizando Math.min para garantir que os botões
        // mantenham uma proporção segura tanto em monitores ultrawide quanto em telas mobile.
        const escalaBase = Math.min(this.scale.width, this.scale.height) * 0.00008;
        const escalaAumentada = escalaBase * 1.2;
        const escalaPressionada = escalaBase * 0.9;

        // Instancia o botão primário "Jogar", posicionado à esquerda
        this.botaoJogar = criarBotao(
            this.scale.width * 0.162, this.scale.height * 0.6,
            "botaoJogarNormal", "botaoJogarCrescendo", "botaoJogarPressionado",
            escalaBase, escalaAumentada, escalaPressionada,
            () => this.transicaoPara("cenaTutorial")
        );

        // Instancia o botão "Sair", posicionado no canto inferior esquerdo
        this.botaoSair = criarBotao(
            this.scale.width * 0.05, this.scale.height * 0.9,
            "botaoSairNormal", "botaoSairCrescendo", "botaoSairPressionado",
            escalaBase, escalaAumentada, escalaPressionada,
            () => this.game.destroy(true) // Encerra a instância completa do Phaser
        );

        // Instancia o botão "Configurações" como um modal sobreposto (launch) ao invés de transição de cena (start)
        this.botaoConfiguracoes = criarBotao(
            this.scale.width * 0.28, this.scale.height * 0.9,
            "botaoConfiguracoesNormal", "botaoConfiguracoesCrescendo", "botaoConfiguracoesPressionado",
            // Ajuste multiplicador (* 10) específico para compensar a resolução base da sprite de configurações
            escalaBase * 10, escalaAumentada * 10, escalaPressionada * 10, 
            () => {
                // Evita abrir múltiplos modais de configuração se o usuário clicar várias vezes
                if (!this.scene.isActive("cenaConfiguracoes")) {
                    this.scene.launch("cenaConfiguracoes");
                }
            }
        );

        // Define os limites da câmera para o tamanho exato da tela e inicia com um efeito suave de clareamento
        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.cameras.main.fadeIn(200, 0, 0, 0);

        /**
         * @callback handleResizeInicial
         * @description Função que recalcula e reposiciona todos os elementos da tela 
         * caso o canvas do jogo seja redimensionado (ex: mudança de orientação no celular ou redimensionamento de janela).
         */
        const handleResizeInicial = (tamanhoTela) => {
            const { width: largura, height: altura } = tamanhoTela;

            // Ajusta o tamanho e rec centraliza o background
            this.fundo.setPosition(largura / 2, altura / 2).setDisplaySize(largura, altura);

            // Recalcula o fator matemático base de escala da interface
            const novaEscalaBase = Math.min(largura, altura) * 0.00008;

            // Reposiciona as coordenadas e atualiza as escalas ativas de cada botão
            this.botaoJogar.setPosition(largura * 0.162, altura * 0.6).setScale(novaEscalaBase);
            this.botaoSair.setPosition(largura * 0.05, altura * 0.9).setScale(novaEscalaBase);
            this.botaoConfiguracoes.setPosition(largura * 0.28, altura * 0.9).setScale(novaEscalaBase * 10);
        };

        // Adiciona o ouvinte do evento de resize nativo do gerenciador de escala do Phaser
        this.scale.on("resize", handleResizeInicial);

        // Etapa crítica de limpeza (Garbage Collection): Remove o ouvinte de resize quando esta cena for fechada,
        // evitando conflitos visuais e vazamento de memória com cenas subsequentes.
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeInicial);
        });
    }

    /**
     * @method transicaoPara
     * @description Helper que gerencia a saída da cena atual, aplicando um efeito visual 
     * e desligando elementos desnecessários antes de inicializar a próxima cena.
     * @param {string} chaveCena - A chave (key) da cena destino (ex: "cenaTutorial")
     */
    transicaoPara(chaveCena) {
        // Trava de segurança contra múltiplos acionamentos
        if (this.transicao) return;

        this.transicao = true;
        this.cameras.main.fadeOut(300, 0, 0, 0);
        
        // Aguarda a câmera escurecer totalmente antes de efetuar a troca de fato
        this.cameras.main.once("camerafadeoutcomplete", () => {
            // Garante que a música não se sobreponha à trilha sonora da próxima cena
            if (gameState.musica?.isPlaying) {
                gameState.musica.stop();
            }
            this.scene.start(chaveCena);
        });
    }
}