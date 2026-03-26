// Importa o estado global
import { gameState } from "../main.js"

// Imports do sistema de cachorro
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js"
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js"

// Define a cena principal
export class cenaPrincipal extends Phaser.Scene {
    constructor() {
        super({ key: "cenaPrincipal" })
    }

    create() {
        // HUD
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD")
        }
        this.scene.bringToTop("HUD")

        // Música de fundo
        if (!gameState.musicaMenuPrincipal) {
            gameState.musicaMenuPrincipal = this.sound.add("musicaMenuPrincipal", { loop: true, volume: 0.5 })
        }
        if (gameState.musicaTutorial?.isPlaying) {
            gameState.musicaTutorial.stop();
        }
        if (!gameState.musicaMenuPrincipal.isPlaying) {
            gameState.musicaMenuPrincipal.play()
        }
        gameState.musica = gameState.musicaMenuPrincipal;

        // --- LÓGICA DE POSICIONAMENTO RESPONSIVO (ÁREA ÚTIL) ---
        const larguraTotal = this.scale.width;
        const alturaTotal = this.scale.height;
        const areaUtilLargura = larguraTotal * 0.8; // Desconto de 20% da HUD

        // Fundo da cena (ajustado para a área útil)
        this.bg = this.add
            .image(areaUtilLargura / 2, alturaTotal / 2, "bgPrincipal")
            .setDisplaySize(areaUtilLargura, alturaTotal)
            .setDepth(-1);

        // Criar cachorro
        this.gerenciadorCachorros = new GerenciadorCachorros(this)
        const indiceAtivo = gameState.pets.cachorroHeroi ? 1 : 0
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo])

        // Configuração das pulgas
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 2,
                repeat: -1
            })
        }

        this.pulgas = this.add.sprite(0, 0, "pulgas")
            .setOrigin(0.5)
            .setScale(alturaTotal * 0.0015) // Mantém o scale dinâmico da branch incoming
            .play("pulgaAnim")
            .setVisible(gameState.pulga);

        // Container (Cachorro + Pulgas)
        this.containerCachorro = this.add.container(areaUtilLargura / 2, alturaTotal * 0.7, [
            this.cachorro.sprite, 
            this.pulgas
        ]);

        // Ajuste de escala inicial
        const escalaBase = alturaTotal * 0.0006;
        this.containerCachorro.setScale(escalaBase);

        // --- TELA DE INSTRUÇÃO (Aparece apenas na primeira vez) ---
        if (!gameState.instrucaoMissaoVista) {
            const centroX = areaUtilLargura / 2;
            const centroY = alturaTotal / 2;

            // Fundo semi-transparente salvo no "this" para podermos redimensionar depois
            this.fundoEscuro = this.add.rectangle(centroX, centroY, areaUtilLargura, alturaTotal, 0x000000, 0.7)
                .setDepth(1000)
                .setInteractive(); 

            // Imagem de instrução (com escala reduzida para 50%)
            this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoMissao")
                .setDepth(1001)
                .setScale(0.5);

            // Calcula a posição do texto para ficar um pouco abaixo da imagem
            const posicaoTextoY = centroY + (this.imgInstrucao.displayHeight / 2) + 30;

            this.txtContinuar = this.add.text(centroX, posicaoTextoY, "[ Clique para continuar ]", {
                fontFamily: '"Press Start 2P", Arial',
                fontSize: "15px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(1001);

            // Efeito piscando suave no texto
            this.tweens.add({
                targets: this.txtContinuar,
                alpha: 0.4,
                duration: 800,
                yoyo: true,
                loop: -1
            });

            // Ao clicar, destrói a tela de aviso e salva no gameState
            this.fundoEscuro.on("pointerdown", () => {
                this.fundoEscuro.destroy();
                this.imgInstrucao.destroy();
                this.txtContinuar.destroy();
                
                // Limpa as variáveis para o resize ignorá-las
                this.fundoEscuro = null;
                this.imgInstrucao = null;
                this.txtContinuar = null;
                
                gameState.instrucaoMissaoVista = true; 
            });
        }
        // ----------------------------------------------------------

        // --- AJUSTE AQUI: Resize dinâmico otimizado ---
        const handleResizePrincipal = () => {
            if (!this.scene.isActive() || !this.cameras || !this.cameras.main) return;

            const novaLargura = this.scale.width;
            const novaAltura = this.scale.height;
            const novaAreaUtilLargura = novaLargura * 0.8; // Desconta 20%
            const novoCentroX = novaAreaUtilLargura / 2;
            const novoCentroY = novaAltura / 2;

            // 1. Atualiza Fundo
            if (this.bg) {
                this.bg.setPosition(novoCentroX, novoCentroY)
                       .setDisplaySize(novaAreaUtilLargura, novaAltura);
            }

            // 2. Atualiza Container
            if (this.containerCachorro) {
                const novaEscala = novaAltura * 0.0006;
                this.containerCachorro.setPosition(novoCentroX, novaAltura * 0.7)                          
                                      .setScale(novaEscala);
            }

            // 3. Ajusta a tela de instrução (se ela estiver aberta)
            if (this.fundoEscuro && this.fundoEscuro.active) {
                this.fundoEscuro.setSize(novaAreaUtilLargura, novaAltura);
                this.fundoEscuro.setPosition(novoCentroX, novoCentroY);
                
                if (this.imgInstrucao && this.imgInstrucao.active) {
                    this.imgInstrucao.setPosition(novoCentroX, novoCentroY);
                    
                    if (this.txtContinuar && this.txtContinuar.active) {
                        const novoPosicaoTextoY = novoCentroY + (this.imgInstrucao.displayHeight / 2) + 30;
                        this.txtContinuar.setPosition(novoCentroX, novoPosicaoTextoY);
                    }
                }
            }
        };

        this.scale.on("resize", handleResizePrincipal);

        // Limpa o evento de resize quando a cena for fechada/parada para evitar vazamento de memória e bugs
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizePrincipal);
        });

        // Câmera Inicial
        this.cameras.main.setBounds(0, 0, larguraTotal, alturaTotal);
        this.cameras.main.fadeIn(200, 0, 0, 0);
    }

    update() {
        if (this.gerenciadorCachorros) {
            this.gerenciadorCachorros.verificarCompletude()
        }
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga)
        }
    }
}