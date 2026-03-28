// importando o estado global, a classe modelo de ração, a ficha e os controladores de estado do mascote
import { gameState } from "../main.js";
import { Racao } from "../componentes/controleRacoes/racoes.js";
import { ficha } from "../componentes/ficha.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";

// importando APENAS os dados referentes às rações disponíveis na linha Standard
import {
    standartGrandeFilhote, standartGrandeAdulto, standartGrandeSenior,
    standartMediaFilhote, standartMediaAdulto, standartMediaSenior,
    standartPequenaFilhote, standartPequenaAdulto, standartPequenaSenior
} from "../componentes/controleRacoes/dadosRacoes.js";

// definição da classe controladora da cena de rações da categoria standard
export class cenaRacaoStandart extends Phaser.Scene {
    constructor() {
        super({ key: "cenaRacaoStandart" });
        this.transicao = false;
        this.duracaoFade = 250;
    }

    create() {
        // obtendo as dimensões de largura e altura do canvas da aplicação
        let largura = this.scale.width;
        let altura = this.scale.height;

        // calculando as posições centrais relativas para os eixos esquerdo e direito
        const centroEsquerdaX = largura * 0.30;
        const centroDireitaX = largura * 0.70;

        // determinando o mascote ativo com base no estado global da aplicação
        const petAtivo = gameState.pets.cachorroHeroi ? cachorrosBase[1] : cachorrosBase[0];
        const pet = petAtivo;

        // interrompendo a execução da cena de interface de usuário e redefinindo o estado de transição
        this.scene.stop("HUD");
        this.transicao = false;

        // preservando as declarações de funções originais com adaptações para leitura de escala dinâmica
        const criarBotao = (x, y, texturaNormal, texturaPressionado, escalaBase, escalaAumentada, escalaPressionada, callback) => {
            const botao = this.add.image(x, y, texturaNormal).setScale(escalaBase).setInteractive({ useHandCursor: true });

            // armazenando os valores de escala na instância do botão para posterior atualização durante o redimensionamento da tela
            botao.escalaNormal = escalaBase;
            botao.escalaHover = escalaAumentada;
            botao.escalaPress = escalaPressionada;

            // registro dos tratadores de eventos de ponteiro para os estados de interação do botão
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

        // função auxiliar para aplicar efeitos visuais de transição de escala aos elementos interativos
        const passarPressionarEfeito = (alvo, escalaNormal, escalaPassar) => {
            // preservando as propriedades de escala no objeto alvo para suporte ao redimensionamento
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

        // função responsável por alternar a visibilidade da cena contendo a ficha de informações do mascote
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

        // instanciando o botão de retorno com a respectiva função de chamada para transição de cena
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
        
        // inicializando o elemento gráfico da ficha de informações do mascote e vinculando eventos interativos
        gameState.bilhete = this.add.image(largura * 0.94, altura * 0.3, 'mineFicha')
            .setScale(0.12)
            .setDepth(20)
            .setInteractive({ useHandCursor:true });
        
        // aplicando o tratador de eventos visuais de escala no elemento do bilhete
        passarPressionarEfeito(gameState.bilhete, 0.12, 0.14);

        gameState.bilhete.on("pointerup", alternarFicha);

        // instanciando os botões de navegação entre as categorias de alimentação
        this.botaoStandard = criarBotao(
            largura * 0.20, altura * 0.15,
            "botaoStandard", "botaoStandardPressionado",
            0.35, 0.4, 0.30,
            () => { /* Já estamos na cena Standard, ignorando comando */ }
        );

        this.botaoSuperPremium = criarBotao(
            largura * 0.40, altura * 0.155,
            "botaoSuperPremium", "botaoSuperPremiumPressionado",
            0.35, 0.4, 0.3,
            () => this.scene.start("cenaRacaoSuperPremium")
        );

        // renderizando o elemento gráfico da estante para alocação dos itens
        this.estante = this.add.image(centroEsquerdaX, altura * 0.6, "estanteVazia").setScale(1).setDepth(-1);

        // definindo as coordenadas de grade para o posicionamento matricial dos itens na estante
        const colunasRacao = [largura * 0.18, largura * 0.30, largura * 0.42];
        const linhasRacao = [altura * 0.37, altura * 0.605, altura * 0.845];

        // instanciando o grupo de rações da categoria standard utilizando as importações específicas
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
        
        // inicializando o painel de fundo para exibição das informações nutricionais
        this.fundoTemplateRacao = this.add.image(centroDireitaX, altura * 0.56, "fundoTemplateRacao")
            .setScale(altura * 0.00075);

        // instanciando um contêiner inicial para o alinhamento centralizado dos elementos textuais instrucionais
        this.containerTexto = this.add.container(centroDireitaX, altura * 0.55);

        this.titulo = this.add.text(0, -altura*0.15, "Compre sua ração!", {
            fontSize: "22px", color: "#000", fontFamily: '"Press Start 2P"', align: "center"
        }).setScale(altura*0.00125).setOrigin(0.5);

        this.subtitulo = this.add.text(0, altura*0.02, "Escolha o tipo de\n\nração ideal para seu\n\npet entre Super\n\nPremium e Standard", {
            fontSize: "18px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 450 }
        }).setScale(altura*0.0013).setOrigin(0.5);

        this.containerTexto.add([this.titulo, this.subtitulo]);

        // configurando o elemento de texto destinado ao retorno visual das operações de transação
        this.textoFeedback = this.add.text(centroDireitaX, altura * 0.93, "", {
            fontSize: "14px", color: "#ff0000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 350 }
        }).setOrigin(0.5);

        // instanciando o botão de confirmação e implementando a lógica integral de validação da transação financeira
        this.botaoComprarStandard = criarBotao(
            centroDireitaX, altura * 0.75, 
            "botaoComprarStandard", "botaoComprarStandardPressionado",
            0.15, 0.16, 0.14,
            () => {
                // validação da existência de um item previamente selecionado pelo usuário
                if (!Racao.selecionada) {
                    this.textoFeedback.setText("SELECIONE UMA RAÇÃO PRIMEIRO!").setColor("#ff0000");
                    return;
                }
                
                // validação de compatibilidade entre o item selecionado e os requisitos específicos do mascote ativo
                if (Racao.selecionada.id !== pet.id) {
                    this.textoFeedback.setText("ESSA RAÇÃO NÃO É IDEAL.\nESCOLHA OUTRA RAÇÃO.").setColor("#ff0000");
                    return;
                }

                // obtenção do valor comercial do item e verificação de disponibilidade de saldo financeiro
                const valorDaRacao = Racao.selecionada.valor || 15;

                if (gameState.cobasiCoins < valorDaRacao) {
                    // emissão de feedback visual indicando insuficiência de recursos financeiros
                    this.textoFeedback.setText("SALDO INSUFICIENTE!").setColor("#ff0000");
                    return;
                }

                // dedução do valor no saldo global e atualização do componente textual na interface
                gameState.cobasiCoins -= valorDaRacao;
                this.textoMoedas.setText(gameState.cobasiCoins);

                // emissão do feedback visual indicando transação bem-sucedida
                this.textoFeedback.setText(`COMPRA EFETUADA! (-${valorDaRacao} MOEDAS)\nRedirecionando...`).setColor("#006600");
                
                // desabilitação da interatividade do botão para prevenção de requisições duplicadas
                this.botaoComprarStandard.disableInteractive();
                
                // atualização das variáveis de estado globais referentes ao tipo de ração adquirida
                gameState.standart = true;
                gameState.superPremium = false;

                // inicialização de atraso temporal para redirecionamento sequencial à fase de alimentação
                this.time.delayedCall(1500, () => {
                    Racao.selecionada = null; 
                    this.transicaoPara("jogoAlimentacao"); 
                });
            }
        ).setVisible(false).setAlpha(0);

        // inicialização do contêiner oculto destinado ao agrupamento dos dados nutricionais exibidos após a seleção
        this.containerInfo = this.add.container(centroDireitaX, altura * 0.47)
            .setScale(altura * 0.0009)
            .setVisible(false).setAlpha(0);

        this.composicaoRacao = this.add.image(0, 0, "composicaoRacao");
        this.imagemRacaoInfo = this.add.image(-160, -70, "").setScale(0.18);

        // parametrização tipográfica e espacial dos elementos textuais de composição nutricional
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

        // iteração sobre o array de rações para injeção de propriedades interativas e dinâmicas
        this.racoesStandard.forEach((racao) => {
            // atribuição de propriedades dinâmicas baseadas na instancialização gráfica da ração
            racao.sprite.escalaNormal = 0.3;
            racao.sprite.escalaHover = 0.32;

            racao.sprite.setScale(racao.sprite.escalaNormal).setVisible(true).setInteractive({ useHandCursor: true });
            
            racao.sprite.on("pointerover", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaHover, duration: 100, ease: "Power2" }));
            racao.sprite.on("pointerout", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaNormal, duration: 100, ease: "Power2" }));

            // vinculando evento de clique para preenchimento e exibição do painel de informações com os dados do item focado
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

        // implementação do tratador de eventos focado na readequação proporcional dos elementos gráficos durante o redimensionamento da janela
        const handleResizeRacaoStandart = (gameSize) => {
            const w = gameSize.width;
            const h = gameSize.height;

            try {
                this.cameras.resize(w, h);
                this.fundo.setDisplaySize(w, h).setPosition(w / 2, h / 2);
                
                // atualização dinâmica das variáveis de interação física e dimensões do botão voltar
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

                // recalibragem responsiva da ficha do mascote
                if (gameState.bilhete) {
                    gameState.bilhete.setPosition(w * 0.94, h * 0.3);
                    gameState.bilhete.escalaNormal = 0.12;
                    gameState.bilhete.escalaPassar = 0.14;
                    gameState.bilhete.setScale(gameState.bilhete.escalaNormal);
                }

                // recalibragem responsiva dos controladores de transição de categoria
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
                
                // atualização responsiva do componente finalizador da transação (Botão Comprar)
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
                
                // atualização em malha matricial para garantir posicionamento fluido dos itens na vitrine/estante
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

        // vinculando e gerenciando ativamente o evento global de redimensionamento
        this.scale.on("resize", handleResizeRacaoStandart);

        // assegurando o descarte do ouvinte de evento durante o descarte da cena para mitigar possíveis vazamentos de memória
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeRacaoStandart);
        });
    }

    // função auxiliar destinada ao controle de transições visuais de saída entre cenas de interface
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