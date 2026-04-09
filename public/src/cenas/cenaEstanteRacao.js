// Importando os dados estáticos referentes aos atributos das rações disponíveis no catálogo
import {
    racaoStandardPequeno,
    racaoStandardMedio,
    racaoStandardGrande,
    racaoPremiumPequeno,
    racaoPremiumMedio,
    racaoPremiumGrande,
    racaoSuperPremiumPequeno,
    racaoSuperPremiumMedio,
    racaoSuperPremiumGrande,
} from "../componentes/controleRacoes/dadosRacoes.js";

// Importando a classe modelo de Ração para instanciar os objetos visuais e lógicos
import { Racao } from "../componentes/controleRacoes/racoes.js";

// Importando os dados base dos mascotes e os controladores de estado global da aplicação
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";
import { gameState, iniciarMusicaAleatoria } from "../main.js";

// (Opcional) Importação do componente de ficha, caso necessite de métodos específicos
import { ficha } from "../componentes/ficha.js";

/**
 * @class cenaEstanteRacao
 * @extends Phaser.Scene
 * @description Cena responsável pela interface da loja/estante de rações. 
 * Permite ao jogador visualizar opções de alimentos, verificar informações nutricionais, 
 * comparar com as necessidades do seu pet atual e efetuar a compra utilizando moedas virtuais.
 */
export class cenaEstanteRacao extends Phaser.Scene {
    constructor() {
        super({ key: "cenaEstanteRacao" });
        // Flag para evitar múltiplas chamadas de transição simultâneas
        this.transicao = false;
        // Tempo padrão para as animações de fade in/out das câmeras
        this.duracaoFade = 250;
    }

    /**
     * Método principal do ciclo de vida do Phaser, executado quando a cena é iniciada.
     */
    create() {
        // Inicia a música de fundo caso as configurações de áudio do gameState permitam
        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        // Configurações de tela e variáveis relativas
        let largura = this.scale.width;
        let altura = this.scale.height;

        // Eixos de referência para dividir a tela em duas áreas: estante (esquerda) e painel (direita)
        const centroEsquerdaX = largura * 0.30;
        const centroDireitaX = largura * 0.70;

        // Lógica de seleção do pet ativo baseada no estado global (Cachorro João > Herói > Padrão)
        const petAtivo = gameState.pets.cachorroJoao ? cachorrosBase[2] 
                       : (gameState.pets.cachorroHeroi ? cachorrosBase[1] 
                       : cachorrosBase[0]);
        const pet = petAtivo;

        // Interrompe qualquer HUD sobreposto ativo e reseta a flag de transição da cena
        this.scene.stop("HUD");
        this.transicao = false;

        /**
         * Helper dinâmico para criar botões interativos com efeitos de tween (animação) nos estados de ponteiro.
         */
        const criarBotao = (x, y, texturaNormal, texturaPressionado, escalaBase, escalaAumentada, escalaPressionada, callback) => {
            const botao = this.add.image(x, y, texturaNormal)
                .setScale(escalaBase)
                .setInteractive({ useHandCursor: true });

            botao.escalaNormal = escalaBase;
            botao.escalaHover = escalaAumentada;
            botao.escalaPress = escalaPressionada;

            botao.on("pointerover", () => {
                botao.setTexture(texturaPressionado);
                this.tweens.add({ targets: botao, scale: botao.escalaHover, duration: 150, ease: "Power2" });
            });

            botao.on("pointerout", () => {
                botao.setTexture(texturaNormal);
                this.tweens.add({ targets: botao, scale: botao.escalaNormal, duration: 150, ease: "Power2" });
            });

            botao.on("pointerdown", () => {
                botao.setTexture(texturaPressionado);
                this.tweens.add({ targets: botao, scale: botao.escalaPress, duration: 100, ease: "Power2" });
            });

            botao.on("pointerup", () => {
                botao.setTexture(texturaPressionado);
                this.tweens.add({ targets: botao, scale: botao.escalaHover, duration: 100, ease: "Power2" });
                if (callback) callback();
            });

            return botao;
        };

        /**
         * Helper para adicionar efeito de "pulsar" a um elemento não clicável por padrão.
         */
        const passarPressionarEfeito = (alvo, escalaNormal, escalaPassar) => {
            alvo.escalaNormal = escalaNormal;
            alvo.escalaPassar = escalaPassar;

            alvo.on("pointerover", () => {
                this.tweens.add({ targets: alvo, scaleX: alvo.escalaPassar, scaleY: alvo.escalaPassar, duration: 200 });
            });

            alvo.on("pointerdown", () => {
                this.tweens.add({ targets: alvo, scaleX: alvo.escalaNormal * 0.9, scaleY: alvo.escalaNormal * 0.9, duration: 150, yoyo: true });
            });

            alvo.on("pointerout", () => {
                this.tweens.add({ targets: alvo, scaleX: alvo.escalaNormal, scaleY: alvo.escalaNormal, duration: 200 });
            });
        };

        const alternarFicha = () => {
            if (this.scene.isActive("ficha")) {
                this.scene.stop("ficha");
                return;
            }
            this.scene.launch("ficha");
            this.scene.bringToTop("ficha");
        };

        // Background e transição inicial
        this.fundo = this.add.image(largura / 2, altura / 2, "bgLimpo")
            .setDisplaySize(largura, altura)
            .setDepth(-1); 

        this.cameras.main.setBounds(0, 0, largura, altura);
        this.cameras.main.fadeIn(this.duracaoFade, 0, 0, 0);

        // Botão para retornar à cena principal
        this.botaoVoltar = criarBotao(
            largura * 0.95, altura * 0.9, "iconeVoltar", "iconeVoltar",
            0.8, 1, 0.6,
            () => this.transicaoPara("cenaComida")
        );

        // Display de economia (HUD de Moedas)
        this.iconeMoeda = this.add.image(largura * 0.93, altura * 0.06, "cobasiCoin").setScale(0.6);
        this.textoMoedas = this.add.text(largura * 0.94, altura * 0.06, gameState.cobasiCoins, {
            fontSize: "20px", color: "#ffffff", fontFamily: '"Press Start 2P"', align: "center"
        }).setOrigin(0.5);  

        // Botão flutuante para acessar a ficha
        gameState.bilhete = this.add.image(largura * 0.94, altura * 0.3, 'mineFicha')
            .setScale(0.12)
            .setDepth(20)
            .setInteractive({ useHandCursor:true });
        
        passarPressionarEfeito(gameState.bilhete, 0.12, 0.14);
        gameState.bilhete.on("pointerup", alternarFicha);

        // Renderização do móvel "Estante"
        this.estante = this.add.image(centroEsquerdaX, altura * 0.6, "estanteVazia").setScale(1).setDepth(-1);

        const colunasRacao = [largura * 0.18, largura * 0.30, largura * 0.42];
        const linhasRacao = [altura * 0.35, altura * 0.605, altura * 0.855];

        this.racoes = [
            new Racao(this, colunasRacao[0], linhasRacao[0], racaoStandardPequeno),
            new Racao(this, colunasRacao[1], linhasRacao[0], racaoStandardMedio),
            new Racao(this, colunasRacao[2], linhasRacao[0], racaoStandardGrande),
            
            new Racao(this, colunasRacao[0], linhasRacao[1], racaoPremiumPequeno),
            new Racao(this, colunasRacao[1], linhasRacao[1], racaoPremiumMedio),
            new Racao(this, colunasRacao[2], linhasRacao[1], racaoPremiumGrande),
            
            new Racao(this, colunasRacao[0], linhasRacao[2], racaoSuperPremiumPequeno),
            new Racao(this, colunasRacao[1], linhasRacao[2], racaoSuperPremiumMedio),
            new Racao(this, colunasRacao[2], linhasRacao[2], racaoSuperPremiumGrande),
        ];
        
        // Painel lateral
        this.fundoTemplateRacao = this.add.image(centroDireitaX, altura * 0.56, "fundoTemplateRacao")
            .setScale(altura * 0.00075);

        // Contêiner inicial (Mostrado quando NENHUMA ração está selecionada)
        this.containerTexto = this.add.container(centroDireitaX, altura * 0.55);

        this.titulo = this.add.text(0, -altura*0.15, "Compre sua ração!", {
            fontSize: "22px", color: "#000", fontFamily: '"Press Start 2P"', align: "center"
        }).setScale(altura*0.00125).setOrigin(0.5);

        this.subtitulo = this.add.text(0, altura*0.02, "Escolha o tipo de\n\nração ideal para seu\n\npet entre Super\n\nPremium e Standard", {
            fontSize: "18px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 450 }
        }).setScale(altura*0.0013).setOrigin(0.5);

        this.containerTexto.add([this.titulo, this.subtitulo]);

        this.textoFeedback = this.add.text(centroDireitaX, altura * 0.93, "", {
            fontSize: "14px", color: "#ff0000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 350 }
        }).setOrigin(0.5);


        // =========================================================================================
        // NOVO BOTÃO DE COMPRA COM TEXTO EMBUTIDO (USANDO CONTAINER)
        // =========================================================================================

        this.containerBotaoComprar = this.add.container(centroDireitaX, altura * 0.75).setDepth(10);
        
        // Propriedades de escala para uso dinâmico nos Tweens e no Resize
        this.containerBotaoComprar.escalaNormal = 0.15;
        this.containerBotaoComprar.escalaHover = 0.16;
        this.containerBotaoComprar.escalaPress = 0.14;
        
        // Inicia oculto e com a escala padrão
        this.containerBotaoComprar.setScale(this.containerBotaoComprar.escalaNormal).setVisible(false).setAlpha(0);

        this.botaoComprarImg = this.add.image(0, 0, "botaoComprar").setInteractive({ useHandCursor: true });
        
        // O texto foi configurado com um tamanho grande (150px) porque ele será comprimido pela escala 0.15 do container
        this.textoPrecoBotao = this.add.text(100, 13, "0", {
            fontSize: "150px", color: "#ffffff", fontFamily: '"Press Start 2P", Arial', align: "center"
        }).setOrigin(0.5);

        // Adiciona a imagem e o texto ao Container
        this.containerBotaoComprar.add([this.botaoComprarImg, this.textoPrecoBotao]);

        // Interações de mouse vinculadas ao Container
        this.botaoComprarImg.on("pointerover", () => {
            this.botaoComprarImg.setTexture("botaoComprando");
            this.tweens.add({ targets: this.containerBotaoComprar, scale: this.containerBotaoComprar.escalaHover, duration: 150, ease: "Power2" });
        });

        this.botaoComprarImg.on("pointerout", () => {
            this.botaoComprarImg.setTexture("botaoComprar");
            this.tweens.add({ targets: this.containerBotaoComprar, scale: this.containerBotaoComprar.escalaNormal, duration: 150, ease: "Power2" });
        });

        this.botaoComprarImg.on("pointerdown", () => {
            this.botaoComprarImg.setTexture("botaoComprando");
            this.tweens.add({ targets: this.containerBotaoComprar, scale: this.containerBotaoComprar.escalaPress, duration: 100, ease: "Power2" });
        });

        this.botaoComprarImg.on("pointerup", () => {
            this.botaoComprarImg.setTexture("botaoComprando");
            this.tweens.add({ targets: this.containerBotaoComprar, scale: this.containerBotaoComprar.escalaHover, duration: 100, ease: "Power2" });
            
            // Lógica principal de Validação e Compra
            if (!Racao.selecionada) {
                this.textoFeedback.setText("SELECIONE UMA RAÇÃO PRIMEIRO!").setColor("#ff0000");
                return;
            }

            if (Racao.selecionada.id !== pet.id) {
                this.textoFeedback.setText("ESSA RAÇÃO NÃO É IDEAL.\nESCOLHA OUTRA RAÇÃO.").setColor("#ff0000");
                return;
            }

            const valorDaRacao = Racao.selecionada.valor || 15; 
            
            if (gameState.cobasiCoins >= valorDaRacao) {
                gameState.cobasiCoins -= valorDaRacao;
                this.textoMoedas.setText(gameState.cobasiCoins);

                this.textoFeedback.setText(`COMPRA EFETUADA! (-${valorDaRacao} MOEDAS)\nRedirecionando...`).setColor("#006600");

                this.botaoComprarImg.disableInteractive();

                gameState.superPremium = false;
                gameState.premium = false;
                gameState.standard = false;

                if (Racao.selecionada.tipo === "Super Premium") {
                    gameState.superPremium = true;
                } else if (Racao.selecionada.tipo === "Premium") {
                    gameState.premium = true;
                } else if (Racao.selecionada.tipo === "Standard") {
                    gameState.standard = true;
                }

                gameState.racaoAtual = {
                    tipo: Racao.selecionada.tipo,
                    sprite: Racao.selecionada.sprite.texture.key 
                };

                this.time.delayedCall(1500, () => {
                    Racao.selecionada = null; 
                    this.transicaoPara("jogoAlimentacao"); 
                });
            } else {
                this.textoFeedback.setText("SALDO INSUFICIENTE!").setColor("#ff0000"); 
            }
        });


        // Montagem do painel de informações nutricionais
        this.containerInfo = this.add.container(centroDireitaX, altura * 0.47)
            .setScale(altura * 0.0009)
            .setVisible(false).setAlpha(0);

        this.composicaoRacao = this.add.image(35, 10, "composicaoRacao").setScale(0.75);
        this.imagemRacaoInfo = this.add.image(-160, -70, "").setScale(0.5);

        this.textoTipo = this.add.text(0, -217, "", { fontSize: "32px", color: "#005e64", fontFamily: '"Press Start 2P"', align: "center" }).setOrigin(0.5);
        this.textoPorte = this.add.text(150, -150, "", { fontSize: "22px", color: "#006600", fontFamily: '"Press Start 2P"' }).setOrigin(0, 0.5);
        this.textoChar1 = this.add.text(120, -60, "", { fontSize: "16px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 300 } }).setOrigin(0.5);
        this.textoChar2 = this.add.text(120, 15, "", { fontSize: "16px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 300 } }).setOrigin(0.5);

        const porcentagem = { fontSize: "16px", color: "#8B4513", fontFamily: '"Press Start 2P"' };
        this.textoTrigo = this.add.text(-180, 208, "", porcentagem).setOrigin(0.5);
        this.textoCarne = this.add.text(-53, 208, "", porcentagem).setOrigin(0.5);
        this.textoOsso = this.add.text(78, 208, "", porcentagem).setOrigin(0.5);
        this.textoGordura = this.add.text(197, 208, "", porcentagem).setOrigin(0.5);

        this.containerInfo.add([
            this.composicaoRacao, this.imagemRacaoInfo, this.textoTipo, this.textoPorte, 
            this.textoChar1, this.textoChar2, this.textoTrigo, this.textoCarne, this.textoOsso, this.textoGordura
        ]);

        
        // Configuração de eventos para os sacos de ração na estante
        this.racoes.forEach((racao, index) => {
            racao.sprite.removeAllListeners('pointerover');
            racao.sprite.removeAllListeners('pointerout');

            let tamanhoNormal = 0.3;
            let tamanhoHover = 0.32;

            if (index >= 0 && index <= 2) {
                tamanhoNormal = 0.3; 
                tamanhoHover = 0.35;
            } else if (index >= 3 && index <= 5) {
                tamanhoNormal = 0.3; 
                tamanhoHover = 0.35;
            } else if (index >= 6 && index <= 8) {
                tamanhoNormal = 0.3; 
                tamanhoHover = 0.35;
            }

            racao.sprite.escalaNormal = tamanhoNormal;
            racao.sprite.escalaHover = tamanhoHover;

            racao.sprite.setScale(tamanhoNormal).setVisible(true).setInteractive({ useHandCursor: true });
            
            racao.sprite.on("pointerover", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaHover, duration: 100, ease: "Power2" }));
            racao.sprite.on("pointerout", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaNormal, duration: 100, ease: "Power2" }));

            // Clique na ração
            racao.sprite.on("pointerup", () => {
                Racao.selecionada = racao; 
                
                this.tweens.add({
                    targets: this.containerTexto, alpha: 0, duration: 200, ease: "Power2",
                    onComplete: () => this.containerTexto.setVisible(false)
                });

                this.textoTipo.setText(racao.tipo || "Super Premium");
                this.textoPorte.setText(racao.porte || "-");
                this.textoChar1.setText(racao.caracteristicas ? racao.caracteristicas[0] : "");
                this.textoChar2.setText(racao.caracteristicas ? racao.caracteristicas[1] : "");
                this.textoTrigo.setText(racao.nutrientes ? racao.nutrientes.trigo : "");
                this.textoCarne.setText(racao.nutrientes ? racao.nutrientes.carne : "");
                this.textoOsso.setText(racao.nutrientes ? racao.nutrientes.osso : "");
                this.textoGordura.setText(racao.nutrientes ? racao.nutrientes.gordura : "");
                this.imagemRacaoInfo.setTexture(racao.sprite.texture.key);

                if (this.textoFeedback) this.textoFeedback.setText("");

                const valorRacaoAtual = racao.valor || 15;
                this.textoPrecoBotao.setText(`${valorRacaoAtual}`);

                // Revela o container de informações e o container do botão de compra
                this.composicaoRacao.setVisible(true);
                this.containerInfo.setAlpha(0).setVisible(true);
                this.containerBotaoComprar.setVisible(true);
                
                this.tweens.add({ targets: [this.containerInfo, this.containerBotaoComprar], alpha: 1, duration: 250, ease: "Power2" });
            });
        });

        if (!gameState.instrucaoDescricaoRacaoVista) {
            this.mostrarInstrucaoDescricaoRacao(largura, altura);
        }

        const handleResizeRacaoSuperPremium = (gameSize) => {
            const w = gameSize.width;
            const h = gameSize.height;

            this.cameras.resize(w, h);
            this.fundo.setDisplaySize(w, h).setPosition(w / 2, h / 2);
            
            // Botões do HUD
            this.botaoVoltar.setPosition(w * 0.95, h * 0.9);
            this.botaoVoltar.escalaNormal = h * 0.0013; 
            this.botaoVoltar.escalaHover = h * 0.0016;  
            this.botaoVoltar.escalaPress = h * 0.0010;  
            this.botaoVoltar.setScale(this.botaoVoltar.escalaNormal);

            this.iconeMoeda.setPosition(w * 0.93, h * 0.06).setScale(h * 0.001); 
            
            if (this.textoMoedas) {
                this.textoMoedas.setPosition(w * 0.94, h * 0.06).setScale(h * 0.0015);
            }

            if (gameState.bilhete) {
                gameState.bilhete.setPosition(w * 0.94, h * 0.3);
                gameState.bilhete.escalaNormal = 0.12;  
                gameState.bilhete.escalaPassar = 0.14; 
                gameState.bilhete.setScale(gameState.bilhete.escalaNormal);
            }

            this.estante.setPosition(w * 0.30, h * 0.6).setScale(h * 0.0016);

            this.fundoTemplateRacao.setPosition(w * 0.70, h * 0.56).setScale(h * 0.00075);
            this.containerTexto.setPosition(w * 0.70, h * 0.55);
            
            this.titulo.setPosition(0, -h * 0.15).setScale(h * 0.00125);
            this.subtitulo.setPosition(0, h * 0.02).setScale(h * 0.0013);

            this.containerInfo.setPosition(w * 0.70, h * 0.47).setScale(h * 0.0009);
            
            // Atualiza posição e escalas do novo botão via Container
            this.containerBotaoComprar.setPosition(w * 0.70, h * 0.75);
            this.containerBotaoComprar.escalaNormal = h * 0.00025; 
            this.containerBotaoComprar.escalaHover = h * 0.00026;  
            this.containerBotaoComprar.escalaPress = h * 0.00023;  
            this.containerBotaoComprar.setScale(this.containerBotaoComprar.escalaNormal);

            this.textoFeedback.setPosition(w * 0.70, h * 0.93).setScale(h * 0.001);

            const novasColunas = [w * 0.18, w * 0.30, w * 0.42];
            const novasLinhas = [h * 0.37, h * 0.605, h * 0.845];
            
            let index = 0;
            for (let i = 0; i < 3; i++) { 
                for (let j = 0; j < 3; j++) { 
                    if(this.racoes[index]) {
                        this.racoes[index].sprite.setPosition(novasColunas[j], novasLinhas[i]);
                        
                        let escalaBase = h * 0.0005;
                        let escalaHover = h * 0.00053;

                        if (index >= 0 && index <= 2) { 
                            escalaBase = h * 0.0005;
                            escalaHover = h * 0.00053;
                        } else if (index >= 3 && index <= 5) { 
                            escalaBase = h * 0.0006;
                            escalaHover = h * 0.00063;
                        } else if (index >= 6 && index <= 8) { 
                            escalaBase = h * 0.0007;
                            escalaHover = h * 0.00073;
                        }

                        this.racoes[index].sprite.escalaNormal = escalaBase;  
                        this.racoes[index].sprite.escalaHover = escalaHover; 
                        this.racoes[index].sprite.setScale(this.racoes[index].sprite.escalaNormal);
                    }
                    index++;
                }
            }

            if (this.fundoEscuroInstrucao && this.fundoEscuroInstrucao.active) {
                this.fundoEscuroInstrucao.setSize(w, h);
                this.fundoEscuroInstrucao.setPosition(w / 2, h / 2);
                
                if (this.imgInstrucao && this.imgInstrucao.active) {
                    this.imgInstrucao.setPosition(w / 2, h / 2);
                    
                    if (this.txtContinuarInstrucao && this.txtContinuarInstrucao.active) {
                        const novoPosicaoTextoY = (h / 2) + (this.imgInstrucao.displayHeight / 2) + 30;
                        this.txtContinuarInstrucao.setPosition(w / 2, novoPosicaoTextoY);
                    }
                }
            }
        };

        this.scale.on("resize", handleResizeRacaoSuperPremium);

        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeRacaoSuperPremium);
        });
    }

    mostrarInstrucaoDescricaoRacao(largura, altura) {
        const centroX = largura / 2;
        const centroY = altura / 2;

        this.fundoEscuroInstrucao = this.add.rectangle(centroX, centroY, largura, altura, 0x000000, 0.7)
            .setDepth(1000)
            .setInteractive(); 

        this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoEscolhaRacao")
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
            
            gameState.instrucaoDescricaoRacaoVista = true; 
        });
    }

    transicaoPara(chaveCena) {
        if (this.transicao) return;

        this.transicao = true;
        this.cameras.main.fadeOut(this.duracaoFade, 0, 0, 0);
        
        this.cameras.main.once("camerafadeoutcomplete", () => {
            if (this.scene.isActive("ficha")) {
                this.scene.stop("ficha");
            }
            this.scene.start(chaveCena);
        });
    }
}