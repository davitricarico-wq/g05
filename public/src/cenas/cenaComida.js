// Importa o gerenciador responsável pela lógica e criação dos sprites dos pets
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js"
// Importa as configurações base (raças, atributos) dos cachorros
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js"
// Importa o objeto de estado global para persistência de dados entre cenas
import { gameState } from "../main.js";

// Exporta a cena responsável pela área de alimentação e visualização da ficha do pet
export class cenaComida extends Phaser.Scene {
    
    constructor() {
        // Define a chave identificadora da cena no motor Phaser
        super({ key: "cenaComida" });
        // Flag para controle de transição de cenas
        this.transicao = false;
    }

    create() {
        // Reseta o estado de transição ao iniciar a cena
        this.transicao = false;

        // Gerenciamento da HUD: garante que a interface esteja ativa e visível sobre a cena atual
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD");
        } else if (this.scene.isSleeping("HUD")) {
            this.scene.wake("HUD");
        }
        this.scene.bringToTop("HUD");

        // Definição da área útil de gameplay, reservando espaço para a barra lateral da HUD (20%)
        const posicaoX = (this.scale.width - this.scale.width * 0.2);
        const posicaoY = this.scale.height;

        /**
         * Função utilitária para aplicar efeitos visuais de feedback (Hover e Click)
         * @param {Phaser.GameObjects.GameObject} alvo - O objeto que receberá os eventos
         * @param {number} escalaNormal - Escala padrão do objeto
         * @param {number} escalaPassar - Escala ao passar o mouse (hover)
         */
        const passarPressionarEfeito = (alvo, escalaNormal, escalaPassar) => {
            alvo.removeAllListeners();

            // Efeito de aumento suave ao passar o mouse
            alvo.on("pointerover", () => {
                this.tweens.add({ targets: alvo, scaleX: escalaPassar, scaleY: escalaPassar, duration: 200 });
            });

            // Efeito de "aperto" (squash) ao clicar
            alvo.on("pointerdown", () => {
                this.tweens.add({ targets: alvo, scaleX: escalaNormal * 0.9, scaleY: escalaNormal * 0.9, duration: 150, yoyo: true });
            });

            // Retorno à escala original ao retirar o mouse
            alvo.on("pointerout", () => {
                this.tweens.add({ targets: alvo, scaleX: escalaNormal, scaleY: escalaNormal, duration: 200 });
            });
        };

        // Renderização do cenário de fundo centralizado na área útil
        this.fundo = this.add.image(posicaoX / 2, posicaoY / 2, "bgRacao")
            .setDisplaySize(posicaoX, posicaoY)
            .setDepth(-1);

        // Instanciação da estante de rações com interatividade para troca de cena
        const estante = this.add.image(posicaoX * 0.25, posicaoY * 0.68, "estanteRacao")
            .setScale(posicaoY * 0.0006)
            .setInteractive({ useHandCursor: true });

        passarPressionarEfeito(estante, estante.scaleX, estante.scaleX * 1.1);

        // Lógica de navegação para a cena de seleção de ração específica
        estante.on("pointerdown", () => {
            const cenaHUD = this.scene.manager.getScene("HUD");
            if (cenaHUD && cenaHUD.transicionarPara) {
                cenaHUD.transicionarPara("cenaRacaoSuperPremium");
            } else {
                this.scene.start("cenaRacaoSuperPremium");
            }
        });

        // Adição da ficha (bilhete) de informações do cachorro na parede
        gameState.bilhete = this.add.image(
            this.scale.width * 0.7, 
            this.scale.height * 0.25,
            'mineFicha')
        .setScale(0.15)
        .setInteractive({ useHandCursor:true });
        
        // Armazena a profundidade para restaurar após efeitos de destaque/overlay
        gameState.bilhete.setDepth(10); 
        this.profundidadeOriginalBilhete = gameState.bilhete.depth;
        
        passarPressionarEfeito(gameState.bilhete, 0.15, 0.18);

        // Lógica de abertura da Ficha: limpa overlays de tutorial e lança a cena de detalhes
        gameState.bilhete.on('pointerdown', () => {
            if (this.overlayFicha) {
                this.overlayFicha.destroy();
                this.overlayFicha = null;
                if (this.txtCliqueFicha) this.txtCliqueFicha.destroy();
                
                gameState.bilhete.setDepth(this.profundidadeOriginalBilhete);
                gameState.enfaseFichaVista = true; 
            }

            if(this.scene.isActive('ficha')) {
                this.scene.stop('ficha')
            } else {
                this.scene.launch('ficha')
            }
        });

        // Objeto visual da tigela vazia no chão
        const racaoVazia = this.add.image((posicaoX / 2) + (posicaoX / 2) * 0.1, posicaoY / 2 + posicaoY * 0.4, "racaoVazia")
            .setScale(posicaoY * 0.0002);

        // Configuração do Pet e Parasitas (Pulgas)
        this.gerenciadorCachorros = new GerenciadorCachorros(this)

        // Instancia o cachorro (posição 0,0 relativa ao container pai)
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[0])
        const elementosContainer = [this.cachorro.sprite];

        // Registro global da animação das pulgas (se não houver no cache)
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 1,  
                repeat: -1     
            });
        }

        // Adição das pulgas com escala proporcional e controle de visibilidade
        this.pulgas = this.add.sprite(0, 0, "pulgas")
            .setOrigin(0.5)
            .setScale(posicaoY * 0.0015);

        this.pulgas.play("pulgaAnim");
        this.pulgas.setVisible(gameState.pulga); 
        elementosContainer.push(this.pulgas); 

        // Cálculo da posição absoluta do pet no cenário
        const dogX = (posicaoX / 2) + (posicaoX / 2) * 0.4;
        const dogY = (posicaoY / 2) + (posicaoY / 2) * 0.25;

        // Container agrupa pet + pulgas para transformações (escala/posição) unificadas
        this.containerCachorro = this.add.container(dogX, dogY, elementosContainer);
        this.containerCachorro.setScale(posicaoY * 0.0007);

        // Controle de fluxo de onboarding: decide qual popup de instrução exibir primeiro
        if (!gameState.instrucaoRacaoVista) {
            this.mostrarInstrucaoRacao(posicaoX, posicaoY);
        } else if (!gameState.enfaseFichaVista) {
            this.destacarFicha(posicaoX, posicaoY);
        }

        // Listener de Responsividade: reajusta todos os elementos caso a janela mude de tamanho
        const handleResizeComida = () => {
            if (!this.scene.isActive() || !this.cameras || !this.cameras.main) return;

            const novaLargura = (this.scale.width - this.scale.width * 0.2);
            const novaAltura = this.scale.height;
            const novoCentroX = novaLargura / 2;
            const novoCentroY = novaAltura / 2;

            this.fundo.setPosition(novoCentroX, novoCentroY).setDisplaySize(novaLargura, novaAltura);
            estante.setPosition(novaLargura * 0.25, novaAltura * 0.68).setScale(novaAltura * 0.0006);
            gameState.bilhete.setPosition(this.scale.width * 0.7, novaAltura * 0.25).setScale(0.15);
            racaoVazia.setPosition(novoCentroX + novoCentroX * 0.1, novoCentroY + novaAltura * 0.4).setScale(novaAltura * 0.0002);
            
            const novoDogX = novoCentroX + novoCentroX * 0.4;
            const novoDogY = novoCentroY + novoCentroY * 0.25;
            this.containerCachorro.setPosition(novoDogX, novoDogY).setScale(novaAltura * 0.0007);
            this.pulgas.setScale(novaAltura * 0.0015);

            // Reajuste de modais de instrução ativos durante o resize
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

            if (this.overlayFicha && this.overlayFicha.active) {
                this.overlayFicha.setSize(novaLargura, novaAltura);
                this.overlayFicha.setPosition(novoCentroX, novoCentroY);
            }
            if (this.txtCliqueFicha && this.txtCliqueFicha.active) {
                this.txtCliqueFicha.setPosition(this.scale.width * 0.7, (novaAltura * 0.25) + 60);
            }
        };

        this.scale.on("resize", handleResizeComida);

        // Limpeza do listener ao encerrar a cena para evitar vazamento de memória
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeComida);
        });
    }

    update() {
        // Atualização em tempo real da visibilidade das pulgas conforme estado global
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga);
        }

        // Sincronização: troca o pet exibido se houver comando no estado global
        if (gameState.trocar) {
            this.gerenciadorCachorros.mudarParaCachorroHeroi()
        }
    }

    /**
     * Exibe o popup inicial de instrução sobre o funcionamento da ração
     */
    mostrarInstrucaoRacao(areaUtilLargura, alturaTotal) {
        const centroX = areaUtilLargura / 2;
        const centroY = alturaTotal / 2;

        // Overlay de fundo para focar a atenção no popup
        this.fundoEscuroInstrucao = this.add.rectangle(centroX, centroY, areaUtilLargura, alturaTotal, 0x000000, 0.7)
            .setDepth(1000)
            .setInteractive(); 

        this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoRacao")
            .setDepth(1001)
            .setScale(0.5);

        // Texto com animação de "piscar" (alpha) para indicar interatividade
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

        // Evento para fechar modal e encadear o próximo tutorial (Destaque da Ficha)
        this.fundoEscuroInstrucao.on("pointerdown", () => {
            this.fundoEscuroInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.txtContinuarInstrucao.destroy();
            
            this.fundoEscuroInstrucao = null;
            this.imgInstrucao = null;
            this.txtContinuarInstrucao = null;
            
            gameState.instrucaoRacaoVista = true; 
            
            if (!gameState.enfaseFichaVista) {
                this.destacarFicha(areaUtilLargura, alturaTotal);
            }
        });
    }

    /**
     * Aplica um efeito de destaque (foco) especificamente no bilhete de informações
     */
    destacarFicha(areaUtilLargura, alturaTotal) {
        const centroX = areaUtilLargura / 2;
        const centroY = alturaTotal / 2;

        // Overlay escuro que bloqueia cliques em outros elementos do cenário
        this.overlayFicha = this.add.rectangle(centroX, centroY, areaUtilLargura, alturaTotal, 0x000000, 0.7)
            .setDepth(900)
            .setInteractive(); 

        // Eleva a profundidade do bilhete para "atravessar" o overlay escuro
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