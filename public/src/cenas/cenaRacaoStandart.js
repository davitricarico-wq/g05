import { gameState } from "../main.js";
import { Racao } from "../componentes/controleRacoes/racoes.js";
import { ficha } from "../componentes/ficha.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";

// Importando APENAS os dados da linha Standart
import {
    standartGrandeFilhote, standartGrandeAdulto, standartGrandeSenior,
    standartMediaFilhote, standartMediaAdulto, standartMediaSenior,
    standartPequenaFilhote, standartPequenaAdulto, standartPequenaSenior
} from "../componentes/controleRacoes/dadosRacoes.js";

export class cenaRacaoStandart extends Phaser.Scene {
    constructor() {
        super({ key: "cenaRacaoStandart" });
        this.transicao = false;
        this.duracaoFade = 250;
    }

    create() {
        let largura = this.scale.width;
        let altura = this.scale.height;

        const centroEsquerdaX = largura * 0.30;
        const centroDireitaX = largura * 0.70;

        const petAtivo = gameState.pets.cachorroHeroi ? cachorrosBase[1] : cachorrosBase[0];
        const pet = petAtivo;

        this.scene.stop("HUD");
        this.transicao = false;

        const criarBotao = (x, y, texturaNormal, texturaPressionado, escalaBase, escalaAumentada, escalaPressionada, callback) => {
            const botao = this.add.image(x, y, texturaNormal).setScale(escalaBase).setInteractive({ useHandCursor: true });

            // Salvamos as escalas no próprio botão para poder atualizar no resize
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
            // Salvamos as escalas no alvo para atualizar no resize
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

       
        this.fundo = this.add.image(largura / 2, altura / 2, "bgLimpo")
            .setDisplaySize(largura, altura)
            .setDepth(-1);

        this.cameras.main.setBounds(0, 0, largura, altura);
        this.cameras.main.fadeIn(this.duracaoFade, 0, 0, 0);

        this.botaoVoltar = criarBotao(
            largura * 0.95, altura * 0.9, "iconeVoltar", "iconeVoltar",
            0.8, 1, 0.6,
            () => this.transicaoPara("cenaComida")
        );

        this.iconeMoeda = this.add.image(largura * 0.93, altura * 0.06, "cobasiCoin").setScale(0.6);

        this.textoMoedas = this.add.text(largura * 0.94, altura * 0.06, gameState.cobasiCoins, {
            fontSize: "20px", color: "#ffffff", fontFamily: '"Press Start 2P"', align: "center"
        }).setOrigin(0.5);  
        
        gameState.bilhete = this.add.image(largura * 0.94, altura * 0.3, 'mineFicha')
            .setScale(0.12)
            .setDepth(20)
            .setInteractive({ useHandCursor:true });
        passarPressionarEfeito(gameState.bilhete, 0.12, 0.14);

        gameState.bilhete.on("pointerup", alternarFicha);

        this.botaoStandard = criarBotao(
            largura * 0.20, altura * 0.15,
            "botaoStandard", "botaoStandardPressionado",
            0.35, 0.4, 0.30,
            () => { /* Já estamos na cena Standard */ }
        );

        this.botaoSuperPremium = criarBotao(
            largura * 0.40, altura * 0.155,
            "botaoSuperPremium", "botaoSuperPremiumPressionado",
            0.35, 0.4, 0.3,
            () => this.scene.start("cenaRacaoSuperPremium")
        );

        this.estante = this.add.image(centroEsquerdaX, altura * 0.6, "estanteVazia").setScale(1).setDepth(-1);

        const colunasRacao = [largura * 0.18, largura * 0.30, largura * 0.42];
        const linhasRacao = [altura * 0.37, altura * 0.605, altura * 0.845];

        this.racoesStandard = [
            new Racao(this, colunasRacao[0], linhasRacao[0], standartGrandeFilhote),
            new Racao(this, colunasRacao[1], linhasRacao[0], standartGrandeAdulto),
            new Racao(this, colunasRacao[2], linhasRacao[0], standartGrandeSenior),
            new Racao(this, colunasRacao[0], linhasRacao[1], standartMediaFilhote),
            new Racao(this, colunasRacao[1], linhasRacao[1], standartMediaAdulto),
            new Racao(this, colunasRacao[2], linhasRacao[1], standartMediaSenior),
            new Racao(this, colunasRacao[0], linhasRacao[2], standartPequenaFilhote),
            new Racao(this, colunasRacao[1], linhasRacao[2], standartPequenaAdulto),
            new Racao(this, colunasRacao[2], linhasRacao[2], standartPequenaSenior),
        ];
        
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

        this.botaoComprarStandard = criarBotao(
            centroDireitaX, altura * 0.75, 
            "botaoComprarStandard", "botaoComprarStandardPressionado",
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

                if (gameState.cobasiCoins < valorDaRacao) {
                    this.textoFeedback.setText("SALDO INSUFICIENTE!").setColor("#ff0000");
                    return;
                }

                gameState.cobasiCoins -= valorDaRacao;
                this.textoMoedas.setText(gameState.cobasiCoins);

                this.textoFeedback.setText(`COMPRA EFETUADA! (-${valorDaRacao} MOEDAS)\nRedirecionando...`).setColor("#006600");
                this.botaoComprarStandard.disableInteractive();
                this.time.delayedCall(1500, () => {
                    Racao.selecionada = null; 
                    this.transicaoPara("jogoAlimentacao"); 
                });
            }
        ).setVisible(false).setAlpha(0);

        this.containerInfo = this.add.container(centroDireitaX, altura * 0.47)
            .setScale(altura * 0.0009)
            .setVisible(false).setAlpha(0);

        this.composicaoRacao = this.add.image(0, 0, "composicaoRacao");
        this.imagemRacaoInfo = this.add.image(-160, -70, "").setScale(0.18);

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

        this.racoesStandard.forEach((racao) => {
            // Propriedades dinâmicas para a ração
            racao.sprite.escalaNormal = 0.3;
            racao.sprite.escalaHover = 0.32;

            racao.sprite.setScale(racao.sprite.escalaNormal).setVisible(true).setInteractive({ useHandCursor: true });
            
            racao.sprite.on("pointerover", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaHover, duration: 100, ease: "Power2" }));
            racao.sprite.on("pointerout", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaNormal, duration: 100, ease: "Power2" }));

            racao.sprite.on("pointerup", () => {
                Racao.selecionada = racao; 
                this.tweens.add({
                    targets: this.containerTexto, alpha: 0, duration: 200, ease: "Power2",
                    onComplete: () => this.containerTexto.setVisible(false)
                });
                this.textoTipo.setText(racao.tipo || "Standard");
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
                this.botaoComprarStandard.setVisible(true);
                
                this.tweens.add({ targets: [this.containerInfo, this.botaoComprarStandard], alpha: 1, duration: 250, ease: "Power2" });
            });
        });

        
        const handleResizeRacaoStandart = (gameSize) => {
            const w = gameSize.width;
            const h = gameSize.height;

            try {
                this.cameras.resize(w, h);
                this.fundo.setDisplaySize(w, h).setPosition(w / 2, h / 2);
                
                // Botão Voltar (Atualiza as variáveis de hover/press dinamicamente)
                if (this.botaoVoltar) {
                    this.botaoVoltar.setPosition(w * 0.95, h * 0.9);
                    this.botaoVoltar.escalaNormal = h * 0.0013;
                    this.botaoVoltar.escalaHover = h * 0.0016;
                    this.botaoVoltar.escalaPress = h * 0.0010;
                    this.botaoVoltar.setScale(this.botaoVoltar.escalaNormal);
                }

                if (this.iconeMoeda) {
                    this.iconeMoeda.setPosition(w * 0.93, h * 0.06).setScale(h * 0.001);
                }
                
                if (this.textoMoedas) {
                    this.textoMoedas.setPosition(w * 0.94, h * 0.06).setScale(h * 0.0015);
                }

                // Bilhete
                if (gameState.bilhete) {
                    gameState.bilhete.setPosition(w * 0.94, h * 0.3);
                    gameState.bilhete.escalaNormal = 0.12;
                    gameState.bilhete.escalaPassar = 0.14;
                    gameState.bilhete.setScale(gameState.bilhete.escalaNormal);
                }

                // Botões de Categoria
                if (this.botaoStandard) {
                    this.botaoStandard.setPosition(w * 0.20, h * 0.15);
                    this.botaoStandard.escalaNormal = h * 0.00058;
                    this.botaoStandard.escalaHover = h * 0.00066;
                    this.botaoStandard.escalaPress = h * 0.0005;
                    this.botaoStandard.setScale(this.botaoStandard.escalaNormal);
                }

                if (this.botaoSuperPremium) {
                    this.botaoSuperPremium.setPosition(w * 0.40, h * 0.155);
                    this.botaoSuperPremium.escalaNormal = h * 0.00058;
                    this.botaoSuperPremium.escalaHover = h * 0.00066;
                    this.botaoSuperPremium.escalaPress = h * 0.0005;
                    this.botaoSuperPremium.setScale(this.botaoSuperPremium.escalaNormal);
                }

                if (this.estante) {
                    this.estante.setPosition(w * 0.30, h * 0.6).setScale(h * 0.0016);
                }

                if (this.fundoTemplateRacao) {
                    this.fundoTemplateRacao.setPosition(w * 0.70, h * 0.56).setScale(h * 0.00075);
                }
                
                if (this.containerTexto) {
                    this.containerTexto.setPosition(w * 0.70, h * 0.55);
                }

                if (this.titulo) {
                    this.titulo.setScale(h * 0.00125);
                }
                
                if (this.subtitulo) {
                    this.subtitulo.setScale(h * 0.0013);
                }

                if (this.containerInfo) {
                    this.containerInfo.setPosition(w * 0.70, h * 0.47).setScale(h * 0.0009);
                }
                
                // Botão Comprar
                if (this.botaoComprarStandard) {
                    this.botaoComprarStandard.setPosition(w * 0.70, h * 0.75);
                    this.botaoComprarStandard.escalaNormal = h * 0.00025;
                    this.botaoComprarStandard.escalaHover = h * 0.00026;
                    this.botaoComprarStandard.escalaPress = h * 0.00023;
                    this.botaoComprarStandard.setScale(this.botaoComprarStandard.escalaNormal);
                }

                if (this.textoFeedback) {
                    this.textoFeedback.setPosition(w * 0.70, h * 0.93).setScale(h * 0.001);
                }

                const novasColunas = [w * 0.18, w * 0.30, w * 0.42];
                const novasLinhas = [h * 0.37, h * 0.605, h * 0.845];
                
                // Atualização dinâmica também para as Rações na Estante
                if (this.racoesStandard) {
                    let index = 0;
                    for (let i = 0; i < 3; i++) { 
                        for (let j = 0; j < 3; j++) { 
                            if(this.racoesStandard[index]) {
                                this.racoesStandard[index].sprite.setPosition(novasColunas[j], novasLinhas[i]);
                                this.racoesStandard[index].sprite.escalaNormal = h * 0.0005;
                                this.racoesStandard[index].sprite.escalaHover = h * 0.00053;
                                this.racoesStandard[index].sprite.setScale(this.racoesStandard[index].sprite.escalaNormal);
                            }
                            index++;
                        }
                    }
                }
            } catch (e) {
                console.error("Erro no resize handler:", e);
            }
        };

        this.scale.on("resize", handleResizeRacaoStandart);

        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeRacaoStandart);
        });
    }

    transicaoPara(chaveCena) {
        if (this.transicao) return;
        this.transicao = true;
        this.cameras.main.fadeOut(this.duracaoFade, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
            if (this.scene.isActive("ficha")) this.scene.stop("ficha");
            this.scene.start(chaveCena);
        });
    }
}
