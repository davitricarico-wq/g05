// importando os dados referentes às rações disponíveis no catálogo
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

// importando a classe modelo de ração e os controladores de estado do mascote
import { Racao } from "../componentes/controleRacoes/racoes.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";
import { gameState, iniciarMusicaAleatoria } from "../main.js";
import { ficha } from "../componentes/ficha.js";

// definição da classe controladora da cena de rações
export class cenaEstanteRacao extends Phaser.Scene {
    constructor() {
        super({ key: "cenaEstanteRacao" });
        this.transicao = false;
        this.duracaoFade = 250;
    }

    create() {
        // Inicia música aleatória
        iniciarMusicaAleatoria(this);

        // obtendo as dimensões de largura e altura do canvas da aplicação
        let largura = this.scale.width;
        let altura = this.scale.height;

        // calculando as posições centrais relativas para os eixos esquerdo e direito
        const centroEsquerdaX = largura * 0.30;
        const centroDireitaX = largura * 0.70;

        // determinando o mascote ativo com base no estado global da aplicação
        const petAtivo = gameState.pets.cachorroJoao ? cachorrosBase[2] : (gameState.pets.cachorroHeroi ? cachorrosBase[1] : cachorrosBase[0]);
        const pet = petAtivo;

        // interrompendo a execução da cena de interface de usuário e redefinindo o estado de transição
        this.scene.stop("HUD");
        this.transicao = false;

        // preservando as declarações de funções originais com adaptações para leitura de escala dinâmica
        const criarBotao = (x, y, texturaNormal, texturaPressionado, escalaBase, escalaAumentada, escalaPressionada, callback) => {
            const botao = this.add.image(x, y, texturaNormal).setScale(escalaBase).setInteractive({ useHandCursor: true });

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

        // renderizando a imagem de fundo e iniciando o efeito visual de transição de entrada
        this.fundo = this.add.image(largura / 2, altura / 2, "bgLimpo")
            .setDisplaySize(largura, altura)
            .setDepth(-1);

        this.cameras.main.setBounds(0, 0, largura, altura);
        this.cameras.main.fadeIn(this.duracaoFade, 0, 0, 0);

        // instanciando o botão de retorno
        this.botaoVoltar = criarBotao(
            largura * 0.95, altura * 0.9, "iconeVoltar", "iconeVoltar",
            0.8, 1, 0.6,
            () => this.transicaoPara("cenaComida")
        );

        // renderizando o ícone e o valor atualizado do saldo de moedas virtuais do usuário
        this.iconeMoeda = this.add.image(largura * 0.93, altura * 0.06, "cobasiCoin").setScale(0.6);

        this.textoMoedas = this.add.text(largura * 0.94, altura * 0.06, gameState.cobasiCoins, {
            fontSize: "20px", color: "#ffffff", fontFamily: '"Press Start 2P"', align: "center"
        }).setOrigin(0.5);  

        // inicializando o elemento gráfico da ficha de informações
        gameState.bilhete = this.add.image(largura * 0.94, altura * 0.3, 'mineFicha')
            .setScale(0.12)
            .setDepth(20)
            .setInteractive({ useHandCursor:true });
        
        gameState.bilhete.escalaNormal = 0.12;
        gameState.bilhete.escalaPassar = 0.14;
        
        passarPressionarEfeito(gameState.bilhete, 0.12, 0.14);
        gameState.bilhete.on("pointerup", alternarFicha);

        // renderizando a estante
        this.estante = this.add.image(centroEsquerdaX, altura * 0.6, "estanteVazia").setScale(1).setDepth(-1);

        const colunasRacao = [largura * 0.18, largura * 0.30, largura * 0.42];
        const linhasRacao = [altura * 0.35, altura * 0.605, altura * 0.855];

        // Instanciando as rações corretas importadas do dadosRacoes.js (Grid 3x3)
        this.racoes = [
            // Linha 1: Rações Standard (Índices 0 a 2)
            new Racao(this, colunasRacao[0], linhasRacao[0], racaoStandardPequeno),
            new Racao(this, colunasRacao[1], linhasRacao[0], racaoStandardMedio),
            new Racao(this, colunasRacao[2], linhasRacao[0], racaoStandardGrande),
            
            // Linha 2: Rações Premium (Índices 3 a 5)
            new Racao(this, colunasRacao[0], linhasRacao[1], racaoPremiumPequeno),
            new Racao(this, colunasRacao[1], linhasRacao[1], racaoPremiumMedio),
            new Racao(this, colunasRacao[2], linhasRacao[1], racaoPremiumGrande),
            
            // Linha 3: Rações Super Premium (Índices 6 a 8)
            new Racao(this, colunasRacao[0], linhasRacao[2], racaoSuperPremiumPequeno),
            new Racao(this, colunasRacao[1], linhasRacao[2], racaoSuperPremiumMedio),
            new Racao(this, colunasRacao[2], linhasRacao[2], racaoSuperPremiumGrande),
        ];
        
        // inicializando o painel de fundo para exibição das informações nutricionais
        this.fundoTemplateRacao = this.add.image(centroDireitaX, altura * 0.56, "fundoTemplateRacao")
            .setScale(altura * 0.00075);

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

        // instanciando o botão de confirmação e lógica de compra
        this.botaoComprarSuperPremium = criarBotao(
            centroDireitaX, altura * 0.75,
            "botaoComprarSuperPremium", "botaoComprarSuperPremiumPressionado",
            0.15, 0.16, 0.14,
            () => {
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

                    this.botaoComprarSuperPremium.disableInteractive();

                    // --- ATUALIZAÇÃO DO GAMESTATE AQUI ---
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

                    // 👉 NOVA LÓGICA: Salvamos a ração exata no gameState
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
            }
        ).setVisible(false).setAlpha(0); 

        // inicialização do contêiner de informações nutricionais
        this.containerInfo = this.add.container(centroDireitaX, altura * 0.47)
            .setScale(altura * 0.0009)
            .setVisible(false).setAlpha(0);

        this.composicaoRacao = this.add.image(0, 0, "composicaoRacao");
        this.imagemRacaoInfo = this.add.image(-160, -70, "").setScale(0.5);

        this.textoTipo = this.add.text(0, -217, "", { fontSize: "32px", color: "#000", fontFamily: '"Press Start 2P"', align: "center" }).setOrigin(0.5);
        this.textoPorte = this.add.text(75, -138, "", { fontSize: "16px", color: "#006600", fontFamily: '"Press Start 2P"' }).setOrigin(0, 0.5);
        this.textoIdade = this.add.text(75, -102, "", { fontSize: "16px", color: "#006600", fontFamily: '"Press Start 2P"' }).setOrigin(0, 0.5);
        this.textoChar1 = this.add.text(80, -44, "", { fontSize: "16px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 300 } }).setOrigin(0.5);
        this.textoChar2 = this.add.text(80, 18, "", { fontSize: "16px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 300 } }).setOrigin(0.5);

        const porcentagem = { fontSize: "12px", color: "#8B4513", fontFamily: '"Press Start 2P"' };
        this.textoTrigo = this.add.text(-170, 204, "", porcentagem).setOrigin(0.5);
        this.textoCarne = this.add.text(-60, 204, "", porcentagem).setOrigin(0.5);
        this.textoOsso = this.add.text(51, 204, "", porcentagem).setOrigin(0.5);
        this.textoGordura = this.add.text(165, 204, "", porcentagem).setOrigin(0.5);

        this.containerInfo.add([
            this.composicaoRacao, this.imagemRacaoInfo, this.textoTipo, this.textoPorte, this.textoIdade, 
            this.textoChar1, this.textoChar2, this.textoTrigo, this.textoCarne, this.textoOsso, this.textoGordura
        ]);

        // Interação com as Rações na Estante
        this.racoes.forEach((racao, index) => {
            // 🚨 REMOVE EVENTOS ANTIGOS DA CLASSE RACAO
            racao.sprite.removeAllListeners('pointerover');
            racao.sprite.removeAllListeners('pointerout');

            let tamanhoNormal = 0.3;
            let tamanhoHover = 0.32;

            // CONDIÇÃO INICIAL DE ESCALAS POR ÍNDICES
            if (index >= 0 && index <= 2) {
                // Rações Standard (Linha de cima)
                tamanhoNormal = 0.3; 
                tamanhoHover = 0.35;

            } else if (index >= 3 && index <= 5) {
                // Rações Premium (Linha do meio)
                tamanhoNormal = 0.3; 
                tamanhoHover = 0.35;
            } else if (index >= 6 && index <= 8) {
                // Rações Super Premium (Linha de baixo)
                tamanhoNormal = 0.3; 
                tamanhoHover = 0.35;
            }

            racao.sprite.escalaNormal = tamanhoNormal;
            racao.sprite.escalaHover = tamanhoHover;

            // APLICA O SETSCALE DIRETAMENTE AQUI
            racao.sprite.setScale(tamanhoNormal).setVisible(true).setInteractive({ useHandCursor: true });
            
            // Recria os eventos de hover com as escalas novas
            racao.sprite.on("pointerover", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaHover, duration: 100, ease: "Power2" }));
            racao.sprite.on("pointerout", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaNormal, duration: 100, ease: "Power2" }));

            racao.sprite.on("pointerup", () => {
                Racao.selecionada = racao; 
                this.tweens.add({
                    targets: this.containerTexto, alpha: 0, duration: 200, ease: "Power2",
                    onComplete: () => this.containerTexto.setVisible(false)
                });

                this.textoTipo.setText(racao.tipo || "Super Premium");
                this.textoPorte.setText(racao.porte || "-");
                this.textoIdade.setText(racao.idade || "-");
                this.textoChar1.setText(racao.caracteristicas ? racao.caracteristicas[0] : "");
                this.textoChar2.setText(racao.caracteristicas ? racao.caracteristicas[1] : "");
                this.textoTrigo.setText(racao.nutrientes ? racao.nutrientes.trigo : "");
                this.textoCarne.setText(racao.nutrientes ? racao.nutrientes.carne : "");
                this.textoOsso.setText(racao.nutrientes ? racao.nutrientes.osso : "");
                this.textoGordura.setText(racao.nutrientes ? racao.nutrientes.gordura : "");
                this.imagemRacaoInfo.setTexture(racao.sprite.texture.key);

                if (this.textoFeedback) this.textoFeedback.setText("");

                this.composicaoRacao.setVisible(true);
                this.containerInfo.setAlpha(0).setVisible(true);
                this.botaoComprarSuperPremium.setVisible(true);
                
                this.tweens.add({ targets: [this.containerInfo, this.botaoComprarSuperPremium], alpha: 1, duration: 250, ease: "Power2" });
            });
        });

        // Modal de Instruções
        if (!gameState.instrucaoDescricaoRacaoVista) {
            this.mostrarInstrucaoDescricaoRacao(largura, altura);
        }

        // Evento de Resize
        const handleResizeRacaoSuperPremium = (gameSize) => {
            const w = gameSize.width;
            const h = gameSize.height;

            this.cameras.resize(w, h);
            this.fundo.setDisplaySize(w, h).setPosition(w / 2, h / 2);
            
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
            
            this.botaoComprarSuperPremium.setPosition(w * 0.70, h * 0.75);
            this.botaoComprarSuperPremium.escalaNormal = h * 0.00025; 
            this.botaoComprarSuperPremium.escalaHover = h * 0.00026;  
            this.botaoComprarSuperPremium.escalaPress = h * 0.00023;  
            this.botaoComprarSuperPremium.setScale(this.botaoComprarSuperPremium.escalaNormal);

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

                        //  CONDIÇÃO DE RESIZE POR ÍNDICES
                        if (index >= 0 && index <= 2) {
                            // Rações Standard
                            escalaBase = h * 0.0005;
                            escalaHover = h * 0.00053;
                        } else if (index >= 3 && index <= 5) {
                            // Rações Premium
                            escalaBase = h * 0.0006;
                            escalaHover = h * 0.00063;
                        } else if (index >= 6 && index <= 8) {
                            // Rações Super Premium
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

        this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoDescricaoRacao")
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