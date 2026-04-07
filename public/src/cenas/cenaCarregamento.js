// Exporta a cena responsável por carregar todos os assets (imagens, sprites, sons, etc.)
export class cenaCarregamento extends Phaser.Scene {
    constructor() {
        // Define a chave da cena como "cenaCarregamento"
        super({ key: "cenaCarregamento" });
    }

    preload() {

        // Tela Inicial
        this.load.image("bgInicial", "assets/tela-inicial/bgInicial.png"); // Fundo da tela inicial
        this.load.image("bgPrincipal", "assets/tela-principal/bgPrincipal.png");// Fundo principal

        // Botões da tela inicial em diferentes estados (normal, crescendo, pressionado)
        this.load.image("botaoJogarNormal", "assets/tela-inicial/botaoJogarNormal.png");
        this.load.image("botaoJogarCrescendo", "assets/tela-inicial/botaoJogarCrescendo.png");
        this.load.image("botaoJogarPressionado", "assets/tela-inicial/botaoJogarPressionado.png");
        this.load.image("botaoSairNormal", "assets/tela-inicial/botaoSairNormal.png");
        this.load.image("botaoSairCrescendo", "assets/tela-inicial/botaoSairCrescendo.png");
        this.load.image("botaoSairPressionado", "assets/tela-inicial/botaoSairPressionado.png");
        this.load.image("botaoConfiguracoesNormal", "assets/tela-inicial/botaoConfiguracoesNormal.png");
        this.load.image("botaoConfiguracoesCrescendo", "assets/tela-inicial/botaoConfiguracoesCrescendo.png");
        this.load.image("botaoConfiguracoesPressionado", "assets/tela-inicial/botaoConfiguracoesPressionado.png");

        // Tela Configurações
        this.load.image("retornoInicio", "assets/tela-configuracoes/retornoInicio.png"); // Botão de voltar
        this.load.image("configuracoes", "assets/tela-configuracoes/configuracoes.png"); // Fundo de configurações
        this.load.image("botaoOff", "assets/tela-configuracoes/botaoOff.png");           // Botão desligado
        this.load.image("botaoOn", "assets/tela-configuracoes/botaoOn.png");             // Botão ligado

        // Ícones das barras de status
        this.load.image("iconeFome", "assets/icones/iconeFome.png");
        this.load.image("iconeFelicidade", "assets/icones/iconeFelicidade.png");
        this.load.image("iconeSaude", "assets/icones/iconeSaude.png");
        this.load.image("iconeSujeira", "assets/icones/iconeSujeira.png");

        // Spritesheet da barra de status
        this.load.spritesheet("barra", "assets/icones/barraStatus.png", {
            frameWidth: 144,
            frameHeight: 32
        });

        // HUD (interface do jogo)
        this.load.image("iconeBanho", "assets/iconeBanho.png");
        this.load.image("iconeRacao", "assets/iconeRacao.png");
        this.load.image("iconeCuidados", "assets/iconeCuidados.png");
        this.load.image("iconeLazer", "assets/iconeLazer.png");
        this.load.image("iconeVoltar", "assets/iconeVoltar.png");
        this.load.image("cobasiCoin", "assets/moeda.png"); //moedas do jogo

        // Cena de Cuidado
        this.load.image("bgCuidado", "assets/tela-cuidado/bgCuidado.png");//fundo do pelo do primeiro cachorro
        this.load.image("pulga1", "assets/tela-cuidado/pulga1.png");
        this.load.image("bandeja", "assets/tela-cuidado/bandeja.png");
        this.load.image("bgCuidadoHeroi", "assets/bgCuidadoHeroi.png");//fundo do pelo do segundo animal
        this.load.image("bgVeterinario", "assets/tela-veterinario/bgVeterinario.png");
        this.load.image("lupa", "assets/tela-veterinario/lupa.png");

        // Cenas de Ração
        this.load.image("bgRacao", "assets/tela-alimentacao/bgRacao.png");
        this.load.image("mineFicha", "assets/mineFicha.png");
        this.load.image("estanteVazia", "assets/tela-alimentacao/estanteVazia.png");
        this.load.image("estanteRacao", "assets/tela-alimentacao/estanteRacao.png");
        this.load.image("racaoVazia", "assets/tela-alimentacao/racaoVazia.png");

         // Sprites da cena jogoRacao.js
        this.load.image("botaoStandard", "assets/botaoStandardNormal.png");
        this.load.image("botaoStandardPressionado", "assets/botaoStandardPressionado.png");
        this.load.image("botaoSuperPremium", "assets/botaoSuperPremiumNormal.png");
        this.load.image("botaoSuperPremiumPressionado", "assets/botaoSuperPremiumPressionado.png");
        this.load.image("fundoTemplateRacao", "assets/fundoTemplateRacao.png");
        this.load.image("composicaoRacao", "assets/tela-racao/composicaoRacao.png");
        this.load.image("estanteRacao", "assets/tela-alimentacao/estanteRacao.png");
        this.load.image("estanteStandard", "assets/tela-alimentacao/estanteStandard.png");
        this.load.image("botaoComprarSuperPremium", "assets/botaoComprarSuperPremium.png");
        this.load.image("botaoComprarSuperPremiumPressionado", "assets/botaoComprarSuperPremiumPressionado.png");
        this.load.image("botaoComprarStandard", "assets/botaoComprarStandard.png");
        this.load.image("botaoComprarStandardPressionado", "assets/botaoComprarStandardPressionado.png");

          //Imagens jogo Alimentação 
        this.load.image('bgFoodScene', 'assets/tela-alimentacao/fundoracao.png');
        this.load.image('dogPlayer', 'assets/dogPlayer.png');//sprite do primeiro cachorro com boca aberta
        this.load.image('foodNormal', 'assets/foodNormal.png');
        this.load.image('foodSuperPremium', 'assets/foodSuperPremium.png');
        this.load.image('foodChocolate', 'assets/foodChocolate.png'); // petisco proibido
        this.load.image('heart', 'assets/heart.png');//vida 
        this.load.image('retornoInicio', 'assets/retornoInicio.png');
        this.load.image("cachorroHeroiBoca", "assets/cachorroHeroiBoca.png");//sprite do segundo cachorro
    
        //Cenas banheiro
        this.load.image("bgLimpo", "assets/bgLimpo.png");
        this.load.image("bgBanheiro", "assets/tela-banho/bgBanheiro.png");
        this.load.image("botaoVoltar", "assets/botaoVoltar.png");
        this.load.image("chuveiro", "assets/tela-banho/chuveiro.png");
        this.load.image("sabao", "assets/tela-banho/barrasabao.png");
        this.load.image("toalha", "assets/tela-banho/toalha.png");
        this.load.image("bolhas", "assets/tela-banho/bolhas.png");
        
        // Cena Lazer
        this.load.image("bolaLaranja","assets/bolaLaranja.png");
        this.load.image("petisco", "assets/tela-lazer/petisco.png");
        this.load.image("petiscoEstragado", "assets/tela-lazer/petiscoestragado.png")
        this.load.image("obstaculo", "assets/tela-lazer/obstaculo.png"); 
        this.load.image("bgLazer", "assets/tela-lazer/bgLazer.png");
        this.load.image("camaElastica", "assets/tela-lazer/camaElastica.png");

        // Tela de storytelling/tutorial
        this.load.image("tutorial1", "assets/tutorial1.png");
        this.load.image("tutorial2", "assets/tutorial2.png");
        this.load.image("tutorial3", "assets/tutorial3.png");
        this.load.image("tutorial4", "assets/tutorial4.png");
        this.load.image("tutorial5", "assets/tutorial5.png");
        this.load.image("tutorial6", "assets/tutorial6.png");
        this.load.image("tutorial7", "assets/tutorial7.png");
        this.load.image("tutorial8", "assets/tutorial8.png");
        this.load.image("tutorial9", "assets/tutorial9.png");
        this.load.image("tutorial10", "assets/tutorial10.png");
        this.load.image("tutorial11", "assets/tutorial11.png");

        // Assets das rações standard
        this.load.image("racaoStandardPequeno", "assets/racoes/racaoStandard_P.png");
        this.load.image("racaoStandardMedio", "assets/racoes/racaoStandard_M.png");
        this.load.image("racaoStandardGrande", "assets/racoes/racaoStandard_G.png");

        // Assets das rações premium
        this.load.image("racaoPremiumPequeno", "assets/racoes/racaoPremium_P.png");
        this.load.image("racaoPremiumMedio", "assets/racoes/racaoPremium_M.png");
        this.load.image("racaoPremiumGrande", "assets/racoes/racaoPremium_G.png");

        // Assets das rações super premium
        this.load.image("racaoSuperPremiumPequeno", "assets/racoes/racaoSuperPremium_P.png");
        this.load.image("racaoSuperPremiumMedio", "assets/racoes/racaoSuperPremium_M.png");
        this.load.image("racaoSuperPremiumGrande", "assets/racoes/racaoSuperPremium_G.png");

       
        //Cenas feedback
        this.load.image("feeedback3estrelas", "assets/feedback/feedbackMineGame.png");
        this.load.image("feedback2estrelas", "assets/feedback/feedbackMineGame2.png");
        this.load.image("feedback1estrela", "assets/feedback/feedbackMineGame3.png");

        //Cenas de instrução e Como Jogar
        this.load.image("instrucaoDescricaoBanho", "assets/feedback/instrucaoBanho.png");
        this.load.image("conclusaoPrimeiroRound", "assets/feedback/conclusaoPrimeiroRound.png");
        this.load.image("conclusaoSegundoRound", "assets/feedback/conclusaoSegundoRound.png");
        this.load.image("conclusaoTerceiroRound", "assets/feedback/conclusaoTerceiroRound.png");
        this.load.image("instrucaoSegundoRound", "assets/feedback/instrucaoSegundoRound.png");
        this.load.image("instrucaoTerceiroRound", "assets/feedback/instrucaoTerceiroRound.png");
        this.load.image("instrucaoDescricaoRacao", "assets/feedback/instrucaoDescricaoRacao.png");
        this.load.image("instrucaoLazer", "assets/feedback/instrucaoLazer.png");
        this.load.image("instrucaoBanho", "assets/feedback/instrucaoBanho.png");
        this.load.image("instrucaoMissao", "assets/feedback/instrucaoMissao.png");
        this.load.image("instrucaoPulgas", "assets/feedback/instrucaoPulgas.png");
        this.load.image("instrucaoRacao", "assets/feedback/instrucaoRacao.png");
        this.load.image("instrucaoSegundaFase", "assets/feedback/instrucaoSegundaFase.png");
        this.load.image("comoJogarLazer", "assets/feedback/comoJogarLazer.png");
        this.load.image("comoJogarPulgas", "assets/feedback/comoJogarPulgas.png");
        this.load.image("comoJogarRacao", "assets/feedback/comoJogarRacao.png");
        this.load.image("instrucaoQuiz", "assets/feedback/instrucaoQuiz.png");
        this.load.image("final", "assets/feedback/final.png");
       
        // Áudio
        this.load.audio("musicaMenuPrincipal", "assets/sons/menu-principal.mp3");
        this.load.audio("musica", "assets/sons/menu-principal.mp3");
        this.load.audio("musicaTutorial", "assets/sons/musica-cutscene.mp3");

        // Spritesheets do cachorro e água
        this.load.spritesheet("pulgas", "assets/pulgaCachorro.png", {
            frameWidth: 626,
            frameHeight: 655
        });
        this.load.spritesheet("cachorroCaramelo", "assets/cachorroCaramelo.png", {
            frameWidth: 626,
            frameHeight: 655
        });
        //sprite do segundo cachorro
        this.load.spritesheet("cachorroHeroi", "assets/cachorroHeroi.png", {
            frameWidth: 626,
            frameHeight: 655
        });
           this.load.spritesheet("cachorroJoao", "assets/cachorroJoao.png", {
            frameWidth: 626,
            frameHeight: 655
        });
        this.load.spritesheet("agua", "assets/tela-banho/agua.png", {
            frameWidth: 480,
            frameHeight: 480
        });
        this.load.spritesheet("cachorroCorrendo", "assets/tela-lazer/cachorroCorrendo.png", {
            frameWidth: 445,
            frameHeight: 280 
        });
        this.load.spritesheet("cachorroHeroiCorrendo", "assets/cachorroHeroiCorrendo.png", {
            frameWidth: 1202,
            frameHeight: 1087 
        });
        this.load.spritesheet("cachorroJoaoCorrendo", "assets/cachorroJoaoCorrendo.png", {
            frameWidth: 338,
            frameHeight: 339 
        });
        this.load.spritesheet("espirradorPulgas", "assets/tela-cuidado/espirradorPulga.png", {
            frameWidth: 232,
            frameHeight: 239 
        });

        this.load.image("pinca", "assets/tela-cuidado/pinca.png");
      
    }

    create() {
        // Após carregar todos os assets, inicia a cena inicial do jogo
        //this.scene.start("cenaInicial"); 
        this.scene.start("cenaEstanteRacao")
    }
}
