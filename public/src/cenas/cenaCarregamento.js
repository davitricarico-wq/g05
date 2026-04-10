/**
 * @class cenaCarregamento
 * @extends Phaser.Scene
 * @description Esta cena é responsável por buscar e alocar na memória todos os 
 * assets do jogo (imagens, áudios, spritesheets) antes de iniciar a gameplay.
 * É o primeiro passo crítico para garantir que o jogo rode sem engasgos.
 */
export class cenaCarregamento extends Phaser.Scene {
    constructor() {
        // Registra a chave de identificação desta cena no Scene Manager do Phaser
        super({ key: "cenaCarregamento" });
    }

    /**
     * @method preload
     * @description O Phaser executa este método automaticamente. Tudo o que for 
     * chamado com 'this.load' entra numa fila de download assíncrono. O jogo só 
     * avança para o método 'create' quando toda esta fila terminar de baixar.
     */
    preload() {
        
        // CORREÇÃO 1: Limita os downloads simultâneos para não assustar o servidor
        this.load.maxParallelDownloads = 1;

        // CORREÇÃO 2: Adicionado "./" em TODOS os caminhos para resolver os erros 404

        // Backgrounds da tela inicial
        this.load.image("bgInicial", "./assets/tela-inicial/bgInicial.png");
        this.load.image("bgPrincipal", "./assets/tela-principal/bgPrincipal.png");

        // Botões da Tela Inicial 
        this.load.image("botaoJogarNormal", "./assets/tela-inicial/botaoJogarNormal.png");
        this.load.image("botaoJogarCrescendo", "./assets/tela-inicial/botaoJogarCrescendo.png");
        this.load.image("botaoJogarPressionado", "./assets/tela-inicial/botaoJogarPressionado.png");
        
        this.load.image("botaoSairNormal", "./assets/tela-inicial/botaoSairNormal.png");
        this.load.image("botaoSairCrescendo", "./assets/tela-inicial/botaoSairCrescendo.png");
        this.load.image("botaoSairPressionado", "./assets/tela-inicial/botaoSairPressionado.png");
        
        this.load.image("botaoConfiguracoesNormal", "./assets/tela-inicial/botaoConfiguracoesNormal.png");
        this.load.image("botaoConfiguracoesCrescendo", "./assets/tela-inicial/botaoConfiguracoesCrescendo.png");
        this.load.image("botaoConfiguracoesPressionado", "./assets/tela-inicial/botaoConfiguracoesPressionado.png");

        // Tela de Configurações (Sistema)
        this.load.image("retornoInicio", "./assets/tela-configuracoes/retornoInicio.png"); // Botão Voltar
        this.load.image("configuracoes", "./assets/tela-configuracoes/configuracoes.png"); // Background
        this.load.image("botaoOff", "./assets/tela-configuracoes/botaoOff.png");           // Toggle Desligado
        this.load.image("botaoOn", "./assets/tela-configuracoes/botaoOn.png");             // Toggle Ligado

        // ASSETS: INTERFACE DE USUÁRIO (HUD) E ÍCONES
        this.load.image("iconeFome", "./assets/icones/iconeFome.png");
        this.load.image("iconeFelicidade", "./assets/icones/iconeFelicidade.png");
        this.load.image("iconeSaude", "./assets/icones/iconeSaude.png");
        this.load.image("iconeSujeira", "./assets/icones/iconeSujeira.png");

        // Spritesheet da barra de status
        this.load.spritesheet("barra", "./assets/icones/barraStatus.png", {
            frameWidth: 144,
            frameHeight: 32
        });

        // Ícones do menu lateral do HUD
        this.load.image("iconeBanho", "./assets/iconeBanho.png");
        this.load.image("iconeRacao", "./assets/iconeRacao.png");
        this.load.image("iconeCuidados", "./assets/iconeCuidados.png");
        this.load.image("iconeLazer", "./assets/iconeLazer.png");
        this.load.image("iconeVoltar", "./assets/iconeVoltar.png");
        this.load.image("cobasiCoin", "./assets/moeda.png");

        //  CENA DE CUIDADOS MÉDICOS / VETERINÁRIO 
        this.load.image("bgCuidado", "./assets/tela-cuidado/bgCuidado.png"); 
        this.load.image("pulga1", "./assets/tela-cuidado/pulga1.png");
        this.load.image("bandeja", "./assets/tela-cuidado/bandeja.png");
        
        // Nota: Se "bgCuidadoHeroi.png" continuar dando 404, verifique no GitLab se 
        // ele não está dentro da pasta "tela-cuidado". Se estiver, mude o caminho abaixo!
        this.load.image("bgCuidadoHeroi", "./assets/bgCuidadoHeroi.png"); 
        
        this.load.image("bgVeterinario", "./assets/tela-veterinario/bgVeterinario.png");
        this.load.image("lupa", "./assets/tela-veterinario/lupa.png");

        // CENA DE ESTOQUE E COMPRA DE RAÇÃO 
        this.load.image("bgRacao", "./assets/tela-alimentacao/bgRacao.png");
        this.load.image("mineFicha", "./assets/mineFicha.png");
        this.load.image("estanteVazia", "./assets/tela-alimentacao/estanteVazia.png");
        this.load.image("racaoVazia", "./assets/tela-alimentacao/racaoVazia.png");
        this.load.image("estanteRacao", "./assets/tela-alimentacao/estanteRacao.png");
        this.load.image("fundoTemplateRacao", "./assets/fundoTemplateRacao.png");
        this.load.image("composicaoRacao", "./assets/tela-racao/composicaoRacao.png");

        // Botões de categorias e compra de ração
        this.load.image("botaoComprar", "./assets/botaoComprar.png");
        this.load.image("botaoComprando", "./assets/botaoComprando.png");

        // JOGO DE ALIMENTAÇÃO (PEGA-PEGA DA COMIDA) 
        this.load.image('bgFoodScene', './assets/tela-alimentacao/fundoracao.png');
        this.load.image('dogPlayer', './assets/dogPlayer.png'); 
        this.load.image("cachorroHeroiBoca", "./assets/cachorroHeroiBoca.png"); 
        this.load.image('foodChocolate', './assets/foodChocolate.png'); 
        this.load.image('heart', './assets/heart.png'); 
        this.load.image('retornoInicio', './assets/retornoInicio.png'); 

        // CENA DO BANHEIRO 
        this.load.image("bgLimpo", "./assets/bgLimpo.png");
        this.load.image("bgBanheiro", "./assets/tela-banho/bgBanheiro.png");
        this.load.image("botaoVoltar", "./assets/botaoVoltar.png"); 
        this.load.image("chuveiro", "./assets/tela-banho/chuveiro.png");
        this.load.image("sabao", "./assets/tela-banho/barrasabao.png");
        this.load.image("toalha", "./assets/tela-banho/toalha.png");
        this.load.image("bolhas", "./assets/tela-banho/bolhas.png");
        
        // CENA DE LAZER (PARQUE/BRINCADEIRA) 
        this.load.image("bgLazer", "./assets/tela-lazer/bgLazer.png");
        this.load.image("petisco", "./assets/tela-lazer/petisco.png");
        this.load.image("petiscoEstragado", "./assets/tela-lazer/petiscoestragado.png");
        this.load.image("obstaculo", "./assets/tela-lazer/obstaculo.png"); 
        this.load.image("camaElastica", "./assets/tela-lazer/camaElastica.png");

        // ASSETS: ITENS DE INVENTÁRIO (PACOTES DE RAÇÃO)        
        this.load.image("racaoStandardPequeno", "./assets/racoes/racaoStandard_P.png");
        this.load.image("racaoStandardMedio", "./assets/racoes/racaoStandard_M.png");
        this.load.image("racaoStandardGrande", "./assets/racoes/racaoStandard_G.png");

        this.load.image("racaoPremiumPequeno", "./assets/racoes/racaoPremium_P.png");
        this.load.image("racaoPremiumMedio", "./assets/racoes/racaoPremium_M.png");
        this.load.image("racaoPremiumGrande", "./assets/racoes/racaoPremium_G.png");

        this.load.image("racaoSuperPremiumPequeno", "./assets/racoes/racaoSuperPremium_P.png");
        this.load.image("racaoSuperPremiumMedio", "./assets/racoes/racaoSuperPremium_M.png");
        this.load.image("racaoSuperPremiumGrande", "./assets/racoes/racaoSuperPremium_G.png");

        // ASSETS: TUTORIAIS, STORYTELLING E FEEDBACKS        
        this.load.image("tutorial1", "./assets/tutorial1.png");
        this.load.image("tutorial2", "./assets/tutorial2.png");
        this.load.image("tutorial3", "./assets/tutorial3.png");
        this.load.image("tutorial4", "./assets/tutorial4.png");
        this.load.image("tutorial5", "./assets/tutorial5.png");
        this.load.image("tutorial6", "./assets/tutorial6.png");
        this.load.image("tutorial7", "./assets/tutorial7.png");
        this.load.image("tutorial8", "./assets/tutorial8.png");
        this.load.image("tutorial9", "./assets/tutorial9.png");
        this.load.image("tutorial10", "./assets/tutorial10.png");
        this.load.image("tutorial11", "./assets/tutorial11.png");

        this.load.image("feeedback3estrelas", "./assets/feedback/feedbackMineGame.png");
        this.load.image("feedback2estrelas", "./assets/feedback/feedbackMineGame2.png");
        this.load.image("feedback1estrela", "./assets/feedback/feedbackMineGame3.png");

        this.load.image("instrucaoDescricaoBanho", "./assets/feedback/instrucaoBanho.png"); 
        this.load.image("conclusaoPrimeiroRound", "./assets/feedback/conclusaoPrimeiroRound.png");
        this.load.image("conclusaoSegundoRound", "./assets/feedback/conclusaoSegundoRound.png");
        this.load.image("conclusaoTerceiroRound", "./assets/feedback/conclusaoTerceiroRound.png");
        this.load.image("instrucaoTerceiroRound", "./assets/feedback/instrucaoTerceiroRound.png");
        this.load.image("instrucaoLazer", "./assets/feedback/instrucaoLazer.png");
        this.load.image("instrucaoBanho", "./assets/feedback/instrucaoBanho.png");
        this.load.image("instrucaoMissao", "./assets/feedback/instrucaoMissao.png");
        this.load.image("instrucaoPulgas", "./assets/feedback/instrucaoPulgas.png");
        this.load.image("instrucaoRacao", "./assets/feedback/instrucaoRacao.png");
        this.load.image("instrucaoSegundaFase", "./assets/feedback/instrucaoSegundaFase.png");
        this.load.image("comoJogarLazer", "./assets/feedback/comoJogarLazer.png");
        this.load.image("comoJogarPulgas", "./assets/feedback/comoJogarPulgas.png");
        this.load.image("comoJogarRacao", "./assets/feedback/comoJogarRacao.png");
        this.load.image("instrucaoQuiz", "./assets/feedback/instrucaoQuiz.png");
        this.load.image("final", "./assets/feedback/final.png");
        this.load.image("direcaoJogador", "./assets/feedback/direcaoJogador.png");       
        this.load.image("instrucaoEscolhaRacao", "./assets/tela-racao/instrucaoEscolhaRacao.png");
        
        // CORREÇÃO 3: Adicionado o ?v=1 para forçar o download do áudio
        // ASSETS: ÁUDIO (MÚSICAS E EFEITOS)
        this.load.audio("lazerDespreocupado", "./assets/sons/lazerDespreocupado.ogg?v=1");
        this.load.audio("menuPrincipal", "./assets/sons/menuPrincipal.ogg?v=1");
        this.load.audio("musicaCutscene", "./assets/sons/musicaCutscene.ogg?v=1");
        this.load.audio("novoHorizonte", "./assets/sons/novoHorizonte.ogg?v=1");
        this.load.audio("pegadasCrescidas", "./assets/sons/pegadasCrescidas.ogg?v=1");

        // ASSETS: SPRITESHEETS (ANIMAÇÕES)
        this.load.spritesheet("pulgas", "./assets/pulgaCachorro.png", {
            frameWidth: 626, frameHeight: 655
        });
        
        this.load.spritesheet("cachorroCaramelo", "./assets/cachorroCaramelo.png", {
            frameWidth: 626, frameHeight: 655
        });
        this.load.spritesheet("cachorroHeroi", "./assets/cachorroHeroi.png", {
            frameWidth: 626, frameHeight: 655
        });
        this.load.spritesheet("cachorroJoao", "./assets/cachorroJoao.png", {
            frameWidth: 626, frameHeight: 655
        });
        
        this.load.spritesheet("agua", "./assets/tela-banho/agua.png", {
            frameWidth: 480, frameHeight: 480
        });
        this.load.spritesheet("cachorroCorrendo", "./assets/tela-lazer/cachorroCorrendo.png", {
            frameWidth: 445, frameHeight: 280 
        });
        this.load.spritesheet("cachorroHeroiCorrendo", "./assets/cachorroHeroiCorrendo.png", {
            frameWidth: 1202, frameHeight: 1087 
        });
        this.load.spritesheet("cachorroJoaoCorrendo", "./assets/cachorroJoaoCorrendo.png", {
            frameWidth: 338, frameHeight: 339 
        });
        
        this.load.spritesheet("espirradorPulgas", "./assets/tela-cuidado/espirradorPulga.png", {
            frameWidth: 232, frameHeight: 239 
        });
        this.load.image("pinca", "./assets/tela-cuidado/pinca.png"); 
    }

    /**
     * @method create
     * @description O ciclo de vida do Phaser invoca este método no frame exato em que
     * a fila do 'preload' chega a 100%. Aqui, disparamos a transição para o Menu Incial.
     */
    create() {
        // Carregamento concluído: transiciona imediatamente para a Cena Inicial
        this.scene.start("cenaInicial");
    }
}