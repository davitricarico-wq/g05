// Importa o estado global (gameState) para persistência de dados entre as cenas 
// e a função para tocar músicas dinamicamente.
import { gameState, iniciarMusicaAleatoria } from "../main.js"; 

/**
 * @class jogoLazer
 * @extends Phaser.Scene
 * @description Cena responsável pelo minigame de Lazer (Estilo Endless Runner / Plataforma).
 * O jogador deve pular e desviar de obstáculos enquanto coleta petiscos para chegar ao final do percurso.
 */
export class jogoLazer extends Phaser.Scene {
    constructor() {
        super({ key: "jogoLazer" });
    }

    /**
     * @method init
     * @description Inicializa as variáveis de estado da fase antes da criação dos elementos visuais.
     * Ideal para resetar contadores sempre que a cena for reiniciada.
     */
    init() {
        this.pontos = 0; 
        
        // Flags de Controle de Fluxo do Minigame
        this.instrucoesLidas = false;  // Trava a física até o jogador fechar o modal inicial
        this.ganhou = false;           // Define se o jogador tocou no objetivo final
        this.jogoAcabou = false;       // Bloqueia inputs após a vitória/derrota
        this.minigameFinalizado = false; // Evita múltiplas chamadas da tela de recompensa
        this.isPropulsao = false;      // Impede interações enquanto o cão voa pela cama elástica
        
        this.ultimoTempoMs = 0; 
        gameState.tempoLazerTotal = 0; 
    }

    /**
     * @method create
     * @description Monta os elementos da cena, física, câmera e gera o percurso proceduralmente.
     */
    create() {
        // Remove a HUD padrão para não sobrepor a interface específica do minigame
        this.scene.stop("HUD");

        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        // Botão de fuga caso o jogador queira sair do minigame antes de terminar
        this.botaoVoltar = this.add.text(60, 50, "Voltar", {
            fontFamily: "Arial", fontSize: "24px", color: "#ffffff",
            stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true });

        this.botaoVoltar.on("pointerover", () => this.botaoVoltar.setStyle({ color: "#ffdd00" }));
        this.botaoVoltar.on("pointerout",  () => this.botaoVoltar.setStyle({ color: "#ffffff" }));
        this.botaoVoltar.on("pointerdown", () => {
            this.scene.start("cenaLazer"); 
        });

        // Define uma gravidade forte para que o pulo seja rápido e responsivo
        this.physics.world.gravity.y = 800; 

        const largura = this.scale.width;
        const altura = this.scale.height;
        
        // Calcula a proporção exata para que a textura de fundo cubra a altura da tela sem distorcer
        const alturaImgBg = this.textures.get("bgLazer").getSourceImage().height;
        const escalaBg = altura / alturaImgBg;

        // Fundo contínuo (TileSprite). Largura exagerada (9000) para garantir que não acabe antes do fim da fase
        this.fundo = this.add.tileSprite(0, 0, 9000, altura, "bgLazer").setOrigin(0, 0);
        this.fundo.setTileScale(escalaBg, escalaBg); 

        // Estabelece o "chão" invisível da física em 90% da altura da tela
        const alturaDoChao = altura * 0.9;
        this.physics.world.setBounds(0, 0, 9000, alturaDoChao);
        this.cameras.main.setBounds(0, 0, 9000, altura);

        // Seleção dinâmica do sprite baseada na escolha do pet no estado global
        const spriteCorrendo = gameState.pets.cachorroJoao ? 'cachorroJoaoCorrendo' : (gameState.pets.cachorroHeroi ? 'cachorroHeroiCorrendo' : 'cachorroCorrendo'); 

        this.cachorro = this.physics.add.sprite(largura * 0.15, alturaDoChao - 200, spriteCorrendo);
        this.cachorro.setCollideWorldBounds(true); 
        this.cachorro.setDepth(10); 
        
        // Balanceamento de proporções: cada sprite de cachorro tem um tamanho original diferente
        this.escalaBase = gameState.pets.cachorroJoao ? 0.6 : (gameState.pets.cachorroHeroi ? 0.18 : 0.5);
        this.cachorro.setScale(this.escalaBase); 
        
        // Ajuste da Hitbox (Caixa de Colisão): Reduzida intencionalmente para perdoar 
        // pequenos erros do jogador ao desviar dos obstáculos
        let dogW = this.cachorro.width;
        let dogH = this.cachorro.height;
        this.cachorro.body.setSize(dogW * 0.7, dogH * 0.5);
        this.cachorro.body.setOffset(dogW * 0.15, dogH * 0.5);

        // Recria a animação de corrida caso a cena seja reiniciada
        if (this.anims.exists('correr')) this.anims.remove('correr');
        this.anims.create({
            key: 'correr',
            frames: this.anims.generateFrameNumbers(spriteCorrendo, { start: 0, end: 1 }),
            frameRate: 7, 
            repeat: -1 
        });
        this.cachorro.anims.play('correr', true);

        // Faz a câmera seguir o jogador, com um leve deslocamento à esquerda (-largura * 0.2) 
        // para dar mais tempo de reação ao ver os obstáculos à frente
        this.cameras.main.startFollow(this.cachorro, true, 1, 1, -largura * 0.2, 0);
        
        // Inputs
        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaSpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Grupos de colisão
        this.petiscos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.obstaculos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.camasElasticas = this.physics.add.group({ allowGravity: false, immovable: true });

        // Popula a fase proceduralmente
        this.gerarPercurso(alturaDoChao);

        // Mapeamento de interações físicas
        this.physics.add.overlap(this.cachorro, this.petiscos, this.coletarPetisco, null, this);
        this.physics.add.collider(this.cachorro, this.obstaculos, this.baterNoObstaculo, null, this);
        this.physics.add.collider(this.cachorro, this.camasElasticas, this.usarCamaElastica, null, this);

        // Elementos de UI
        this.textoPontos = this.add.text(largura - 30, 30, 'Petiscos: 0', { 
            fontFamily: '"Press Start 2P", monospace', fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

        this.textoTempo = this.add.text(largura / 2, 30, `Tempo: ${gameState.tempoLazerTotal}s`, { 
            fontFamily: '"Press Start 2P", monospace', fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(20);

        /**
         * @callback handleResizeLazer
         * @description Realinha os elementos fixos da tela em caso de redimensionamento de janela.
         */
        const handleResizeLazer = (tamanhoTela) => {
            const { width: w, height: h } = tamanhoTela;
            this.fundo.setSize(10000, h);
            const novaEscalaBg = h / alturaImgBg;
            this.fundo.setTileScale(novaEscalaBg, novaEscalaBg);

            const novaAlturaDoChao = h * 0.9;
            this.physics.world.setBounds(0, 0, 10000, novaAlturaDoChao);
            this.cameras.main.setBounds(0, 0, 10000, h);
            
            this.textoPontos.setPosition(w - 30, 30);
            this.textoTempo.setPosition(w / 2, 30);
            this.botaoVoltar.setPosition(60, 50);

            // Centraliza os modais caso estejam abertos
            if (this.fundoInstrucao && this.fundoInstrucao.active) {
                this.fundoInstrucao.setPosition(w / 2, h / 2).setSize(w, h);
                if (this.imgInstrucao && this.imgInstrucao.active) {
                    this.imgInstrucao.setPosition(w / 2, h / 2);
                    if (this.textoIniciar && this.textoIniciar.active) {
                        this.textoIniciar.setPosition(w / 2, h / 2 + (this.imgInstrucao.displayHeight / 2) + 40);
                    }
                }
            }
        };

        this.scale.on("resize", handleResizeLazer);

        // Limpeza de eventos e listeners no fechamento da cena (Garbage Collection)
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeLazer);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });
        
        // Congela o jogo até que as instruções sejam dispensadas
        this.mostrarInstrucoes();
        this.physics.pause();
        this.cachorro.anims.pause();
    }

    /**
     * @method update
     * @description Ciclo principal (Game Loop). Gerencia movimentação, progressão de dificuldade e animações.
     */
    update() {
        if (!this.instrucoesLidas) return; 

        // Gerenciamento do Timer visível (Conta a cada 1 segundo real)
        const agora = this.time.now;
        if (agora - this.ultimoTempoMs >= 1000 && !this.jogoAcabou) {
            const segundosPassados = Math.floor((agora - this.ultimoTempoMs) / 1000);
            gameState.tempoLazerTotal += segundosPassados;
            this.ultimoTempoMs = agora;
            this.textoTempo.setText(`Tempo: ${gameState.tempoLazerTotal}s`);
        }

        // Failsafe: Se o jogador pulou a cama elástica e perdeu o petisco final, o jogo reinicia
        if (this.petiscaoFinal && this.petiscaoFinal.active) {
            if (this.cachorro.x > this.petiscaoFinal.x + 100 && !this.ganhou) {
                this.scene.restart(); 
            }
        }

        const noChao = this.cachorro.body.blocked.down || this.cachorro.body.touching.down;

        // Lógica de "Cinemática" de Vitória
        if (this.ganhou) {
            if (!this.jogoAcabou) {
                let velocidadeAtual = Math.min(300 + (this.cachorro.x * 0.05), 700);
                this.cachorro.setVelocityX(velocidadeAtual);

                // O jogador tocou o chão após capturar o objetivo no ar
                if (noChao && !this.isPropulsao) {
                    this.jogoAcabou = true; // Trava inputs e loop principal
                    
                    this.cachorro.setScale(this.escalaBase);
                    this.cachorro.play('correr', true);

                    // Animação procedural de frenagem (Tween na física)
                    this.tweens.add({
                        targets: this.cachorro.body.velocity,
                        x: 0, // Desacelera até parar
                        duration: 700, 
                        onUpdate: () => {
                            // Sincroniza a velocidade das pernas com a perda de velocidade física
                            this.cachorro.anims.timeScale = Math.max(0.1, this.cachorro.body.velocity.x / 300);
                        },
                        onComplete: () => {
                            // Fixa no frame de "parado" e inicia os modais finais
                            this.cachorro.anims.stop();
                            this.cachorro.setFrame(0); 
                            
                            this.time.delayedCall(300, () => {
                                this.mostrarTextoVitoria();
                            });
                        }
                    });

                } else if (!noChao) {
                    // Trava a animação em uma pose fixa enquanto o cão voa no pulo final
                    this.cachorro.anims.pause(this.cachorro.anims.currentAnim.frames[0]);
                }
            }
            return; // Interrompe o resto do update() para ignorar os inputs do jogador
        }

        // Progressão de dificuldade: O cão corre mais rápido quanto mais longe chega (Max: 700px/s)
        let velocidadeAtual = Math.min(300 + (this.cachorro.x * 0.05), 700);
        this.cachorro.setVelocityX(velocidadeAtual);
        this.cachorro.anims.timeScale = velocidadeAtual / 300; 

        if (this.jogoAcabou) return; 

        // Gerenciamento de Inputs
        const querPular = this.teclado.up.isDown || Phaser.Input.Keyboard.JustDown(this.teclaSpace);
        
        if (querPular) {
            this.pular();
        } else if (this.teclado.down.isDown) {
            this.abaixar(noChao);
        } else {
            this.cachorro.setScale(this.escalaBase, this.escalaBase); 
        }

        // Cosmético: Se estiver no ar, pausa a corrida. Se voltar ao chão, retoma.
        if (!noChao) {
            this.cachorro.anims.pause(this.cachorro.anims.currentAnim.frames[0]);
        } else {
            if (this.cachorro.anims.isPaused) this.cachorro.anims.resume();
            if (!this.cachorro.anims.isPlaying) this.cachorro.play('correr', true);
        }
    }

    /**
     * @method mostrarInstrucoes
     * @description Exibe o overlay contendo o tutorial básico antes de a fase efetivamente começar.
     */
    mostrarInstrucoes() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.fundoInstrucao = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85)
            .setDepth(200).setScrollFactor(0).setInteractive(); 

        this.imgInstrucao = this.add.image(cx, cy, "comoJogarLazer")
            .setDepth(201).setScrollFactor(0).setInteractive();

        // Ajuste dinâmico para garantir que a imagem não vaze em telas menores
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaFinal = Math.min(limiteLargura / this.imgInstrucao.width, limiteAltura / this.imgInstrucao.height);
        this.imgInstrucao.setScale(escalaFinal);

        this.textoIniciar = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 40, "[ Clique ou aperte ESPAÇO para começar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
        // Efeito visual de "piscar" na mensagem de start
        this.tweens.add({ targets: this.textoIniciar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const iniciar = () => {
            if(!this.instrucoesLidas) {
                this.fundoInstrucao.destroy();
                this.imgInstrucao.destroy();
                this.textoIniciar.destroy();
                this.iniciarMinigameAposInstrucoes();
            }
        };

        this.fundoInstrucao.on('pointerdown', iniciar);
        this.imgInstrucao.on('pointerdown', iniciar);
        this.time.delayedCall(200, () => { this.input.keyboard.once('keydown-SPACE', iniciar); });
    }

    iniciarMinigameAposInstrucoes() {
        this.instrucoesLidas = true;
        this.ultimoTempoMs = this.time.now;
        this.physics.resume();
        this.cachorro.anims.resume();
    }

    pular() {
        if (this.jogoAcabou) return; 
        const noChao = this.cachorro.body.blocked.down || this.cachorro.body.touching.down;
        // Só permite pular se estiver encostando no chão (evita double-jump infinito)
        if (noChao) {
            this.cachorro.setVelocityY(-550); 
            this.cachorro.setFrame(0); 
        }
    }

    abaixar(noChao) {
        if (this.jogoAcabou) return;
        // Se apertar para baixo enquanto pula, aplica um "peso" extra (smash) para cair rápido
        if (!noChao) {
            this.cachorro.setVelocityY(1000); 
        } 
        
        // Amassa a escala vertical do sprite em 18% para simular a esquiva
        this.cachorro.setScale(this.escalaBase, this.escalaBase * 0.82); 
    }

    /**
     * @method gerarPercurso
     * @description Distribui os obstáculos e petiscos ao longo do eixo X de forma pseudo-aleatória.
     * @param {number} alturaDoChao - Base Y para posicionamento.
     */
    gerarPercurso(alturaDoChao) {
        let fimDaFase = 7000;
        // Um array de booleanos embaralhado para decidir se o petisco do trecho é bom ou estragado
        let tiposPetiscos = [true, true, true, false, false, false, false, false];
        Phaser.Utils.Array.Shuffle(tiposPetiscos); 

        // O laço salta a cada 800px para garantir um espaçamento que o jogador consiga desviar
        for (let x = 600; x <= fimDaFase; x += 800) {
            let posX = x + 400; 

            // Se for o último elemento da fase, instancia o conjunto especial de vitória
            if (x === fimDaFase) {
                let cama = this.camasElasticas.create(posX, alturaDoChao - 60, 'camaElastica').setScale(0.4).setDepth(5);
                cama.body.setSize(cama.width * 0.4, cama.height * 0.1); 
                cama.body.setOffset(cama.width * 0.4, cama.height * 0.5); 

                let yPetiscao = alturaDoChao - 400; // Posicionado bem alto para forçar o uso da cama elástica
                let petiscoAlto = this.petiscos.create(posX + 350, yPetiscao, 'petisco').setScale(0.3).setDepth(5);
                petiscoAlto.body.setSize(petiscoAlto.width * 0.6, petiscoAlto.height * 0.6);
                petiscoAlto.body.setOffset(petiscoAlto.width * 0.2, petiscoAlto.height * 0.2);
                petiscoAlto.tint = 0xffd700; // Coloração dourada
                petiscoAlto.isSuper = true;  // Flag que dispara a função vencerJogo()
                this.petiscaoFinal = petiscoAlto; 
            } else {
                // Obstáculos normais (hitbox circular ajustada)
                let obs = this.obstaculos.create(posX, alturaDoChao - 50, 'obstaculo').setScale(2).setDepth(5);
                let raio = obs.width * 0.30; 
                obs.body.setCircle(raio, obs.width * 0.35, obs.height * 0.4); 

                // Petiscos (pontuação)
                let yPetisco = alturaDoChao - 180; 
                let petisco = this.petiscos.create(x, yPetisco, 'petisco').setScale(0.15).setDepth(5);
                petisco.body.setSize(petisco.width * 0.6, petisco.height * 0.6);
                petisco.body.setOffset(petisco.width * 0.2, petisco.height * 0.2);

                let ehEstragado = tiposPetiscos.shift(); 
                if (ehEstragado) {
                    petisco.isEstragado = true;
                    petisco.setTexture('petiscoEstragado'); 
                } else {
                    petisco.isEstragado = false;
                }
            }
        }
    }

    /**
     * @method usarCamaElastica
     * @description Sobrescreve a física padrão (Arcade Physics) aplicando uma trajetória 
     * parabólica matemática manual via Cinemática. Garante que o pulo sempre alcance o objetivo.
     */
    usarCamaElastica(cachorro, cama) {
        if (this.isPropulsao || this.jogoAcabou || this.ganhou) return;
        this.isPropulsao = true; 
        // Desliga o motor de colisão e gravidade momentaneamente para evitar interferências
        cachorro.body.moves = false; 

        const xi = cachorro.x;
        const yi = cachorro.y;
        const duracaoTotal = 0.3; // Segundos no ar
        const xf = xi + 150;      // Destino horizontal do arco
        const yf = yi - 100;      // Altura (vértice) do arco

        // Fórmulas de movimento uniforme horizontal e aceleração vertical (MRUV)
        const velocidadeX = (xf - xi) / duracaoTotal;
        const aceleracaoY = (2 * (yf - yi)) / Math.pow(duracaoTotal, 2);

        let tempoAtual = 0;
        let tempoAnterior = performance.now();

        const atualizarFrame = (tempoFrame) => {
            let dt = (tempoFrame - tempoAnterior) / 1000; 
            tempoAnterior = tempoFrame;
            tempoAtual += dt;

            if (tempoAtual > duracaoTotal) tempoAtual = duracaoTotal;

            // Aplica as novas posições quadro-a-quadro
            cachorro.x = xi + (velocidadeX * tempoAtual);
            cachorro.y = yi + (aceleracaoY * Math.pow(tempoAtual, 2)) / 2;

            if (tempoAtual < duracaoTotal) {
                requestAnimationFrame(atualizarFrame); 
            } else {
                // Restaura o controle ao motor da física
                cachorro.body.moves = true;
                cachorro.setVelocityY(aceleracaoY * tempoAtual); 
                this.time.delayedCall(1000, () => { this.isPropulsao = false; });
            }
        };
        requestAnimationFrame(atualizarFrame);
    }

    coletarPetisco(cachorro, petisco) {
        petisco.disableBody(true, true); // Remove do cálculo e da tela

        if (petisco.isEstragado) {
            // Punição visual (fica vermelho) e perda de pontuação (limitada a zero)
            this.pontos = Math.max(0, this.pontos - 1); 
            cachorro.tint = 0xff0000; 
            this.time.delayedCall(500, () => { cachorro.clearTint(); }); 
        } else {
            this.pontos += 1;
            if (petisco.isSuper) this.vencerJogo(); 
        }
        
        this.textoPontos.setText('Petiscos: ' + this.pontos);
        this.events.emit("atualizarHUD"); 
    }

    baterNoObstaculo() {
        // Condição de derrota impiedosa: bateu, recomeça do zero.
        this.scene.restart();
    }

    vencerJogo() {
        if (this.jogoAcabou) return; 
        this.ganhou = true; 
    }

    /**
     * @method mostrarTextoVitoria
     * @description Modal transacional temporário antes de apresentar as estatísticas finais.
     */
    mostrarTextoVitoria() {
        const meioX = this.cameras.main.worldView.x + (this.scale.width / 2);
        const meioY = this.scale.height / 2;

        this.add.text(meioX, meioY, 'FASE CONCLUIDA!', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '40px', fill: '#00ff00',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(30);
        
        this.time.delayedCall(2000, () => {
            this.finalizarMinigame();
        });
    }
    
    /**
     * @method finalizarMinigame
     * @description Calcula os resultados, atualiza o gameState com as economias e barras do pet,
     * e renderiza o popup de feedback (estrelas e moedas).
     */
    finalizarMinigame() {
        if (this.minigameFinalizado) return;
        this.minigameFinalizado = true;

        const estrelas = this.calcularEstrelas(this.pontos);
        const moedas = this.calcularMoedas(estrelas);
        const reducaoLazer = this.calcularLazer(estrelas);

        const cachorroAtivo = gameState.pets.cachorroJoao ? 'joao' : (gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo');
        
        // Limita o farm: as moedas da primeira vitória só são entregues caso o player 
        // não tenha completado a missão de lazer deste pet antes.
        if (!gameState.recompensas.lazer[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.lazer[cachorroAtivo] = true;
        }

        // Reduz o medidor de estresse (Lazer) baseado na performance. (Clamp impede valores negativos)
        let lazerAtual = gameState.barras.lazer !== undefined ? gameState.barras.lazer : 11;
        gameState.barras.lazer = Phaser.Math.Clamp(lazerAtual - reducaoLazer, 0, 11); 

        // Regra de negócio global: Se todas as barras chegarem a zero, o jogo volta pra tela principal.
        const barrasZero = 
          gameState.barras.comida <= 0 &&
          gameState.barras.lazer <= 0 &&
          gameState.barras.limpeza <= 0 &&
          gameState.barras.saude <= 0;

        let imagemFeedback = estrelas === 3 ? "feeedback3estrelas" : (estrelas === 2 ? "feedback2estrelas" : "feedback1estrela");

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // UI: Modal de recompensas final
        this.fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(100).setScrollFactor(0).setInteractive(); 

        this.telaFeedback = this.add.image(cx, cy, imagemFeedback).setDepth(101).setScrollFactor(0).setInteractive();
        const escalaFinal = Math.min((this.scale.width * 0.8) / this.telaFeedback.width, (this.scale.height * 0.8) / this.telaFeedback.height);
        this.telaFeedback.setScale(escalaFinal);

        let posMoedasY = cy + (this.telaFeedback.displayHeight * 0.12);
        this.textoMoedas = this.add.text(cx -12, posMoedasY, `${moedas} Moedas`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

        let posTempoY = cy - 20 + (this.telaFeedback.displayHeight * 0.35); 
        this.textoTempo = this.add.text(cx, posTempoY, `${gameState.tempoLazerTotal}s`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

        this.textoContinuar = this.add.text(cx, cy + (this.telaFeedback.displayHeight / 2) + 40, "[ Clique ou ESPAÇO para continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        
        this.tweens.add({ targets: this.textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const voltarParaMenu = () => {
            if (this.fundoFeedback) this.fundoFeedback.destroy();
            if (this.telaFeedback) this.telaFeedback.destroy();
            if (this.textoMoedas) this.textoMoedas.destroy();
            if (this.textoTempo) this.textoTempo.destroy();
            if (this.textoContinuar) this.textoContinuar.destroy();
            this.exibirDirecaoJogador(barrasZero);
        };
        
        this.fundoFeedback.on('pointerdown', voltarParaMenu);
        this.telaFeedback.on('pointerdown', voltarParaMenu);
        this.time.delayedCall(200, () => { this.input.keyboard.once('keydown-SPACE', voltarParaMenu); });
    }

    /** * @method exibirDirecaoJogador
     * @description Exibe o popup de direcionamento final, gerenciando o encerramento total.
     */
    exibirDirecaoJogador(barrasZero) {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const fundoEscuro = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(100).setScrollFactor(0).setInteractive();
        const imgDirecao = this.add.image(cx, cy, "direcaoJogador")
            .setDepth(101).setScrollFactor(0).setInteractive({ useHandCursor: true });

        const escalaFinal = Math.min((this.scale.width * 0.8) / imgDirecao.width, (this.scale.height * 0.8) / imgDirecao.height);
        imgDirecao.setScale(escalaFinal);

        const txtContinuar = this.add.text(cx, cy + (imgDirecao.displayHeight / 2) + 40, "[ Clique ou ESPAÇO para continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

        this.tweens.add({ targets: txtContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const proximaCena = () => {
            if (barrasZero) {
                this.scene.start("cenaPrincipal");
            } else {
                this.scene.start("cenaLazer");
            }
        };
        
        fundoEscuro.on('pointerdown', proximaCena);
        imgDirecao.on('pointerdown', proximaCena);
        this.time.delayedCall(200, () => { this.input.keyboard.once('keydown-SPACE', proximaCena); });
    }
    
    // Métodos utilitários: encapsulam a matemática de conversão Pontos -> Recompensas
    calcularEstrelas(pontos) {
        if (pontos >= 5) return 3; 
        if (pontos >= 3) return 2; 
        return 1;
    }

    calcularMoedas(estrelas) {
        if (estrelas === 3) return 20;
        if (estrelas === 2) return 10;
        return 5; 
    }

    calcularLazer(estrelas) {
        if (estrelas === 3) return 11; 
        if (estrelas === 2) return 5;  
        return 2; 
    }
}