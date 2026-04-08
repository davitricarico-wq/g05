// Importa o estado global do jogo e os arquivos necessarios para gerenciar o cachorro
import { gameState, iniciarMusicaAleatoria } from "../main.js";
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";

// Define a classe da cena do veterinario
export class cenaVeterinario extends Phaser.Scene {
    constructor() {
        super({ key: "cenaVeterinario" });
        
        // Variaveis de controle
        this.achouPulga = false;
        this.lupaSendoArrastada = false;
        this.escalaLupaBase = 0.8;
    }

    create() {
        // Atualiza as variaveis com base no estado global do jogo
        this.achouPulga = gameState.lupaJaUsada || false;
        this.lupaSendoArrastada = false;

        // Interface e Música
        if (!this.scene.isActive("HUD")) this.scene.launch("HUD");
        this.scene.bringToTop("HUD");

        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        // Configurações de Tela
        const larguraTotal = this.scale.width;
        const alturaTotal = this.scale.height;
        const areaUtilLargura = larguraTotal * 0.8; 

        // Fundo
        this.fundo = this.add.image(areaUtilLargura / 2, alturaTotal / 2, "bgVeterinario")
            .setDisplaySize(areaUtilLargura, alturaTotal)
            .setDepth(-1);

        // Cachorro
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0);
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);

        this.physics.add.existing(this.cachorro.sprite);
        this.cachorro.sprite.body.setAllowGravity(false);
        this.cachorro.sprite.body.immovable = true;

        // Pulgas Animadas (Pequenas no cachorro)
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
            .play("pulgaAnim")
            .setVisible(gameState.pulga);

        // Container do Cachorro
        this.containerCachorro = this.add.container(areaUtilLargura / 2, alturaTotal * 0.5, [
            this.cachorro.sprite, 
            this.pulgas
        ]);
        this.containerCachorro.setScale(alturaTotal * 0.0006);

        // Pulga Alvo (A que cresce no zoom)
        this.pulgaAlvo = this.add.image(0, 0, "pulga1")
            .setScale(0.1)
            .setDepth(15)
            .setVisible(false);

        // Lupa e Texto da Lupa
        this.escalaLupaBase = alturaTotal * 0.0012;
        this.lupa = this.add.image(areaUtilLargura * 0.5, alturaTotal * 0.85, "lupa")
            .setOrigin(0.5)
            .setDepth(10)
            .setScale(this.escalaLupaBase);

        // --- NOVO: Texto que acompanha a lupa ---
        this.textoLupa = this.add.text(this.lupa.x, this.lupa.y - 70, "Procure as pulgas!", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "14px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(11).setVisible(false);

        // Configuração de Arrastar
        if (!gameState.lupaJaUsada) {
            this.lupa.setInteractive({ useHandCursor: true });
            this.input.setDraggable(this.lupa);
        } else {
            this.lupa.setAlpha(0.5);
        }

        // EVENTOS DA LUPA
        this.lupa.on('dragstart', () => {
            if (this.achouPulga) return;
            this.lupaSendoArrastada = true;
            this.lupa.setScale(this.escalaLupaBase * 1.15); 
            this.textoLupa.setVisible(true);
        });

        this.lupa.on('drag', (pointer, dragX, dragY) => {
            if (this.achouPulga) return;
            
            this.lupa.x = dragX;
            this.lupa.y = dragY;
            
            // O texto segue a posição da lupa
            this.textoLupa.setPosition(dragX, dragY - 70);

            const distancia = Phaser.Math.Distance.Between(
                this.lupa.x, this.lupa.y,
                this.containerCachorro.x, this.containerCachorro.y
            );

            if (distancia < 150) {
                this.darZoomNaPulga();
            }
        });

        this.lupa.on('dragend', () => {
            if (this.achouPulga) return;
            this.lupaSendoArrastada = false;
            this.lupa.setScale(this.escalaLupaBase); 
            this.textoLupa.setVisible(false);
        });

        // Resize e Tutorial
        const handleResize = (tamanhoTela) => {
            const larguraTotal = tamanhoTela.width;
            const alturaTotal = tamanhoTela.height;
            const areaUtil = larguraTotal * 0.8; 

            if (this.fundo) this.fundo.setPosition(areaUtil / 2, alturaTotal / 2).setDisplaySize(areaUtil, alturaTotal);
            if (this.containerCachorro) this.containerCachorro.setPosition(areaUtil / 2, alturaTotal * 0.5).setScale(alturaTotal * 0.0006);
            if (this.lupa && !this.lupaSendoArrastada) {
                this.escalaLupaBase = alturaTotal * 0.0012;
                this.lupa.setPosition(areaUtil * 0.5, alturaTotal * 0.85).setScale(this.escalaLupaBase);
            }
        };

        this.scale.on("resize", handleResize);
        this.events.on('shutdown', () => this.scale.off("resize", handleResize));

        if (!gameState.instrucoesPulgasVistas) {
            this.mostrarInstrucoes();
        }
    }

    darZoomNaPulga() {
        if (this.achouPulga) return;

        this.achouPulga = true;
        this.lupaSendoArrastada = false;
        this.textoLupa.setVisible(false); // Esconde o texto ao encontrar

        this.pulgaAlvo.setVisible(true);
        this.pulgaAlvo.setPosition(this.lupa.x, this.lupa.y);

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

    update(time, delta) {
        if (this.cachorro?.update) this.cachorro.update(time, delta);
        if (this.pulgas) this.pulgas.setVisible(gameState.pulga);
    }

    mostrarInstrucoes() {
        this.scene.bringToTop();
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        const fundoEscuro = this.add.rectangle(centroX, centroY, this.scale.width, this.scale.height, 0x000000, 0.85)
            .setDepth(100).setInteractive();

        const telaInstrucao = this.add.image(centroX, centroY, "instrucaoPulgas")
            .setDepth(101).setInteractive({ useHandCursor: true }); 

        const escalaFinal = Math.min((this.scale.width * 0.8) / telaInstrucao.width, (this.scale.height * 0.8) / telaInstrucao.height);
        telaInstrucao.setScale(escalaFinal);

        const textoIniciar = this.add.text(centroX, centroY + (telaInstrucao.displayHeight / 2) + 40, "[ Clique ou ESPAÇO para começar ]", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "15px",
            color: "#ffffff"
        }).setOrigin(0.5).setDepth(101);
        
        this.tweens.add({ targets: textoIniciar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        let instrucoesLidas = false;
        const fecharInstrucoes = () => {
            if (instrucoesLidas) return;
            instrucoesLidas = true;
            fundoEscuro.destroy();
            telaInstrucao.destroy();
            textoIniciar.destroy();
            gameState.instrucoesPulgasVistas = true; 
            this.scene.bringToTop("HUD");
        };

        fundoEscuro.on('pointerdown', fecharInstrucoes);
        telaInstrucao.on('pointerdown', fecharInstrucoes);
        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', fecharInstrucoes);
        });
    }
}