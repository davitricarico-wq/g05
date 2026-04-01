// Importa o estado global do jogo para acessar as moedas e valores das barras
import { gameState } from "../main.js";
// Importa a classe Barra para criar as representacoes visuais das necessidades
import { Barra } from "./barras/barras.js";

// Classe HUD que gerencia a interface do usuario sobreposta ao jogo
export class HUD extends Phaser.Scene {
    constructor() {
        // Define a chave da cena para o Phaser conseguir identifica la
        super({ key: "HUD" });
        // Variavel de controle para evitar mais de uma transicao ao mesmo tempo
        this.transicao = false; 
    }

    create() {
        // Garante que a variavel de controle inicie desligada
        this.transicao = false;

        // Configuracao inicial das medidas do painel lateral
        const larguraPainel = this.scale.width * 0.2;
        const painelX = this.scale.width - larguraPainel / 2;
        const centroY = this.scale.height / 2;

        // Cria o icone de moedas na tela
        this.coinIcon = this.add.image(this.scale.width - this.scale.width*0.1, this.scale.height*0.05, "cobasiCoin")
            .setScale(this.scale.height*0.0008)
            .setScrollFactor(0)
            .setDepth(1000);

        // Adiciona o texto que mostra a quantidade de moedas
        this.coinText = this.add.text(this.scale.width - this.scale.width*0.09, this.scale.height*0.045,
            gameState.cobasiCoins,
            {
                fontFamily: '"Press Start 2P"',
                fontSize: "16px",
                color: "#ffffff"
            })
            .setScrollFactor(0)
            .setDepth(1000)
            .setScale(this.scale.height*0.0013);

        // Cria os icones e as barras de status do pet
        this.iconeFome = this.add.image(this.scale.width*0.05, this.scale.height*0.16, "iconeFome").setScale(this.scale.height*0.002);
        this.barraComida = new Barra(this, this.scale.width*0.15, this.scale.height*0.16, gameState.barras.comida);
        this.barraComida.sprite.setScale(this.scale.height*0.002);

        this.iconeFelicidade = this.add.image(this.scale.width*0.05, this.scale.height*0.32, "iconeFelicidade").setScale(this.scale.height*0.002);
        this.barraLazer = new Barra(this, this.scale.width*0.15, this.scale.height*0.32, gameState.barras.lazer);
        this.barraLazer.sprite.setScale(this.scale.height*0.002);

        this.iconeSujeira = this.add.image(this.scale.width*0.05, this.scale.height*0.08, "iconeSujeira").setScale(this.scale.height*0.002);
        this.barraLimpeza = new Barra(this, this.scale.width*0.15, this.scale.height*0.08, gameState.barras.limpeza);
        this.barraLimpeza.sprite.setScale(this.scale.height*0.002);

        this.iconeSaude = this.add.image(this.scale.width*0.05, this.scale.height*0.24, "iconeSaude").setScale(this.scale.height*0.002);
        this.barraSaude = new Barra(this, this.scale.width*0.15, this.scale.height*0.24, gameState.barras.saude);
        this.barraSaude.sprite.setScale(this.scale.height*0.002);

        // Cria o fundo branco do painel lateral
        this.painel = this.add.rectangle(painelX, centroY, larguraPainel, this.scale.height, 0xffffff, 1)
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0);

        // Prepara uma lista para guardar os botoes criados
        this.botoes = [];

        // Cria o botao de dar banho e configura o evento de clique
        const botaoBanho = this.add.image(painelX, this.scale.height*0.2, "iconeBanho")
            .setInteractive({ useHandCursor: true })
            .setScale(this.scale.height*0.001)
            .setScrollFactor(0);
        botaoBanho.on("pointerdown", () => this.transicionarPara("cenaBanho"));
        this.botoes.push({ botao: botaoBanho, cenaAlvo: "cenaBanho" });

        // Cria o botao de dar racao e configura o evento de clique
        const botaoRacao = this.add.image(painelX, this.scale.height*0.4, "iconeRacao")
            .setInteractive({ useHandCursor: true })
            .setScale(this.scale.height*0.001)
            .setScrollFactor(0);
        botaoRacao.on("pointerdown", () => this.transicionarPara("cenaComida"));
        this.botoes.push({ botao: botaoRacao, cenaAlvo: "cenaComida" });

        // Cria o botao de cuidados medicos e configura o evento de clique
        const botaoCuidados = this.add.image(painelX, this.scale.height*0.6, "iconeCuidados")
            .setInteractive({ useHandCursor: true })
            .setScale(this.scale.height*0.001)
            .setScrollFactor(0);
        botaoCuidados.on("pointerdown", () => this.transicionarPara("cenaVeterinario"));
        this.botoes.push({ botao: botaoCuidados, cenaAlvo: "cenaVeterinario" });

        // Cria o botao de brincar e configura o evento de clique
        const botaoLazer = this.add.image(painelX, this.scale.height*0.8, "iconeLazer")
            .setInteractive({ useHandCursor: true })
            .setScale(this.scale.height*0.001)
            .setScrollFactor(0);
        botaoLazer.on("pointerdown", () => this.transicionarPara("cenaLazer"));
        this.botoes.push({ botao: botaoLazer, cenaAlvo: "cenaLazer" });

        // Cria o botao de voltar para a tela principal e configura o evento de clique
        const botaoVoltar = this.add.image(painelX, this.scale.height*0.95, "iconeVoltar")
            .setInteractive({ useHandCursor: true })
            .setScale(this.scale.height*0.001)
            .setScrollFactor(0);
        botaoVoltar.on("pointerdown", () => this.transicionarPara("cenaPrincipal"));
        this.botoes.push({ botao: botaoVoltar, cenaAlvo: "cenaPrincipal" });

        // Funcao interna para ajustar elementos dinamicamente quando a janela mudar de tamanho
        const handleResizeHUD = (tamanhoTela) => {
            const { width: largura, height: altura } = tamanhoTela;

            const larguraPainel = largura * 0.2;
            const painelX = largura - larguraPainel / 2;
            const centroY = altura / 2;

            // Ajusta o tamanho e posicao do painel lateral
            this.painel.setSize(larguraPainel, altura).setPosition(painelX, centroY);

            // Ajusta as posicoes e proporcoes dos botoes
            this.botoes[0].botao.setPosition(painelX, altura * 0.2).setScale(altura * 0.001);
            this.botoes[1].botao.setPosition(painelX, altura * 0.4).setScale(altura * 0.001);
            this.botoes[2].botao.setPosition(painelX, altura * 0.6).setScale(altura * 0.001);
            this.botoes[3].botao.setPosition(painelX, altura * 0.8).setScale(altura * 0.001);
            this.botoes[4].botao.setPosition(painelX, altura * 0.95).setScale(altura * 0.001);

            // Ajusta a posicao do icone e do texto de moedas
            this.coinIcon.setPosition(largura - largura * 0.1, altura * 0.05).setScale(altura * 0.0008);
            this.coinText.setPosition(largura - largura * 0.09, altura * 0.045).setScale(altura * 0.0013);

            // Ajusta o espacamento proporcional dos icones e barras de necessidades
            this.iconeFome.setPosition(largura * 0.05, altura * 0.08).setScale(altura * 0.002);
            this.barraComida.sprite.setPosition(largura * 0.15, altura * 0.08).setScale(altura * 0.002);

            this.iconeFelicidade.setPosition(largura * 0.05, altura * 0.16).setScale(altura * 0.002);
            this.barraLazer.sprite.setPosition(largura * 0.15, altura * 0.16).setScale(altura * 0.002);

            this.iconeSujeira.setPosition(largura * 0.05, altura * 0.24).setScale(altura * 0.002);
            this.barraLimpeza.sprite.setPosition(largura * 0.15, altura * 0.24).setScale(altura * 0.002);

            this.iconeSaude.setPosition(largura * 0.05, altura * 0.32).setScale(altura * 0.002);
            this.barraSaude.sprite.setPosition(largura * 0.15, altura * 0.32).setScale(altura * 0.002);
        };

        // Ativa o ouvinte de eventos de redimensionamento de tela
        this.scale.on("resize", handleResizeHUD);

        // Remove o ouvinte de eventos quando a cena for destruida para evitar erros de memoria
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeHUD);
        });

    }

    // Funcao responsavel por gerenciar as trocas de cena com efeito visual de escurecimento
    transicionarPara(cenaAlvo) {
        // Interrompe a execucao se ja houver uma transicao em andamento
        if (this.transicao) return;
        
        // Verifica se a cena solicitada realmente existe configurada no jogo
        if (!this.scene.manager.keys[cenaAlvo]) {
            console.error(`Cena não registrada: ${cenaAlvo}`);
            return;
        }

        // Busca todas as cenas que estao ativas no momento
        const cenasAtivas = this.scene.manager.getScenes(true);
        
        // Descobre qual cena principal do jogo esta rodando por tras do HUD
        const cenaJogo = cenasAtivas.find(cena => {
            const chave = cena.scene.key;
            return chave !== "cenaHUD" && chave !== "ficha";
        });

        // Ignora o comando se o jogador tentar ir para a cena onde ja esta
        if (cenaJogo?.scene.key === cenaAlvo) return;

        // Ativa a trava de transicao e inicia o efeito de escurecer a tela
        this.transicao = true;
        this.cameras.main.fadeOut(300, 0, 0, 0);
        
        // Aguarda a tela escurecer completamente antes de trocar as cenas
        this.cameras.main.once("camerafadeoutcomplete", () => {
            // Desliga as cenas antigas que nao serao mais usadas
            cenasAtivas.forEach(cena => {
                const chave = cena.scene.key;
                if (chave !== "cenaHUD" && chave !== cenaAlvo) {
                    this.scene.stop(chave);
                }
            });
            
            // Inicia a nova cena solicitada caso ainda nao esteja rodando
            if (!this.scene.isActive(cenaAlvo)) {
                this.scene.launch(cenaAlvo);
            }
            
            // Garante que o HUD continue aparecendo por cima de tudo
            this.scene.bringToTop("cenaHUD");
            
            // Clareia a tela revelando a nova cena
            this.cameras.main.fadeIn(300, 0, 0, 0);
            
            // Libera a trava permitindo futuras transicoes
            this.transicao = false;
        });
    }


    // Funcao do ciclo de vida que executa constantemente para atualizar os visuais
    update() {
        // Sincroniza os valores das barras com os dados globais atuais
        this.barraComida.valor  = gameState.barras.comida;
        this.barraLazer.valor   = gameState.barras.lazer;
        this.barraLimpeza.valor = gameState.barras.limpeza;
        this.barraSaude.valor   = gameState.barras.saude;

        // Pede para as barras desenharem seus tamanhos atualizados
        this.barraComida.atualizarBarra();
        this.barraLazer.atualizarBarra();
        this.barraLimpeza.atualizarBarra();
        this.barraSaude.atualizarBarra();

        // Atualiza o numero escrito no marcador de moedas
        this.coinText.setText(gameState.cobasiCoins);

        // Chama a rotina para conferir se o cachorro precisa voltar a cena principal
        this.verificarManutencaoCachorro();
    }

    // Funcao que avalia as condicoes atuais das necessidades do pet
    verificarManutencaoCachorro() {
        // Checa se os valores de todas as quatro necessidades chegaram a zero
        const barrasZero = 
            gameState.barras.comida <= 0 &&
            gameState.barras.lazer <= 0 &&
            gameState.barras.limpeza <= 0 &&
            gameState.barras.saude <= 0

        // Forca o retorno para a tela principal caso as barras zerassem jogando com o Caramelo
        if (barrasZero && gameState.pets.cachorroCaramelo === true && !this.transicao) {
            this.transicionarPara("cenaPrincipal")
        }
    }
}