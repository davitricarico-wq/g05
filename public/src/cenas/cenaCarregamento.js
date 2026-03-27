// Exporta a cena responsável por carregar todos os assets (imagens, sprites, sons, etc.)
export class cenaCarregamento extends Phaser.Scene {
    constructor() {
        // Define a chave da cena como "cenaCarregamento"
        super({ key: "cenaCarregamento" });
    }

    preload() {
        // Tela Inicial
        this.load.image("bgInicial", "assets/tela-inicial/bgInicial.png"); // Fundo da tela inicial
        this.load.image("bgPrincipal", "assets/tela-principal/bgPrincipal.png");         // Fundo principal
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
        this.load.image("iconeFome", "assets/Icones/iconeFome.png");
        this.load.image("iconeFelicidade", "assets/Icones/iconeFelicidade.png");
        this.load.image("iconeSaude", "assets/Icones/iconeSaude.png");
        this.load.image("iconeSujeira", "assets/Icones/iconeSujeira.png");

        // Spritesheet da barra de status
        this.load.spritesheet("barra", "assets/Icones/barraStatus.png", {
            frameWidth: 144,
            frameHeight: 32
        });

        // HUD (interface do jogo)
        this.load.image("iconeBanho", "assets/iconeBanho.png");
        this.load.image("iconeRacao", "assets/iconeRacao.png");
        this.load.image("iconeCuidados", "assets/iconeCuidados.png");
        this.load.image("iconeLazer", "assets/iconeLazer.png");
        this.load.image("iconeVoltar", "assets/iconeVoltar.png");
        this.load.image("cobasiCoin", "assets/moeda.png"); 

        
        

        
        // Tela de Cuidado
        this.load.image("bgCuidado", "assets/tela-cuidado/bgCuidado.png");
        this.load.image("pulga1", "assets/tela-cuidado/pulga1.png");
        this.load.image("bandeja", "assets/tela-cuidado/bandeja.png");
        this.load.image("bgCuidadoHeroi", "assets/bgCuidadoHeroi.png");

        // Cenas de gameplay
        this.load.image("bgRacao", "assets/tela-alimentacao/bgRacao.png");
        this.load.image("bgLimpo", "assets/bgLimpo.png");
        this.load.image("bgBanheiro", "assets/tela-banho/bgBanheiro.png");
        this.load.image("estanteVazia", "assets/tela-alimentacao/estanteVazia.png");
        this.load.image("estanteRacao", "assets/tela-alimentacao/estanteRacao.png");
        this.load.image("racaoVazia", "assets/tela-alimentacao/racaoVazia.png");
        this.load.image("mineFicha", "assets/mineFicha.png");
        this.load.image("botaoVoltar", "assets/botaoVoltar.png");
        this.load.image("chuveiro", "assets/tela-banho/chuveiro.png");
        this.load.image("sabao", "assets/tela-banho/barrasabao.png");
        this.load.image("toalha", "assets/tela-banho/toalha.png");
        this.load.image("bolhas", "assets/tela-banho/bolhas.png");
        this.load.image("bolaLaranja","assets/bolaLaranja.png");
        this.load.image("bgVeterinario", "assets/tela-veterinario/bgVeterinario.png");
        this.load.image("lupa", "assets/tela-veterinario/lupa.png")
        this.load.image("petisco", "assets/tela-lazer/petisco.png");
        this.load.image("petiscoEstragado", "assets/tela-lazer/petiscoestragado.png")
        this.load.image("obstaculo", "assets/tela-lazer/obstaculo.png"); 
        this.load.image("bgLazer", "assets/tela-lazer/bgLazer.png");
        this.load.image("camaElastica", "assets/tela-lazer/camaElastica.png");

        this.load.image("cachorroHeroiBoca", "assets/cachorroHeroiBoca.png")

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

        // Rações refinadas
        this.load.image("racaoGA", "assets/Racoes/racaoGA.png");
        this.load.image("racaoGF", "assets/Racoes/racaoGF.png");
        this.load.image("racaoGV", "assets/Racoes/racaoGV.png");
        this.load.image("racaoMA", "assets/Racoes/racaoMA.png");
        this.load.image("racaoMF", "assets/Racoes/racaoMF.png");
        this.load.image("racaoMV", "assets/Racoes/racaoMV.png");
        this.load.image("racaoPA", "assets/Racoes/racaoPA.png");
        this.load.image("racaoPF", "assets/Racoes/racaoPF.png");
        this.load.image("racaoPV", "assets/Racoes/racaoPV.png");
        this.load.image("standardGA", "assets/Racoes/standardGA.png");
        this.load.image("standartGF", "assets/Racoes/standartGF.png");
        this.load.image("standartGV", "assets/Racoes/standartGV.png");
        this.load.image("standartMA", "assets/Racoes/standartMA.png");
        this.load.image("standartMF", "assets/Racoes/standartMF.png");
        this.load.image("standartMV", "assets/Racoes/standartMV.png");
        this.load.image("standartPA", "assets/Racoes/standartPA.png");
        this.load.image("standartPF", "assets/Racoes/standartPF.png");
        this.load.image("standartPV", "assets/Racoes/standartPV.png");

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


        //Cenas feedback
       // this.load.image("avisoConclusao", "assets/Feedback/avisoConclusao.png");
        this.load.image("feeedback3estrelas", "assets/Feedback/feedbackMineGame.png");
        this.load.image("feedback2estrelas", "assets/Feedback/feedbackMineGame2.png");
        this.load.image("feedback1estrela", "assets/Feedback/feedbackMineGame3.png");
        this.load.image("instrucaoDescricaoBanho", "assets/Feedback/instrucaoBanho.png");
        this.load.image("conclusaoPrimeiroRound", "assets/Feedback/conclusaoPrimeiroRound.png");
        this.load.image("instrucaoDescricaoRacao", "assets/Feedback/instrucaoDescricaoRacao.png");
        this.load.image("instrucaoLazer", "assets/Feedback/instrucaoLazer.png");
        this.load.image("instrucaoBanho", "assets/Feedback/instrucaoBanho.png");
        this.load.image("instrucaoMissao", "assets/Feedback/instrucaoMissao.png");
        this.load.image("instrucaoPulgas", "assets/Feedback/instrucaoPulgas.png");
        this.load.image("instrucaoRacao", "assets/Feedback/instrucaoRacao.png");
        this.load.image("instrucaoSegundaFase", "assets/Feedback/instrucaoSegundaFase.png");
        this.load.image("comoJogarLazer", "assets/Feedback/comoJogarLazer.png");
        this.load.image("comoJogarPulgas", "assets/Feedback/comoJogarPulgas.png");
        this.load.image("comoJogarRacao", "assets/Feedback/comoJogarRacao.png");
        this.load.image("bgCuidadoHeroi", "assets/bgCuidadoHeroi.png");
        // Áudio
        this.load.audio("musicaMenuPrincipal", "assets/Sons/menu-principal.mp3");
        this.load.audio("musica", "assets/Sons/menu-principal.mp3");
        this.load.audio("musicaTutorial", "assets/Sons/musica-cutscene.mp3");

        // Spritesheets do cachorro e água
        this.load.spritesheet("pulgas", "assets/pulgaCachorro.png", {
            frameWidth: 626,
            frameHeight: 655
        });
        this.load.spritesheet("cachorroCaramelo", "assets/cachorroCaramelo.png", {
            frameWidth: 626,
            frameHeight: 655
        });
        this.load.spritesheet("cachorroHeroi", "assets/cachorroHeroi.png", {
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
            frameWidth: 640,
            frameHeight: 402 
        });


        //Imagens jogo Alimentação
        
        this.load.image('bgFoodScene', 'assets/tela-alimentacao/fundoracao.png');
        this.load.image('dogPlayer', 'assets/dogPlayer.png');
        this.load.image('foodNormal', 'assets/foodNormal.png');
        this.load.image('foodSuperPremium', 'assets/foodSuperPremium.png');
        this.load.image('foodChocolate', 'assets/foodChocolate.png');
        this.load.image('heart', 'assets/heart.png');
        this.load.image('retornoInicio', 'assets/retornoInicio.png');
    
    }

    create() {
        // Após carregar todos os assets, inicia a cena inicial do jogo
        // this.scene.start("cenaInicial"); // <- descomente esta linha para voltar ao fluxo normal
        this.scene.start("cenaInicial"); // <- comente esta linha para voltar ao fluxo normal
    }
}
