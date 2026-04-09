// Importação do estado global para persistência de dados (moedas, saúde, progresso)
// e controle global de áudio contínuo.
import { gameState, iniciarMusicaAleatoria } from "../main.js";

// Imports das lógicas orientadas a objetos do sistema de gerenciamento de pets.
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";

/**
 * @class cenaLazer
 * @extends Phaser.Scene
 * @description Classe responsável pela cena de "Lazer" ou quintal, onde o jogador 
 * interage de forma passiva com o pet atual, pode visualizar o estado dele (ex: pulgas) 
 * e acessar o minigame/atividade de lazer através de botões.
 */
export class cenaLazer extends Phaser.Scene {
    constructor() {
        // Define a chave identificadora desta cena para o gerenciador do Phaser
        super({ key: "cenaLazer" });
    }

    /**
     * @method create
     * @description Método do ciclo de vida do Phaser disparado na inicialização da cena.
     * Constrói os elementos visuais, a lógica de contêineres e a interface interativa.
     */
    create() {
        // Inicializa a cena HUD (que contém as barras de status e moedas) caso ela
        // não esteja rodando em paralelo, garantindo que o jogador sempre veja seus recursos.
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD");
        }
        // Força a HUD a ficar acima de todos os elementos desta cena atual
        this.scene.bringToTop("HUD");

        // Verifica a preferência do usuário no estado global antes de tocar a música
        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        // Define as dimensões e proporções baseadas na escala da tela para uso responsivo
        const largura = this.scale.width;
        const altura = this.scale.height;
        // Subtrai 20% da largura para criar uma área de foco descentralizada (útil para menus laterais da HUD)
        const posicaoX = largura - largura * 0.2;
        const posicaoY = altura;

        // Adiciona a imagem de fundo da cena, posicionando no centro e forçando o 
        // redimensionamento para cobrir as dimensões calculadas.
        this.fundo = this.add.image(posicaoX / 2, posicaoY / 2, "bgLazer")
            .setDisplaySize(posicaoX, posicaoY);
   
        // Instancia a classe gerenciadora que cuida das lógicas de atributos do pet
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        
        // Lógica condicional (ternário) para definir o índice do array do pet ativo no gameState
        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0);
        
        // Cria a sprite do pet na coordenada local (0,0) pois ele será atrelado a um Container
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);
        
        // Inicia a lista de elementos que serão agrupados logicamente
        const elementosContainer = [this.cachorro.sprite];

        // Configura a animação das pulgas apenas se ela ainda não existir no cache do Phaser
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 1,
                repeat: -1 // Loop infinito (-1)
            });
        }

        // Cria o sprite das pulgas, centraliza o pivô (origin) e aplica uma escala baseada na altura da tela
        this.pulgas = this.add.sprite(0, 0, "pulgas")
            .setOrigin(0.5)
            .setScale(posicaoY * 0.0015); 

        // Inicia a animação imediatamente
        this.pulgas.play("pulgaAnim");
        
        // Define se as pulgas aparecem ou não com base no status do gameState (booleano)
        this.pulgas.setVisible(gameState.pulga);

        // Adiciona as pulgas à lista de elementos do container
        elementosContainer.push(this.pulgas);

        // O Container é usado para tratar o pet e seus efeitos (pulgas) como uma única entidade.
        // Assim, se o container for movido ou redimensionado, o pet e as pulgas acompanham perfeitamente.
        this.containerCachorro = this.add.container(
            posicaoX / 1.95, 
            posicaoY / 1.5, 
            elementosContainer
        );

        // Escala global do container (afeta o cachorro e a pulga proporcionalmente)
        this.containerCachorro.setScale(posicaoY * 0.0006);
        
        // Ativação da física no sprite principal do cachorro (possivelmente para detectar colisões 
        // futuras com objetos de limpeza ou interações de mouse)
        this.physics.add.existing(this.cachorro.sprite);
        this.cachorro.sprite.body.setAllowGravity(false); // Impede que o pet caia da tela
        this.cachorro.sprite.body.immovable = true;       // Impede que impactos o empurrem

        // Cria o botão de ação principal desta cena e o torna interagível
        this.petiscoBtn = this.add.image(posicaoX / 1.2, posicaoY / 1.1, 'petisco');
        this.petiscoBtn.setScale(0.2); 
        this.petiscoBtn.setInteractive({ useHandCursor: true });

        // Evento de clique: Inicia a cena do minigame/atividade de lazer
        this.petiscoBtn.on('pointerdown', () => {
            this.scene.start('jogoLazer');
        });

        // Evento Hover: Aumenta o tamanho do botão para feedback visual ao usuário
        this.petiscoBtn.on('pointerover', () => {
            this.petiscoBtn.setScale(0.25); 
        });

        // Evento Out: Retorna o botão ao tamanho original quando o mouse sai de cima
        this.petiscoBtn.on('pointerout', () => {
            this.petiscoBtn.setScale(0.2); 
        });

        // Verifica o estado global para saber se é a primeira vez que o jogador acessa esta cena.
        // Se for, sobrepõe a tela de instruções.
        if (!gameState.instrucoesLazerVistas) {
            this.mostrarInstrucoes(posicaoX, posicaoY);
        }
    }
    
    /**
     * @method update
     * @description Método chamado a cada frame do jogo. Utilizado para "ouvir" 
     * mudanças dinâmicas no gameState enquanto o jogador está nesta cena.
     */
    update(){
        // Verifica se houve requisição em outra cena (ex: loja) para trocar de pet.
        // Se sim, invoca o gerenciador para recarregar as texturas e reseta a flag.
        if (gameState.trocar) {
            this.gerenciadorCachorros.mudarParaCachorroAtivo();
            gameState.trocar = false;
        }
        
        // Atualiza a visibilidade das pulgas a cada frame, garantindo que se o 
        // jogador aplicar um remédio (alterando gameState.pulga), a resposta seja imediata.
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga);
        }
    }

    /**
     * @method mostrarInstrucoes
     * @description Cria um overlay modal para explicar os controles da cena ao jogador.
     * @param {number} posicaoX - Largura util da tela para cálculo de centro
     * @param {number} posicaoY - Altura util da tela para cálculo de centro
     */
    mostrarInstrucoes(posicaoX, posicaoY) {
        // [NOVO] Atraso sutil para garantir que a cena atual passe por cima da HUD no Scene Manager
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaLazer");
        });

        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        // Cria uma camada escura semi-transparente para focar a atenção na caixa de instruções.
        // É definida como gigantesca (8000x8000) e interativa para bloquear cliques nos botões do jogo abaixo.
        const fundoEscuro = this.add.rectangle(centroX, centroY, 8000, 8000, 0x000000, 0.7)
            .setDepth(100)
            .setInteractive();

        // Imagem principal de instrução
        const telaInstrucao = this.add.image(centroX, centroY, 'instrucaoLazer')
            .setDepth(101)
            .setInteractive({ useHandCursor: true }); 

        // Lógica de escalonamento responsivo "contain" (manter aspecto):
        // Garante que a imagem de instrução ocupe no máximo 80% da tela menor sem distorcer.
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaX = limiteLargura / telaInstrucao.width;
        const escalaY = limiteAltura / telaInstrucao.height;
        const escalaFinal = Math.min(escalaX, escalaY); // Usa o menor fator para evitar cortes
        telaInstrucao.setScale(escalaFinal);

        /**
         * @function fecharInstrucoes
         * @description Callback disparado ao clicar na tela. Limpa (destroy) os objetos do modal 
         * para liberar memória, marca o tutorial como concluído e devolve a HUD para o topo.
         */
        const fecharInstrucoes = () => {
            fundoEscuro.destroy();
            telaInstrucao.destroy();
            // Flag de persistência para não exibir na próxima vez que acessar a cena
            gameState.instrucoesLazerVistas = true; 
            
            // [NOVO] Restaura a HUD como camada mais alta da interface após fechar o modal
            this.scene.bringToTop("HUD");
        };

        // Atrela a função de fechamento tanto ao clique na tela preta quanto na própria imagem
        fundoEscuro.on('pointerdown', fecharInstrucoes);
        telaInstrucao.on('pointerdown', fecharInstrucoes);
    }

    /** Exibe o popup de direcionamento para voltar à cena principal */
    exibirDirecaoJogadorVoltar() {
        // [NOVO] Garante que o popup fique por cima da HUD
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaLazer");
        });

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const fundoEscuro = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(200).setInteractive();
        const imgDirecao = this.add.image(cx, cy, "direcaoJogador")
            .setDepth(201).setInteractive({ useHandCursor: true });

        const escalaFinal = Math.min(
            (this.scale.width * 0.8) / imgDirecao.width,
            (this.scale.height * 0.8) / imgDirecao.height
        );
        imgDirecao.setScale(escalaFinal);

        const txtContinuar = this.add.text(cx, cy + (imgDirecao.displayHeight / 2) + 40, "[ Clique para Continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(202);

        this.tweens.add({ targets: txtContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const voltarCena = () => {
            // [NOVO] Devolve o topo para a HUD antes de transicionar de cena
            this.scene.bringToTop("HUD");
            this.scene.start("cenaPrincipal");
        };
        
        fundoEscuro.on('pointerdown', voltarCena);
        imgDirecao.on('pointerdown', voltarCena);
    }
}