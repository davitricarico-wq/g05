/**
 * CENA: CenaTutorial
 *
 * Exibe uma sequência de imagens que contam a história do jogo.
 * Responsiva: imagens e botões se adaptam ao redimensionamento da tela.
 */
import { gameState } from "../main.js"

export class cenaTutorial extends Phaser.Scene {
    constructor() {
        super({ key: 'cenaTutorial' });
        this.indiceAtual = 1;
        this.totalImagens = 11;
    }

    preload() {
        for (let i = 1; i <= this.totalImagens; i++) {
            this.load.image(`tutorial${i}`, `assets/tutorial${i}.png`);
        }
    }

    create() {
           if (!gameState.musicaTutorial) {
            gameState.musicaTutorial = this.sound.add("musicaTutorial", { loop: true, volume: 4.5 });
        }
        if (gameState.musicaMenuPrincipal?.isPlaying) {
            gameState.musicaMenuPrincipal.stop();
        }
        if (!gameState.musicaTutorial.isPlaying) {
            gameState.musicaTutorial.play();
        }
        gameState.musica = gameState.musicaTutorial;

        this.indiceAtual = 1;

        // Imagem centralizada e responsiva
        this.imagemAtual = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            `tutorial${this.indiceAtual}`
        ).setOrigin(0.5).setDepth(0)
         .setDisplaySize(this.scale.width, this.scale.height);

        // Texto de progresso
        this.textoProgresso = this.add.text(
            this.scale.width / 2,
            this.scale.height - 40,
            `${this.indiceAtual} / ${this.totalImagens}`,
            {
                fontFamily: 'Arial',
                fontSize: '22px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(10);

        // Botão anterior
        this.botaoAnterior = this.add.text(
            80, this.scale.height / 2,
            '◀',
            {
                fonteFamilia: 'Arial',
                fontSize: '52px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 5
            }
        ).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

        this.botaoAnterior.on('pointerover', () => this.botaoAnterior.setStyle({ color: '#ffdd00' }));
        this.botaoAnterior.on('pointerout',  () => this.botaoAnterior.setStyle({ color: '#ffffff' }));
        this.botaoAnterior.on('pointerdown', () => this.irParaImagem(this.indiceAtual - 1));

        // Botão próximo
        this.botaoProximo = this.add.text(
            this.scale.width - 80, this.scale.height / 2,
            '▶',
            {
                fonteFamilia: 'Arial',
                fontSize: '52px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 5
            }
        ).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

        this.botaoProximo.on('pointerover', () => this.botaoProximo.setStyle({ color: '#ffdd00' }));
        this.botaoProximo.on('pointerout',  () => this.botaoProximo.setStyle({ color: '#ffffff' }));
        this.botaoProximo.on('pointerdown', () => this.irParaImagem(this.indiceAtual + 1));

        // Botão pular
        this.botaoPular = this.add.text(
            this.scale.width - 100, 50,
            'Pular',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

        this.botaoPular.on('pointerover', () => this.botaoPular.setStyle({ color: '#ffdd00' }));
        this.botaoPular.on('pointerout',  () => this.botaoPular.setStyle({ color: '#ffffff' }));
        this.botaoPular.on('pointerdown', () => this.scene.start('cenaPrincipal'));

        this.atualizarBotoes();

        // Listener para redimensionamento da tela
        const handleResizeTutorial = (tamanhoTela) => {
            const { width: largura, height: altura } = tamanhoTela;

            // Ajusta câmera
            this.cameras.resize(largura, altura);

            // Ajusta imagem
            this.imagemAtual.setPosition(largura / 2, altura / 2)
                            .setDisplaySize(largura, altura);

            // Ajusta texto de progresso
            this.textoProgresso.setPosition(largura / 2, altura - 40);

            // Ajusta botões
            this.botaoAnterior.setPosition(80, altura / 2);
            this.botaoProximo.setPosition(largura - 80, altura / 2);
            this.botaoPular.setPosition(largura - 100, 50);
        };

        this.scale.on("resize", handleResizeTutorial);

        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeTutorial);
        });
    }

    irParaImagem(novoIndice) {
        if (novoIndice > this.totalImagens) {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('cenaPrincipal');
            });
            return;
        }
        if (novoIndice < 1) return;

        this.indiceAtual = novoIndice;
        this.imagemAtual.setTexture(`tutorial${this.indiceAtual}`);
        this.textoProgresso.setText(`${this.indiceAtual} / ${this.totalImagens}`);
        this.atualizarBotoes();
    }

    atualizarBotoes() {
        this.botaoAnterior.setVisible(this.indiceAtual > 1);

        if (this.indiceAtual === this.totalImagens) {
            this.botaoProximo.setText('JOGAR ▶')
                .setStyle({ fontSize: '32px', color: '#88ff88' });
        } else {
            this.botaoProximo.setText('▶')
                .setStyle({ fontSize: '52px', color: '#ffffff' });
        }
    }
}
