// Importa o estado global do jogo (para persistência de configurações de áudio)
// e a função utilitária para gerenciamento de música contínua.
import { gameState, iniciarMusica } from "../main.js"

/**
 * @class cenaTutorial
 * @extends Phaser.Scene
 * @description Classe responsável por apresentar o tutorial do jogo no formato de 
 * "slideshow" (carrossel de imagens). Gerencia a navegação entre as telas, 
 * feedback visual dos botões e a transição final para a cena de gameplay.
 */
export class cenaTutorial extends Phaser.Scene {
    constructor() {
        // Define a chave identificadora desta cena para o gerenciador do Phaser
        super({ key: 'cenaTutorial' });
        
        // Controla qual slide o jogador está visualizando no momento
        this.indiceAtual = 1;
        // Total estático de imagens que compõem o tutorial (define o limite da paginação)
        this.totalImagens = 11;
    }

    /**
     * @method preload
     * @description Método do ciclo de vida do Phaser responsável por carregar os 
     * assets na memória antes da cena ser renderizada.
     */
    preload() {
        // Carrega todas as imagens do tutorial dinamicamente através de um loop,
        for (let i = 1; i <= this.totalImagens; i++) {
            this.load.image(`tutorial${i}`, `assets/tutorial${i}.png`);
        }
    }

    /**
     * @method create
     * @description Monta os elementos visuais da cena, configura a interatividade 
     * dos botões de navegação e estabelece as regras de responsividade.
     */
    create() {
        // Verifica a preferência do usuário e inicia a música temática da cutscene.
        if (gameState.musicaLigada) {
            iniciarMusica(this, 'musicaCutscene', true);
        }

        // Garante que, caso o jogador retorne ao tutorial depois de já ter jogado,
        this.indiceAtual = 1;

        // Imagem centralizada que servirá como a "tela" do slide.
        this.imagemAtual = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            `tutorial${this.indiceAtual}`
        ).setOrigin(0.5).setDepth(0)
         .setDisplaySize(this.scale.width, this.scale.height);

        // Texto que indica o progresso atual do jogador 
        this.textoProgresso = this.add.text(
            this.scale.width / 2,
            this.scale.height - 40,
            `${this.indiceAtual} / ${this.totalImagens}`,
            {
                fontFamily: 'Arial',
                fontSize: '22px',
                color: '#ffffff',
                stroke: '#000000',     // Contorno preto para garantir legibilidade
                strokeThickness: 4     // sobre fundos claros ou escuros
            }
        ).setOrigin(0.5).setDepth(10);

        // Botão voltar (Anterior) 
        this.botaoAnterior = this.add.text(
            80, this.scale.height / 2, // Fixo na lateral esquerda, centralizado no eixo Y
            '◀',
            {
                fontFamily: 'Arial', // Corrigido 'fonteFamilia' para o padrão 'fontFamily'
                fontSize: '52px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 5
            }
        ).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

        // Eventos de interatividade visual para o botão Voltar (Hover e Clique)
        this.botaoAnterior.on('pointerover', () => this.botaoAnterior.setStyle({ color: '#ffdd00' })); // Fica amarelo
        this.botaoAnterior.on('pointerout',  () => this.botaoAnterior.setStyle({ color: '#ffffff' })); // Retorna ao branco
        this.botaoAnterior.on('pointerdown', () => this.irParaImagem(this.indiceAtual - 1));

        // Botão avançar (Próximo)
        this.botaoProximo = this.add.text(
            this.scale.width - 80, this.scale.height / 2, // Fixo na lateral direita
            '▶',
            {
                fontFamily: 'Arial', // Corrigido 'fonteFamilia' para o padrão 'fontFamily'
                fontSize: '52px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 5
            }
        ).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

        // Eventos de interatividade visual para o botão Avançar
        this.botaoProximo.on('pointerover', () => this.botaoProximo.setStyle({ color: '#ffdd00' }));
        this.botaoProximo.on('pointerout',  () => this.botaoProximo.setStyle({ color: '#ffffff' }));
        this.botaoProximo.on('pointerdown', () => this.irParaImagem(this.indiceAtual + 1));

        // Botão pular (Skip)
        this.botaoPular = this.add.text(
            this.scale.width - 100, 50, // Canto superior direito
            'Pular',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

        // Eventos do botão Pular: Redireciona diretamente para a cena principal, ignorando os slides
        this.botaoPular.on('pointerover', () => this.botaoPular.setStyle({ color: '#ffdd00' }));
        this.botaoPular.on('pointerout',  () => this.botaoPular.setStyle({ color: '#ffffff' }));
        this.botaoPular.on('pointerdown', () => this.scene.start('cenaPrincipal'));

        // Chama a função de atualização para configurar a visibilidade correta dos botões 
        this.atualizarBotoes();

        /**
         * @callback handleResizeTutorial
         * @description Reposiciona e redimensiona os elementos dinamicamente 
         * sempre que a tela ou janela do navegador mudar de tamanho.
         */
        const handleResizeTutorial = (tamanhoTela) => {
            const { width: largura, height: altura } = tamanhoTela;

            this.cameras.resize(largura, altura);

            // Mantém o slide ocupando 100% da tela nova
            this.imagemAtual.setPosition(largura / 2, altura / 2)
                            .setDisplaySize(largura, altura);

            // Reposiciona os elementos de UI com base nas novas dimensões
            this.textoProgresso.setPosition(largura / 2, altura - 40);
            this.botaoAnterior.setPosition(80, altura / 2);
            this.botaoProximo.setPosition(largura - 80, altura / 2);
            this.botaoPular.setPosition(largura - 100, 50);
        };

        this.scale.on("resize", handleResizeTutorial);

        // Etapa de limpeza (Garbage Collection): Remove o listener de resize 
        // quando a cena for destruída, prevenindo vazamentos de memória (memory leaks).
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeTutorial);
        });
    }

    /**
     * @method irParaImagem
     * @description Lógica central de paginação do tutorial. Atualiza a textura da imagem 
     * e o texto, ou inicia o jogo caso o tutorial tenha chegado ao fim.
     * @param {number} novoIndice - O número do slide a ser carregado.
     */
    irParaImagem(novoIndice) {
        // Lógica de finalização: Se o jogador tentar avançar além da última imagem, encerramos o tutorial com um efeito suave (fade out) e iniciamos o jogo.
        if (novoIndice > this.totalImagens) {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('cenaPrincipal');
            });
            return;
        }
        
        // Proteção de limite inferior: impede que o índice seja menor que 1.
        if (novoIndice < 1) return;

        // Atualiza o estado da classe para o novo índice
        this.indiceAtual = novoIndice;
        
        // Troca a imagem de fundo utilizando a chave gerada no preload (ex: 'tutorial2')
        this.imagemAtual.setTexture(`tutorial${this.indiceAtual}`);
        
        // Atualiza o texto do contador na tela
        this.textoProgresso.setText(`${this.indiceAtual} / ${this.totalImagens}`);
        
        // Reavalia a aparência e visibilidade dos botões com o novo slide
        this.atualizarBotoes();
    }

    /**
     * @method atualizarBotoes
     * @description Ajusta a interface de usuário dependendo de qual slide está sendo 
     * visualizado (UX/UI Dynamics).
     */
    atualizarBotoes() {
        // Esconde o botão "Anterior" se o jogador estiver no primeiro slide,
        // pois não há para onde voltar.
        this.botaoAnterior.setVisible(this.indiceAtual > 1);

        // Se o jogador chegou na última imagem do tutorial, transforma o botão "Avançar"
        // em um botão de "JOGAR" evidente (texto verde e maior) para um Call to Action claro.
        if (this.indiceAtual === this.totalImagens) {
            this.botaoProximo.setText('JOGAR ▶')
                .setStyle({ fontSize: '32px', color: '#88ff88' });
        } else {
            // Caso contrário, restaura o visual padrão da seta de navegação
            this.botaoProximo.setText('▶')
                .setStyle({ fontSize: '52px', color: '#ffffff' });
        }
    }
}