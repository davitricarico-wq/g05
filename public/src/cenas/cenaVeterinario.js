// Importa o estado global do jogo (para persistência e controle da lupa) 
// e o utilitário de áudio.
import { gameState, iniciarMusicaAleatoria } from "../main.js";

// Importa os módulos de gerenciamento orientado a objetos do cachorro
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";

/**
 * @class cenaVeterinario
 * @extends Phaser.Scene
 * @description Classe responsável pelo minigame de inspeção veterinária. 
 * O jogador utiliza uma lupa interativa (drag and drop) para procurar 
 * pulgas escondidas no cachorro. Serve como transição para a cena de cuidados.
 */
export class cenaVeterinario extends Phaser.Scene {
    constructor() {
        // Define a chave identificadora da cena para o Phaser
        super({ key: "cenaVeterinario" });
        
        // Flag para travar interações extras após o jogador encontrar a pulga
        this.achouPulga = false;
        // Flag visual para saber se o usuário está segurando a lupa no momento
        this.lupaSendoArrastada = false;
        // Escala base da lupa, guardada na classe para recalcular em redimensionamentos
        this.escalaLupaBase = 0.8;
    }

    /**
     * @method create
     * @description Inicializa os elementos visuais, a física de arraste (drag),
     * a UI e os cálculos de colisão/distância do minigame.
     */
    create() {
        // Verifica se o jogador já cumpriu esse minigame antes (persistência).
        // Se já usou, a cena pode se comportar de forma diferente (ex: lupa inativa).
        this.achouPulga = gameState.lupaJaUsada || false;
        this.lupaSendoArrastada = false;

        // Garante que a HUD (moedas, status) esteja visível e sempre no topo da tela
        if (!this.scene.isActive("HUD")) this.scene.launch("HUD");
        this.scene.bringToTop("HUD");

        // Inicia a música temática caso a configuração global permita
        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        const larguraTotal = this.scale.width;
        const alturaTotal = this.scale.height;
        // Define que a área útil de jogo ocupará 80% da tela (deixando espaço livre possivelmente para a HUD)
        const areaUtilLargura = larguraTotal * 0.8; 

        // Adiciona o background centralizado na área útil e o empurra para o fundo (Depth -1)
        this.fundo = this.add.image(areaUtilLargura / 2, alturaTotal / 2, "bgVeterinario")
            .setDisplaySize(areaUtilLargura, alturaTotal)
            .setDepth(-1);

        // Instancia o controlador do pet
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        
        // Descobre qual cachorro o jogador está usando atualmente
        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0);
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);

        // Ativa a física no pet apenas para leitura de coordenadas/colisão estática
        this.physics.add.existing(this.cachorro.sprite);
        this.cachorro.sprite.body.setAllowGravity(false);
        this.cachorro.sprite.body.immovable = true;

        // Cria a animação das pulgas em loop contínuo, caso não exista no cache
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 1,  
                repeat: -1     
            });
        }

        // Inicializa as pulgas na posição (0,0) relativas ao container futuro
        this.pulgas = this.add.sprite(0, 0, "pulgas")
            .setOrigin(0.5)
            .play("pulgaAnim")
            .setVisible(gameState.pulga);

        // Agrupa o cachorro e suas pulgas em um contêiner para manipulação unificada
        this.containerCachorro = this.add.container(areaUtilLargura / 2, alturaTotal * 0.5, [
            this.cachorro.sprite, 
            this.pulgas
        ]);
        // Escala dinâmica do contêiner baseada na altura da tela
        this.containerCachorro.setScale(alturaTotal * 0.0006);

        // Sprite da "Pulga Gigante". Ela começa invisível e só aparece 
        // fazendo uma animação de zoom quando o jogador encontra as pulgas originais.
        this.pulgaAlvo = this.add.image(0, 0, "pulga1")
            .setScale(0.1)
            .setDepth(15) // Mantém bem à frente da tela
            .setVisible(false);

        // Define a escala inicial matemática da lupa para responsividade
        this.escalaLupaBase = alturaTotal * 0.0012;
        
        // Cria o objeto da Lupa na parte inferior da tela
        this.lupa = this.add.image(areaUtilLargura * 0.5, alturaTotal * 0.85, "lupa")
            .setOrigin(0.5)
            .setDepth(10)
            .setScale(this.escalaLupaBase);

        // Texto dinâmico de feedback que "flutua" acima da lupa
        this.textoLupa = this.add.text(this.lupa.x, this.lupa.y - 70, "Procure as pulgas!", {
            fontFamily: '"Press Start 2P", Arial', // Fonte pixel-art com fallback para Arial
            fontSize: "14px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(11).setVisible(false);

        // Se o minigame ainda não foi concluído, torna a lupa arrastável.
        if (!gameState.lupaJaUsada) {
            this.lupa.setInteractive({ useHandCursor: true });
            this.input.setDraggable(this.lupa); // Habilita o plugin de arrasto do Phaser
        } else {
            // Se já foi usada, deixa a lupa meio transparente (feedback visual de inatividade)
            this.lupa.setAlpha(0.5);
        }

        // Evento: Ao começar a arrastar a lupa
        this.lupa.on('dragstart', () => {
            if (this.achouPulga) return; // Trava de segurança
            this.lupaSendoArrastada = true;
            this.lupa.setScale(this.escalaLupaBase * 1.15); // Efeito de aumento (Feedback táctil visual)
            this.textoLupa.setVisible(true); // Exibe a dica
        });

        // Evento: Durante o arraste da lupa
        this.lupa.on('drag', (pointer, dragX, dragY) => {
            if (this.achouPulga) return;
            
            // Atualiza as coordenadas da lupa para a posição do mouse/dedo
            this.lupa.x = dragX;
            this.lupa.y = dragY;
            
            // Faz o texto perseguir a lupa mantendo um offset (-70 pixels em Y)
            this.textoLupa.setPosition(dragX, dragY - 70);

            // Lógica de Condição de Vitória:
            // Calcula a distância euclidiana entre a Lupa e o Container do Cachorro
            const distancia = Phaser.Math.Distance.Between(
                this.lupa.x, this.lupa.y,
                this.containerCachorro.x, this.containerCachorro.y
            );

            // Se o raio de distância for menor que 150px, o jogador encontrou as pulgas!
            if (distancia < 150) {
                this.darZoomNaPulga();
            }
        });

        // Evento: Ao soltar o clique/toque
        this.lupa.on('dragend', () => {
            if (this.achouPulga) return;
            this.lupaSendoArrastada = false;
            this.lupa.setScale(this.escalaLupaBase); // Devolve a lupa ao tamanho normal
            this.textoLupa.setVisible(false);        // Esconde a dica
        });

        /**
         * @callback handleResize
         * @description Realinha e reescala o cenário, container e a lupa dinamicamente.
         */
        const handleResize = (tamanhoTela) => {
            const larguraTotal = tamanhoTela.width;
            const alturaTotal = tamanhoTela.height;
            const areaUtil = larguraTotal * 0.8; 

            if (this.fundo) this.fundo.setPosition(areaUtil / 2, alturaTotal / 2).setDisplaySize(areaUtil, alturaTotal);
            if (this.containerCachorro) this.containerCachorro.setPosition(areaUtil / 2, alturaTotal * 0.5).setScale(alturaTotal * 0.0006);
            
            // Só recalcula e reposiciona a lupa se ela não estiver na mão do jogador (arrastada)
            if (this.lupa && !this.lupaSendoArrastada) {
                this.escalaLupaBase = alturaTotal * 0.0012;
                this.lupa.setPosition(areaUtil * 0.5, alturaTotal * 0.85).setScale(this.escalaLupaBase);
            }
        };

        this.scale.on("resize", handleResize);
        
        // Limpa o evento de resize para evitar vazamento de memória (Memory Leak)
        this.events.on('shutdown', () => this.scale.off("resize", handleResize));

        // Inicia a modal de tutorial caso seja a primeira vez na cena
        if (!gameState.instrucoesPulgasVistas) {
            this.mostrarInstrucoes();
        }
    }

    /**
     * @method darZoomNaPulga
     * @description Função disparada quando a condição de vitória do minigame é atingida.
     * Trava as interações, faz a animação do monstro (pulga) pulando na tela e exibe direcionamento.
     */
    darZoomNaPulga() {
        if (this.achouPulga) return;

        // Trava estado para evitar duplicação de animação
        this.achouPulga = true;
        this.lupaSendoArrastada = false;
        this.textoLupa.setVisible(false);

        // Prepara e posiciona a pulga gigante no exato local em que a lupa parou
        this.pulgaAlvo.setVisible(true);
        this.pulgaAlvo.setPosition(this.lupa.x, this.lupa.y);

        // Cria uma animação suave (Tween) na pulga para dar um 'Jumpscare' leve e cômico
        this.tweens.add({
            targets: this.pulgaAlvo,
            scale: 1.5,
            duration: 600,
            ease: 'Back.easeOut', // Efeito elástico ao crescer
            onComplete: () => {
                // Após a animação, aguarda 1.5 segundos e exibe direcionamento
                this.time.delayedCall(1500, () => {
                    gameState.cachorroTemPulga = true; // Atualiza a flag global
                    this.scene.start("cenaCuidado");
                });
            }
        });
    }

    /** Exibe o popup de direcionamento para ir ao cuidado do pet */
    exibirDirecaoJogador() {
        // [NOVO] Garante que a cena atual fique por cima da HUD no Scene Manager
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaVeterinario");
        });

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const fundoEscuro = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(200).setScrollFactor(0).setInteractive();
        const imgDirecao = this.add.image(cx, cy, "direcaoJogador")
            .setDepth(201).setScrollFactor(0).setInteractive({ useHandCursor: true });

        const escalaFinal = Math.min(
            (this.scale.width * 0.8) / imgDirecao.width,
            (this.scale.height * 0.8) / imgDirecao.height
        );
        imgDirecao.setScale(escalaFinal);

        const txtContinuar = this.add.text(cx, cy + (imgDirecao.displayHeight / 2) + 40, "[ Clique para Continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

        this.tweens.add({ targets: txtContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const proximaCena = () => {
            // [NOVO] Devolve o topo para a HUD antes de transicionar de cena
            this.scene.bringToTop("HUD");
            this.scene.start("cenaCuidado");
        };

        fundoEscuro.on('pointerdown', proximaCena);
        imgDirecao.on('pointerdown', proximaCena);
    }

    /**
     * @method update
     * @description Ciclo de atualização de frame (Game Loop). Repassa o delta time 
     * para o componente do pet e escuta alterações dinâmicas de estado.
     */
    update(time, delta) {
        if (this.cachorro?.update) this.cachorro.update(time, delta);
        
        // Atualiza em tempo real se as pulgas pequenas devem ser exibidas 
        if (this.pulgas) this.pulgas.setVisible(gameState.pulga);
    }

    /**
     * @method mostrarInstrucoes
     * @description Renderiza o overlay (modal) explicativo das regras do minigame.
     * Inclui um texto piscante (feedback visual) e suporta fechamento por clique ou teclado.
     */
    mostrarInstrucoes() {
        // [NOVO] Atraso sutil para garantir que a cena atual passe por cima da HUD no Scene Manager
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaVeterinario");
        });

        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        // Máscara escura para focar a atenção na imagem de tutorial
        const fundoEscuro = this.add.rectangle(centroX, centroY, this.scale.width, this.scale.height, 0x000000, 0.85)
            .setDepth(100).setInteractive(); // Bloqueia cliques fora

        const telaInstrucao = this.add.image(centroX, centroY, "instrucaoPulgas")
            .setDepth(101).setInteractive({ useHandCursor: true }); 

        // Escala responsável ("contain") que impede a imagem de sair dos limites da tela
        const escalaFinal = Math.min((this.scale.width * 0.8) / telaInstrucao.width, (this.scale.height * 0.8) / telaInstrucao.height);
        telaInstrucao.setScale(escalaFinal);

        // Texto de Call-to-Action (CTA) ensinando como sair do menu
        const textoIniciar = this.add.text(centroX, centroY + (telaInstrucao.displayHeight / 2) + 40, "[ Clique ou ESPAÇO para começar ]", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "15px",
            color: "#ffffff"
        }).setOrigin(0.5).setDepth(101);
        
        // Faz o texto piscar suavemente mudando o Alpha entre 0.5 e 1.0
        this.tweens.add({ targets: textoIniciar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        // Controle para evitar que o fechamento ocorra duas vezes (ex: clique + espaço acidental)
        let instrucoesLidas = false;
        
        const fecharInstrucoes = () => {
            if (instrucoesLidas) return;
            instrucoesLidas = true;
            
            // Destrói os objetos de tutorial liberando memória
            fundoEscuro.destroy();
            telaInstrucao.destroy();
            textoIniciar.destroy();
            
            // Atualiza a flag global para não abrir novamente nesta sessão
            gameState.instrucoesPulgasVistas = true; 
            
            // [MANTIDO] Garante que a HUD volte a reinar no topo
            this.scene.bringToTop("HUD");
        };

        // Permite fechar clicando na máscara ou na imagem
        fundoEscuro.on('pointerdown', fecharInstrucoes);
        telaInstrucao.on('pointerdown', fecharInstrucoes);
        
        // Um pequeno delay garante que o jogador não feche a tela instantaneamente por um clique não intencional ao carregar.
        // Adiciona atalho para fechamento com a barra de espaço (acessibilidade).
        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', fecharInstrucoes);
        });
    }
}