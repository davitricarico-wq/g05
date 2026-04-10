// Importando os dados estáticos referentes aos atributos das rações (Standard, Premium, Super Premium) 
// divididas por porte (Pequeno, Médio, Grande). Esses objetos contêm propriedades como valor, nutrientes, etc.
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

// Importando a classe modelo 'Racao' responsável por gerenciar a lógica e a renderização 
// do item visual na prateleira, além de armazenar o estado de seleção.
import { Racao } from "../componentes/controleRacoes/racoes.js";

// Importando o catálogo de dados base dos mascotes para validação de dieta (id da ração x id do pet)
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";

// Importando os controladores de estado global (gameState) e o gerenciador de áudio
import { gameState, iniciarMusicaAleatoria } from "../main.js";

// Importação do componente de ficha do pet (uma UI sobreposta/modal)
import { ficha } from "../componentes/ficha.js";

/**
 * @class cenaEstanteRacao
 * @extends Phaser.Scene
 * @description Cena responsável pela interface da loja/estante de rações. 
 * Gerencia a visualização das opções de alimentos, exibição detalhada de informações nutricionais, 
 * validação de compatibilidade com o pet ativo e o fluxo de transação (compra via moedas).
 */
export class cenaEstanteRacao extends Phaser.Scene {
    constructor() {
        // Define a chave única de identificação desta cena no gerenciador do Phaser
        super({ key: "cenaEstanteRacao" });
        
        // Flag de controle de estado para impedir que o jogador acione múltiplas transições 
        // de cena simultaneamente (evita bugs de clique duplo rápido)
        this.transicao = false;
        
        // Define o tempo padrão (em milissegundos) para as animações de fade in e fade out da câmera
        this.duracaoFade = 250;
    }

    /**
     * Método nativo do Phaser. Executado uma única vez quando a cena é inicializada.
     * É aqui que todos os GameObjects são instanciados e a lógica inicial é configurada.
     */
    create() {

        // Verifica a preferência do jogador salva no gameState e inicia a trilha sonora se permitido
        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        // Captura as dimensões atuais da tela para aplicar um design responsivo baseado em proporções
        let largura = this.scale.width;
        let altura = this.scale.height;

        // Eixos de referência percentuais para dividir a tela. 
        // 30% da largura para a estante (esquerda) e 70% para o painel de informações (direita)
        const centroEsquerdaX = largura * 0.30;
        const centroDireitaX = largura * 0.70;

        // Determina qual pet está ativo usando uma estrutura condicional (if/else) ternária em cascata.
        // A prioridade de verificação é: Cachorro João > Cachorro Herói > Cachorro Padrão.
        const petAtivo = gameState.pets.cachorroJoao ? cachorrosBase[2] 
                       : (gameState.pets.cachorroHeroi ? cachorrosBase[1] 
                       : cachorrosBase[0]);
        const pet = petAtivo;

        // Garante que nenhuma interface sobreposta remanescente (HUD) de outras cenas esteja ativa
        this.scene.stop("HUD");
        // Reseta a flag de transição sempre que a cena é recarregada
        this.transicao = false;

        // =========================================================================================
        // FUNÇÕES AUXILIARES (HELPERS) INTERNAS
        // =========================================================================================

        /**
         * Cria um botão interativo padronizado com animações (tweens) para feedback visual.
         * @param {number} x - Posição no eixo X
         * @param {number} y - Posição no eixo Y
         * @param {string} texturaNormal - Chave da imagem base
         * @param {string} texturaPressionado - Chave da imagem quando clicada ou com hover
         * @param {number} escalaBase - Tamanho padrão do botão
         * @param {number} escalaAumentada - Tamanho quando o mouse passa por cima (hover)
         * @param {number} escalaPressionada - Tamanho quando o clique é pressionado
         * @param {function} callback - Função a ser executada no evento 'pointerup' (soltar o clique)
         * @returns {Phaser.GameObjects.Image} A imagem configurada como botão interativo
         */
        const criarBotao = (x, y, texturaNormal, texturaPressionado, escalaBase, escalaAumentada, escalaPressionada, callback) => {
            const botao = this.add.image(x, y, texturaNormal)
                .setScale(escalaBase)
                .setInteractive({ useHandCursor: true }); // Altera o cursor do mouse para a "mãozinha"

            // Armazena as propriedades de escala no próprio objeto para facilitar o acesso durante o redimensionamento
            botao.escalaNormal = escalaBase;
            botao.escalaHover = escalaAumentada;
            botao.escalaPress = escalaPressionada;

            // Evento: Mouse entra na área do botão (Hover in)
            botao.on("pointerover", () => {
                botao.setTexture(texturaPressionado);
                this.tweens.add({ targets: botao, scale: botao.escalaHover, duration: 150, ease: "Power2" });
            });

            // Evento: Mouse sai da área do botão (Hover out)
            botao.on("pointerout", () => {
                botao.setTexture(texturaNormal);
                this.tweens.add({ targets: botao, scale: botao.escalaNormal, duration: 150, ease: "Power2" });
            });

            // Evento: Botão do mouse pressionado (Click down)
            botao.on("pointerdown", () => {
                botao.setTexture(texturaPressionado);
                this.tweens.add({ targets: botao, scale: botao.escalaPress, duration: 100, ease: "Power2" });
            });

            // Evento: Botão do mouse solto (Click up) - Dispara a ação principal
            botao.on("pointerup", () => {
                botao.setTexture(texturaPressionado);
                this.tweens.add({ targets: botao, scale: botao.escalaHover, duration: 100, ease: "Power2" });
                if (callback) callback();
            });

            return botao;
        };

        /**
         * Adiciona um efeito de "pulsação" a um Sprite/Image genérico que não seja necessariamente um botão principal.
         * @param {Phaser.GameObjects.Image} alvo - O objeto que receberá os eventos
         * @param {number} escalaNormal - Escala de repouso
         * @param {number} escalaPassar - Escala durante o hover
         */
        const passarPressionarEfeito = (alvo, escalaNormal, escalaPassar) => {
            alvo.escalaNormal = escalaNormal;
            alvo.escalaPassar = escalaPassar;

            alvo.on("pointerover", () => {
                this.tweens.add({ targets: alvo, scaleX: alvo.escalaPassar, scaleY: alvo.escalaPassar, duration: 200 });
            });

            alvo.on("pointerdown", () => {
                // Reduz a escala para 90% do tamanho normal e retorna (efeito de "mola" via yoyo: true)
                this.tweens.add({ targets: alvo, scaleX: alvo.escalaNormal * 0.9, scaleY: alvo.escalaNormal * 0.9, duration: 150, yoyo: true });
            });

            alvo.on("pointerout", () => {
                this.tweens.add({ targets: alvo, scaleX: alvo.escalaNormal, scaleY: alvo.escalaNormal, duration: 200 });
            });
        };

        /**
         * Alterna (abre/fecha) a cena secundária que exibe a ficha técnica do mascote atual.
         */
        const alternarFicha = () => {
            if (this.scene.isActive("ficha")) {
                this.scene.stop("ficha");
                return;
            }
            // Inicia e traz a cena para a frente para garantir que não fique escondida
            this.scene.launch("ficha");
            this.scene.bringToTop("ficha");
        };

        // Configuração do plano de fundo. O setDepth(-1) garante que fique atrás de todos os elementos.
        this.fundo = this.add.image(largura / 2, altura / 2, "bgLimpo")
            .setDisplaySize(largura, altura)
            .setDepth(-1); 

        // Delimita a área visível da câmera principal e executa o efeito de entrada da cena
        this.cameras.main.setBounds(0, 0, largura, altura);
        this.cameras.main.fadeIn(this.duracaoFade, 0, 0, 0);

        // Botão de retornar, localizado no canto inferior direito
        this.botaoVoltar = criarBotao(
            largura * 0.95, altura * 0.9, "iconeVoltar", "iconeVoltar",
            0.8, 1, 0.6,
            () => this.transicaoPara("cenaComida") // Callback para voltar ao jogo principal
        );

        // HUD de Economia: Exibe a imagem da moeda e a quantidade atual do jogador
        this.iconeMoeda = this.add.image(largura * 0.93, altura * 0.06, "cobasiCoin").setScale(0.6);
        this.textoMoedas = this.add.text(largura * 0.94, altura * 0.06, gameState.cobasiCoins, {
            fontSize: "20px", color: "#ffffff", fontFamily: '"Press Start 2P"', align: "center"
        }).setOrigin(0.5);  

        // Botão flutuante (ícone de prancheta) para abrir a ficha do animal
        gameState.bilhete = this.add.image(largura * 0.94, altura * 0.3, 'mineFicha')
            .setScale(0.12)
            .setDepth(20) // Fica numa camada superior para não ser sobreposto
            .setInteractive({ useHandCursor:true });
        
        // Aplica o helper de pulsação e vincula a ação de alternar cena ao clique
        passarPressionarEfeito(gameState.bilhete, 0.12, 0.14);
        gameState.bilhete.on("pointerup", alternarFicha);

        // Imagem base do móvel que abrigará as embalagens
        this.estante = this.add.image(centroEsquerdaX, altura * 0.6, "estanteVazia").setScale(1).setDepth(-1);

        // Arrays de coordenadas predefinidas baseadas na largura/altura para distribuir os sacos em um grid 3x3
        const colunasRacao = [largura * 0.18, largura * 0.30, largura * 0.42];
        const linhasRacao = [altura * 0.35, altura * 0.605, altura * 0.855];

        // Instancia os objetos lógicos 'Racao', associando as coordenadas aos dados importados
        this.racoes = [
            // Linha 1: Rações Standard
            new Racao(this, colunasRacao[0], linhasRacao[0], racaoStandardPequeno),
            new Racao(this, colunasRacao[1], linhasRacao[0], racaoStandardMedio),
            new Racao(this, colunasRacao[2], linhasRacao[0], racaoStandardGrande),
            
            // Linha 2: Rações Premium
            new Racao(this, colunasRacao[0], linhasRacao[1], racaoPremiumPequeno),
            new Racao(this, colunasRacao[1], linhasRacao[1], racaoPremiumMedio),
            new Racao(this, colunasRacao[2], linhasRacao[1], racaoPremiumGrande),
            
            // Linha 3: Rações Super Premium
            new Racao(this, colunasRacao[0], linhasRacao[2], racaoSuperPremiumPequeno),
            new Racao(this, colunasRacao[1], linhasRacao[2], racaoSuperPremiumMedio),
            new Racao(this, colunasRacao[2], linhasRacao[2], racaoSuperPremiumGrande),
        ];
    
        // Fundo do painel lateral (Prancheta/Papel onde as descrições aparecem)
        this.fundoTemplateRacao = this.add.image(centroDireitaX, altura * 0.56, "fundoTemplateRacao")
            .setScale(altura * 0.00075);

        // Contêiner de texto padrão (Placeholder) exibido apenas quando o jogador ainda não clicou em nenhuma ração
        this.containerTexto = this.add.container(centroDireitaX, altura * 0.55);

        this.titulo = this.add.text(0, -altura*0.15, "Compre sua ração!", {
            fontSize: "22px", color: "#000", fontFamily: '"Press Start 2P"', align: "center"
        }).setScale(altura*0.00125).setOrigin(0.5);

        // Subtítulo com instrução clara em múltiplas quebras de linha via wordWrap
        this.subtitulo = this.add.text(0, altura*0.02, "Escolha o tipo de\n\nração ideal para seu\n\npet entre Super\n\nPremium e Standard", {
            fontSize: "18px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 450 }
        }).setScale(altura*0.0013).setOrigin(0.5);

        // Agrupa os textos no container para facilitar a ocultação simultânea depois
        this.containerTexto.add([this.titulo, this.subtitulo]);

        // Objeto de texto genérico para exibir mensagens dinâmicas de erro/sucesso do sistema de economia
        this.textoFeedback = this.add.text(centroDireitaX, altura * 0.93, "", {
            fontSize: "14px", color: "#ff0000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 350 }
        }).setOrigin(0.5);

        // Contêiner para o botão de compra. Ele permite que a imagem do botão e o texto do preço 
        // escalem juntos harmonicamente.
        this.containerBotaoComprar = this.add.container(centroDireitaX, altura * 0.75).setDepth(10);
        
        // Setup dinâmico de escalas do contêiner. São muito pequenos porque compensam as escalas dos filhos.
        this.containerBotaoComprar.escalaNormal = 0.15;
        this.containerBotaoComprar.escalaHover = 0.16;
        this.containerBotaoComprar.escalaPress = 0.14;
        
        // Inicia totalmente invisível (alpha 0 e visible false) até que um item seja selecionado
        this.containerBotaoComprar.setScale(this.containerBotaoComprar.escalaNormal).setVisible(false).setAlpha(0);

        // Imagem visual do botão (filho do contêiner)
        this.botaoComprarImg = this.add.image(0, 0, "botaoComprar").setInteractive({ useHandCursor: true });
        
        // ATENÇÃO: O texto possui 150px propositalmente para contornar a perda de qualidade de fontes no WebGL 
        // ao ser comprimido pela escala de 0.15 do seu Container pai. Isso garante uma renderização nítida (Anti-aliasing natural).
        this.textoPrecoBotao = this.add.text(100, 13, "0", {
            fontSize: "150px", color: "#ffffff", fontFamily: '"Press Start 2P", Arial', align: "center"
        }).setOrigin(0.5);

        this.containerBotaoComprar.add([this.botaoComprarImg, this.textoPrecoBotao]);

        // Os eventos estão vinculados à Imagem, mas os Tweens de redimensionamento afetam o Container inteiro.
        
        this.botaoComprarImg.on("pointerover", () => {
            this.botaoComprarImg.setTexture("botaoComprando"); // Troca textura para estado "Hover"
            this.tweens.add({ targets: this.containerBotaoComprar, scale: this.containerBotaoComprar.escalaHover, duration: 150, ease: "Power2" });
        });

        this.botaoComprarImg.on("pointerout", () => {
            this.botaoComprarImg.setTexture("botaoComprar"); // Restaura textura original
            this.tweens.add({ targets: this.containerBotaoComprar, scale: this.containerBotaoComprar.escalaNormal, duration: 150, ease: "Power2" });
        });

        this.botaoComprarImg.on("pointerdown", () => {
            this.botaoComprarImg.setTexture("botaoComprando");
            this.tweens.add({ targets: this.containerBotaoComprar, scale: this.containerBotaoComprar.escalaPress, duration: 100, ease: "Power2" });
        });

        // Ação principal de tentativa de compra
        this.botaoComprarImg.on("pointerup", () => {
            this.botaoComprarImg.setTexture("botaoComprando");
            this.tweens.add({ targets: this.containerBotaoComprar, scale: this.containerBotaoComprar.escalaHover, duration: 100, ease: "Power2" });
                        
            // Regra 1: É preciso ter um item selecionado.
            if (!Racao.selecionada) {
                this.textoFeedback.setText("SELECIONE UMA RAÇÃO PRIMEIRO!").setColor("#ff0000");
                return;
            }

            // Regra 2: A ração precisa ser do mesmo tamanho (id) adequado para o pet atual.
            if (Racao.selecionada.id !== pet.id) {
                this.textoFeedback.setText("ESSA RAÇÃO NÃO É IDEAL.\nESCOLHA OUTRA RAÇÃO.").setColor("#ff0000");
                return;
            }

            // Recupera o valor definido no objeto estático ou usa fallback para 15 moedas.
            const valorDaRacao = Racao.selecionada.valor || 15; 
            
            // Regra 3: O jogador precisa ter saldo suficiente.
            if (gameState.cobasiCoins >= valorDaRacao) {
                // Efetiva a cobrança no estado global e atualiza o texto de moedas no HUD
                gameState.cobasiCoins -= valorDaRacao;
                this.textoMoedas.setText(gameState.cobasiCoins);

                // Exibe feedback de sucesso verde limão
                this.textoFeedback.setText(`COMPRA EFETUADA! (-${valorDaRacao} MOEDAS)\nRedirecionando...`).setColor("#006600");

                // Trava o botão para evitar que o jogador clique várias vezes causando múltiplas cobranças
                this.botaoComprarImg.disableInteractive();

                // Reseta as flags dietéticas do pet
                gameState.superPremium = false;
                gameState.premium = false;
                gameState.standard = false;

                // Atualiza a nutrição baseada no produto comprado
                if (Racao.selecionada.tipo === "Super Premium") {
                    gameState.superPremium = true;
                } else if (Racao.selecionada.tipo === "Premium") {
                    gameState.premium = true;
                } else if (Racao.selecionada.tipo === "Standard") {
                    gameState.standard = true;
                }

                // Salva a referência visual da embalagem no estado global para exibi-la na próxima cena
                gameState.racaoAtual = {
                    tipo: Racao.selecionada.tipo,
                    sprite: Racao.selecionada.sprite.texture.key 
                };

                // Inicia um pequeno atraso de imersão de 1.5s antes de fazer a transição para alimentar o pet
                this.time.delayedCall(1500, () => {
                    Racao.selecionada = null; // Limpa a variável estática global da classe 
                    this.transicaoPara("jogoAlimentacao"); 
                });
            } else {
                // Caso falhe na regra 3
                this.textoFeedback.setText("SALDO INSUFICIENTE!").setColor("#ff0000"); 
            }
        });

        // Este container abriga os textos dinâmicos de detalhe da ração. Ele só se torna visível (alpha: 1)
        // quando uma embalagem específica da prateleira recebe um clique.
        this.containerInfo = this.add.container(centroDireitaX, altura * 0.47)
            .setScale(altura * 0.0009)
            .setVisible(false).setAlpha(0);

        // Placa gráfica de plano de fundo do layout interno da bula nutricional
        this.composicaoRacao = this.add.image(35, 10, "composicaoRacao").setScale(0.75);
        
        // Imagem representativa miniatura da embalagem da ração
        this.imagemRacaoInfo = this.add.image(-160, -70, "").setScale(0.5);

        // Campos de Textos formatados para receberem injeção de strings posteriormente
        this.textoTipo = this.add.text(0, -217, "", { fontSize: "32px", color: "#005e64", fontFamily: '"Press Start 2P"', align: "center" }).setOrigin(0.5);
        this.textoPorte = this.add.text(150, -150, "", { fontSize: "22px", color: "#006600", fontFamily: '"Press Start 2P"' }).setOrigin(0, 0.5);
        this.textoChar1 = this.add.text(120, -60, "", { fontSize: "16px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 300 } }).setOrigin(0.5);
        this.textoChar2 = this.add.text(120, 15, "", { fontSize: "16px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 300 } }).setOrigin(0.5);

        // Variável de estilo reutilizável para manter padrão estético dos macros minerais/ingredientes
        const porcentagem = { fontSize: "16px", color: "#8B4513", fontFamily: '"Press Start 2P"' };
        this.textoTrigo = this.add.text(-180, 208, "", porcentagem).setOrigin(0.5);
        this.textoCarne = this.add.text(-53, 208, "", porcentagem).setOrigin(0.5);
        this.textoOsso = this.add.text(78, 208, "", porcentagem).setOrigin(0.5);
        this.textoGordura = this.add.text(197, 208, "", porcentagem).setOrigin(0.5);

        // Empacota toda a árvore visual dentro do contêiner para manipulação atômica (transição em bloco)
        this.containerInfo.add([
            this.composicaoRacao, this.imagemRacaoInfo, this.textoTipo, this.textoPorte, 
            this.textoChar1, this.textoChar2, this.textoTrigo, this.textoCarne, this.textoOsso, this.textoGordura
        ]);

        this.racoes.forEach((racao, index) => {
            // Prevenção contra eventos duplicados que poderiam vir da instância 'Racao' em reloads de cena
            racao.sprite.removeAllListeners('pointerover');
            racao.sprite.removeAllListeners('pointerout');

            // Determina a escala base dos itens dependendo da categoria (nível na prateleira).
            // Atualmente todos utilizam os mesmos valores, mas a estrutura permite ajustes fáceis de perspectiva.
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

            // Ativa propriedades interativas na imagem da ração
            racao.sprite.setScale(tamanhoNormal).setVisible(true).setInteractive({ useHandCursor: true });
            
            // Adiciona feedback responsivo (Tween de pulso) ao passar o mouse
            racao.sprite.on("pointerover", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaHover, duration: 100, ease: "Power2" }));
            racao.sprite.on("pointerout", () => this.tweens.add({ targets: racao.sprite, scale: racao.sprite.escalaNormal, duration: 100, ease: "Power2" }));

            // --- LÓGICA DE SELEÇÃO DO PRODUTO (ON CLICK) ---
            racao.sprite.on("pointerup", () => {
                Racao.selecionada = racao; // Grava em nível de classe/estado global a ração clicada
                
                // Desaparece com o texto inicial orientativo "Escolha um tipo..."
                this.tweens.add({
                    targets: this.containerTexto, alpha: 0, duration: 200, ease: "Power2",
                    onComplete: () => this.containerTexto.setVisible(false) // Desliga renderização para salvar processamento
                });

                // Atualiza o painel de nutrição com as informações injetadas no construtor de 'Racao' 
                // vindos do arquivo de dados 'dadosRacoes.js'. Usa Fallbacks ("") para evitar erros nulos.
                this.textoTipo.setText(racao.tipo || "Super Premium");
                this.textoPorte.setText(racao.porte || "-");
                this.textoChar1.setText(racao.caracteristicas ? racao.caracteristicas[0] : "");
                this.textoChar2.setText(racao.caracteristicas ? racao.caracteristicas[1] : "");
                this.textoTrigo.setText(racao.nutrientes ? racao.nutrientes.trigo : "");
                this.textoCarne.setText(racao.nutrientes ? racao.nutrientes.carne : "");
                this.textoOsso.setText(racao.nutrientes ? racao.nutrientes.osso : "");
                this.textoGordura.setText(racao.nutrientes ? racao.nutrientes.gordura : "");
                
                // Atualiza a imagem miniatura copiando a chave da textura da Racao na prateleira
                this.imagemRacaoInfo.setTexture(racao.sprite.texture.key);

                // Limpa avisos de erros prévios, se houver
                if (this.textoFeedback) this.textoFeedback.setText("");

                // Atualiza o display visual do botão de compra para refletir o preço exato daquela marca
                const valorRacaoAtual = racao.valor || 15;
                this.textoPrecoBotao.setText(`${valorRacaoAtual}`);

                // Configura a visibilidade e aplica um Fade In nos contêineres de Informação e Compra
                this.composicaoRacao.setVisible(true);
                this.containerInfo.setAlpha(0).setVisible(true);
                this.containerBotaoComprar.setVisible(true);
                
                this.tweens.add({ targets: [this.containerInfo, this.containerBotaoComprar], alpha: 1, duration: 250, ease: "Power2" });
            });
        });

        // Checa se o usuário já viu o painel de tutorial dessa cena e o engatilha se necessário.
        if (!gameState.instrucaoDescricaoRacaoVista) {
            this.mostrarInstrucaoDescricaoRacao(largura, altura);
        }

        /**
         * Função de callback acionada sempre que as dimensões do Canvas mudam (giro de celular ou zoom no navegador).
         * Ele recalcula todas as posições em eixo X, Y e reajusta as escalas dinâmicas dos elementos e contêineres.
         * @param {Object} gameSize - Objeto contendo o novo Width e Height.
         */
        const handleResizeRacaoSuperPremium = (gameSize) => {
            const w = gameSize.width;
            const h = gameSize.height;

            // Recalibra os boundings da cena e posicionamento do fundo.
            this.cameras.resize(w, h);
            this.fundo.setDisplaySize(w, h).setPosition(w / 2, h / 2);
            
            // Reajusta os botões globais da interface 
            this.botaoVoltar.setPosition(w * 0.95, h * 0.9);
            this.botaoVoltar.escalaNormal = h * 0.0013; 
            this.botaoVoltar.escalaHover = h * 0.0016;  
            this.botaoVoltar.escalaPress = h * 0.0010;  
            this.botaoVoltar.setScale(this.botaoVoltar.escalaNormal);

            // Reajuste do HUD de Economia
            this.iconeMoeda.setPosition(w * 0.93, h * 0.06).setScale(h * 0.001); 
            if (this.textoMoedas) {
                this.textoMoedas.setPosition(w * 0.94, h * 0.06).setScale(h * 0.0015);
            }

            // Reajuste do Botão da Ficha do Animal
            if (gameState.bilhete) {
                gameState.bilhete.setPosition(w * 0.94, h * 0.3);
                gameState.bilhete.escalaNormal = 0.12;  
                gameState.bilhete.escalaPassar = 0.14; 
                gameState.bilhete.setScale(gameState.bilhete.escalaNormal);
            }

            // Reposicionamento dinâmico da mobília da Loja e Layouts do Painel Direito
            this.estante.setPosition(w * 0.30, h * 0.6).setScale(h * 0.0016);
            this.fundoTemplateRacao.setPosition(w * 0.70, h * 0.56).setScale(h * 0.00075);
            
            // Reajusta a âncora do painel de textos de orientação principal
            this.containerTexto.setPosition(w * 0.70, h * 0.55);
            this.titulo.setPosition(0, -h * 0.15).setScale(h * 0.00125);
            this.subtitulo.setPosition(0, h * 0.02).setScale(h * 0.0013);

            // Reajusta a âncora da ficha nutricional complexa
            this.containerInfo.setPosition(w * 0.70, h * 0.47).setScale(h * 0.0009);
            
            // Recálculo especial para o botão de compra em contêiner (devido ao seu comportamento atrelado a sub-escala)
            this.containerBotaoComprar.setPosition(w * 0.70, h * 0.75);
            this.containerBotaoComprar.escalaNormal = h * 0.00025; 
            this.containerBotaoComprar.escalaHover = h * 0.00026;  
            this.containerBotaoComprar.escalaPress = h * 0.00023;  
            this.containerBotaoComprar.setScale(this.containerBotaoComprar.escalaNormal);

            this.textoFeedback.setPosition(w * 0.70, h * 0.93).setScale(h * 0.001);

            // Geração em grade (Loop Matrix) de novas referências topográficas para os pacotes de ração
            const novasColunas = [w * 0.18, w * 0.30, w * 0.42];
            const novasLinhas = [h * 0.37, h * 0.605, h * 0.845];
            
            let index = 0;
            // O Loop O(N²) que mapeia as 3 linhas e 3 colunas, totalizando 9 espaços.
            for (let i = 0; i < 3; i++) { 
                for (let j = 0; j < 3; j++) { 
                    if(this.racoes[index]) {
                        // Atribui nova posição para cada saco com base na sua linha(i) e coluna(j)
                        this.racoes[index].sprite.setPosition(novasColunas[j], novasLinhas[i]);
                        
                        // Atualiza as dimensões de escala em repouso e hover para preservar o formato da embalagem.
                        // Há uma leve perspectiva configurada intencionalmente se a linha (prateleira) mudar.
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

            // Corrige o posicionamento do overlay de tutorial, caso ele esteja ativo e visível na tela
            if (this.fundoEscuroInstrucao && this.fundoEscuroInstrucao.active) {
                this.fundoEscuroInstrucao.setSize(w, h);
                this.fundoEscuroInstrucao.setPosition(w / 2, h / 2);
                
                if (this.imgInstrucao && this.imgInstrucao.active) {
                    this.imgInstrucao.setPosition(w / 2, h / 2);
                    
                    if (this.txtContinuarInstrucao && this.txtContinuarInstrucao.active) {
                        // Calcula um espaçamento (Y) seguro abaixo da imagem para que não haja colisão de layout
                        const novoPosicaoTextoY = (h / 2) + (this.imgInstrucao.displayHeight / 2) + 30;
                        this.txtContinuarInstrucao.setPosition(w / 2, novoPosicaoTextoY);
                    }
                }
            }
        };

        // Escuta ativamente pelo evento de redimensionamento de janela enviado pelo Game.scale nativo do Phaser
        this.scale.on("resize", handleResizeRacaoSuperPremium);

        // Limpeza (Garbage Collection): Remove o event listener quando a cena é finalizada (destruída).
        // Essencial para evitar Memory Leaks e chamadas a instâncias fantasmas.
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeRacaoSuperPremium);
        });
    }

    /**
     * Função auxiliar para renderizar uma interface em Overlay (modal) ensinando o jogador sobre a mecânica de rações.
     * @param {number} largura - Largura do canvas base.
     * @param {number} altura - Altura do canvas base.
     */
    mostrarInstrucaoDescricaoRacao(largura, altura) {
        const centroX = largura / 2;
        const centroY = altura / 2;

        // Máscara opaca com Alpha 0.7 para destacar o modal focal do tutorial, intercepta cliques.
        this.fundoEscuroInstrucao = this.add.rectangle(centroX, centroY, largura, altura, 0x000000, 0.7)
            .setDepth(1000)
            .setInteractive(); // Ao torná-lo interativo, bloqueamos os cliques no jogo sob o modal.

        // Gráfico contendo as instruções textuais pré-renderizadas de arte.
        this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoEscolhaRacao")
            .setDepth(1001)
            .setScale(0.5); 

        // Call to action de prosseguimento
        const posicaoTextoY = centroY + (this.imgInstrucao.displayHeight / 2) + 30;

        this.txtContinuarInstrucao = this.add.text(centroX, posicaoTextoY, "[ Clique para continuar ]", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "15px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(1001);

        // Um sutil "fade pulsar" do texto para atrair o olho do jogador para a ação de saída
        this.tweens.add({
            targets: this.txtContinuarInstrucao, 
            alpha: 0.4, 
            duration: 800, 
            yoyo: true, 
            loop: -1
        });

        // Evento que destrói o tutorial e registra a flag no gameState para não ser repetido depois
        this.fundoEscuroInstrucao.on("pointerdown", () => {
            this.fundoEscuroInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.txtContinuarInstrucao.destroy();
            
            // Limpa ponteiros da memória de forma declarativa
            this.fundoEscuroInstrucao = null;
            this.imgInstrucao = null;
            this.txtContinuarInstrucao = null;
            
            gameState.instrucaoDescricaoRacaoVista = true; 
        });
    }

    /**
     * Gerencia a navegação entre Cenas da Engine com segurança e polimento (FadeOut visual).
     * @param {string} chaveCena - A identificação (key) da cena para a qual deseja pular.
     */
    transicaoPara(chaveCena) {
        // Bloqueio condicional de controle (Gatekeeper) caso a transição já esteja ocorrendo.
        if (this.transicao) return;

        this.transicao = true;
        this.cameras.main.fadeOut(this.duracaoFade, 0, 0, 0); // Efeito para o preto
        
        // Listener assíncrono. Só desliga a cena atual QUANDO o Fade Out terminar a execução.
        this.cameras.main.once("camerafadeoutcomplete", () => {
            // Se o menu suspenso de "Ficha" estiver ativado durante a transição, é forçado a fechar para não corromper cenas futuras
            if (this.scene.isActive("ficha")) {
                this.scene.stop("ficha");
            }
            this.scene.start(chaveCena);
        });
    }
}