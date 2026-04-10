// Importa o gerenciador responsável pela lógica e criação dos sprites dos pets
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";
// Importa as configurações base (raças, atributos) dos cachorros
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";
// Importa o objeto de estado global para persistência de dados entre cenas e a função de música
import { gameState, iniciarMusicaAleatoria } from "../main.js";

/**
 * @class cenaComida
 * @extends Phaser.Scene
 * @description Cena que gerencia a área de alimentação, ficha técnica do pet e o fluxo de tutorial inicial.
 * Lida com profundidade de camadas (z-index) para destacar elementos e usa redimensionamento dinâmico.
 */
export class cenaComida extends Phaser.Scene {
    
    constructor() {
        // Inicializa a cena com a chave (nome) "cenaComida", usada para chamar esta cena no jogo
        super({ key: "cenaComida" });
        
        /** @type {boolean} Controla o estado de transição para evitar que múltiplos cliques causem bugs */
        this.transicao = false;
    }

    /**
     * @method create
     * @description Executado uma vez quando a cena inicia. Configura os objetos visuais, áudio, inputs e eventos.
     */
    create() {
        // Reseta o estado de transição sempre que a cena for recriada
        this.transicao = false;

        // Verifica se a cena HUD não está ativa. Se não estiver, inicia a HUD.
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD");
        } 
        // Se a HUD estiver "dormindo" (pausada), acorda ela
        else if (this.scene.isSleeping("HUD")) {
            this.scene.wake("HUD");
        }
        // Garante que a HUD fique sempre acima da cena de comida
        this.scene.bringToTop("HUD");

        // Se a configuração global de música estiver ativada, toca uma música aleatória
        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        // Reserva 20% da largura da tela para a HUD lateral. Os elementos do jogo usarão os 80% restantes.
        const areaUtilX = (this.scale.width - this.scale.width * 0.2);
        const areaUtilY = this.scale.height;

        /**
         * @function passarPressionarEfeito
         * @description Função auxiliar interna. Cria animações (Tweens) de feedback visual quando o mouse
         * passa por cima (hover) ou clica no objeto.
         * @param {Phaser.GameObjects.GameObject} alvo - O objeto interativo na tela (ex: estante, tigela).
         * @param {number} escalaNormal - Tamanho padrão do objeto.
         * @param {number} escalaPassar - Tamanho expandido quando o mouse está por cima.
         */
        const passarPressionarEfeito = (alvo, escalaNormal, escalaPassar) => {
            // Remove eventos antigos para não acumular
            alvo.removeAllListeners();

            // Evento: Mouse entra no objeto (aumenta a escala)
            alvo.on("pointerover", () => {
                this.tweens.add({ targets: alvo, scaleX: escalaPassar, scaleY: escalaPassar, duration: 200 });
            });

            // Evento: Mouse clica no objeto (dá uma leve encolhida e volta, efeito 'yoyo')
            alvo.on("pointerdown", () => {
                this.tweens.add({ targets: alvo, scaleX: escalaNormal * 0.9, scaleY: escalaNormal * 0.9, duration: 150, yoyo: true });
            });

            // Evento: Mouse sai do objeto (retorna à escala original)
            alvo.on("pointerout", () => {
                this.tweens.add({ targets: alvo, scaleX: escalaNormal, scaleY: escalaNormal, duration: 200 });
            });
        };
        
        // Fundo (Background) da cena. Posicionado no centro da área útil. Depth -1 coloca no fundo de tudo.
        this.fundo = this.add.image(areaUtilX / 2, areaUtilY / 2, "bgRacao")
            .setDisplaySize(areaUtilX, areaUtilY)
            .setDepth(-1);

        // Estante: Ponto clicável para iniciar o minigame de escolher a ração.
        this.estante = this.add.image(areaUtilX * 0.25, areaUtilY * 0.68, "estanteRacao")
            .setScale(areaUtilY * 0.0006)
            .setInteractive({ useHandCursor: true }); // Transforma o cursor em "mãozinha"
        
        // Salva a profundidade original para restaurar depois do tutorial, e aplica o efeito visual de hover
        this.profundidadeOriginalEstante = this.estante.depth;
        passarPressionarEfeito(this.estante, this.estante.scaleX, this.estante.scaleX * 1.1);

        // Evento de clique na estante
        this.estante.on("pointerdown", () => {
            // TRAVA DE SEGURANÇA: Impede que o jogador clique na estante se a ficha do pet estiver aberta!
            if (this.scene.isActive('ficha')) return; 

            // Limpa overlays do tutorial (se existirem) e navega para a cena do minigame
            this.encerrarTutorialEstante();
            this.navegarParaEstante();
        });

        // Ficha (Bilhete): Botão para acessar a ficha técnica com atributos do pet
        gameState.bilhete = this.add.image(this.scale.width * 0.7, areaUtilY * 0.25, 'mineFicha')
            .setScale(0.15)
            .setInteractive({ useHandCursor: true })
            .setDepth(10); // Coloca à frente de elementos comuns do cenário
        
        // Salva profundidade e aplica o efeito de botão
        this.profundidadeOriginalBilhete = gameState.bilhete.depth;
        passarPressionarEfeito(gameState.bilhete, 0.15, 0.18);

        // Ao clicar no bilhete, chama a função para abrir a ficha do pet
        gameState.bilhete.on('pointerdown', () => this.abrirFichaDetatilhada());

        // Tigela de Ração Vazia (decorativa interativa que inicia a chuva de petiscos)
        this.racaoVazia = this.add.image((areaUtilX / 2) + (areaUtilX / 2) * 0.1, areaUtilY / 2 + areaUtilY * 0.4, "racaoVazia")
            .setScale(areaUtilY * 0.0002)
            .setInteractive({ useHandCursor: true });

        passarPressionarEfeito(this.racaoVazia, this.racaoVazia.scaleX, this.racaoVazia.scaleX * 1.1);

        // Dispara o efeito de partículas (chuva de petiscos) ao clicar na tigela
        this.racaoVazia.on("pointerdown", () => {
            // TRAVA DE SEGURANÇA: Não faz chover se a ficha do pet estiver aberta na tela
            if (this.scene.isActive('ficha')) return; 

            this.fazerChoverPetiscos();
        });

        // Configura o gerenciador de cachorros e cria o sprite do cachorro ativo baseado no estado global (gameState)
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        // Lógica ternária para descobrir qual cachorro está ativo no estado global (João=2, Herói=1, Padrão=0)
        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0);
        // Cria o sprite do cachorro
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);

        // Cria e configura a animação da pulga (indicador de estado negativo)
        this.configurarAnimacaoPulgas();
        this.pulgas = this.add.sprite(0, 0, "pulgas").setOrigin(0.5).setScale(areaUtilY * 0.0015);
        this.pulgas.play("pulgaAnim");
        // A visibilidade depende do status do pet (gameState.pulga)
        this.pulgas.setVisible(gameState.pulga);

        // Agrupa o cachorro e as pulgas num "Container". 
        // Isso permite mover e escalar o cachorro e as pulgas juntos com um único comando.
        this.containerCachorro = this.add.container(
            (areaUtilX / 2) + (areaUtilX / 2) * 0.4, 
            (areaUtilY / 2) + (areaUtilY / 2) * 0.25, 
            [this.cachorro.sprite, this.pulgas]
        ).setScale(areaUtilY * 0.0007);

        // Inicia as verificações de tutorial/onboarding da cena
        this.gerenciarTutorialInicial(areaUtilX, areaUtilY);

        // Cria um listener que escuta redimensionamento da janela do navegador (resize)
        const handleResize = () => this.ajustarElementosParaNovaTela();
        this.scale.on("resize", handleResize);
        
        // Limpa o evento de redimensionamento caso a cena seja fechada, evitando vazamento de memória (Memory Leak)
        this.events.on('shutdown', () => this.scale.off("resize", handleResize));
    }

    /**
     * @method update
     * @description Executado continuamente a cada frame (ex: 60 vezes por segundo).
     */
    update() {
        // Atualiza constantemente se o cachorro tem pulgas
        if (this.pulgas) this.pulgas.setVisible(gameState.pulga);
        
        // Verifica se houve requisição no estado global para trocar o skin/sprite do cachorro
        if (gameState.trocar) {
            this.gerenciadorCachorros.mudarParaCachorroAtivo();
            gameState.trocar = false; // Desliga a flag após trocar
        }
    }

    /**
     * @method fazerChoverPetiscos
     * @description Cria um efeito visual (Particle Emitter) de petiscos caindo do topo da tela.
     */
    fazerChoverPetiscos() {
        // Configuração do emissor de partículas no Phaser 3
        const emitter = this.add.particles(0, 0, 'petisco', {
            x: { min: 0, max: this.scale.width }, // Spawna os petiscos ao longo de toda a largura da tela
            y: -50, // Spawna um pouco acima da tela (escondido antes de cair)
            speedY: { min: 400, max: 800 }, // Velocidade de queda vertical
            speedX: { min: -100, max: 100 }, // Leve desvio lateral para a direita ou esquerda
            rotate: { min: 0, max: 360 }, // Faz girar enquanto cai
            scale: { start: 0.1, end: 0.1 }, // Tamanho fixo da partícula
            lifespan: 2000, // Tempo de vida de cada partícula em milissegundos (2 segundos)
            quantity: 8, // Quantidade de partículas geradas a cada disparo
            frequency: 50 // Um disparo a cada 50 milissegundos
        });

        emitter.setDepth(5); // Coloca as partículas numa camada média (acima do fundo, atrás da HUD)

        // Após 10 segundos (10000 ms), interrompe o gerador de partículas
        this.time.delayedCall(10000, () => {
            emitter.stop();
        });
    }

    /** * @method abrirFichaDetatilhada
     * @description Gerencia o abrir e fechar (Toggle) da cena de Ficha Técnica do pet.
     * @private
     */
    abrirFichaDetatilhada() {
        // LÓGICA DE TOGGLE: Se a ficha estiver aberta, ao clicar no bilhete ela fecha e sai da função.
        if (this.scene.isActive('ficha')) {
            this.scene.stop('ficha');
            return; 
        }

        // Se a tela estiver escura (tutorial pedindo para clicar na ficha)
        if (this.overlayFicha) {
            // Destrói apenas o TEXTO piscante pedindo para clicar
            if (this.txtCliqueFicha) {
                this.txtCliqueFicha.destroy();
                this.txtCliqueFicha = null;
            }
            // Marca no estado global que o jogador já aprendeu sobre a ficha
            gameState.enfaseFichaVista = true; 
            // NOTA: A tela preta (overlay) e a HUD NÃO são liberadas aqui. 
            // Ficam travadas de propósito até a ficha ser realmente fechada.
        }

        // Lança a cena da ficha em paralelo (não fecha a cena atual) e traz ela para a camada mais alta
        this.scene.launch('ficha');
        this.scene.bringToTop('ficha');

        const cenaFicha = this.scene.manager.getScene('ficha');
        
        // Evento: ISSO SÓ RODA QUANDO A FICHA FOR FECHADA (shutdown ou sleep)
        const finalizarFicha = () => {
            // Remove a tela preta bloqueadora do tutorial (se existia)
            if (this.overlayFicha) {
                this.overlayFicha.destroy();
                this.overlayFicha = null;
            }
            // Remove resquícios de texto do tutorial
            if (this.txtCliqueFicha) {
                this.txtCliqueFicha.destroy();
                this.txtCliqueFicha = null;
            }
            
            // Retorna o ícone do bilhete à sua profundidade normal
            gameState.bilhete.setDepth(this.profundidadeOriginalBilhete);
            
            // Descongela a HUD do jogo, permitindo ao jogador clicar nos botões do sistema
            this.scene.resume("HUD"); 
            this.scene.bringToTop("HUD");
            
            // Se o jogador ainda não viu o tutorial da estante, dispara ele agora
            if (!gameState.enfaseEstanteVista) {
                this.destacarEstante();
            }
        };
        
        // Registra os ouvintes (listeners) que aguardam a cena da ficha ser encerrada
        cenaFicha.events.once('shutdown', finalizarFicha);
        cenaFicha.events.once('sleep', finalizarFicha);
    }

    /** * @method configurarAnimacaoPulgas
     * @description Garante que a animação cíclica das pulgas esteja registrada no cache global do Phaser.
     */
    configurarAnimacaoPulgas() {
        // Checa se a animação já foi criada antes. Evita erros de duplicação.
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                // Usa os frames 0 e 1 do sprite sheet "pulgas"
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 1, // Alterna os frames 1 vez por segundo
                repeat: -1    // -1 significa loop infinito
            });
        }
    }

    /** * @method encerrarTutorialEstante
     * @description Limpa os escurecimentos de tela e textos do tutorial da estante antes de navegar.
     */
    encerrarTutorialEstante() {
        if (this.overlayEstante) {
            this.overlayEstante.destroy(); // Destroi fundo preto
            if (this.txtCliqueEstante) this.txtCliqueEstante.destroy(); // Destrói texto piscante
            
            // Volta a estante para o Depth normal
            this.estante.setDepth(this.profundidadeOriginalEstante);
            
            // Marca o tutorial como visto para não repetir futuramente
            gameState.enfaseEstanteVista = true; 
            
            // Libera a HUD
            this.scene.resume("HUD"); 
            this.scene.bringToTop("HUD");
        }
    }

    /** * @method navegarParaEstante
     * @description Navega para o minigame, utilizando transição suave se a cena HUD possuir esse método.
     */
    navegarParaEstante() {
        const cenaHUD = this.scene.manager.getScene("HUD");
        // Verifica se a HUD tem a função de transição customizada
        if (cenaHUD && cenaHUD.transicionarPara) {
            cenaHUD.transicionarPara("cenaEstanteRacao");
        } else {
            // Fallback direto, caso a HUD não tenha o método
            this.scene.start("cenaEstanteRacao");
        }
    }

    /** * @method gerenciarTutorialInicial
     * @description Orquestra (controla a ordem) a exibição dos tutoriais da cena para o jogador iniciante.
     * @param {number} areaX - Área horizontal útil
     * @param {number} areaY - Área vertical útil
     * @private
     */
    gerenciarTutorialInicial(areaX, areaY) {
        // A lógica de if/else garante que apenas um tutorial seja mostrado por vez, respeitando a ordem.
        if (!gameState.instrucaoRacaoVista) {
            this.mostrarInstrucaoRacao(areaX, areaY);
        } else if (!gameState.enfaseFichaVista) {
            this.destacarFicha();
        } else if (!gameState.enfaseEstanteVista) { 
            this.destacarEstante();
        }
    }

    /** * @method ajustarElementosParaNovaTela
     * @description Responsável por reposicionar e redimensionar tudo dinamicamente caso a janela mude de tamanho.
     */
    ajustarElementosParaNovaTela() {
        // Se a cena não estiver ativa ou a câmera estiver indisponível, cancela para não dar erro
        if (!this.scene.isActive() || !this.cameras.main) return;

        // Recalcula as áreas baseando-se na nova largura e altura
        const novaAreaX = (this.scale.width - this.scale.width * 0.2);
        const novaAreaY = this.scale.height;
        const centroX = novaAreaX / 2;
        const centroY = novaAreaY / 2;

        // Atualiza a posição e escala dos elementos de cenário com base no novo centro matemático
        this.fundo.setPosition(centroX, centroY).setDisplaySize(novaAreaX, novaAreaY);
        this.estante.setPosition(novaAreaX * 0.25, novaAreaY * 0.68).setScale(novaAreaY * 0.0006);
        gameState.bilhete.setPosition(this.scale.width * 0.7, novaAreaY * 0.25);
        this.racaoVazia.setPosition(centroX + centroX * 0.1, centroY + novaAreaY * 0.4).setScale(novaAreaY * 0.0002);
        
        // Atualiza o container inteiro do cachorro de uma vez
        this.containerCachorro.setPosition(centroX + centroX * 0.4, centroY + centroY * 0.25).setScale(novaAreaY * 0.0007);
        this.pulgas.setScale(novaAreaY * 0.0015);

        // Verifica os retângulos escuros (Overlays de Tutorial). Se estiverem na tela, também precisam ser redimensionados
        [this.fundoEscuroInstrucao, this.overlayFicha, this.overlayEstante].forEach(ov => {
            if(ov && ov.active) ov.setSize(this.scale.width, this.scale.height).setPosition(this.scale.width/2, this.scale.height/2);
        });
    }

    /** * @method mostrarInstrucaoRacao
     * @description Exibe a imagem gráfica ensinando o básico da cena de alimentação.
     */
    mostrarInstrucaoRacao() {
        // Delay de 50ms para garantir que tudo foi renderizado antes de trazer a cena de tutorial para cima
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaComida");
        });

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // Cria fundo preto com 70% de transparência (0.7). Depth 9999 garante que fica acima do cenário.
        this.fundoEscuroInstrucao = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.7).setDepth(9999).setInteractive(); 
        // Imagem de instrução
        this.imgInstrucao = this.add.image(cx, cy, "instrucaoRacao").setDepth(10000).setScale(0.5);

        // Texto pedindo para clicar para continuar
        this.txtContinuarInstrucao = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 30, "[ Clique para continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff", stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5).setDepth(10000);

        // Faz o texto piscar suavemente mudando a transparência (Alpha)
        this.tweens.add({ targets: this.txtContinuarInstrucao, alpha: 0.4, duration: 800, yoyo: true, loop: -1 });

        // Evento de clique para fechar a instrução e seguir o fluxo
        this.fundoEscuroInstrucao.on("pointerdown", () => {
            this.fundoEscuroInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.txtContinuarInstrucao.destroy();
            // Salva globalmente que o jogador já passou dessa fase do tutorial
            gameState.instrucaoRacaoVista = true; 
            
            // Retorna o foco da cena principal e puxa o próximo passo do tutorial
            this.scene.bringToTop("HUD");
            this.gerenciarTutorialInicial();
        });
    }

    /** * @method destacarFicha
     * @description Cria um "foco" visual no objeto de Ficha técnica escurecendo todo o resto.
     */
    destacarFicha() {
        // Pausa a HUD para evitar cliques acidentais nos botões de fora
        this.scene.pause("HUD"); 
        
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaComida");
        });

        // Fundo escuro interativo que atua como bloqueador
        this.overlayFicha = this.add.rectangle(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 0x000000, 0.7).setDepth(9999).setInteractive(); 
        
        // Garante que clicar no fundo escuro não vai vazar o clique para objetos que estão embaixo dele
        this.overlayFicha.on('pointerdown', (pointer, localX, localY, event) => { event.stopPropagation(); });

        // Traz o bilhete (ficha) temporariamente para frente do fundo escuro (10000 > 9999)
        gameState.bilhete.setDepth(10000);

        this.txtCliqueFicha = this.add.text(gameState.bilhete.x, gameState.bilhete.y + 60, "Clique na ficha!", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "12px", color: "#ffffff", stroke: "#000000", strokeThickness: 3
        }).setOrigin(0.5).setDepth(10000);

        // Pisca o texto para chamar a atenção
        this.tweens.add({ targets: this.txtCliqueFicha, alpha: 0.4, duration: 600, yoyo: true, loop: -1 });
    }

    /** * @method destacarEstante
     * @description Cria um "foco" visual na estante para forçar/guiar o jogador a clicar no minigame.
     */
    destacarEstante() {
        this.scene.pause("HUD"); 
        
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaComida");
        });

        this.overlayEstante = this.add.rectangle(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 0x000000, 0.7).setDepth(9999).setInteractive(); 
        
        this.overlayEstante.on('pointerdown', (pointer, localX, localY, event) => { event.stopPropagation(); });

        // Destaca a estante à frente do overlay
        this.estante.setDepth(10000);

        this.txtCliqueEstante = this.add.text(this.estante.x, this.estante.y - 100, "Clique na estante!", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "12px", color: "#ffffff", stroke: "#000000", strokeThickness: 3
        }).setOrigin(0.5).setDepth(10000);

        this.tweens.add({ targets: this.txtCliqueEstante, alpha: 0.4, duration: 600, yoyo: true, loop: -1 });
    }

    /** * @method exibirDirecaoJogadorVoltar
     * @description Exibe um popup visual sugerindo ao jogador voltar à cena principal.
     */
    exibirDirecaoJogadorVoltar() {
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaComida");
        });

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const fundoEscuro = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(200).setInteractive();
        const imgDirecao = this.add.image(cx, cy, "direcaoJogador")
            .setDepth(201).setInteractive({ useHandCursor: true });

        // Lógica matemática para redimensionar a imagem de direção garantindo que ela 
        // ocupe no máximo 80% da tela, mantendo a proporção.
        const escalaFinal = Math.min(
            (this.scale.width * 0.8) / imgDirecao.width,
            (this.scale.height * 0.8) / imgDirecao.height
        );
        imgDirecao.setScale(escalaFinal);

        const txtContinuar = this.add.text(cx, cy + (imgDirecao.displayHeight / 2) + 40, "[ Clique para Continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(202);

        this.tweens.add({ targets: txtContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        // Função local para retornar à cena principal e destruir a atual
        const voltarCena = () => {
            this.scene.bringToTop("HUD");
            this.scene.start("cenaPrincipal");
        };
        
        // Clicar no fundo escuro ou na imagem ativa a volta para a cena principal
        fundoEscuro.on('pointerdown', voltarCena);
        imgDirecao.on('pointerdown', voltarCena);
    }
}