import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";
import { gameState } from "../main.js";

export class cenaComida extends Phaser.Scene {
    
    constructor() {
        super({ key: "cenaComida" });
        this.transicao = false;
    }

    create() {
        this.transicao = false;

        // HUD Management
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD");
        } else if (this.scene.isSleeping("HUD")) {
            this.scene.wake("HUD");
        }
        this.scene.bringToTop("HUD");

        // Melhoria Semântica: Renomeado para refletir que são dimensões (largura e altura)
        const larguraUtil = this.scale.width * 0.8; 
        const alturaTotal = this.scale.height;

        /**
         * Aplica efeitos visuais de feedback (Hover e Click)
         */
        const passarPressionarEfeito = (alvo, escalaNormal, escalaPassar) => {
            // Removido alvo.removeAllListeners() para não matar outros eventos anexados ao objeto
            
            alvo.on("pointerover", () => {
                this.tweens.add({ targets: alvo, scaleX: escalaPassar, scaleY: escalaPassar, duration: 200 });
            });

            alvo.on("pointerdown", () => {
                this.tweens.add({ targets: alvo, scaleX: escalaNormal * 0.9, scaleY: escalaNormal * 0.9, duration: 150, yoyo: true });
            });

            alvo.on("pointerout", () => {
                this.tweens.add({ targets: alvo, scaleX: escalaNormal, scaleY: escalaNormal, duration: 200 });
            });
        };

        // Cenário
        this.fundo = this.add.image(larguraUtil / 2, alturaTotal / 2, "bgRacao")
            .setDisplaySize(larguraUtil, alturaTotal)
            .setDepth(-1);

        // Estante
        const estante = this.add.image(larguraUtil * 0.25, alturaTotal * 0.68, "estanteRacao")
            .setScale(alturaTotal * 0.0006)
            .setInteractive({ useHandCursor: true });

        passarPressionarEfeito(estante, estante.scaleX, estante.scaleX * 1.1);

        estante.on("pointerdown", () => {
            const cenaHUD = this.scene.manager.getScene("HUD");
            if (cenaHUD && cenaHUD.transicionarPara) {
                cenaHUD.transicionarPara("cenaRacaoSuperPremium");
            } else {
                this.scene.start("cenaRacaoSuperPremium");
            }
        });

        // Bilhete / Ficha
        gameState.bilhete = this.add.image(
            this.scale.width * 0.7, 
            this.scale.height * 0.25,
            'mineFicha'
        )
        .setScale(0.15)
        .setInteractive({ useHandCursor: true });
        
        gameState.bilhete.setDepth(10); 
        this.profundidadeOriginalBilhete = gameState.bilhete.depth;
        
        passarPressionarEfeito(gameState.bilhete, 0.15, 0.18);

        gameState.bilhete.on('pointerdown', () => {
            if (this.overlayFicha) {
                this.overlayFicha.destroy();
                this.overlayFicha = null;
                if (this.txtCliqueFicha) this.txtCliqueFicha.destroy();
                
                gameState.bilhete.setDepth(this.profundidadeOriginalBilhete);
                gameState.enfaseFichaVista = true; 
            }

            if(this.scene.isActive('ficha')) {
                this.scene.stop('ficha');
            } else {
                this.scene.launch('ficha');
            }
        });

        // Tigela Vazia
        const racaoVazia = this.add.image((larguraUtil / 2) + (larguraUtil / 2) * 0.1, alturaTotal / 2 + alturaTotal * 0.4, "racaoVazia")
            .setScale(alturaTotal * 0.0002);

        // Pet e Pulgas
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[0]);
        const elementosContainer = [this.cachorro.sprite];

        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 1,  
                repeat: -1     
            });
        }

        this.pulgas = this.add.sprite(0, 0, "pulgas")
            .setOrigin(0.5)
            .setScale(alturaTotal * 0.0015);

        this.pulgas.play("pulgaAnim");
        this.pulgas.setVisible(gameState.pulga); 
        elementosContainer.push(this.pulgas); 

        // Container do Pet
        const dogX = (larguraUtil / 2) + (larguraUtil / 2) * 0.4;
        const dogY = (alturaTotal / 2) + (alturaTotal / 2) * 0.25;

        this.containerCachorro = this.add.container(dogX, dogY, elementosContainer);
        this.containerCachorro.setScale(alturaTotal * 0.0007);

        // Tutoriais
        if (!gameState.instrucaoRacaoVista) {
            this.mostrarInstrucaoRacao(larguraUtil, alturaTotal);
        } else if (!gameState.enfaseFichaVista) {
            this.destacarFicha(larguraUtil, alturaTotal);
        }

        // Responsividade
        const handleResizeComida = () => {
            if (!this.scene.isActive() || !this.cameras || !this.cameras.main) return;

            const novaLarguraUtil = this.scale.width * 0.8;
            const novaAlturaTotal = this.scale.height;
            const novoCentroX = novaLarguraUtil / 2;
            const novoCentroY = novaAlturaTotal / 2;

            this.fundo.setPosition(novoCentroX, novoCentroY).setDisplaySize(novaLarguraUtil, novaAlturaTotal);
            estante.setPosition(novaLarguraUtil * 0.25, novaAlturaTotal * 0.68).setScale(novaAlturaTotal * 0.0006);
            gameState.bilhete.setPosition(this.scale.width * 0.7, novaAlturaTotal * 0.25).setScale(0.15);
            racaoVazia.setPosition(novoCentroX + novoCentroX * 0.1, novoCentroY + novaAlturaTotal * 0.4).setScale(novaAlturaTotal * 0.0002);
            
            const novoDogX = novoCentroX + novoCentroX * 0.4;
            const novoDogY = novoCentroY + novoCentroY * 0.25;
            this.containerCachorro.setPosition(novoDogX, novoDogY).setScale(novaAlturaTotal * 0.0007);
            this.pulgas.setScale(novaAlturaTotal * 0.0015);

            if (this.fundoEscuroInstrucao && this.fundoEscuroInstrucao.active) {
                this.fundoEscuroInstrucao.setSize(novaLarguraUtil, novaAlturaTotal);
                this.fundoEscuroInstrucao.setPosition(novoCentroX, novoCentroY);
                if (this.imgInstrucao && this.imgInstrucao.active) {
                    this.imgInstrucao.setPosition(novoCentroX, novoCentroY);
                    if (this.txtContinuarInstrucao && this.txtContinuarInstrucao.active) {
                        const novoPosicaoTextoY = novoCentroY + (this.imgInstrucao.displayHeight / 2) + 30;
                        this.txtContinuarInstrucao.setPosition(novoCentroX, novoPosicaoTextoY);
                    }
                }
            }

            if (this.overlayFicha && this.overlayFicha.active) {
                this.overlayFicha.setSize(novaLarguraUtil, novaAlturaTotal);
                this.overlayFicha.setPosition(novoCentroX, novoCentroY);
            }
            if (this.txtCliqueFicha && this.txtCliqueFicha.active) {
                this.txtCliqueFicha.setPosition(this.scale.width * 0.7, (novaAlturaTotal * 0.25) + 60);
            }
        };

        this.scale.on("resize", handleResizeComida);

        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeComida);
        });
    }

    update() {
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga);
        }

        // Melhoria: Reset do gameState.trocar para evitar chamadas múltiplas da função por frame
        if (gameState.trocar) {
            this.gerenciadorCachorros.mudarParaCachorroHeroi();
            gameState.trocar = false; // Impede que mude 60 vezes por segundo
        }
    }

    mostrarInstrucaoRacao(larguraUtil, alturaTotal) {
        const centroX = larguraUtil / 2;
        const centroY = alturaTotal / 2;

        this.fundoEscuroInstrucao = this.add.rectangle(centroX, centroY, larguraUtil, alturaTotal, 0x000000, 0.7)
            .setDepth(1000)
            .setInteractive(); 

        this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoRacao")
            .setDepth(1001)
            .setScale(0.5);

        const posicaoTextoY = centroY + (this.imgInstrucao.displayHeight / 2) + 30;
        this.txtContinuarInstrucao = this.add.text(centroX, posicaoTextoY, "[ Clique para continuar ]", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "15px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(1001);

        this.tweens.add({
            targets: this.txtContinuarInstrucao, 
            alpha: 0.4, 
            duration: 800, 
            yoyo: true, 
            loop: -1
        });

        this.fundoEscuroInstrucao.on("pointerdown", () => {
            this.fundoEscuroInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.txtContinuarInstrucao.destroy();
            
            this.fundoEscuroInstrucao = null;
            this.imgInstrucao = null;
            this.txtContinuarInstrucao = null;
            
            gameState.instrucaoRacaoVista = true; 
            
            if (!gameState.enfaseFichaVista) {
                this.destacarFicha(larguraUtil, alturaTotal);
            }
        });
    }

    destacarFicha(larguraUtil, alturaTotal) {
        const centroX = larguraUtil / 2;
        const centroY = alturaTotal / 2;

        this.overlayFicha = this.add.rectangle(centroX, centroY, larguraUtil, alturaTotal, 0x000000, 0.7)
            .setDepth(900)
            .setInteractive(); 

        gameState.bilhete.setDepth(901);

        this.txtCliqueFicha = this.add.text(
            this.scale.width * 0.7, 
            (this.scale.height * 0.25) + 60, 
            "Clique na ficha!", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "12px",
            color: "#ffffff",
            align: "center",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(901);

        this.tweens.add({
            targets: this.txtCliqueFicha,
            alpha: 0.4,
            duration: 600,
            yoyo: true,
            loop: -1
        });
    }
}