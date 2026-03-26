import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js"
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js"
import { gameState } from "../main.js";

export class cenaComida extends Phaser.Scene {
    
    constructor() {
        super({ key: "cenaComida" });
        this.transicao = false;
    }

    create() {
        this.transicao = false;

        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD");
        } else if (this.scene.isSleeping("HUD")) {
            this.scene.wake("HUD");
        }
        this.scene.bringToTop("HUD");

        // Calculando área útil (descontando 20% da HUD)
        const posicaoX = (this.scale.width - this.scale.width * 0.2);
        const posicaoY = this.scale.height;

        const passarPressionarEfeito = (alvo, escalaNormal, escalaPassar) => {
            alvo.removeAllListeners();

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

        this.fundo = this.add.image(posicaoX / 2, posicaoY / 2, "bgRacao")
            .setDisplaySize(posicaoX, posicaoY)
            .setDepth(-1);

        const estante = this.add.image(posicaoX * 0.25, posicaoY * 0.68, "estanteRacao")
            .setScale(posicaoY * 0.0006)
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

        // Adiciona a ficha de informações do cachorro
        gameState.bilhete = this.add.image(
            this.scale.width * 0.7, 
            this.scale.height * 0.25,
            'mineFicha')
        .setScale(0.15)
        .setInteractive({ useHandCursor:true });
        
        // Define a profundidade base para podermos voltar a ela depois do destaque
        gameState.bilhete.setDepth(10); 
        this.profundidadeOriginalBilhete = gameState.bilhete.depth;
        
        passarPressionarEfeito(gameState.bilhete, 0.15, 0.18);

        // AÇÃO DA FICHA ATUALIZADA (Remove o destaque antes de abrir a ficha)
        gameState.bilhete.on('pointerdown', () => {
            // Se o overlay de destaque estiver ativo, nós o removemos e permitimos o jogo fluir
            if (this.overlayFicha) {
                this.overlayFicha.destroy();
                this.overlayFicha = null;
                
                if (this.txtCliqueFicha) this.txtCliqueFicha.destroy();
                
                gameState.bilhete.setDepth(this.profundidadeOriginalBilhete);
                gameState.enfaseFichaVista = true; // Salva para não repetir
            }

            if(this.scene.isActive('ficha')) {
                this.scene.stop('ficha')
            } else {
                this.scene.launch('ficha')
            }
        });

        const racaoVazia = this.add.image((posicaoX / 2) + (posicaoX / 2) * 0.1, posicaoY / 2 + posicaoY * 0.4, "racaoVazia")
            .setScale(posicaoY * 0.0002);

        // ==========================================
        // SISTEMA DE CACHORRO + PULGAS NO CONTAINER
        // ==========================================
        this.gerenciadorCachorros = new GerenciadorCachorros(this)

        // Criamos o cachorro na posição 0,0 porque ele vai para dentro do container
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[0])
        const elementosContainer = [this.cachorro.sprite];

        // Cria a animação da pulga (se ainda não existir)
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 1,  
                repeat: -1     
            });
        }

        // Cria o sprite animado da pulga
        this.pulgas = this.add.sprite(0, 0, "pulgas")
            .setOrigin(0.5)
            .setScale(posicaoY * 0.0015); // Mantendo a proporção visual das outras cenas

        this.pulgas.play("pulgaAnim");
        this.pulgas.setVisible(gameState.pulga); 
        elementosContainer.push(this.pulgas); 

        // Calcula a posição onde o cachorro deveria estar
        const dogX = (posicaoX / 2) + (posicaoX / 2) * 0.4;
        const dogY = (posicaoY / 2) + (posicaoY / 2) * 0.25;

        // Cria o container com o cachorro e as pulgas
        this.containerCachorro = this.add.container(dogX, dogY, elementosContainer);
        this.containerCachorro.setScale(posicaoY * 0.0007);
        // ==========================================


        // --- CONTROLE DOS POPUPS E DESTAQUES ---
        if (!gameState.instrucaoRacaoVista) {
            this.mostrarInstrucaoRacao(posicaoX, posicaoY);
        } else if (!gameState.enfaseFichaVista) {
            // Caso o jogador tenha atualizado a página após ver o popup, mas antes de abrir a ficha
            this.destacarFicha(posicaoX, posicaoY);
        }
        // ----------------------------------


        // ==========================================
        // RESPONSIVIDADE - LISTENER DE RESIZE
        // ==========================================
        const handleResizeComida = () => {
            if (!this.scene.isActive() || !this.cameras || !this.cameras.main) return;

            const novaLargura = (this.scale.width - this.scale.width * 0.2);
            const novaAltura = this.scale.height;
            const novoCentroX = novaLargura / 2;
            const novoCentroY = novaAltura / 2;

            // Atualiza fundo
            this.fundo.setPosition(novoCentroX, novoCentroY)
                      .setDisplaySize(novaLargura, novaAltura);

            // Atualiza estante
            estante.setPosition(novaLargura * 0.25, novaAltura * 0.68)
                   .setScale(novaAltura * 0.0006);

            // Atualiza bilhete
            gameState.bilhete.setPosition(this.scale.width * 0.7, novaAltura * 0.25)
                             .setScale(0.15);

            // Atualiza racao vazia
            racaoVazia.setPosition(novoCentroX + novoCentroX * 0.1, novoCentroY + novaAltura * 0.4)
                      .setScale(novaAltura * 0.0002);

            // Atualiza container do cachorro
            const novoDogX = novoCentroX + novoCentroX * 0.4;
            const novoDogY = novoCentroY + novoCentroY * 0.25;
            this.containerCachorro.setPosition(novoDogX, novoDogY)
                                  .setScale(novaAltura * 0.0007);

            // Atualiza pulgas
            this.pulgas.setScale(novaAltura * 0.0015);

            // Ajusta o popup de instrução se estiver aberto
            if (this.fundoEscuroInstrucao && this.fundoEscuroInstrucao.active) {
                this.fundoEscuroInstrucao.setSize(novaLargura, novaAltura);
                this.fundoEscuroInstrucao.setPosition(novoCentroX, novoCentroY);
                
                if (this.imgInstrucao && this.imgInstrucao.active) {
                    this.imgInstrucao.setPosition(novoCentroX, novoCentroY);
                    
                    if (this.txtContinuarInstrucao && this.txtContinuarInstrucao.active) {
                        const novoPosicaoTextoY = novoCentroY + (this.imgInstrucao.displayHeight / 2) + 30;
                        this.txtContinuarInstrucao.setPosition(novoCentroX, novoPosicaoTextoY);
                    }
                }
            }

            // Ajusta o Destaque da Ficha se estiver ativo
            if (this.overlayFicha && this.overlayFicha.active) {
                this.overlayFicha.setSize(novaLargura, novaAltura);
                this.overlayFicha.setPosition(novoCentroX, novoCentroY);
            }
            if (this.txtCliqueFicha && this.txtCliqueFicha.active) {
                this.txtCliqueFicha.setPosition(this.scale.width * 0.7, (novaAltura * 0.25) + 60);
            }
        };

        this.scale.on("resize", handleResizeComida);

        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeComida);
        });
    }

    update() {
        // Atualiza a visibilidade da pulga em tempo real
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga);
        }

        if (gameState.trocar) {
            this.gerenciadorCachorros.mudarParaCachorroHeroi()
        }
    }

    // --- FUNÇÃO PARA MOSTRAR INSTRUÇÃO DA RAÇÃO ---
    mostrarInstrucaoRacao(areaUtilLargura, alturaTotal) {
        const centroX = areaUtilLargura / 2;
        const centroY = alturaTotal / 2;

        // Fundo semi-transparente
        this.fundoEscuroInstrucao = this.add.rectangle(centroX, centroY, areaUtilLargura, alturaTotal, 0x000000, 0.7)
            .setDepth(1000)
            .setInteractive(); 

        // Imagem de instrução da ração
        this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoRacao")
            .setDepth(1001)
            .setScale(0.5);

        // Texto piscante para continuar (posicionado logo abaixo da imagem)
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

        // Evento de clique para fechar a instrução
        this.fundoEscuroInstrucao.on("pointerdown", () => {
            this.fundoEscuroInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.txtContinuarInstrucao.destroy();
            
            this.fundoEscuroInstrucao = null;
            this.imgInstrucao = null;
            this.txtContinuarInstrucao = null;
            
            gameState.instrucaoRacaoVista = true; 
            
            // --- ATIVA O DESTAQUE NA FICHA LOGO APÓS FECHAR O POPUP ---
            if (!gameState.enfaseFichaVista) {
                this.destacarFicha(areaUtilLargura, alturaTotal);
            }
        });
    }

    // --- FUNÇÃO PARA DESTACAR A FICHA ---
    destacarFicha(areaUtilLargura, alturaTotal) {
        const centroX = areaUtilLargura / 2;
        const centroY = alturaTotal / 2;

        // Fundo escuro para bloquear tudo na tela MENOS a ficha
        this.overlayFicha = this.add.rectangle(centroX, centroY, areaUtilLargura, alturaTotal, 0x000000, 0.7)
            .setDepth(900)
            .setInteractive(); // Ao setar interativo sem função, ele bloqueia os cliques nos itens abaixo dele (estante, cenário, etc)

        // Eleva a ficha visualmente acima do fundo escuro
        gameState.bilhete.setDepth(901);

        // Adiciona um pequeno texto guiando o usuário
        this.txtCliqueFicha = this.add.text(
            this.scale.width * 0.7, 
            (this.scale.height * 0.25) + 60, // Posição logo abaixo da ficha
            "Clique na ficha!", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "12px",
            color: "#ffffff",
            align: "center",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(901);

        // Dá um efeitinho piscante no texto
        this.tweens.add({
            targets: this.txtCliqueFicha,
            alpha: 0.4,
            duration: 600,
            yoyo: true,
            loop: -1
        });
    }
}