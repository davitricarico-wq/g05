// Importa o estado global do jogo (para leitura/gravação de progresso) 
// e o gerenciador de áudio.
import { gameState, iniciarMusica } from "../main.js"
// Importa as dependências responsáveis pela lógica de criação, 
// dados e gerenciamento visual dos cachorros.
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js"
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js"
// Importa a cena de Popups (que atuará como um overlay/camada superior).
import { CenaPopups } from "../componentes/popups.js"

/**
 * @class cenaPrincipal
 * @extends Phaser.Scene
 * @description Cena central do jogo. Responsável por renderizar o cenário 
 * principal, o personagem (cachorro), os efeitos (pulgas) e orquestrar 
 * a chamada das outras cenas paralelas (HUD e Popups).
 */
export class cenaPrincipal extends Phaser.Scene {
    constructor() {
        super({ key: "cenaPrincipal" })
    }

    create() {
        // Inicia a interface de status (HUD) em paralelo, caso não esteja rodando.
        // O HUD contém os botões e barras de progresso que ficam por cima do jogo.
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD")
        }
        // Garante que o HUD fique na frente do cenário principal
        this.scene.bringToTop("HUD")

        // Toca a música de fundo caso a configuração global permita
        if (gameState.musicaLigada) {
            iniciarMusica(this, 'menuPrincipal', true);
        }

        // Registra a CenaPopups no gerenciador do Phaser se ela ainda não existir
        if (!this.scene.get("CenaPopups")) {
            this.scene.add("CenaPopups", CenaPopups, false);
        }
        
        // Verifica o estado global para saber se algum popup precisa abrir imediatamente
        // (ex: tela de evolução, instruções da primeira vez ou o quiz educativo)
        if (gameState.aguardandoEvolucao || !gameState.instrucaoMissaoVista || gameState.exibirQuiz) {
            if (!this.scene.isActive("CenaPopups")) {
                this.scene.launch("CenaPopups");
            }
            // Traz os popups para a camada mais alta, cobrindo o HUD e a cena Principal
            this.scene.bringToTop("CenaPopups");
        }

        // CONFIGURAÇÃO DO CENÁRIO E ÁREA ÚTIL
        const larguraTotal = this.scale.width;
        const alturaTotal = this.scale.height;
        
        // Define que o cenário principal ocupará apenas 80% da tela (da esquerda para a direita).
        // Os 20% restantes possivelmente são reservados para uma barra lateral no HUD.
        const areaUtilLargura = larguraTotal * 0.8; 

        // Adiciona o background centralizado na área útil definida
        this.bg = this.add
            .image(areaUtilLargura / 2, alturaTotal / 2, "bgPrincipal")
            .setDisplaySize(areaUtilLargura, alturaTotal)
            // .setDepth(-1) joga o fundo lá para trás, garantindo que nada fique escondido por ele
            .setDepth(-1);
        
        // Inicializa o gerenciador responsável por desenhar o cachorro
        this.gerenciadorCachorros = new GerenciadorCachorros(this)
        
        // Define qual cachorro renderizar com base no progresso salvo no estado global
        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0)
        
        // As coordenadas (0, 0) são usadas aqui porque o cachorro será colocado dentro de um Container
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo])

        // Cria a animação visual das pulgas pulando, se ela ainda não existir na memória do Phaser
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 2,   // 2 quadros por segundo (movimento lento/perceptível)
                repeat: -1      // Loop infinito
            })
        }

        // Adiciona o sprite das pulgas
        this.pulgas = this.add.sprite(0, 0, "pulgas")
            .setOrigin(0.5)
            .setScale(alturaTotal * 0.0015) // Escala proporcional à altura da tela
            .play("pulgaAnim")
            .setVisible(gameState.pulga);   // Só aparece se a variável global permitir

        // Agrupa o cachorro e as pulgas em um Container.
        // Vantagem: Quando movermos ou redimensionarmos o container, o cachorro e as 
        // pulgas se moverão juntos automaticamente, mantendo o alinhamento relativo.
        this.containerCachorro = this.add.container(areaUtilLargura / 2, alturaTotal * 0.7, [
            this.cachorro.sprite, 
            this.pulgas
        ]);

        // Aplica a escala base ao container como um todo
        const escalaBase = alturaTotal * 0.0006;
        this.containerCachorro.setScale(escalaBase);

        // RESPONSIVIDADE (RESIZE HANDLER)        
        const handleResizePrincipal = () => {
            // Trava de segurança: interrompe se a cena já foi destruída ou está inativa
            if (!this.scene.isActive() || !this.cameras || !this.cameras.main) return;

            const novaLargura = this.scale.width;
            const novaAltura = this.scale.height;
            const novaAreaUtilLargura = novaLargura * 0.8; // Recalcula os 80% úteis
            const novoCentroX = novaAreaUtilLargura / 2;
            const novoCentroY = novaAltura / 2;

            // Ajusta posição e tamanho do cenário
            if (this.bg) {
                this.bg.setPosition(novoCentroX, novoCentroY).setDisplaySize(novaAreaUtilLargura, novaAltura);
            }

            // Ajusta proporção e posição do Container do personagem
            if (this.containerCachorro) {
                const novaEscala = novaAltura * 0.0006;
                // Mantém o personagem na posição Y relativa a 70% da altura da tela (alturaTotal * 0.7)
                this.containerCachorro.setPosition(novoCentroX, novaAltura * 0.7).setScale(novaEscala);
            }
        };

        // Escuta o evento de redimensionamento da janela
        this.scale.on("resize", handleResizePrincipal);
        
        // Remove o evento quando a cena for encerrada para evitar vazamento de memória (memory leak)
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizePrincipal);
        });

        // CONFIGURAÇÕES DA CÂMERA        
        this.cameras.main.setBounds(0, 0, larguraTotal, alturaTotal);
        // Aplica um efeito de fade in (tela preta clareando) de 200 milissegundos
        this.cameras.main.fadeIn(200, 0, 0, 0);
    }

    /**
     * @method update
     * @description Loop principal do jogo. Roda a cada quadro (frame) gerado pela engine.
     */
    update() {
        // Checa constantemente se as missões do cachorro atual foram cumpridas
        // (por exemplo: barras de fome, higiene, etc. estão cheias)
        if (this.gerenciadorCachorros) {
            this.gerenciadorCachorros.verificarCompletude()
        }
        
        // Sincroniza em tempo real a visibilidade das pulgas com o estado global.
        // Se o jogador curou as pulgas pelo HUD, elas desaparecem instantaneamente aqui.
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga)
        }
    }
}