// Importa o estado global do jogo para acessar as moedas e valores das barras
import { gameState } from "../main.js";
// Importa a classe Barra para criar as representações visuais das necessidades
import { Barra } from "./barras/barras.js";

/**
 * @class HUD
 * @extends Phaser.Scene
 * @description Classe responsável por gerenciar a interface do usuário (Heads-Up Display).
 * Roda simultaneamente ao jogo principal para exibir moedas, status e painel de navegação.
 */
export class HUD extends Phaser.Scene {
    constructor() {
        // Define a chave identificadora da cena para o gerenciador do Phaser
        super({ key: "HUD" });
        
        // Variável de controle (Lock) para evitar que múltiplas transições de tela
        // ocorram ao mesmo tempo, prevenindo bugs de sobreposição.
        this.transicao = false; 
        
        // Cache para armazenar os valores anteriores das barras e moedas.
        // Isso evita redesenhar a tela (e gastar processamento) se os valores não mudaram.
        this.estadoAnterior = {
            comida: -1,
            lazer: -1,
            limpeza: -1,
            saude: -1,
            moedas: -1
        };
    }

    create() {
        // Reinicia a variável de controle ao criar a cena
        this.transicao = false;

        // Configurações base de layout (evitando "Magic Numbers")
        const larguraTela = this.scale.width;
        const alturaTela = this.scale.height;
        
        // Agrupa as proporções para facilitar manutenção e o redimensionamento
        const configLayout = {
            larguraPainel: larguraTela * 0.2,
            escalaIconeNecessidade: alturaTela * 0.002,
            escalaBotao: alturaTela * 0.001,
            escalaMoeda: alturaTela * 0.0008,
            escalaTextoMoeda: alturaTela * 0.0013
        };
        
        const painelX = larguraTela - configLayout.larguraPainel / 2;
        const centroY = alturaTela / 2;
        
        // Cria o ícone de moedas fixo na tela (ScrollFactor 0) e acima de tudo (Depth 1000)
        this.coinIcon = this.add.image(larguraTela * 0.9, alturaTela * 0.05, "cobasiCoin")
            .setScale(configLayout.escalaMoeda)
            .setScrollFactor(0)
            .setDepth(1000);

        // Adiciona o texto dinâmico que exibe a quantidade atual de moedas
        this.coinText = this.add.text(larguraTela * 0.91, alturaTela * 0.045, gameState.cobasiCoins, {
            fontFamily: '"Press Start 2P"',
            fontSize: "16px",
            color: "#ffffff"
        })
            .setScrollFactor(0)
            .setDepth(1000)
            .setScale(configLayout.escalaTextoMoeda);
        
        // Array com configurações das necessidades para facilitar a criação via loop
        this.statusConfig = [
            { id: "comida", icone: "iconeFome", yRef: 0.16, estadoBase: gameState.barras.comida },
            { id: "saude", icone: "iconeSaude", yRef: 0.24, estadoBase: gameState.barras.saude },
            { id: "lazer", icone: "iconeFelicidade", yRef: 0.32, estadoBase: gameState.barras.lazer },
            { id: "limpeza", icone: "iconeSujeira", yRef: 0.08, estadoBase: gameState.barras.limpeza }
        ];

        // Dicionários para guardar as instâncias criadas
        this.iconesStatus = {};
        this.barrasStatus = {};

        // Loop para instanciar os ícones e barras na tela dinamicamente
        this.statusConfig.forEach(config => {
            const posY = alturaTela * config.yRef;
            
            // Ícone da necessidade
            this.iconesStatus[config.id] = this.add.image(larguraTela * 0.05, posY, config.icone)
                .setScale(configLayout.escalaIconeNecessidade);
            
            // Barra da necessidade respectiva
            this.barrasStatus[config.id] = new Barra(this, larguraTela * 0.15, posY, config.estadoBase);
            this.barrasStatus[config.id].sprite.setScale(configLayout.escalaIconeNecessidade);
        });
        
        // Fundo branco do painel lateral
        this.painel = this.add.rectangle(painelX, centroY, configLayout.larguraPainel, alturaTela, 0xffffff, 1)
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0);

        this.botoes = [];

        // Função helper interna para centralizar a lógica de clique nos botões
        const navegarHud = (cenaAlvo) => {
            // Regra de negócio: Se for o "Cachorro João", ele só tem acesso à cena de Lazer
            if (gameState.pets.cachorroJoao && cenaAlvo !== "cenaLazer" && cenaAlvo !== "cenaPrincipal") {
                return this.exibirAvisoApenasLazer();
            }
            this.transicionarPara(cenaAlvo);
        };

        // Configuração dos botões do menu lateral para instanciação iterativa
        const configBotoes = [
            { img: "iconeBanho", alvo: "cenaBanho", yRef: 0.2 },
            { img: "iconeRacao", alvo: "cenaComida", yRef: 0.4 },
            { img: "iconeCuidados", alvo: "cenaVeterinario", yRef: 0.6 },
            { img: "iconeLazer", alvo: "cenaLazer", yRef: 0.8 },
            { img: "iconeVoltar", alvo: "cenaPrincipal", yRef: 0.95 }
        ];

        // Instancia cada botão, adiciona interatividade do mouse/toque e evento de clique
        configBotoes.forEach(cfg => {
            const btn = this.add.image(painelX, alturaTela * cfg.yRef, cfg.img)
                .setInteractive({ useHandCursor: true })
                .setScale(configLayout.escalaBotao)
                .setScrollFactor(0);
            
            btn.on("pointerdown", () => navegarHud(cfg.alvo));
            this.botoes.push({ botao: btn, cfg: cfg });
        });
        
        /**
         * @callback handleResizeHUD
         * @description Realinha e reescala elementos da HUD dinamicamente se a janela mudar.
         */
        const handleResizeHUD = (tamanhoTela) => {
            const { width: largura, height: altura } = tamanhoTela;
            const novaLarguraPainel = largura * 0.2;
            const novoPainelX = largura - novaLarguraPainel / 2;

            // Atualiza painel e moedas
            this.painel.setSize(novaLarguraPainel, altura).setPosition(novoPainelX, altura / 2);
            this.coinIcon.setPosition(largura * 0.9, altura * 0.05).setScale(altura * 0.0008);
            this.coinText.setPosition(largura * 0.91, altura * 0.045).setScale(altura * 0.0013);

            // Atualiza posições dos botões
            this.botoes.forEach(item => {
                item.botao.setPosition(novoPainelX, altura * item.cfg.yRef).setScale(altura * 0.001);
            });

            // Atualiza posições dos status (ícones e barras) iterando pela config base
            this.statusConfig.forEach(config => {
                const posY = altura * config.yRef;
                this.iconesStatus[config.id].setPosition(largura * 0.05, posY).setScale(altura * 0.002);
                this.barrasStatus[config.id].sprite.setPosition(largura * 0.15, posY).setScale(altura * 0.002);
            });
        };

        // Registra o evento de resize global do Phaser
        this.scale.on("resize", handleResizeHUD);

        // Limpa o evento quando a cena for destruída (Prevenção de Memory Leak)
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeHUD);
        });
    }

    /**
     * @method exibirAvisoApenasLazer
     * @description Exibe um feedback visual temporário informando uma restrição de design.
     */
    exibirAvisoApenasLazer() {
        // Remove o aviso anterior caso o jogador clique freneticamente para não encavalar UI
        if (this.avisoContainer) {
            this.avisoContainer.destroy();
            this.avisoTimer?.remove(false);
        }

        const larguraAviso = this.scale.width * 0.18;
        const x = this.scale.width * 0.9;
        const y = this.scale.height * 0.38;

        const fundoAviso = this.add.rectangle(x, y, larguraAviso, 60, 0x000000, 0.8)
            .setOrigin(0.5).setScrollFactor(0).setDepth(1100);

        const textoAviso = this.add.text(x, y, "Cachorro João só pode brincar. Clique no botão Lazer.", {
            fontFamily: '"Press Start 2P"',
            fontSize: "12px",
            color: "#ffffff",
            align: "center",
            wordWrap: { width: larguraAviso - 20 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1101);

        this.avisoContainer = this.add.container(0, 0, [fundoAviso, textoAviso]);

        // Timer que destrói o aviso automaticamente após 2.2 segundos
        this.avisoTimer = this.time.delayedCall(2200, () => {
            if (this.avisoContainer) {
                this.avisoContainer.destroy();
                this.avisoContainer = null;
            }
        });
    }

    /**
     * @method transicionarPara
     * @param {string} cenaAlvo - A chave da cena que deve ser iniciada
     * @description Gerencia a troca de cenas com efeito de fade-out e fade-in suave,
     * mantendo a HUD sempre ativa e sobreposta.
     */
    transicionarPara(cenaAlvo) {
        if (this.transicao) return; // Trava de segurança

        if (!this.scene.manager.keys[cenaAlvo]) {
            console.error(`Cena não registrada: ${cenaAlvo}`);
            return;
        }

        const cenasAtivas = this.scene.manager.getScenes(true);
        // Filtra para encontrar qual minigame está aberto no momento
        const cenaJogo = cenasAtivas.find(cena => cena.scene.key !== "HUD" && cena.scene.key !== "ficha");

        // Ignora caso o usuário tenha clicado no botão da cena atual
        if (cenaJogo?.scene.key === cenaAlvo) return;

        this.transicao = true;
        this.cameras.main.fadeOut(300, 0, 0, 0);
        
        // Assim que a tela terminar de escurecer:
        this.cameras.main.once("camerafadeoutcomplete", () => {
            // Desliga apenas as cenas de gameplay antigas
            cenasAtivas.forEach(cena => {
                const chave = cena.scene.key;
                if (chave !== "HUD" && chave !== cenaAlvo) {
                    this.scene.stop(chave);
                }
            });
            
            // Inicia a nova cena de minigame solicitada
            if (!this.scene.isActive(cenaAlvo)) {
                this.scene.launch(cenaAlvo);
            }
            
            // Assegura que o HUD seja sempre a última camada (camada do topo)
            this.scene.bringToTop("HUD");
            
            // Clareia a tela novamente
            this.cameras.main.fadeIn(300, 0, 0, 0);
            this.transicao = false; // Libera o lock
        });
    }

    /**
     * @method update
     * @description Game Loop do HUD. Sincroniza os dados visuais com o estado global.
     * Otimizado usando Cache (estadoAnterior) para atualizar a UI apenas quando há mudança.
     */
    update() {
        // Verifica e atualiza apenas as barras que sofreram alterações reais de valor
        ['comida', 'lazer', 'limpeza', 'saude'].forEach(status => {
            if (this.estadoAnterior[status] !== gameState.barras[status]) {
                this.barrasStatus[status].valor = gameState.barras[status];
                this.barrasStatus[status].atualizarBarra(); // Renderiza nova barra apenas se alterou
                this.estadoAnterior[status] = gameState.barras[status]; // Atualiza o cache
            }
        });

        // Verifica e atualiza as moedas na tela apenas se o jogador gastou/recebeu mais
        if (this.estadoAnterior.moedas !== gameState.cobasiCoins) {
            this.coinText.setText(gameState.cobasiCoins);
            this.estadoAnterior.moedas = gameState.cobasiCoins;
        }

        // Checa as condições atuais do pet
        this.verificarManutencaoCachorro();
    }

    /**
     * @method verificarManutencaoCachorro
     * @description Verifica se todas as necessidades do animal foram zeradas,
     * forçando o encerramento do minigame e retornando à cena principal.
     */
    verificarManutencaoCachorro() {
        const barrasZero = 
            gameState.barras.comida <= 0 &&
            gameState.barras.lazer <= 0 &&
            gameState.barras.limpeza <= 0 &&
            gameState.barras.saude <= 0;

        if (barrasZero && gameState.progressoCachorro < 2 && !this.transicao) {
            this.transicionarPara("cenaPrincipal");
        }
    }
}