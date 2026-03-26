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
        const areaUtilLargura = larguraTotal * 0.8; 

        // Fundo da cena
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
            .setScale(alturaTotal * 0.0015) 
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

        // --- NOVA LÓGICA DE EVOLUÇÃO ---
        if (gameState.aguardandoEvolucao) {
            this.exibirPopupEvolucao();
        } 
        // --- FLUXO DE POPUPS INICIAIS ---
        else if (!gameState.instrucaoMissaoVista) {
            this.mostrarFicha();
        }

        // --- SEU RESIZE DINÂMICO ORIGINAL ---
        const handleResizePrincipal = () => {
            if (!this.scene.isActive() || !this.cameras || !this.cameras.main) return;

            const novaLargura = this.scale.width;
            const novaAltura = this.scale.height;
            const novaAreaUtilLargura = novaLargura * 0.8;
            const novoCentroX = novaAreaUtilLargura / 2;
            const novoCentroY = novaAltura / 2;

            if (this.bg) {
                this.bg.setPosition(novoCentroX, novoCentroY).setDisplaySize(novaAreaUtilLargura, novaAltura);
            }

            if (this.containerCachorro) {
                const novaEscala = novaAltura * 0.0006;
                this.containerCachorro.setPosition(novoCentroX, novaAltura * 0.7).setScale(novaEscala);
            }

            if (this.fundoEscuroFicha && this.fundoEscuroFicha.active) {
                this.fundoEscuroFicha.setSize(novaAreaUtilLargura, novaAltura).setPosition(novoCentroX, novoCentroY);
                if (this.containerFicha && this.containerFicha.active) this.containerFicha.setPosition(novoCentroX, novoCentroY);
                if (this.txtContinuarFicha && this.txtContinuarFicha.active) this.txtContinuarFicha.setPosition(novoCentroX, novoCentroY + 200);
            }

            if (this.fundoEscuroInstrucao && this.fundoEscuroInstrucao.active) {
                this.fundoEscuroInstrucao.setSize(novaAreaUtilLargura, novaAltura).setPosition(novoCentroX, novoCentroY);
                if (this.imgInstrucao && this.imgInstrucao.active) {
                    this.imgInstrucao.setPosition(novoCentroX, novoCentroY);
                    if (this.txtContinuarInstrucao && this.txtContinuarInstrucao.active) {
                        const novoPosicaoTextoY = novoCentroY + (this.imgInstrucao.displayHeight / 2) + 30;
                        this.txtContinuarInstrucao.setPosition(novoCentroX, novoPosicaoTextoY);
                    }
                }
            }
        };

        this.scale.on("resize", handleResizePrincipal);
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizePrincipal);
        });

        this.cameras.main.setBounds(0, 0, larguraTotal, alturaTotal);
        this.cameras.main.fadeIn(200, 0, 0, 0);
    }

    // --- SEU UPDATE ORIGINAL (MANTIDO!) ---
    update() {
        if (this.gerenciadorCachorros) {
            this.gerenciadorCachorros.verificarCompletude()
        }
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga)
        }
    }

    // --- MÉTODO DE EVOLUÇÃO ---
// --- MÉTODO DE EVOLUÇÃO ---
    exibirPopupEvolucao() {
        // 1. ESCONDER A HUD (Para o popup reinar sozinho na tela)
        if (this.scene.isActive("HUD")) {
            this.scene.get("HUD").scene.setVisible(false);
        }

        const larguraArea = this.scale.width * 0.8;
        const centroX = larguraArea / 2;
        const centroY = this.scale.height / 2;

        // 2. Criar o fundo (Overlay) - Ele bloqueia cliques no fundo
        const overlay = this.add.rectangle(centroX, centroY, larguraArea, this.scale.height, 0x000000, 0.8)
            .setDepth(5000)
            .setInteractive();

        // 3. Criar a imagem do Popup
        const popupImg = this.add.image(0, 0, "conclusaoPrimeiroRound")
            .setScale(0.6);
        
        // 4. Criar o texto
        const txt = this.add.text(0, 180, "[ Clique para Evoluir! ]", {
            fontFamily: '"Press Start 2P"', 
            fontSize: "16px", 
            fill: "#ffffff"
        }).setOrigin(0.5);

        // 5. Agrupar em um Container (Isso facilita MUITO a vida)
        const containerPopup = this.add.container(centroX, centroY, [popupImg, txt])
            .setDepth(5001);

        // 6. GARANTIR QUE TUDO ESTÁ NO TOPO DA CENA ATUAL
        this.children.bringToTop(overlay);
        this.children.bringToTop(containerPopup);

        // Animação opcional: faz o popup dar uma "puladinha" ao aparecer
        containerPopup.setScale(0.5);
        this.tweens.add({
            targets: containerPopup,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        overlay.on('pointerdown', () => {
            gameState.pets.cachorroCaramelo = false;
            gameState.pets.cachorroHeroi = true;
            gameState.progressoCachorro = 1;
            gameState.aguardandoEvolucao = false;
            gameState.barras = { comida: 11, lazer: 11, limpeza: 11, saude: 11 };
            gameState.pulga = true;

            // Antes de reiniciar, garantir que a HUD voltaria (embora o restart limpe tudo)
            this.scene.restart();
        });
    }

    // --- SUAS FUNÇÕES DE INTERFACE ORIGINAIS (MANTIDAS!) ---
    mostrarFicha() {
        const areaUtilLargura = this.scale.width * 0.8;
        const centroX = areaUtilLargura / 2;
        const centroY = this.scale.height / 2;

        this.fundoEscuroFicha = this.add.rectangle(centroX, centroY, areaUtilLargura, this.scale.height, 0x000000, 0.7).setDepth(1000).setInteractive();
        const pet = cachorrosBase[gameState.pets.cachorroHeroi ? 1 : 0];
        this.containerFicha = this.add.container(centroX, centroY).setDepth(1001);
        const fundoFicha = this.add.rectangle(0, 0, 500, 350, 0xf0e8bb).setOrigin(0.5);
        const estiloPixel = { fontFamily: '"Press Start 2P", Arial', fontSize: "14px", color: "#000000" };

        this.containerFicha.add([
            fundoFicha,
            this.add.text(-220, -120, `Ficha do Animal`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, -80, `Nome: ${pet.nome}`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, -40, `Peso: ${pet.peso}`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, 0, `Idade: ${pet.idade}`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, 40, `Porte: ${pet.porte}`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, 80, `Estado: ${pet.estado}`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, 120, `Historia: ${pet.historia}`, { ...estiloPixel, align: "left", wordWrap: { width: 420 } }).setOrigin(0, 0)
        ]);

        this.txtContinuarFicha = this.add.text(centroX, centroY + 200, "[ Clique para continuar ]", {
            fontFamily: '"Press Start 2P"', fontSize: "15px", color: "#ffffff", stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5).setDepth(1001);

        this.fundoEscuroFicha.on("pointerdown", () => {
            this.fundoEscuroFicha.destroy();
            this.containerFicha.destroy();
            this.txtContinuarFicha.destroy();
            this.mostrarInstrucao(); 
        });
    }

    mostrarInstrucao() {
        const areaUtilLargura = this.scale.width * 0.8;
        const centroX = areaUtilLargura / 2;
        const centroY = this.scale.height / 2;

        this.fundoEscuroInstrucao = this.add.rectangle(centroX, centroY, areaUtilLargura, this.scale.height, 0x000000, 0.7).setDepth(1000).setInteractive(); 
        this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoMissao").setDepth(1001).setScale(0.5);
        this.txtContinuarInstrucao = this.add.text(centroX, centroY + (this.imgInstrucao.displayHeight / 2) + 30, "[ Clique para comecar ]", {
            fontFamily: '"Press Start 2P"', fontSize: "15px", color: "#ffffff", stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5).setDepth(1001);

        this.fundoEscuroInstrucao.on("pointerdown", () => {
            this.fundoEscuroInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.txtContinuarInstrucao.destroy();
            gameState.instrucaoMissaoVista = true;
        });
    }
}