// Importa o estado global do jogo
import { gameState, iniciarMusica } from "../main.js"

// Define a classe da cena de tutorial
export class cenaTutorial extends Phaser.Scene {
    constructor() {
        super({ key: 'cenaTutorial' });
        
        // Define o índice inicial e o total de imagens do tutorial
        this.indiceAtual = 1;
        this.totalImagens = 11;
    }

    preload() {
        // Carrega todas as imagens do tutorial dinamicamente
        for (let i = 1; i <= this.totalImagens; i++) {
            this.load.image(`tutorial${i}`, `assets/tutorial${i}.png`);
        }
    }

    create() {

        // Inicia a música da cutscene
        if (gameState.musicaLigada) {
            iniciarMusica(this, 'musicaCutscene', true);
        }

        // Reinicia o índice da imagem ao entrar na cena
        this.indiceAtual = 1;

        // Imagem centralizada e responsiva ocupando toda a tela
        this.imagemAtual = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            `tutorial${this.indiceAtual}`
        ).setOrigin(0.5).setDepth(0)
         .setDisplaySize(this.scale.width, this.scale.height);

        // Texto de progresso (ex: 1 / 11)
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

        // Botão para voltar para a imagem anterior
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

        // Eventos de interação do botão anterior (passar o mouse, tirar o mouse, clicar)
        this.botaoAnterior.on('pointerover', () => this.botaoAnterior.setStyle({ color: '#ffdd00' }));
        this.botaoAnterior.on('pointerout',  () => this.botaoAnterior.setStyle({ color: '#ffffff' }));
        this.botaoAnterior.on('pointerdown', () => this.irParaImagem(this.indiceAtual - 1));

        // Botão para avançar para a próxima imagem
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

        // Eventos de interação do botão próximo
        this.botaoProximo.on('pointerover', () => this.botaoProximo.setStyle({ color: '#ffdd00' }));
        this.botaoProximo.on('pointerout',  () => this.botaoProximo.setStyle({ color: '#ffffff' }));
        this.botaoProximo.on('pointerdown', () => this.irParaImagem(this.indiceAtual + 1));

        // Botão para pular o tutorial e ir direto para o jogo principal
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

        // Eventos de interação do botão pular
        this.botaoPular.on('pointerover', () => this.botaoPular.setStyle({ color: '#ffdd00' }));
        this.botaoPular.on('pointerout',  () => this.botaoPular.setStyle({ color: '#ffffff' }));
        this.botaoPular.on('pointerdown', () => this.scene.start('cenaPrincipal'));

        // Atualiza a visibilidade e estado inicial dos botões
        this.atualizarBotoes();

        // Listener para redimensionamento da tela (garante a responsividade)
        const handleResizeTutorial = (tamanhoTela) => {
            const { width: largura, height: altura } = tamanhoTela;

            // Ajusta a câmera principal
            this.cameras.resize(largura, altura);

            // Ajusta o tamanho e a posição da imagem atual
            this.imagemAtual.setPosition(largura / 2, altura / 2)
                            .setDisplaySize(largura, altura);

            // Ajusta a posição do texto de progresso
            this.textoProgresso.setPosition(largura / 2, altura - 40);

            // Ajusta as posições dos botões
            this.botaoAnterior.setPosition(80, altura / 2);
            this.botaoProximo.setPosition(largura - 80, altura / 2);
            this.botaoPular.setPosition(largura - 100, 50);
        };

        // Escuta o evento de redimensionamento da janela
        this.scale.on("resize", handleResizeTutorial);

        // Remove o listener de redimensionamento quando a cena for encerrada para evitar vazamento de memória
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeTutorial);
        });
    }

    // Função para navegar entre as imagens do tutorial
    irParaImagem(novoIndice) {
        // Se passar da última imagem, faz um efeito de escurecimento e inicia a cena principal
        if (novoIndice > this.totalImagens) {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('cenaPrincipal');
            });
            return;
        }
        
        // Impede que o índice retorne para antes da primeira imagem
        if (novoIndice < 1) return;

        // Atualiza o índice, a textura da imagem na tela e o texto de progresso
        this.indiceAtual = novoIndice;
        this.imagemAtual.setTexture(`tutorial${this.indiceAtual}`);
        this.textoProgresso.setText(`${this.indiceAtual} / ${this.totalImagens}`);
        
        // Atualiza os botões com base no novo índice
        this.atualizarBotoes();
    }

    // Função para atualizar a visibilidade e o texto dos botões de navegação
    atualizarBotoes() {
        // O botão de voltar só fica visível se não estiver na primeira imagem
        this.botaoAnterior.setVisible(this.indiceAtual > 1);

        // Se estiver na última imagem, muda o texto e o estilo do botão "próximo" para "JOGAR"
        if (this.indiceAtual === this.totalImagens) {
            this.botaoProximo.setText('JOGAR ▶')
                .setStyle({ fontSize: '32px', color: '#88ff88' });
        } else {
            // Caso contrário, mantém a seta padrão
            this.botaoProximo.setText('▶')
                .setStyle({ fontSize: '52px', color: '#ffffff' });
        }
    }
}