// Importa o estado global do jogo (persistência de dados entre cenas) 
// e a função utilitária para tocar música.
import { gameState, iniciarMusicaAleatoria } from "../main.js";

/**
 * @class jogoAlimentacao
 * @extends Phaser.Scene
 * @description Cena responsável pelo minigame de "Catch" (Pegar itens caindo).
 * O jogador controla o cachorro para pegar a ração correta e desviar do chocolate.
 */
export class jogoAlimentacao extends Phaser.Scene {
    constructor() {
        // Define a chave identificadora da cena para o gerenciador do Phaser
        super({ key: 'jogoAlimentacao' });
    }

    /**
     * @method init
     * @description Executado toda vez que a cena é chamada. Garante que as 
     * variáveis de controle reiniciem limpas a cada nova partida.
     */
    init() {
        this.pontuacao = 0;
        this.vidas = 3;
        this.vidasMaximas = 3;
        
        // Controle de Dificuldade
        this.velocidadeQueda = 220;
        this.intervaloSpawn = 1200;
        this.intervaloMinimoSpawn = 420; // Limite máximo de dificuldade (itens caem rápido)
        
        // Flags de controle de estado
        this.partidaEncerrada = false;
        this.mostrandoInstrucoes = true; // Pausa a lógica principal enquanto exibe o tutorial
        this.tempoInicialMs = 0;
    }

    /**
     * @method preload
     * @description Carrega os assets visuais necessários exclusivamente para esta cena.
     */
    preload() {
        this.load.image('bgFoodScene', 'assets/tela-alimentação/bgRacao.png');
        this.load.image('dogPlayer', 'assets/dogPlayer.png');
        this.load.image('foodChocolate', 'assets/foodChocolate.png'); // O vilão (item negativo)
        this.load.image('heart', 'assets/heart.png');
        this.load.image('retornoInicio', 'assets/retornoInicio.png');
    }

    /**
     * @method create
     * @description Inicializa os elementos visuais, a física do mundo, 
     * a UI (HUD) e os manipuladores de eventos de input e resize.
     */
    create() {
        // Desativa a HUD global para não sobrepor a HUD específica do minigame
        if (this.scene.isActive("HUD")) {
            this.scene.sleep("HUD");
        }

        // Toca a música caso a configuração global permita
        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        // Medidas base da tela para posicionamento responsivo
        this.larguraTela = this.scale.width;
        this.alturaTela = this.scale.height;
        this.chaoY = this.alturaTela - 90; // Define o limite em Y (chão virtual) para o cachorro

        // Background enviado para o fundo (Depth -1)
        this.fundo = this.add.image(this.larguraTela / 2, this.alturaTela / 2, 'bgFoodScene')
            .setDisplaySize(this.larguraTela, this.alturaTela).setDepth(-1);

        // Seleciona o sprite do pet baseado no gameState
        const bocaAtiva = gameState.pets.cachorroJoao ? 'cachorroJoaoBoca' : (gameState.pets.cachorroHeroi ? 'cachorroHeroiBoca' : 'dogPlayer');
        
        // Instancia o jogador com a engine de física Arcade ativada
        this.jogador = this.physics.add.sprite(this.larguraTela / 2, this.chaoY, bocaAtiva);
        this.jogador.setCollideWorldBounds(true); // Impede que o pet saia da tela
        this.jogador.body.allowGravity = true;
        this.jogador.setGravityY(1200); // Dá um "peso" realista caso ele saia do chão
        this.jogador.setScale(0.15);
        this.velocidadeJogador = 560;

        // Sincroniza as bordas da física com o tamanho atual da tela
        this.physics.world.setBounds(0, 0, this.larguraTela, this.alturaTela);

        // Cria o grupo de física para os itens (rações e chocolates)
        this.itensComida = this.physics.add.group();
        
        // Define que ao haver sobreposição (overlap) entre jogador e um item, chama a função 'coletarItem'
        this.physics.add.overlap(this.jogador, this.itensComida, this.coletarItem, null, this);

        // === CRIAÇÃO DA HUD INTERNA ===
        this.textoPontuacao = this.add.text(100, 45, 'Pontuacao: 0', {
            fontFamily: '"Press Start 2P"', fontSize: "18px", color: '#1f1f1f'
        }).setDepth(10);

        this.textoTempo = this.add.text(this.larguraTela / 2, 45, 'Tempo: 0s', {
            fontFamily: '"Press Start 2P"', fontSize: "18px", color: '#1f1f1f'
        }).setOrigin(0.5, 0).setDepth(10);

        // Instancia os corações representando as vidas no canto superior direito
        this.iconesVida = [];
        for (let i = 0; i < this.vidasMaximas; i++) {
            const coracao = this.add.image(this.larguraTela - 40 - (i * 60), 35, 'heart').setScale(0.25).setDepth(10);
            this.iconesVida.push(coracao);
        }
        this.atualizarHUDVidas();

        // === CONTROLES (INPUTS) ===
        this.cursors = this.input.keyboard.createCursorKeys(); // Setas direcionais
        this.teclaA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.teclaD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.teclaEspaco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        /**
         * @callback handleResizeAlimentacao
         * @description Garante que o jogo não quebre visualmente caso o jogador
         * redimensione a janela do navegador ou rotacione o celular.
         */
        const handleResizeAlimentacao = (gameSize) => {
            this.larguraTela = gameSize.width;
            this.alturaTela = gameSize.height;
            this.chaoY = this.alturaTela - 90;

            this.cameras.resize(this.larguraTela, this.alturaTela);
            this.fundo.setDisplaySize(this.larguraTela, this.alturaTela).setPosition(this.larguraTela / 2, this.alturaTela / 2);
            this.jogador.setPosition(this.larguraTela / 2, this.chaoY);
            
            // Reposiciona a HUD
            this.textoPontuacao.setPosition(100, 45);
            this.textoTempo.setPosition(this.larguraTela / 2, 45);
            this.iconesVida.forEach((icone, i) => {
                icone.setPosition(this.larguraTela - 40 - (i * 60), 35);
            });

            this.physics.world.setBounds(0, 0, this.larguraTela, this.alturaTela);
            
            // Realinha a tela de instruções caso ela esteja ativa
            if (this.fundoInstrucao && this.fundoInstrucao.active) {
                this.fundoInstrucao.setPosition(this.larguraTela / 2, this.alturaTela / 2).setSize(this.larguraTela, this.alturaTela);
                if (this.imgInstrucao && this.imgInstrucao.active) {
                    this.imgInstrucao.setPosition(this.larguraTela / 2, this.alturaTela / 2);
                    if (this.textoIniciar && this.textoIniciar.active) {
                        this.textoIniciar.setPosition(this.larguraTela / 2, this.alturaTela / 2 + (this.imgInstrucao.displayHeight / 2) + 40);
                    }
                }
            }
        };

        // Escuta o evento de resize da tela
        this.scale.on("resize", handleResizeAlimentacao);

        // Prevenção de Memory Leak: Remove os listeners globais ao destruir a cena
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeAlimentacao);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });

        // Inicia travando o jogo e exibindo o tutorial
        this.mostrarComoJogar();
    }

    /**
     * @method update
     * @description Game Loop Principal. Chamado a cada frame. 
     * Gerencia a movimentação do jogador e o timer.
     */
    update() {
        // Bloqueia atualizações se o jogo acabou ou está no tutorial
        if (this.partidaEncerrada || this.mostrandoInstrucoes) return;

        // Atualiza o relógio na HUD
        const segundos = Math.floor((this.time.now - this.tempoInicialMs) / 1000);
        this.textoTempo.setText(`Tempo: ${Math.max(0, segundos)}s`);

        // Garante que o jogador não ultrapasse o chão (Efeito de gravidade controlada)
        if (this.jogador.y >= this.chaoY) {
            this.jogador.y = this.chaoY; 
            if (this.jogador.body.velocity.y > 0) {
                this.jogador.setVelocityY(0);
            }
        }

        // Lógica de Movimentação (Suporta WASD e Setas)
        const indoEsquerda = this.cursors.left.isDown || this.teclaA.isDown;
        const indoDireita = this.cursors.right.isDown || this.teclaD.isDown;

        if (indoEsquerda) {
            this.jogador.setVelocityX(-this.velocidadeJogador);
            this.jogador.setFlipX(true); // Vira o sprite para a esquerda
        } else if (indoDireita) {
            this.jogador.setVelocityX(this.velocidadeJogador);
            this.jogador.setFlipX(false); // Vira o sprite para a direita
        } else {
            this.jogador.setVelocityX(0); // Para instantaneamente (sem inércia)
        }

        // Garbage Collector Manual: Remove itens que saíram da tela e aplica punição se necessário
        this.itensComida.getChildren().forEach((item) => {
            if (item.y > this.alturaTela + item.displayHeight) {
                this.tratarItemPerdido(item);
            }
        });
    }

    /**
     * @method mostrarComoJogar
     * @description Exibe a modal explicativa e pausa o início do jogo.
     */
    mostrarComoJogar() {
        const cx = this.larguraTela / 2;
        const cy = this.alturaTela / 2;

        // Overlay escuro (interativo para bloquear cliques no jogo atrás dele)
        this.fundoInstrucao = this.add.rectangle(cx, cy, this.larguraTela, this.alturaTela, 0x000000, 0.8)
            .setDepth(200).setScrollFactor(0).setInteractive(); 

        this.imgInstrucao = this.add.image(cx, cy, "comoJogarRacao")
            .setDepth(201).setScrollFactor(0).setInteractive();

        // Escala responsiva "contain" para a imagem não estourar os limites
        const limiteLargura = this.larguraTela * 0.8;
        const limiteAltura = this.alturaTela * 0.8;
        const escalaX = limiteLargura / this.imgInstrucao.width;
        const escalaY = limiteAltura / this.imgInstrucao.height;
        this.imgInstrucao.setScale(Math.min(escalaX, escalaY));

        this.textoIniciar = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 40, "[ Clique ou aperte ESPAÇO para começar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
        // Efeito de piscar no texto para chamar a atenção
        this.tweens.add({ targets: this.textoIniciar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const comecarJogo = () => {
            this.fundoInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.textoIniciar.destroy();
            this.iniciarPartida();
        };

        // Permite fechamento via clique ou atalho no teclado (Acessibilidade)
        this.fundoInstrucao.on('pointerdown', comecarJogo);
        this.imgInstrucao.on('pointerdown', comecarJogo);
        this.input.keyboard.once('keydown-SPACE', comecarJogo);
    }

    /**
     * @method iniciarPartida
     * @description Destrava o jogo após o tutorial e inicia os temporizadores (Timers).
     */
    iniciarPartida() {
        this.mostrandoInstrucoes = false; 
        this.tempoInicialMs = this.time.now;
        
        this.criarEventoSpawn(); // Começa a chover comida

        // Loop de Aumento Progressivo de Dificuldade (A cada 8s)
        this.eventoDificuldade = this.time.addEvent({
            delay: 8000,
            loop: true,
            callback: () => {
                if (this.partidaEncerrada) return;
                // Aumenta a velocidade da queda até o limite de 700
                this.velocidadeQueda = Math.min(this.velocidadeQueda + 30, 700);
                // Diminui o tempo entre spawns até o mínimo permitido
                this.intervaloSpawn = Math.max(this.intervaloSpawn - 90, this.intervaloMinimoSpawn);
                this.criarEventoSpawn(); // Recria o evento com os novos tempos
            }
        });
    }

    /**
     * @method criarEventoSpawn
     * @description Reinicia o temporizador que joga os itens na tela.
     */
    criarEventoSpawn() {
        if (this.eventoSpawn) this.eventoSpawn.remove(false);
        
        this.eventoSpawn = this.time.addEvent({
            delay: this.intervaloSpawn, loop: true, callback: this.spawnarItem, callbackScope: this
        });
    }

    /**
     * @method determinarRacaoEscolhida
     * @description Define o tipo de ração que cai com base no que o usuário
     * comprou no gameState (Sistema de Dificuldade vs Recompensa dinâmica).
     * @returns {Object} Configuração estruturada da ração.
     */
    determinarRacaoEscolhida() {
        const racao = gameState.racaoAtual; 
        
        if (!racao) {
            console.warn("Nenhuma ração encontrada no gameState.racaoAtual! Usando fallback...");
            return { tipo: 'Standard', key: 'racaoStandardMedio', pontos: 15, penalidade: 5, dano: 0, escala: 0.15 };
        }

        // Rações melhores rendem mais pontos por captura
        let pontosCalculados = 15;
        let escalaCalculada = 0.2; 

        if (racao.tipo === "Premium") {
            pontosCalculados = 20;
        } else if (racao.tipo === "Super Premium") {
            pontosCalculados = 25;
        }

        return { 
            tipo: racao.tipo, 
            key: racao.sprite, 
            pontos: pontosCalculados, 
            penalidade: 5, 
            dano: 0,
            escala: escalaCalculada 
        };
    }

    /**
     * @method sortearTipoItem
     * @description Sistema de RNG (Random Number Generator). 
     * Define 75% de chance de ser ração boa e 25% de ser o chocolate venenoso.
     * @returns {Object} Item sorteado.
     */
    sortearTipoItem() {
        const chance = Phaser.Math.Between(1, 100);
        if (chance <= 75) return this.determinarRacaoEscolhida();
        
        return { tipo: 'chocolate', key: 'foodChocolate', pontos: 0, penalidade: 0, dano: 1, escala: 0.19 };
    }

    /**
     * @method spawnarItem
     * @description Instancia o sprite físico na parte superior da tela com 
     * metadados (pontos, dano) acoplados ao objeto.
     */
    spawnarItem() {
        if (this.partidaEncerrada || this.mostrandoInstrucoes) return;

        const tipoSorteado = this.sortearTipoItem();
        
        // Define uma posição X aleatória, com margem de segurança de 40px
        const x = Phaser.Math.Between(40, this.larguraTela - 40);
        const item = this.itensComida.create(x, -40, tipoSorteado.key);

        // Define a física do item (não afeta pela gravidade para ter velocidade constante controlada)
        item.body.allowGravity = false;
        // Adiciona um pouco de aleatoriedade na velocidade para não ficar robótico
        item.setVelocityY(this.velocidadeQueda + Phaser.Math.Between(-25, 25));
        
        // Acopla variáveis de regra de negócio diretamente no Game Object
        item.setData('tipo', tipoSorteado.tipo);
        item.setData('pontos', tipoSorteado.pontos);
        item.setData('penalidade', tipoSorteado.penalidade);
        item.setData('dano', tipoSorteado.dano);

        item.setScale(tipoSorteado.escala); 
    }

    /**
     * @method coletarItem
     * @description Callback disparado pelo motor de física quando o jogador e a comida colidem.
     */
    coletarItem(jogador, item) {
        if (this.partidaEncerrada) return;

        // Recupera os metadados setados no spawn
        this.pontuacao += item.getData('pontos');
        const dano = item.getData('dano');
        
        if (dano > 0) {
            this.alterarVidas(-dano); // Tomou dano (Pegou Chocolate)
        }

        this.atualizarHUDPontuacao();
        item.destroy(); // Retira da tela e da memória

        // Condição de Vitória: Atingir 150 pontos
        if (this.pontuacao >= 150) {
            this.finalizarMinigame();
        }
    }

    /**
     * @method tratarItemPerdido
     * @description Penaliza o jogador se deixar uma ração boa cair no chão.
     */
    tratarItemPerdido(item) {
        const penalidade = item.getData('penalidade');
        
        if (penalidade > 0) {
            // Garante que a pontuação não fique negativa
            this.pontuacao = Math.max(0, this.pontuacao - penalidade);
            this.atualizarHUDPontuacao();
        }

        item.destroy();
    }

    /**
     * @method alterarVidas
     * @description Gerencia o status de vida, processa a HUD e o Game Over.
     * @param {number} valor - Valor a ser somado/subtraído (Ex: -1).
     */
    alterarVidas(valor) {
        // Clamp mantém o valor travado entre 0 e o valor Máximo
        this.vidas = Phaser.Math.Clamp(this.vidas + valor, 0, this.vidasMaximas);
        this.atualizarHUDVidas();

        // Condição de Derrota
        if (this.vidas <= 0) {
            this.encerrarPartida();
        }
    }

    atualizarHUDPontuacao() {
        this.textoPontuacao.setText('Pontuacao: ' + this.pontuacao);
    }

    atualizarHUDVidas() {
        // Esconde os corações com base nas vidas perdidas
        this.iconesVida.forEach((icone, index) => {
            icone.setVisible(index < this.vidas);
        });
    }

    /**
     * @method finalizarMinigame
     * @description Função de VITÓRIA. Trava interações, distribui moedas 
     * e atualiza as barras de saciedade global do cachorro.
     */
    finalizarMinigame() {
        if (this.partidaEncerrada) return;
        
        this.partidaEncerrada = true;
        this.jogador.setVelocityX(0);

        const segundosDecorridos = Math.floor((this.time.now - this.tempoInicialMs) / 1000);

        // Limpa os temporizadores e itens caindo
        if (this.eventoSpawn) this.eventoSpawn.remove(false);
        if (this.eventoDificuldade) this.eventoDificuldade.remove(false);
        this.itensComida.clear(true, true);

        // Cálculos de recompensa
        const estrelas = this.calcularEstrelas(this.vidas);
        const moedas = this.calcularMoedas(estrelas);

        // Garante que o pet recebe a recompensa apenas na primeira vez do dia/sessão
        const cachorroAtivo = gameState.pets.cachorroJoao ? 'joao' : (gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo');
        if (!gameState.recompensas.alimentacao[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.alimentacao[cachorroAtivo] = true;
        }

        // Atualiza a Fome no Status Global baseada na qualidade da ração comprada
        // OBS: "0" na barra de fome significa que o pet está totalmente cheio
        const racao = gameState.racaoAtual;
        if (racao) {
            if (racao.tipo === "Super Premium") {
                gameState.barras.comida = 0; 
            } else if (racao.tipo === "Premium") {
                gameState.barras.comida = Math.max(0, gameState.barras.comida - 8);
            } else { 
                gameState.barras.comida = Math.max(0, gameState.barras.comida - 3);
            }
        }
        
        // Consome a ração do inventário virtual
        gameState.racaoAtual = null;

        this.mostrarPainelResultado(estrelas, moedas, segundosDecorridos);
    }

    calcularEstrelas(vidas) {
        if (vidas >= 3) return 3; 
        if (vidas === 2) return 2; 
        return 1;                  
    }

    calcularMoedas(estrelas) {
        if (estrelas === 3) return 20;
        if (estrelas === 2) return 10;
        return 5; 
    }

    /**
     * @method mostrarPainelResultado
     * @description Exibe a UI final de vitória, com moedas e tempo final,
     * e gerencia o redirecionamento para a cena principal.
     */
    mostrarPainelResultado(estrelas, moedas, segundos) {
        let imagemFeedback = "";
        
        // Seleciona a imagem com base no desempenho
        if (estrelas === 3) {
            imagemFeedback = "feeedback3estrelas"; 
        } else if (estrelas === 2) {
            imagemFeedback = "feedback2estrelas";
        } else {
            imagemFeedback = "feedback1estrela";
        }

        const cx = this.larguraTela / 2;
        const cy = this.alturaTela / 2;

        const fundoFeedback = this.add.rectangle(cx, cy, this.larguraTela, this.alturaTela, 0x000000, 0.8)
            .setDepth(1200).setScrollFactor(0).setInteractive(); 
        const telaFeedback = this.add.image(cx, cy, imagemFeedback)
            .setDepth(2000).setScrollFactor(0).setInteractive();

        // Lógica de "Contain" para responsividade da imagem
        const limiteLargura = this.larguraTela * 0.8;
        const limiteAltura = this.alturaTela * 0.8;
        const escalaFinal = Math.min(limiteLargura / telaFeedback.width, limiteAltura / telaFeedback.height);
        telaFeedback.setScale(escalaFinal);

        // Posicionamentos relativos dinâmicos para suportar telas diferentes (Mobile/Desktop)
        let posMoedasY = cy + (telaFeedback.displayHeight * 0.12);
        this.add.text(this.scale.width / 2 - 12, posMoedasY, `${moedas} Moedas`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(2001);

        let posTempoY = cy + (telaFeedback.displayHeight * 0.35); 
        this.add.text(this.scale.width / 2 - 20, posTempoY, `${segundos}s`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(2001);

        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Pressione ESPAÇO ou Clique ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(2001).setScrollFactor(0);
        
        this.tweens.add({ targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const voltarCena = () => {
            this.scene.start("cenaComida"); // Retorna o jogador ao jogo principal
        };

        fundoFeedback.on('pointerdown', voltarCena);
        telaFeedback.on('pointerdown', voltarCena);

        // Evita que cliques indesejados encerrem o menu muito rapidamente
        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', voltarCena);
        });
    }

    /**
     * @method encerrarPartida
     * @description Função de DERROTA (GAME OVER). Trava tudo e permite tentar novamente.
     */
    encerrarPartida() {
        if (this.partidaEncerrada) return;

        this.partidaEncerrada = true;
        this.jogador.setVelocityX(0);

        // Mata os timers
        if (this.eventoSpawn) this.eventoSpawn.remove(false);
        if (this.eventoDificuldade) this.eventoDificuldade.remove(false);
        this.itensComida.clear(true, true);

        // UI de Game Over Simples
        this.add.rectangle(this.larguraTela / 2, this.alturaTela / 2, this.larguraTela, this.alturaTela, 0x000000, 0.55).setDepth(20);

        this.add.text(this.larguraTela / 2, this.alturaTela / 2 - 60, 'GAME OVER', {
            fontFamily: 'Arial', fontSize: '64px', color: '#ffffff'
        }).setOrigin(0.5).setDepth(21);

        this.add.text(this.larguraTela / 2, this.alturaTela / 2, 'Pontuacao final: ' + this.pontuacao, {
            fontFamily: 'Arial', fontSize: '30px', color: '#ffffff'
        }).setOrigin(0.5).setDepth(21);

        this.add.text(this.larguraTela / 2, this.alturaTela / 2 + 55, 'Pressione ESPAÇO para reiniciar', {
            fontFamily: 'Arial', fontSize: '24px', color: '#ffffff'
        }).setOrigin(0.5).setDepth(21);

        // Aguarda 200ms por segurança para não reiniciar instantaneamente se ele já estiver apertando espaço
        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.restart(); // Reseta a cena toda, chamando o init() novamente
            });
        });
    }
}