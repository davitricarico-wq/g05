/// importando os dados referentes às rações disponíveis no catálogo
import {
    racaoGrandeFilhote,
    racaoGrandeAdulto,
    racaoGrandeSenior,
    racaoMediaAdulto,
    racaoMediaFilhote,
    racaoMediaSenior,
    racaoPequenaAdulto,
    racaoPequenaFilhote,
    racaoPequenaSenior
} from "../componentes/controleRacoes/dadosRacoes.js";

/// importando a classe modelo de ração e os controladores de estado do mascote
import { Racao } from "../componentes/controleRacoes/racoes.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";
import { gameState } from "../main.js";
import { ficha } from "../componentes/ficha.js";

/// definição da classe controladora da cena de rações da categoria super premium
export class cenaRacaoSuperPremium extends Phaser.Scene {
    constructor() {
        super({ key: "cenaRacaoSuperPremium" });
        this.transicao = false;
        this.duracaoFade = 250;
    }

    create() {
        /// obtendo as dimensões de largura e altura do canvas da aplicação
        let largura = this.scale.width;
        let altura = this.scale.height;

        /// calculando as posições centrais relativas para os eixos esquerdo e direito
        const centroEsquerdaX = largura * 0.30;
        const centroDireitaX = largura * 0.70;

        /// determinando o mascote ativo com base no estado global da aplicação
        const petAtivo = gameState.pets.cachorroHeroi ? cachorrosBase[1] : cachorrosBase[0];
        const pet = petAtivo;

        /// interrompendo a execução da cena de interface de usuário e redefinindo o estado de transição
        this.scene.stop("HUD");
        this.transicao = false;

        /// preservando as declarações de funções originais com adaptações para leitura de escala dinâmica
        const criarBotao = (x, y, texturaNormal, texturaPressionado, escalaBase, escalaAumentada, escalaPressionada, callback) => {
            const botao = this.add.image(x, y, texturaNormal).setScale(escalaBase).setInteractive({ useHandCursor: true });

            /// armazenando os valores de escala na instância do botão para posterior atualização durante o redimensionamento da tela
            botao.escalaNormal = escalaBase;
            botao.escalaHover = escalaAumentada;
            botao.escalaPress = escalaPressionada;

            /// registro dos tratadores de eventos de ponteiro para os estados de interação do botão
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

        /// função auxiliar para aplicar efeitos visuais de transição de escala aos elementos interativos
        const passarPressionarEfeito = (alvo, escalaNormal, escalaPassar) => {
            /// preservando as propriedades de escala no objeto alvo para suporte ao redimensionamento
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

        /// função responsável por alternar a visibilidade da cena contendo a ficha de informações do mascote
        const alternarFicha = () => {
            if (this.scene.isActive("ficha")) {
                this.scene.stop("ficha");
                return;
            }

            this.scene.launch("ficha");
            this.scene.bringToTop("ficha");
        };

        /// renderizando a imagem de fundo e iniciando o efeito visual de transição de entrada
        this.fundo = this.add.image(largura / 2, altura / 2, "bgLimpo")
            .setDisplaySize(largura, altura)
            .setDepth(-1);

        this.cameras.main.setBounds(0, 0, largura, altura);
        this.cameras.main.fadeIn(this.duracaoFade, 0, 0, 0);

        /// instanciando o botão de retorno com a respectiva função de chamada para transição de cena
        this.botaoVoltar = criarBotao(
            largura * 0.95, altura * 0.9, "iconeVoltar", "iconeVoltar",
            0.8, 1, 0.6,
            () => this.transicaoPara("cenaComida")
        );

        /// renderizando o ícone e o valor atualizado do saldo de moedas virtuais do usuário
        this.iconeMoeda = this.add.image(largura * 0.93, altura * 0.06, "cobasiCoin").setScale(0.6);

        this.textoMoedas = this.add.text(largura * 0.94, altura * 0.06, gameState.cobasiCoins, {
            fontSize: "20px", color: "#ffffff", fontFamily: '"Press Start 2P"', align: "center"
        }).setOrigin(0.5);  

        /// inicializando o elemento gráfico da ficha de informações do mascote e vinculando eventos interativos
        gameState.bilhete = this.add.image(largura * 0.94, altura * 0.3, 'mineFicha')
            .setScale(0.12)
            .setDepth(20)
            .setInteractive({ useHandCursor:true });
        
        /// armazenando as proporções de escala para suporte à responsividade da interface
        gameState.bilhete.escalaNormal = 0.12;
        gameState.bilhete.escalaPassar = 0.14;
        
        passarPressionarEfeito(gameState.bilhete, 0.12, 0.14);

        gameState.bilhete.on("pointerup", alternarFicha);

        /// instanciando os botões de navegação entre as categorias de alimentação
        this.botaoStandard = criarBotao(
            largura * 0.20, altura * 0.15,
            "botaoStandard", "botaoStandardPressionado",
            0.35, 0.4, 0.30,
            () => this.transicaoPara("cenaRacaoStandart")
        );

        this.botaoSuperPremium = criarBotao(
            largura * 0.40, altura * 0.155,
            "botaoSuperPremium", "botaoSuperPremiumPressionado",
            0.35, 0.4, 0.30,
            () => { /* estado atual já reflete esta cena, ignorando comando */ }
        );

        /// renderizando o elemento gráfico da estante para alocação dos itens
        this.estante = this.add.image(centroEsquerdaX, altura * 0.6, "estanteVazia").setScale(1).setDepth(-1);

        /// definindo as coordenadas de grade para o posicionamento matricial dos itens na estante
        const colunasRacao = [largura * 0.18, largura * 0.30, largura * 0.42];
        const linhasRacao = [altura * 0.37, altura * 0.605, altura * 0.845];

        /// instanciando o grupo de rações da categoria super premium e definindo sua visibilidade inicial
        this.racoesSuperPremium = [
            new Racao(this, colunasRacao[0], linhasRacao[0], racaoGrandeFilhote),
            new Racao(this, colunasRacao[1], linhasRacao[0], racaoGrandeAdulto),
            new Racao(this, colunasRacao[2], linhasRacao[0], racaoGrandeSenior),
            new Racao(this, colunasRacao[0], linhasRacao[1], racaoMediaFilhote),
            new Racao(this, colunasRacao[1], linhasRacao[1], racaoMediaAdulto),
            new Racao(this, colunasRacao[2], linhasRacao[1], racaoMediaSenior),
            new Racao(this, colunasRacao[0], linhasRacao[2], racaoPequenaFilhote),
            new Racao(this, colunasRacao[1], linhasRacao[2], racaoPequenaAdulto),
            new Racao(this, colunasRacao[2], linhasRacao[2], racaoPequenaSenior),
        ];
        
        /// inicializando o painel de fundo para exibição das informações nutricionais
        this.fundoTemplateRacao = this.add.image(centroDireitaX, altura * 0.56, "fundoTemplateRacao")
            .setScale(altura * 0.00075);

        /// instanciando um contêiner oculto para o alinhamento centralizado dos elementos textuais no painel
        this.containerTexto = this.add.container(centroDireitaX, altura * 0.55);

        this.titulo = this.add.text(0, -altura*0.15, "Compre sua ração!", {
            fontSize: "22px", color: "#000", fontFamily: '"Press Start 2P"', align: "center"
        }).setScale(altura*0.00125).setOrigin(0.5);

        this.subtitulo = this.add.text(0, altura*0.02, "Escolha o tipo de\n\nração ideal para seu\n\npet entre Super\n\nPremium e Standard", {
            fontSize: "18px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 450 }
        }).setScale(altura*0.0013).setOrigin(0.5);

        this.containerTexto.add([this.titulo, this.subtitulo]);

        /// configurando o elemento de texto destinado ao retorno visual das operações de transação
        this.textoFeedback = this.add.text(centroDireitaX, altura * 0.93, "", {
            fontSize: "14px", color: "#ff0000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 350 }
        }).setOrigin(0.5);

        /// instanciando o botão de confirmação e implementando a lógica integral de validação da transação financeira
        this.botaoComprarSuperPremium = criarBotao(
            centroDireitaX, altura * 0.75,
            "botaoComprarSuperPremium", "botaoComprarSuperPremiumPressionado",
            0.15, 0.16, 0.14,
            () => {
                /// validação da existência de um item previamente selecionado pelo usuário
                if (!Racao.selecionada) {
                    this.textoFeedback.setText("SELECIONE UMA RAÇÃO PRIMEIRO!").setColor("#ff0000");
                    return;
                }

                /// validação de compatibilidade entre o item selecionado e os requisitos específicos do mascote ativo
                if (Racao.selecionada.id !== pet.id) {
                    this.textoFeedback.setText("ESSA RAÇÃO NÃO É IDEAL.\nESCOLHA OUTRA RAÇÃO.").setColor("#ff0000");
                    return;
                }

                /// obtenção do valor comercial do item e verificação de disponibilidade de saldo financeiro
                const valorDaRacao = Racao.selecionada.valor || 15; 
                
                if (gameState.cobasiCoins >= valorDaRacao) {
                    /// dedução do valor no saldo global e atualização do componente textual na interface
                    gameState.cobasiCoins -= valorDaRacao;
                    this.textoMoedas.setText(gameState.cobasiCoins);

                    /// emissão do feedback visual indicando transação bem-sucedida
                    this.textoFeedback.setText(`COMPRA EFETUADA! (-${valorDaRacao} MOEDAS)\nRedirecionando...`).setColor("#006600");

                    /// desabilitação da interatividade do botão para prevenção de requisições duplicadas
                    this.botaoComprarSuperPremium.disableInteractive();

                    /// agendamento de chamada atrasada para limpeza de seleção e redirecionamento de cena
                    this.time.delayedCall(1500, () => {
                        Racao.selecionada = null; 
                        this.transicaoPara("jogoAlimentacao"); 
                    });
                } else {
                    /// emissão de feedback visual indicando insuficiência de recursos financeiros
                    this.textoFeedback.setText("SALDO INSUFICIENTE!").setColor("#ff0000"); 
                }
            }
        ).setVisible(false).setAlpha(0); 

        /// inicialização do contêiner para agrupamento dos dados nutricionais exibidos após a seleção do item
        this.containerInfo = this.add.container(centroDireitaX, altura * 0.47)
            .setScale(altura * 0.0009)
            .setVisible(false).setAlpha(0);

        this.composicaoRacao = this.add.image(0, 0, "composicaoRacao");
        this.imagemRacaoInfo = this.add.image(-160, -70, "").setScale(0.18);

        /// parametrização tipográfica e espacial dos elementos textuais de composição nutricional
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

        /// anexando os nós de texto ao contêiner pai para manipulação unificada
        this.containerInfo.add([
            this.composicaoRacao, this.imagemRacaoInfo, this.textoTipo, this.textoPorte, this.textoIdade, 
            this.textoChar1, this.textoChar2, this.textoTrigo, this.textoCarne, this.textoOsso, this.textoGordura
        ]);

        /// iteração sobre a coleção de itens para injeção de comportamentos interativos e eventos de seleção
        this.racoesSuperPremium.forEach((racao) => {
            /// atribuição de propriedades dinâmicas de escala à entidade visual do item
            racao.sprite.escalaNormal = 0.3;
            racao.sprite.escalaHover = 0.32;

            racao.sprite.setScale(racao.sprite.escalaNormal).setVisible(true).setInteractive({ useHandCursor: true });
            
            racao.sprite.on("pointerover", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaHover, duration: 100, ease: "Power2" }));
            racao.sprite.on("pointerout", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaNormal, duration: 100, ease: "Power2" }));

            /// atualização do painel de informações laterais mediante o acionamento do evento de seleção do item
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

        /// verificação de estado e acionamento do componente modal contendo as instruções de uso
        if (!gameState.instrucaoDescricaoRacaoVista) {
            this.mostrarInstrucaoDescricaoRacao(largura, altura);
        }

        /// tratador do evento de redimensionamento para adequação responsiva e recálculo total das escalas
        const handleResizeRacaoSuperPremium = (gameSize) => {
            const w = gameSize.width;
            const h = gameSize.height;

            this.cameras.resize(w, h);
            this.fundo.setDisplaySize(w, h).setPosition(w / 2, h / 2);
            
            /// recálculo dinâmico das posições e das variáveis de interação para o botão de retorno
            this.botaoVoltar.setPosition(w * 0.95, h * 0.9);
            this.botaoVoltar.escalaNormal = h * 0.0013; 
            this.botaoVoltar.escalaHover = h * 0.0016;  
            this.botaoVoltar.escalaPress = h * 0.0010;  
            this.botaoVoltar.setScale(this.botaoVoltar.escalaNormal);

            this.iconeMoeda.setPosition(w * 0.93, h * 0.06).setScale(h * 0.001); 
            
            if (this.textoMoedas) {
                this.textoMoedas.setPosition(w * 0.94, h * 0.06).setScale(h * 0.0015);
            }

            /// atualização das proporções responsivas do elemento gráfico do bilhete
            if (gameState.bilhete) {
                gameState.bilhete.setPosition(w * 0.94, h * 0.3);
                gameState.bilhete.escalaNormal = 0.12;  
                gameState.bilhete.escalaPassar = 0.14; 
                gameState.bilhete.setScale(gameState.bilhete.escalaNormal);
            }

            /// redimensionamento e reposicionamento dos botões de navegação de categoria
            this.botaoStandard.setPosition(w * 0.20, h * 0.15);
            this.botaoStandard.escalaNormal = h * 0.00058; 
            this.botaoStandard.escalaHover = h * 0.00066;  
            this.botaoStandard.escalaPress = h * 0.0005;   
            this.botaoStandard.setScale(this.botaoStandard.escalaNormal);

            this.botaoSuperPremium.setPosition(w * 0.40, h * 0.155);
            this.botaoSuperPremium.escalaNormal = h * 0.00058;
            this.botaoSuperPremium.escalaHover = h * 0.00066;
            this.botaoSuperPremium.escalaPress = h * 0.0005;
            this.botaoSuperPremium.setScale(this.botaoSuperPremium.escalaNormal);

            this.estante.setPosition(w * 0.30, h * 0.6).setScale(h * 0.0016);

            this.fundoTemplateRacao.setPosition(w * 0.70, h * 0.56).setScale(h * 0.00075);
            this.containerTexto.setPosition(w * 0.70, h * 0.55);
            
            this.titulo.setPosition(0, -h * 0.15).setScale(h * 0.00125);
            this.subtitulo.setPosition(0, h * 0.02).setScale(h * 0.0013);

            this.containerInfo.setPosition(w * 0.70, h * 0.47).setScale(h * 0.0009);
            
            /// ajuste proporcional do botão de confirmação de transação perante a nova resolução
            this.botaoComprarSuperPremium.setPosition(w * 0.70, h * 0.75);
            this.botaoComprarSuperPremium.escalaNormal = h * 0.00025; 
            this.botaoComprarSuperPremium.escalaHover = h * 0.00026;  
            this.botaoComprarSuperPremium.escalaPress = h * 0.00023;  
            this.botaoComprarSuperPremium.setScale(this.botaoComprarSuperPremium.escalaNormal);

            this.textoFeedback.setPosition(w * 0.70, h * 0.93).setScale(h * 0.001);

            const novasColunas = [w * 0.18, w * 0.30, w * 0.42];
            const novasLinhas = [h * 0.37, h * 0.605, h * 0.845];
            
            /// recálculo da grade matricial e reposicionamento dinâmico dos itens alocados na estante
            let index = 0;
            for (let i = 0; i < 3; i++) { 
                for (let j = 0; j < 3; j++) { 
                    if(this.racoesSuperPremium[index]) {
                        this.racoesSuperPremium[index].sprite.setPosition(novasColunas[j], novasLinhas[i]);
                        this.racoesSuperPremium[index].sprite.escalaNormal = h * 0.0005;  
                        this.racoesSuperPremium[index].sprite.escalaHover = h * 0.00053; 
                        this.racoesSuperPremium[index].sprite.setScale(this.racoesSuperPremium[index].sprite.escalaNormal);
                    }
                    index++;
                }
            }

            /// adequação responsiva das dimensões e posicionamento do modal de instruções, caso esteja ativo
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

        /// remoção do tratador de eventos de redimensionamento durante o ciclo de destruição da cena
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeRacaoSuperPremium);
        });
    }

    /// método responsável pela renderização e controle do componente modal de instruções sobre a descrição dos itens
    mostrarInstrucaoDescricaoRacao(largura, altura) {
        const centroX = largura / 2;
        const centroY = altura / 2;

        /// instanciando a camada de fundo com opacidade reduzida para destaque do modal
        this.fundoEscuroInstrucao = this.add.rectangle(centroX, centroY, largura, altura, 0x000000, 0.7)
            .setDepth(1000)
            .setInteractive(); 

        /// renderizando o elemento gráfico contendo as diretrizes visuais
        this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoDescricaoRacao")
            .setDepth(1001)
            .setScale(0.5); 

        /// configurando o componente textual indicativo de continuidade com animação de opacidade intermitente
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

        /// registro do tratador de eventos para desconstrução do modal e atualização do estado global de visualização
        this.fundoEscuroInstrucao.on("pointerdown", () => {
            this.fundoEscuroInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.txtContinuarInstrucao.destroy();
            
            this.fundoEscuroInstrucao = null;
            this.imgInstrucao = null;
            this.txtContinuarInstrucao = null;
            
            /// persistência do estado de visualização para evitar reexibição durante o recarregamento da cena
            gameState.instrucaoDescricaoRacaoVista = true; 
        });
    }

    /// método encapsulado para transição segura entre cenas direcionando ao minijogo de alimentação
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