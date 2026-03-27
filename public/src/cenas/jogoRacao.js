// Importa o estado global do jogo para gerenciar progresso e dados
import { gameState } from "../main.js";

// Importa os dados de propriedades de cada tipo de ração (tamanho da ração e idade do pet)
import {
    racaoGrandeFilhote, racaoGrandeAdulto, racaoGrandeSenior,
    racaoMediaAdulto, racaoMediaFilhote, racaoMediaSenior,
    racaoPequenaAdulto, racaoPequenaFilhote, racaoPequenaSenior
} from "../componentes/controleRacoes/dadosRacoes.js";

// Importa a classe responsável por construir o objeto da ração no jogo
import { Racao } from "../componentes/controleRacoes/racoes.js";

// Importa as informações base dos cachorros
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";

// Define a classe da cena da loja de rações
export class jogoRacao extends Phaser.Scene {
    constructor() {
        // Define a chave identificadora desta cena dentro do Phaser
        super({ key: "jogoRacao" });
    }

    // O método create é executado quando a cena é montada
    create() {
        // Armazena as dimensões atuais da tela para facilitar o posicionamento
        const larguraTotal = this.scale.width;
        const alturaTotal = this.scale.height;

        // Função auxiliar para padronizar a criação de botões com animação e som
        const criarBotao = (x, y, texturaNormal, texturaPressionado, escalaBase, escalaAumentada, escalaPressionada, callback) => {
            // Cria a imagem do botão e o torna clicável
            const botao = this.add.image(x, y, texturaNormal).setScale(escalaBase).setInteractive({ useHandCursor: true });

            // Efeito de "hover" quando o mouse passa por cima (aumenta o botão)
            botao.on("pointerover", () => {
                botao.setTexture(texturaPressionado);
                this.tweens.add({ targets: botao, scale: escalaAumentada, duration: 150, ease: "Power2" });
            });

            // Retorna o botão ao estado normal quando o mouse sai de cima
            botao.on("pointerout", () => {
                botao.setTexture(texturaNormal);
                this.tweens.add({ targets: botao, scale: escalaBase, duration: 150, ease: "Power2" });
            });

            // Efeito de afundar o botão no momento exato do clique
            botao.on("pointerdown", () => {
                botao.setTexture(texturaPressionado);
                this.tweens.add({ targets: botao, scale: escalaPressionada, duration: 100, ease: "Power2" });
            });

            // Dispara a ação do botão e retorna ele pro tamanho "hover" quando solta o clique
            botao.on("pointerup", () => {
                botao.setTexture(texturaPressionado);
                this.tweens.add({ targets: botao, scale: escalaAumentada, duration: 100, ease: "Power2" });
                if (callback) callback();
            });

            return botao;
        };

        // Adiciona a imagem de fundo esticada para preencher a tela inteira
        this.fundo = this.add.image(larguraTotal / 2, alturaTotal / 2, "bgLimpo")
            .setDisplaySize(larguraTotal, alturaTotal)
            .setDepth(-1);

        // Adiciona a estante onde os sacos de ração ficarão posicionados
        this.estante = this.add.image(larguraTotal / 4, alturaTotal * 0.6, "estanteVazia")
            .setScale(1.2)
            .setDepth(0);

        // Cria os botões para filtrar e trocar a categoria das rações exibidas
        this.botaoStandard = criarBotao(larguraTotal * 0.15, alturaTotal * 0.145, "botaoStandard", "botaoStandardPressionado", 0.5, 0.55, 0.45);
        this.botaoSuperPremium = criarBotao(larguraTotal * 0.35, alturaTotal * 0.15, "botaoSuperPremium", "botaoSuperPremiumPressionado", 0.5, 0.55, 0.45);

        // Instancia as rações da categoria Super Premium passando posições e dados específicos
        this.racoesSuperPremium = [
            new Racao(this, larguraTotal * 0.13, alturaTotal * 0.37, racaoGrandeFilhote),
            new Racao(this, larguraTotal * 0.25, alturaTotal * 0.37, racaoGrandeAdulto),
            new Racao(this, larguraTotal * 0.37, alturaTotal * 0.37, racaoGrandeSenior),
            new Racao(this, larguraTotal * 0.13, alturaTotal * 0.605, racaoMediaFilhote),
            new Racao(this, larguraTotal * 0.25, alturaTotal * 0.605, racaoMediaAdulto),
            new Racao(this, larguraTotal * 0.37, alturaTotal * 0.605, racaoMediaSenior),
            new Racao(this, larguraTotal * 0.13, alturaTotal * 0.845, racaoPequenaFilhote),
            new Racao(this, larguraTotal * 0.25, alturaTotal * 0.845, racaoPequenaAdulto),
            new Racao(this, larguraTotal * 0.37, alturaTotal * 0.845, racaoPequenaSenior),
        ];

        // Configura a base do painel direito que mostra os detalhes ou o texto inicial
        this.fundoTemplateRacao = this.add.image(larguraTotal * 0.58, alturaTotal * 0.47, "fundoTemplateRacao")
            .setScale(alturaTotal * 0.00065);

        // Container e textos iniciais convidando o jogador a escolher uma ração
        this.containerTexto = this.add.container(this.fundoTemplateRacao.x, this.fundoTemplateRacao.y);
        const titulo = this.add.text(0, -200, "Compre sua ração!", { fontSize: "30px", color: "#000", fontFamily: '"Press Start 2P"', align: "center" }).setOrigin(0.5);
        const subtitulo = this.add.text(0, 0, "Escolha a ração\nideal para seu pet", { fontSize: "20px", color: "#000", fontFamily: '"Press Start 2P"', align: "center" }).setOrigin(0.5);
        
        // Agrupa os textos para facilitar a manipulação (esconder/mostrar)
        this.containerTexto.add([titulo, subtitulo]);

        // Cria o botão de confirmação da compra
        this.botaoComprar = criarBotao(larguraTotal * 0.58, alturaTotal * 0.70, "botaoComprar", "botaoComprarPressionado", 0.35, 0.4, 0.30, () => console.log("Comprado!"));

        // Cria o container da ficha técnica da ração (inicia invisível até clicar em uma)
        this.containerInfo = this.add.container(larguraTotal * 0.58, alturaTotal * 0.45)
            .setScale(alturaTotal * 0.0009)
            .setVisible(false).setAlpha(0);

        // Prepara os textos e imagens vazias que serão preenchidos ao selecionar a ração
        this.composicaoRacao = this.add.image(0, 0, "composicaoRacao");
        this.imagemRacaoInfo = this.add.image(-160, -70, "").setScale(0.18);
        this.textoTipo = this.add.text(0, -217, "", { fontSize: "32px", color: "#000", fontFamily: '"Press Start 2P"', align: "center" }).setOrigin(0.5);
        this.textoPorte = this.add.text(75, -138, "", { fontSize: "16px", color: "#006600", fontFamily: '"Press Start 2P"' }).setOrigin(0, 0.5);
        this.textoIdade = this.add.text(75, -102, "", { fontSize: "16px", color: "#006600", fontFamily: '"Press Start 2P"' }).setOrigin(0, 0.5);
        this.textoChar1 = this.add.text(80, -44, "", { fontSize: "16px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 300 } }).setOrigin(0.5);
        this.textoChar2 = this.add.text(80, 18, "", { fontSize: "16px", color: "#000", fontFamily: '"Press Start 2P"', align: "center", wordWrap: { width: 300 } }).setOrigin(0.5);

        // Prepara os campos de valor nutricional da ração
        const estiloNutri = { fontSize: "12px", color: "#8B4513", fontFamily: '"Press Start 2P"' };
        this.textoTrigo = this.add.text(-170, 204, "", estiloNutri).setOrigin(0.5);
        this.textoCarne = this.add.text(-60, 204, "", estiloNutri).setOrigin(0.5);
        this.textoOsso = this.add.text(51, 204, "", estiloNutri).setOrigin(0.5);
        this.textoGordura = this.add.text(165, 204, "", estiloNutri).setOrigin(0.5);

        // Adiciona todos os elementos visuais criados no container de informação
        this.containerInfo.add([
            this.composicaoRacao, this.imagemRacaoInfo, this.textoTipo, this.textoPorte, 
            this.textoIdade, this.textoChar1, this.textoChar2, this.textoTrigo, 
            this.textoCarne, this.textoOsso, this.textoGordura
        ]);

        // Adiciona a interatividade de clique e mouse para cada saco de ração instanciado
        this.racoesSuperPremium.forEach((racao) => {
            racao.sprite.setInteractive({ useHandCursor: true }).setScale(0.125);

            // Dá zoom leve no pacote de ração ao passar o mouse
            racao.sprite.on("pointerover", () => {
                this.tweens.add({ targets: racao.sprite, scale: 0.14, duration: 100, ease: "Power2" });
            });

            // Volta ao tamanho original
            racao.sprite.on("pointerout", () => {
                this.tweens.add({ targets: racao.sprite, scale: 0.125, duration: 100, ease: "Power2" });
            });

            // Ação principal: ao clicar no pacote de ração, mostra os dados dele
            racao.sprite.on("pointerup", () => {
                
                // Desaparece com a mensagem inicial de boas-vindas da tela
                this.tweens.add({
                    targets: this.containerTexto,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => this.containerTexto.setVisible(false)
                });

                // Atualiza os textos do painel de detalhes com os dados desta ração específica
                this.textoTipo.setText(racao.dados.tipo || "Premium");
                this.textoPorte.setText(racao.dados.porte || "-");
                this.textoIdade.setText(racao.dados.idade || "-");
                this.imagemRacaoInfo.setTexture(racao.sprite.texture.key);
                
                // Atualiza os dados de nutrientes caso eles existam no objeto
                if (racao.dados.nutrientes) {
                    this.textoTrigo.setText(racao.dados.nutrientes.trigo);
                    this.textoCarne.setText(racao.dados.nutrientes.carne);
                    this.textoOsso.setText(racao.dados.nutrientes.osso);
                    this.textoGordura.setText(racao.dados.nutrientes.gordura);
                }

                // Torna o container de informações visível e faz uma transição de transparência suave
                this.containerInfo.setVisible(true);
                this.tweens.add({ targets: this.containerInfo, alpha: 1, duration: 250 });
            });
        });

        // Função para manter o layout no lugar certo caso o jogador redimensione a aba do navegador
        const handleResizeRacao = (gameSize) => {
            const largura = gameSize.width;
            const altura = gameSize.height;

            // Ajusta a câmera, fundo e estante
            this.cameras.resize(largura, altura);
            this.fundo.setDisplaySize(largura, altura).setPosition(largura / 2, altura / 2);
            this.estante.setPosition(largura / 4, altura * 0.6);
            
            // Reposiciona os botões de categorias
            this.botaoStandard.setPosition(largura * 0.15, altura * 0.145);
            this.botaoSuperPremium.setPosition(largura * 0.35, altura * 0.15);
            
            // Reposiciona o painel direito e os containers de informação e compra
            this.fundoTemplateRacao.setPosition(largura * 0.58, altura * 0.47).setScale(altura * 0.00065);
            this.containerTexto.setPosition(this.fundoTemplateRacao.x, this.fundoTemplateRacao.y);
            this.containerInfo.setPosition(largura * 0.58, altura * 0.45).setScale(altura * 0.0009);
            this.botaoComprar.setPosition(largura * 0.58, altura * 0.70);
        };

        // Escuta o evento de resize do Phaser e chama a função de alinhamento
        this.scale.on("resize", handleResizeRacao);

        // Remove o evento de redimensionamento ao sair da cena para evitar erros de lentidão no jogo
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeRacao);
        });
    }
}