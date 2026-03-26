// Importa o estado global
import { gameState } from "../main.js"

// Imports do sistema de cachorro
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js"
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js"

// ====================================================================
// NOVA CENA: Gerencia apenas os Popups (Fica acima da HUD e do Jogo)
// ====================================================================
class CenaPopups extends Phaser.Scene {
    constructor() {
        super({ key: "CenaPopups" });
    }

    create() {
        // Decide qual popup mostrar
        if (gameState.aguardandoEvolucao) {
            this.exibirPopupEvolucao();
        } else if (!gameState.instrucaoMissaoVista) {
            this.mostrarFicha();
        }

        // Lógica de Resize exclusiva para os Popups
        const handleResizePopups = () => {
            if (!this.scene.isActive() || !this.cameras || !this.cameras.main) return;

            const novaLargura = this.scale.width;
            const novaAltura = this.scale.height;
            const novaAreaUtilLargura = novaLargura * 0.8;
            const novoCentroX = novaAreaUtilLargura / 2;
            const novoCentroY = novaAltura / 2;

            if (this.imgEvolucao && this.imgEvolucao.active) this.imgEvolucao.setPosition(novoCentroX, novoCentroY);
            if (this.txtEvolucao && this.txtEvolucao.active) this.txtEvolucao.setPosition(novoCentroX, novoCentroY + 180);

            if (this.containerFicha && this.containerFicha.active) this.containerFicha.setPosition(novoCentroX, novoCentroY);
            if (this.txtContinuarFicha && this.txtContinuarFicha.active) this.txtContinuarFicha.setPosition(novoCentroX, novoCentroY + 200);
            
            if (this.imgInstrucao && this.imgInstrucao.active) {
                this.imgInstrucao.setPosition(novoCentroX, novoCentroY);
                if (this.txtContinuarInstrucao && this.txtContinuarInstrucao.active) {
                    const novoPosicaoTextoY = novoCentroY + (this.imgInstrucao.displayHeight / 2) + 30;
                    this.txtContinuarInstrucao.setPosition(novoCentroX, novoPosicaoTextoY);
                }
            }
        };

        this.scale.on("resize", handleResizePopups);
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizePopups);
        });
    }

    exibirPopupEvolucao() {
        const areaUtilLargura = this.scale.width * 0.8; 
        const centroX = areaUtilLargura / 2;
        const centroY = this.scale.height / 2;

        this.imgEvolucao = this.add.image(centroX, centroY, "conclusaoPrimeiroRound")
            .setScale(0.6)
            .setInteractive({ useHandCursor: true }); 
        
        this.txtEvolucao = this.add.text(centroX, centroY + 180, "[ Clique para Evoluir! ]", {
            fontFamily: '"Press Start 2P"', 
            fontSize: "16px", 
            fill: "#ffffff"
        }).setOrigin(0.5);

        this.imgEvolucao.on('pointerdown', () => {
            gameState.pets.cachorroCaramelo = false;
            gameState.pets.cachorroHeroi = true;
            gameState.progressoCachorro = 1;
            gameState.aguardandoEvolucao = false;
            gameState.barras = { comida: 11, lazer: 11, limpeza: 11, saude: 11 };
            gameState.pulga = true;

            // Para a cena de popups e reinicia a cena principal
            this.scene.stop();
            this.scene.get("cenaPrincipal").scene.restart();
        });
    }

    mostrarFicha() {
        const areaUtilLargura = this.scale.width * 0.8;
        const centroX = areaUtilLargura / 2;
        const centroY = this.scale.height / 2;

        const pet = cachorrosBase[gameState.pets.cachorroHeroi ? 1 : 0];
        
        this.containerFicha = this.add.container(centroX, centroY)
            .setSize(500, 350) 
            .setInteractive({ useHandCursor: true }); 

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
        }).setOrigin(0.5);

        this.containerFicha.on("pointerdown", () => {
            this.containerFicha.destroy();
            this.txtContinuarFicha.destroy();
            this.mostrarInstrucao(); 
        });
    }

    mostrarInstrucao() {
        const areaUtilLargura = this.scale.width * 0.8;
        const centroX = areaUtilLargura / 2;
        const centroY = this.scale.height / 2;

        this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoMissao")
            .setScale(0.5)
            .setInteractive({ useHandCursor: true }); 

        this.txtContinuarInstrucao = this.add.text(centroX, centroY + (this.imgInstrucao.displayHeight / 2) + 30, "[ Clique para comecar ]", {
            fontFamily: '"Press Start 2P"', fontSize: "15px", color: "#ffffff", stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5);

        this.imgInstrucao.on("pointerdown", () => {
            this.imgInstrucao.destroy();
            this.txtContinuarInstrucao.destroy();
            gameState.instrucaoMissaoVista = true;
            
            // Fecha a cena de popups quando o jogador começa
            this.scene.stop();
        });
    }
}

// ====================================================================
// CENA PRINCIPAL: Gerencia o Cachorro, Cenário e invoca a HUD e Popups
// ====================================================================
export class cenaPrincipal extends Phaser.Scene {
    constructor() {
        super({ key: "cenaPrincipal" })
    }

    create() {
        // 1. Inicia e traz a HUD para o topo da cenaPrincipal
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD")
        }
        this.scene.bringToTop("HUD")

        // 2. Registra dinamicamente e lança a Cena de Popups por cima da HUD
        if (!this.scene.get("CenaPopups")) {
            this.scene.add("CenaPopups", CenaPopups, false);
        }
        
        if (gameState.aguardandoEvolucao || !gameState.instrucaoMissaoVista) {
            if (!this.scene.isActive("CenaPopups")) {
                this.scene.launch("CenaPopups");
            }
            this.scene.bringToTop("CenaPopups"); // Garante que fica ACIMA de tudo
        }

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

        // --- SEU RESIZE DINÂMICO ---
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
        };

        this.scale.on("resize", handleResizePrincipal);
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizePrincipal);
        });

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