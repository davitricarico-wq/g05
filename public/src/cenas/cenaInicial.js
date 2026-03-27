// Importa o objeto global gameState do arquivo principal
import { gameState } from "../main.js";

// Define a cena "CenaInicial", que é a tela principal do jogo
export class cenaInicial extends Phaser.Scene {
    constructor() {
        super({ key: "cenaInicial" });
        this.transicao = false; // Flag para evitar múltiplas transições de cena
    }

    create() {
        // Para garantir que a HUD não fique ativa ao iniciar
        this.scene.stop("HUD");
        this.transicao = false;

        // Música de fundo da tela inicial
        if (!gameState.musicaMenuPrincipal) {
            gameState.musicaMenuPrincipal = this.sound.add("musicaMenuPrincipal", { loop: true, volume: 0.5 });
        }
        if (gameState.musicaTutorial?.isPlaying) {
            gameState.musicaTutorial.stop();
        }
        if (!gameState.musicaMenuPrincipal.isPlaying) {
            gameState.musicaMenuPrincipal.play();
        }
        gameState.musica = gameState.musicaMenuPrincipal;


        // Fundo da cena inicial (responsivo)
        this.fundo = this.add
            .image(this.scale.width / 2, this.scale.height / 2, "bgInicial")
            .setDisplaySize(this.scale.width, this.scale.height);

        // Função utilitária para criar botões com troca de textura e animação de escala
        const criarBotao = (x, y, texturaNormal, texturaSobre, texturaPressionado, escalaBase, escalaAumentada, escalaPressionada, callback) => {
            const botao = this.add.image(x, y, texturaNormal).setScale(escalaBase).setInteractive({ useHandCursor: true });

            botao.on("pointerover", () => {
                botao.setTexture(texturaSobre);
                this.tweens.add({ targets: botao, scale: escalaAumentada, duration: 150, ease: "Power2" });
            });

            botao.on("pointerout", () => {
                botao.setTexture(texturaNormal);
                this.tweens.add({ targets: botao, scale: escalaBase, duration: 150, ease: "Power2" });
            });

            botao.on("pointerdown", () => {
                botao.setTexture(texturaPressionado);
                this.tweens.add({ targets: botao, scale: escalaPressionada, duration: 100, ease: "Power2" });
            });

            botao.on("pointerup", () => {
                botao.setTexture(texturaSobre);
                this.tweens.add({ targets: botao, scale: escalaAumentada, duration: 100, ease: "Power2" });
                if (callback) callback();
            });

            return botao;
        };

        // Escalas adaptativas (baseadas no tamanho da tela)
        const escalaBase = Math.min(this.scale.width, this.scale.height) * 0.00008;
        const escalaAumentada = escalaBase * 1.2;
        const escalaPressionada = escalaBase * 0.9;

        // Botão Jogar
        this.botaoJogar = criarBotao(
            this.scale.width * 0.162, this.scale.height * 0.6,
            "botaoJogarNormal", "botaoJogarCrescendo", "botaoJogarPressionado",
            escalaBase, escalaAumentada, escalaPressionada,
            () => this.transicaoPara("cenaTutorial")
        );

        // Botão Sair
        this.botaoSair = criarBotao(
            this.scale.width * 0.05, this.scale.height * 0.9,
            "botaoSairNormal", "botaoSairCrescendo", "botaoSairPressionado",
            escalaBase, escalaAumentada, escalaPressionada,
            () => this.game.destroy(true)
        );

        // Botão Configurações
        this.botaoConfiguracoes = criarBotao(
            this.scale.width * 0.28, this.scale.height * 0.9,
            "botaoConfiguracoesNormal", "botaoConfiguracoesCrescendo", "botaoConfiguracoesPressionado",
            escalaBase * 10, escalaAumentada * 10, escalaPressionada * 10, // Config maior
            () => {
                if (!this.scene.isActive("cenaConfiguracoes")) {
                    this.scene.launch("cenaConfiguracoes");
                }
            }
        );

        // Configuração da câmera (fade in inicial)
        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.cameras.main.fadeIn(200, 0, 0, 0);

        // Listener para redimensionamento da tela
        const handleResizeInicial = (tamanhoTela) => {
            const { width: largura, height: altura } = tamanhoTela;

            // Atualiza fundo
            this.fundo.setPosition(largura / 2, altura / 2).setDisplaySize(largura, altura);

            // Recalcula escalas
            const escalaBase = Math.min(largura, altura) * 0.00008;

            // Atualiza botões
            this.botaoJogar.setPosition(largura * 0.162, altura * 0.6).setScale(escalaBase);
            this.botaoSair.setPosition(largura * 0.05, altura * 0.9).setScale(escalaBase);
            this.botaoConfiguracoes.setPosition(largura * 0.28, altura * 0.9).setScale(escalaBase * 10);
        };

        this.scale.on("resize", handleResizeInicial);

        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeInicial);
        });
    }

    // Função para transição entre cenas com efeito de fade
    transicaoPara(chaveCena) {
        if (this.transicao) return;

        this.transicao = true;
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
            if (gameState.musica?.isPlaying) {
                gameState.musica.stop();
            }
            this.scene.start(chaveCena);
        });
    }
}
