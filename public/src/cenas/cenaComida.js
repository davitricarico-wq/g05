// Importa o gerenciador responsável pela lógica e criação dos sprites dos pets
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";
// Importa as configurações base (raças, atributos) dos cachorros
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";
// Importa o objeto de estado global para persistência de dados entre cenas
import { gameState, iniciarMusicaAleatoria } from "../main.js";

/**
 * @class cenaComida
 * @extends Phaser.Scene
 * @description Gerencia a área de alimentação, ficha técnica do pet e o fluxo de onboarding (tutorial).
 * Lida com profundidade de camadas (z-index) para destacar elementos e responsividade dinâmica.
 */
export class cenaComida extends Phaser.Scene {
    
    constructor() {
        super({ key: "cenaComida" });
        /** @type {boolean} Controla o estado de transição para evitar cliques duplicados */
        this.transicao = false;
    }

    /**
     * @method create
     * @description Inicializa os elementos visuais, configura eventos de input e define a hierarquia de camadas.
     */
    create() {
        this.transicao = false;

        // Garante que a HUD esteja ativa e sincronizada com a cena de gameplay
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD");
        } else if (this.scene.isSleeping("HUD")) {
            this.scene.wake("HUD");
        }
        this.scene.bringToTop("HUD");

        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        // Reserva 20% da largura para a HUD lateral, definindo a área útil de jogo
        const areaUtilX = (this.scale.width - this.scale.width * 0.2);
        const areaUtilY = this.scale.height;

        /**
         * @function passarPressionarEfeito
         * @description Cria micro-interações de feedback visual (Hover/Click) via Tweens.
         * @param {Phaser.GameObjects.GameObject} alvo - Objeto interativo.
         * @param {number} escalaNormal - Escala de repouso.
         * @param {number} escalaPassar - Escala de destaque (hover).
         */
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

        // --- ELEMENTOS DO CENÁRIO ---
        this.fundo = this.add.image(areaUtilX / 2, areaUtilY / 2, "bgRacao")
            .setDisplaySize(areaUtilX, areaUtilY)
            .setDepth(-1);

        // Estante: Ponto de entrada para o minigame de escolha de ração
        this.estante = this.add.image(areaUtilX * 0.25, areaUtilY * 0.68, "estanteRacao")
            .setScale(areaUtilY * 0.0006)
            .setInteractive({ useHandCursor: true });
        
        this.profundidadeOriginalEstante = this.estante.depth;
        passarPressionarEfeito(this.estante, this.estante.scaleX, this.estante.scaleX * 1.1);

        this.estante.on("pointerdown", () => {
            // TRAVA DE SEGURANÇA: Se a ficha estiver aberta, o clique na estante é ignorado!
            if (this.scene.isActive('ficha')) return; 

            this.encerrarTutorialEstante();
            this.navegarParaEstante();
        });

        // Ficha (Bilhete): Acesso aos detalhes técnicos e progresso do pet
        gameState.bilhete = this.add.image(this.scale.width * 0.7, areaUtilY * 0.25, 'mineFicha')
            .setScale(0.15)
            .setInteractive({ useHandCursor: true })
            .setDepth(10);
        
        this.profundidadeOriginalBilhete = gameState.bilhete.depth;
        passarPressionarEfeito(gameState.bilhete, 0.15, 0.18);

        gameState.bilhete.on('pointerdown', () => this.abrirFichaDetatilhada());

        // Tigela decorativa interativa (agora inicia o minigame/efeito de chuva)
        this.racaoVazia = this.add.image((areaUtilX / 2) + (areaUtilX / 2) * 0.1, areaUtilY / 2 + areaUtilY * 0.4, "racaoVazia")
            .setScale(areaUtilY * 0.0002)
            .setInteractive({ useHandCursor: true });

        passarPressionarEfeito(this.racaoVazia, this.racaoVazia.scaleX, this.racaoVazia.scaleX * 1.1);

        // Dispara a chuva de petiscos ao clicar na tigela
        this.racaoVazia.on("pointerdown", () => {
            // TRAVA DE SEGURANÇA: Impede interações se a ficha estiver aberta
            if (this.scene.isActive('ficha')) return; 

            this.fazerChoverPetiscos();
        });

        // Configurações do pet
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0);
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);

        // Pulgas: Sistema de partículas/animação de estado negativo
        this.configurarAnimacaoPulgas();
        this.pulgas = this.add.sprite(0, 0, "pulgas").setOrigin(0.5).setScale(areaUtilY * 0.0015);
        this.pulgas.play("pulgaAnim").setVisible(gameState.pulga);

        // Agrupamento em container para facilitar transformações globais (X, Y, Escala)
        this.containerCachorro = this.add.container(
            (areaUtilX / 2) + (areaUtilX / 2) * 0.4, 
            (areaUtilY / 2) + (areaUtilY / 2) * 0.25, 
            [this.cachorro.sprite, this.pulgas]
        ).setScale(areaUtilY * 0.0007);

        // Fluxo de onboarding
        this.gerenciarTutorialInicial(areaUtilX, areaUtilY);

        // Sistema de responsividade
        const handleResize = () => this.ajustarElementosParaNovaTela();
        this.scale.on("resize", handleResize);
        this.events.on('shutdown', () => this.scale.off("resize", handleResize));
    }

    /** Sincroniza o estado das pulgas e troca de pet em tempo real */
    update() {
        if (this.pulgas) this.pulgas.setVisible(gameState.pulga);
        if (gameState.trocar) {
            this.gerenciadorCachorros.mudarParaCachorroAtivo();
            gameState.trocar = false;
        }
    }

    /**
     * @method fazerChoverPetiscos
     * @description Cria um efeito INTENSO de chuva de petiscos para aumentar a dificuldade.
     */
    fazerChoverPetiscos() {
        const emitter = this.add.particles(0, 0, 'petisco', {
            x: { min: 0, max: this.scale.width }, 
            y: -50, 
            speedY: { min: 400, max: 800 }, 
            speedX: { min: -100, max: 100 }, 
            rotate: { min: 0, max: 360 }, 
            scale: { start: 0.1, end: 0.1 }, 
            lifespan: 2000, 
            quantity: 8, 
            frequency: 50 
        });

        emitter.setDepth(5);

        this.time.delayedCall(10000, () => {
            emitter.stop();
        });
    }

    /** * Centraliza a lógica de abertura da cena de ficha. 
     * @private
     */
    abrirFichaDetatilhada() {
        // LÓGICA DE TOGGLE: Se a ficha já estiver aberta, clicar no ícone a fecha
        if (this.scene.isActive('ficha')) {
            this.scene.stop('ficha');
            return; 
        }

        // NOVO: Apenas destruímos o TEXTO. O Fundo Escuro (overlayFicha) FICA AQUI para continuar bloqueando
        // a tela até que o jogador feche a ficha obrigatoriamente.
        if (this.overlayFicha) {
            if (this.txtCliqueFicha) {
                this.txtCliqueFicha.destroy();
                this.txtCliqueFicha = null;
            }
            gameState.enfaseFichaVista = true; 
            // A HUD NÃO dá resume aqui. Fica travada de propósito.
        }

        // Inicia a cena da ficha
        this.scene.launch('ficha');
        this.scene.bringToTop('ficha');

        const cenaFicha = this.scene.manager.getScene('ficha');
        
        // Eventos de encadeamento: ISSO AQUI SÓ RODA QUANDO A FICHA FOR FECHADA
        const finalizarFicha = () => {
            // Agora sim, como a ficha foi fechada, destruímos a tela escura que bloqueava os cliques
            if (this.overlayFicha) {
                this.overlayFicha.destroy();
                this.overlayFicha = null;
            }
            if (this.txtCliqueFicha) {
                this.txtCliqueFicha.destroy();
                this.txtCliqueFicha = null;
            }
            
            gameState.bilhete.setDepth(this.profundidadeOriginalBilhete);
            
            // AGORA SIM descongelamos a HUD, liberando o jogo
            this.scene.resume("HUD"); 
            this.scene.bringToTop("HUD");
            
            if (!gameState.enfaseEstanteVista) {
                this.destacarEstante();
            }
        };
        
        cenaFicha.events.once('shutdown', finalizarFicha);
        cenaFicha.events.once('sleep', finalizarFicha);
    }

    /** Garante a animação cíclica das pulgas no cache global */
    configurarAnimacaoPulgas() {
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 1, repeat: -1    
            });
        }
    }

    /** Limpa overlays de tutorial da estante antes da navegação */
    encerrarTutorialEstante() {
        if (this.overlayEstante) {
            this.overlayEstante.destroy();
            if (this.txtCliqueEstante) this.txtCliqueEstante.destroy();
            this.estante.setDepth(this.profundidadeOriginalEstante);
            gameState.enfaseEstanteVista = true; 
            
            this.scene.resume("HUD"); 
            this.scene.bringToTop("HUD");
        }
    }

    /** Navegação com suporte a transições personalizadas da HUD */
    navegarParaEstante() {
        const cenaHUD = this.scene.manager.getScene("HUD");
        if (cenaHUD && cenaHUD.transicionarPara) {
            cenaHUD.transicionarPara("cenaEstanteRacao");
        } else {
            this.scene.start("cenaEstanteRacao");
        }
    }

    /** * Controla a ordem de exibição dos tutoriais. 
     * @private
     */
    gerenciarTutorialInicial(areaX, areaY) {
        if (!gameState.instrucaoRacaoVista) {
            this.mostrarInstrucaoRacao(areaX, areaY);
        } else if (!gameState.enfaseFichaVista) {
            this.destacarFicha();
        } else if (!gameState.enfaseEstanteVista) { 
            this.destacarEstante();
        }
    }

    /** * Método central de redimensionamento. Recalcula âncoras e escalas 
     * para manter a proporção independente da resolução.
     */
    ajustarElementosParaNovaTela() {
        if (!this.scene.isActive() || !this.cameras.main) return;

        const novaAreaX = (this.scale.width - this.scale.width * 0.2);
        const novaAreaY = this.scale.height;
        const centroX = novaAreaX / 2;
        const centroY = novaAreaY / 2;

        this.fundo.setPosition(centroX, centroY).setDisplaySize(novaAreaX, novaAreaY);
        this.estante.setPosition(novaAreaX * 0.25, novaAreaY * 0.68).setScale(novaAreaY * 0.0006);
        gameState.bilhete.setPosition(this.scale.width * 0.7, novaAreaY * 0.25);
        this.racaoVazia.setPosition(centroX + centroX * 0.1, centroY + novaAreaY * 0.4).setScale(novaAreaY * 0.0002);
        
        this.containerCachorro.setPosition(centroX + centroX * 0.4, centroY + centroY * 0.25).setScale(novaAreaY * 0.0007);
        this.pulgas.setScale(novaAreaY * 0.0015);

        // Reajusta modais de overlay ativos (Fundo Escuro e Textos de destaque)
        [this.fundoEscuroInstrucao, this.overlayFicha, this.overlayEstante].forEach(ov => {
            if(ov && ov.active) ov.setSize(this.scale.width, this.scale.height).setPosition(this.scale.width/2, this.scale.height/2);
        });
    }

    /** Exibe o guia visual principal da cena de alimentação */
    mostrarInstrucaoRacao() {
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaComida");
        });

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.fundoEscuroInstrucao = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.7).setDepth(9999).setInteractive(); 
        this.imgInstrucao = this.add.image(cx, cy, "instrucaoRacao").setDepth(10000).setScale(0.5);

        this.txtContinuarInstrucao = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 30, "[ Clique para continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff", stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5).setDepth(10000);

        this.tweens.add({ targets: this.txtContinuarInstrucao, alpha: 0.4, duration: 800, yoyo: true, loop: -1 });

        this.fundoEscuroInstrucao.on("pointerdown", () => {
            this.fundoEscuroInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.txtContinuarInstrucao.destroy();
            gameState.instrucaoRacaoVista = true; 
            
            this.scene.bringToTop("HUD");
            this.gerenciarTutorialInicial();
        });
    }

    /** Cria um "foco" visual no objeto de Ficha técnica */
    destacarFicha() {
        this.scene.pause("HUD"); 
        
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaComida");
        });

        this.overlayFicha = this.add.rectangle(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 0x000000, 0.7).setDepth(9999).setInteractive(); 
        
        this.overlayFicha.on('pointerdown', (pointer, localX, localY, event) => { event.stopPropagation(); });

        gameState.bilhete.setDepth(10000);

        this.txtCliqueFicha = this.add.text(gameState.bilhete.x, gameState.bilhete.y + 60, "Clique na ficha!", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "12px", color: "#ffffff", stroke: "#000000", strokeThickness: 3
        }).setOrigin(0.5).setDepth(10000);

        this.tweens.add({ targets: this.txtCliqueFicha, alpha: 0.4, duration: 600, yoyo: true, loop: -1 });
    }

    /** Cria um "foco" visual na estante para guiar o jogador ao minigame */
    destacarEstante() {
        this.scene.pause("HUD"); 
        
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaComida");
        });

        this.overlayEstante = this.add.rectangle(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 0x000000, 0.7).setDepth(9999).setInteractive(); 
        
        this.overlayEstante.on('pointerdown', (pointer, localX, localY, event) => { event.stopPropagation(); });

        this.estante.setDepth(10000);

        this.txtCliqueEstante = this.add.text(this.estante.x, this.estante.y - 100, "Clique na estante!", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "12px", color: "#ffffff", stroke: "#000000", strokeThickness: 3
        }).setOrigin(0.5).setDepth(10000);

        this.tweens.add({ targets: this.txtCliqueEstante, alpha: 0.4, duration: 600, yoyo: true, loop: -1 });
    }

    /** Exibe o popup de direcionamento para voltar à cena principal */
    exibirDirecaoJogadorVoltar() {
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaComida");
        });

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const fundoEscuro = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(200).setInteractive();
        const imgDirecao = this.add.image(cx, cy, "direcaoJogador")
            .setDepth(201).setInteractive({ useHandCursor: true });

        const escalaFinal = Math.min(
            (this.scale.width * 0.8) / imgDirecao.width,
            (this.scale.height * 0.8) / imgDirecao.height
        );
        imgDirecao.setScale(escalaFinal);

        const txtContinuar = this.add.text(cx, cy + (imgDirecao.displayHeight / 2) + 40, "[ Clique para Continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(202);

        this.tweens.add({ targets: txtContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const voltarCena = () => {
            this.scene.bringToTop("HUD");
            this.scene.start("cenaPrincipal");
        };
        
        fundoEscuro.on('pointerdown', voltarCena);
        imgDirecao.on('pointerdown', voltarCena);
    }
}