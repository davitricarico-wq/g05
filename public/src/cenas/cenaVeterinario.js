// Importa o estado global do jogo e os arquivos necessarios para gerenciar o cachorro
import { gameState } from "../main.js";
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";

// Define a classe da cena do veterinario
export class cenaVeterinario extends Phaser.Scene {
    constructor() {
        super({ key: "cenaVeterinario" });
        
        // Variaveis de controle para saber se a pulga foi encontrada e o estado da lupa
        this.achouPulga = false;
        this.lupaSendoArrastada = false;
        this.escalaLupaBase = 0.8;
    }

    create() {
        // Atualiza as variaveis com base no estado global do jogo
        this.achouPulga = gameState.lupaJaUsada || false;
        this.lupaSendoArrastada = false;

        // Inicia e traz a interface de usuario para a frente da tela
        if (!this.scene.isActive("HUD")) this.scene.launch("HUD");
        this.scene.bringToTop("HUD");

        // Configura e toca a musica principal do jogo
        if (!gameState.musicaMenuPrincipal) {
            gameState.musicaMenuPrincipal = this.sound.add("musicaMenuPrincipal", { loop: true, volume: 1.0 });
        }
        
        // Para a musica do tutorial se ela estiver tocando
        if (gameState.musicaTutorial?.isPlaying) {
            gameState.musicaTutorial.stop();
        }
        
        // Garante que a musica principal comece a tocar
        if (!gameState.musicaMenuPrincipal.isPlaying) gameState.musicaMenuPrincipal.play();
        gameState.musica = gameState.musicaMenuPrincipal;

        // Define o tamanho da tela e a area jogavel descontando o espaco da interface
        const larguraTotal = this.scale.width;
        const alturaTotal = this.scale.height;
        const areaUtilLargura = larguraTotal * 0.8; 

        // Adiciona a imagem de fundo centralizada na area util
        this.fundo = this.add.image(areaUtilLargura / 2, alturaTotal / 2, "bgVeterinario")
            .setDisplaySize(areaUtilLargura, alturaTotal)
            .setDepth(-1);

        // Instancia o gerenciador e cria o cachorro na tela
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[0]);

        // Adiciona fisica ao cachorro sem gravidade e travado no lugar para nao se mover
        this.physics.add.existing(this.cachorro.sprite);
        this.cachorro.sprite.body.setAllowGravity(false);
        this.cachorro.sprite.body.immovable = true;

        // Cria a animacao das pulgas caso ainda nao exista no jogo
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 1,  
                repeat: -1     
            });
        }

        // Adiciona a imagem animada das pulgas e vincula sua visibilidade ao estado global
        this.pulgas = this.add.sprite(0, 0, "pulgas")
            .setOrigin(0.5)
            .play("pulgaAnim")
            .setVisible(gameState.pulga);

        // Agrupa o cachorro e as pulgas em um container para facilitar o ajuste de tamanho juntos
        this.containerCachorro = this.add.container(areaUtilLargura / 2, alturaTotal * 0.5, [
            this.cachorro.sprite, 
            this.pulgas
        ]);
        this.containerCachorro.setScale(alturaTotal * 0.0006);

        // Prepara a imagem da pulga gigante que aparecera depois inicialmente invisivel
        this.pulgaAlvo = this.add.image(0, 0, "pulga1")
            .setScale(0.1)
            .setDepth(15)
            .setVisible(false);

        // Adiciona o texto de instrucao centralizado inicialmente escondido
        this.textoInstrucao = this.add.text(areaUtilLargura / 2, alturaTotal * 0.15,
            "Ache as pulgas e retire elas.",
            {
                fontFamily: '"Press Start 2P", Arial',
                fontSize: "20px",
                color: "#ffd166",
                stroke: "#000000",
                strokeThickness: 4,
                align: "center"
            }
        ).setOrigin(0.5).setDepth(20).setVisible(false);

        // Configura e adiciona a lupa na tela
        this.escalaLupaBase = alturaTotal * 0.0012;
        this.lupa = this.add.image(areaUtilLargura * 0.5, alturaTotal * 0.85, "lupa")
            .setOrigin(0.5)
            .setDepth(10)
            .setScale(this.escalaLupaBase);

        // Torna a lupa arrastavel se o jogador ainda nao a usou ou deixa transparente se ja usou
        if (!gameState.lupaJaUsada) {
            this.lupa.setInteractive({ useHandCursor: true });
            this.input.setDraggable(this.lupa);
        } else {
            this.lupa.setAlpha(0.5);
        }

        // Evento disparado quando o jogador comeca a arrastar a lupa
        this.lupa.on('dragstart', () => {
            if (this.achouPulga) return;
            this.lupaSendoArrastada = true;
            this.lupa.setScale(this.escalaLupaBase * 1.15); 
            this.textoInstrucao.setVisible(true);
        });

        // Evento disparado enquanto a lupa esta sendo arrastada pela tela
        this.lupa.on('drag', (pointer, dragX, dragY) => {
            if (this.achouPulga) return;
            this.lupa.x = dragX;
            this.lupa.y = dragY;

            // Calcula a distancia entre a lupa e o cachorro
            const distancia = Phaser.Math.Distance.Between(
                this.lupa.x, this.lupa.y,
                this.containerCachorro.x, this.containerCachorro.y
            );

            // Se a lupa chegar muito perto do cachorro aciona o zoom na pulga
            if (distancia < 150) {
                this.darZoomNaPulga();
            }
        });

        // Evento disparado quando o jogador solta a lupa
        this.lupa.on('dragend', () => {
            if (this.achouPulga) return;
            this.lupaSendoArrastada = false;
            this.lupa.setScale(this.escalaLupaBase); 
            this.textoInstrucao.setVisible(false);
        });

        // Funcao para manter todos os elementos no lugar correto se a tela mudar de tamanho
        const handleResize = (tamanhoTela) => {
            const larguraTotal = tamanhoTela.width;
            const alturaTotal = tamanhoTela.height;
            const areaUtil = larguraTotal * 0.8; 

            // Reposiciona e ajusta o fundo
            if (this.fundo) {
                this.fundo.setPosition(areaUtil / 2, alturaTotal / 2)
                          .setDisplaySize(areaUtil, alturaTotal);
            }

            // Reposiciona e ajusta o container do cachorro
            if (this.containerCachorro) {
                const novaEscalaCachorro = alturaTotal * 0.0006;
                this.containerCachorro.setPosition(areaUtil / 2, alturaTotal * 0.5)
                                      .setScale(novaEscalaCachorro);
            }

            // Reposiciona e ajusta a lupa caso nao esteja sendo arrastada no momento
            if (this.lupa && !this.lupaSendoArrastada) {
                this.escalaLupaBase = alturaTotal * 0.0012;
                this.lupa.setPosition(areaUtil * 0.5, alturaTotal * 0.85)
                         .setScale(this.escalaLupaBase);
            }

            // Reposiciona o texto de instrucao
            if (this.textoInstrucao) {
                this.textoInstrucao.setPosition(areaUtil / 2, alturaTotal * 0.15);
            }
        };

        // Avisa o jogo para escutar mudancas de tamanho da tela
        this.scale.on("resize", handleResize);

        // Remove o evento de redimensionamento ao fechar a cena para evitar erros de memoria
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResize);
        });

        // Mostra o tutorial de pulgas se for a primeira vez do jogador nesta etapa
        if (!gameState.instrucoesPulgasVistas) {
            this.mostrarInstrucoes();
        }
    }

    // Funcao que faz a pulga crescer na tela quando encontrada com a lupa
    darZoomNaPulga() {
        if (this.achouPulga) return;

        this.achouPulga = true;
        this.lupaSendoArrastada = false;

        // Revela a pulga gigante exatamente onde a lupa esta
        this.pulgaAlvo.setVisible(true);
        this.pulgaAlvo.setPosition(this.lupa.x, this.lupa.y);

        // Cria uma animacao de crescimento suave para a pulga e muda de cena ao terminar
        this.tweens.add({
            targets: this.pulgaAlvo,
            scale: 1.5,
            duration: 600,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    gameState.cachorroTemPulga = true;
                    this.scene.start("cenaCuidado");
                });
            }
        });
    }

    // Funcao que roda a cada quadro do jogo para atualizar animacoes continuas
    update(time, delta) {
        if (this.cachorro?.update) {
            this.cachorro.update(time, delta);
        }
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga);
        }
    }

    // Funcao para exibir a tela de tutorial inicial
    mostrarInstrucoes() {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        // Cria um fundo escuro transparente cobrindo toda a tela
        const fundoEscuro = this.add.rectangle(centroX, centroY, this.scale.width, this.scale.height, 0x000000, 0.7)
            .setDepth(100).setInteractive();

        // Adiciona a imagem de instrucoes no centro e permite clicar nela
        const telaInstrucao = this.add.image(centroX, centroY, "instrucaoPulgas")
            .setDepth(101).setInteractive({ useHandCursor: true }); 

        // Calcula a melhor escala para a imagem caber bem na tela
        const escalaFinal = Math.min(this.scale.width * 0.8 / telaInstrucao.width, this.scale.height * 0.8 / telaInstrucao.height);
        telaInstrucao.setScale(escalaFinal);

        // Funcao interna para fechar as instrucoes e registrar que o jogador ja leu
        const fecharInstrucoes = () => {
            fundoEscuro.destroy();
            telaInstrucao.destroy();
            gameState.instrucoesPulgasVistas = true; 
            this.scene.bringToTop("HUD");
        };

        // Permite fechar clicando no fundo escuro ou na propria imagem
        fundoEscuro.on('pointerdown', fecharInstrucoes);
        telaInstrucao.on('pointerdown', fecharInstrucoes);
    }
}