// Importa o estado global do jogo
import { gameState, iniciarMusicaAleatoria } from "../main.js";

// Define a classe da cena do minigame de alimentacao
export class jogoAlimentacao extends Phaser.Scene {
    constructor() {
        super({ key: 'jogoAlimentacao' });
    }

    // O metodo init garante que variaveis reiniciem corretamente a cada nova partida
    init() {
        this.pontuacao = 0;
        this.vidas = 3;
        this.vidasMaximas = 3;
        this.velocidadeQueda = 220;
        this.intervaloSpawn = 1200;
        this.intervaloMinimoSpawn = 420;
        this.partidaEncerrada = false;
        
        // Flag para pausar o jogo enquanto as instrucoes sao exibidas
        this.mostrandoInstrucoes = true; 
        this.tempoInicialMs = 0;
    }

    preload() {
        this.load.image('bgFoodScene', 'assets/tela-alimentação/bgRacao.png');
        this.load.image('dogPlayer', 'assets/dogPlayer.png');
        this.load.image('foodChocolate', 'assets/foodChocolate.png'); // O vilão da fase
        this.load.image('heart', 'assets/heart.png');
        this.load.image('retornoInicio', 'assets/retornoInicio.png');
    }

    // Configura todos os elementos visuais e fisicos quando a cena inicia
    create() {
        if (this.scene.isActive("HUD")) {
            this.scene.sleep("HUD");
        }

        // Inicia música aleatória
        iniciarMusicaAleatoria(this);

        this.botaoVoltar = this.add.text(60, 50, "←", {
            fontFamily: "Arial", fontSize: "52px", color: "#ffffff", stroke: "#000000", strokeThickness: 6
        }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

        this.botaoVoltar.on("pointerover", () => this.botaoVoltar.setStyle({ color: "#ffdd00" }));
        this.botaoVoltar.on("pointerout",  () => this.botaoVoltar.setStyle({ color: "#ffffff" }));
        
        this.botaoVoltar.on("pointerdown", () => {
            if (this.scene.isSleeping("cenaHUD")) { this.scene.wake("cenaHUD"); }
            this.scene.start("cenaComida");
        });

        this.larguraTela = this.scale.width;
        this.alturaTela = this.scale.height;
        this.chaoY = this.alturaTela - 90;

        this.fundo = this.add.image(this.larguraTela / 2, this.alturaTela / 2, 'bgFoodScene')
            .setDisplaySize(this.larguraTela, this.alturaTela).setDepth(-1);

        const bocaAtiva = gameState.pets.cachorroJoao ? 'cachorroJoaoBoca' : (gameState.pets.cachorroHeroi ? 'cachorroHeroiBoca' : 'dogPlayer');
        this.jogador = this.physics.add.sprite(this.larguraTela / 2, this.chaoY, bocaAtiva);
        
        this.jogador.setCollideWorldBounds(true);
        this.jogador.body.allowGravity = true;
        this.jogador.setGravityY(1200); 
        this.jogador.setScale(0.15);
        this.velocidadeJogador = 560;

        this.physics.world.setBounds(0, 0, this.larguraTela, this.alturaTela);

        this.itensComida = this.physics.add.group();
        
        this.physics.add.overlap(this.jogador, this.itensComida, this.coletarItem, null, this);

        this.textoPontuacao = this.add.text(100, 45, 'Pontuacao: 0', {
            fontFamily: '"Press Start 2P"', fontSize: "18px", color: '#1f1f1f'
        }).setDepth(10);

        this.textoTempo = this.add.text(this.larguraTela / 2, 45, 'Tempo: 0s', {
            fontFamily: '"Press Start 2P"', fontSize: "18px", color: '#1f1f1f'
        }).setOrigin(0.5, 0).setDepth(10);

        this.iconesVida = [];
        for (let i = 0; i < this.vidasMaximas; i++) {
            const coracao = this.add.image(this.larguraTela - 40 - (i * 60), 35, 'heart').setScale(0.25).setDepth(10);
            this.iconesVida.push(coracao);
        }
        
        this.atualizarHUDVidas();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.teclaA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.teclaD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.teclaEspaco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        const handleResizeAlimentacao = (gameSize) => {
            this.larguraTela = gameSize.width;
            this.alturaTela = gameSize.height;
            this.chaoY = this.alturaTela - 90;

            this.cameras.resize(this.larguraTela, this.alturaTela);

            this.fundo.setDisplaySize(this.larguraTela, this.alturaTela).setPosition(this.larguraTela / 2, this.alturaTela / 2);
            this.jogador.setPosition(this.larguraTela / 2, this.chaoY);
            
            this.textoPontuacao.setPosition(100, 45);
            this.textoTempo.setPosition(this.larguraTela / 2, 45);

            this.iconesVida.forEach((icone, i) => {
                icone.setPosition(this.larguraTela - 40 - (i * 60), 35);
            });

            this.botaoVoltar.setPosition(60, 50);
            this.physics.world.setBounds(0, 0, this.larguraTela, this.alturaTela);
            
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

        this.scale.on("resize", handleResizeAlimentacao);

        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeAlimentacao);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });

        this.mostrarComoJogar();
    }

    update() {
        if (this.partidaEncerrada || this.mostrandoInstrucoes) return;

        const segundos = Math.floor((this.time.now - this.tempoInicialMs) / 1000);
        this.textoTempo.setText(`Tempo: ${Math.max(0, segundos)}s`);

        if (this.jogador.y >= this.chaoY) {
            this.jogador.y = this.chaoY; 
            
            if (this.jogador.body.velocity.y > 0) {
                this.jogador.setVelocityY(0);
            }
        }

        const indoEsquerda = this.cursors.left.isDown || this.teclaA.isDown;
        const indoDireita = this.cursors.right.isDown || this.teclaD.isDown;

        if (indoEsquerda) {
            this.jogador.setVelocityX(-this.velocidadeJogador);
            this.jogador.setFlipX(true);
        } else if (indoDireita) {
            this.jogador.setVelocityX(this.velocidadeJogador);
            this.jogador.setFlipX(false);
        } else {
            this.jogador.setVelocityX(0);
        }

        this.itensComida.getChildren().forEach((item) => {
            if (item.y > this.alturaTela + item.displayHeight) {
                this.tratarItemPerdido(item);
            }
        });
    }

    mostrarComoJogar() {
        const cx = this.larguraTela / 2;
        const cy = this.alturaTela / 2;

        this.fundoInstrucao = this.add.rectangle(cx, cy, this.larguraTela, this.alturaTela, 0x000000, 0.8).setDepth(200).setScrollFactor(0).setInteractive(); 
        this.imgInstrucao = this.add.image(cx, cy, "comoJogarRacao").setDepth(201).setScrollFactor(0).setInteractive();

        const limiteLargura = this.larguraTela * 0.8;
        const limiteAltura = this.alturaTela * 0.8;
        const escalaX = limiteLargura / this.imgInstrucao.width;
        const escalaY = limiteAltura / this.imgInstrucao.height;
        this.imgInstrucao.setScale(Math.min(escalaX, escalaY));

        this.textoIniciar = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 40, "[ Clique ou aperte ESPAÇO para começar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
        this.tweens.add({ targets: this.textoIniciar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const comecarJogo = () => {
            this.fundoInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.textoIniciar.destroy();
            this.iniciarPartida();
        };

        this.fundoInstrucao.on('pointerdown', comecarJogo);
        this.imgInstrucao.on('pointerdown', comecarJogo);
        this.input.keyboard.once('keydown-SPACE', comecarJogo);
    }

    iniciarPartida() {
        this.mostrandoInstrucoes = false; 
        this.tempoInicialMs = this.time.now;
        this.criarEventoSpawn();

        this.eventoDificuldade = this.time.addEvent({
            delay: 8000,
            loop: true,
            callback: () => {
                if (this.partidaEncerrada) return;
                this.velocidadeQueda = Math.min(this.velocidadeQueda + 30, 700);
                this.intervaloSpawn = Math.max(this.intervaloSpawn - 90, this.intervaloMinimoSpawn);
                this.criarEventoSpawn();
            }
        });
    }

    criarEventoSpawn() {
        if (this.eventoSpawn) this.eventoSpawn.remove(false);
        
        this.eventoSpawn = this.time.addEvent({
            delay: this.intervaloSpawn, loop: true, callback: this.spawnarItem, callbackScope: this
        });
    }

    determinarRacaoEscolhida() {
        const racao = gameState.racaoAtual; 
        
        if (!racao) {
            console.warn("Nenhuma ração encontrada no gameState.racaoAtual! Usando fallback...");
            return { tipo: 'Standard', key: 'racaoStandardMedio', pontos: 15, penalidade: 5, dano: 0, escala: 0.15 };
        }

        let pontosCalculados = 15;
        let escalaCalculada = 0.2; 

        if (racao.tipo === "Premium") {
            pontosCalculados = 20;
            escalaCalculada = 0.2; 
        } else if (racao.tipo === "Super Premium") {
            pontosCalculados = 25;
            escalaCalculada = 0.2; 
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

    sortearTipoItem() {
        const chance = Phaser.Math.Between(1, 100);
        
        if (chance <= 75) {
            return this.determinarRacaoEscolhida();
        }
        
        return { tipo: 'chocolate', key: 'foodChocolate', pontos: 0, penalidade: 0, dano: 1, escala: 0.19 };
    }

    spawnarItem() {
        if (this.partidaEncerrada || this.mostrandoInstrucoes) return;

        const tipoSorteado = this.sortearTipoItem();
        const x = Phaser.Math.Between(40, this.larguraTela - 40);
        
        const item = this.itensComida.create(x, -40, tipoSorteado.key);

        item.body.allowGravity = false;
        item.setVelocityY(this.velocidadeQueda + Phaser.Math.Between(-25, 25));
        
        item.setData('tipo', tipoSorteado.tipo);
        item.setData('pontos', tipoSorteado.pontos);
        item.setData('penalidade', tipoSorteado.penalidade);
        item.setData('dano', tipoSorteado.dano);

        item.setScale(tipoSorteado.escala); 
    }

    coletarItem(jogador, item) {
        if (this.partidaEncerrada) return;

        this.pontuacao += item.getData('pontos');

        const dano = item.getData('dano');
        if (dano > 0) {
            this.alterarVidas(-dano);
        }

        this.atualizarHUDPontuacao();
        item.destroy();

        if (this.pontuacao >= 150) {
            this.finalizarMinigame();
        }
    }

    tratarItemPerdido(item) {
        const penalidade = item.getData('penalidade');
        
        if (penalidade > 0) {
            this.pontuacao = Math.max(0, this.pontuacao - penalidade);
            this.atualizarHUDPontuacao();
        }

        item.destroy();
    }

    alterarVidas(valor) {
        this.vidas = Phaser.Math.Clamp(this.vidas + valor, 0, this.vidasMaximas);
        this.atualizarHUDVidas();

        if (this.vidas <= 0) {
            this.encerrarPartida();
        }
    }

    atualizarHUDPontuacao() {
        this.textoPontuacao.setText('Pontuacao: ' + this.pontuacao);
    }

    atualizarHUDVidas() {
        this.iconesVida.forEach((icone, index) => {
            icone.setVisible(index < this.vidas);
        });
    }

    finalizarMinigame() {
        if (this.partidaEncerrada) return;
        
        this.partidaEncerrada = true;
        this.jogador.setVelocityX(0);

        const segundosDecorridos = Math.floor((this.time.now - this.tempoInicialMs) / 1000);

        if (this.eventoSpawn) this.eventoSpawn.remove(false);
        if (this.eventoDificuldade) this.eventoDificuldade.remove(false);

        this.itensComida.clear(true, true);

        const estrelas = this.calcularEstrelas(this.vidas);
        const moedas = this.calcularMoedas(estrelas);

        const cachorroAtivo = gameState.pets.cachorroJoao ? 'joao' : (gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo');
        
        if (!gameState.recompensas.alimentacao[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.alimentacao[cachorroAtivo] = true;
        }

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

    mostrarPainelResultado(estrelas, moedas, segundos) {
        let imagemFeedback = "";
        
        if (estrelas === 3) {
            imagemFeedback = "feeedback3estrelas"; 
        } else if (estrelas === 2) {
            imagemFeedback = "feedback2estrelas";
        } else {
            imagemFeedback = "feedback1estrela";
        }

        const cx = this.larguraTela / 2;
        const cy = this.alturaTela / 2;

        const fundoFeedback = this.add.rectangle(cx, cy, this.larguraTela, this.alturaTela, 0x000000, 0.8).setDepth(100).setScrollFactor(0).setInteractive(); 
        const telaFeedback = this.add.image(cx, cy, imagemFeedback).setDepth(101).setScrollFactor(0).setInteractive();

        const limiteLargura = this.larguraTela * 0.8;
        const limiteAltura = this.alturaTela * 0.8;
        const escalaX = limiteLargura / telaFeedback.width;
        const escalaY = limiteAltura / telaFeedback.height;
        const escalaFinal = Math.min(escalaX, escalaY);
        telaFeedback.setScale(escalaFinal);

        let posMoedasY = cy + (telaFeedback.displayHeight * 0.12);
        this.add.text(this.scale.width / 2 - 12, posMoedasY, `${moedas} Moedas`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(102);

        let posTempoY = cy + (telaFeedback.displayHeight * 0.35); 
        this.add.text(this.scale.width / 2 - 20, posTempoY, `${segundos}s`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(102);

        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Pressione ESPAÇO ou Clique ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        
        this.tweens.add({ targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const voltarCena = () => {
            this.scene.start("cenaComida");
        };

        fundoFeedback.on('pointerdown', voltarCena);
        telaFeedback.on('pointerdown', voltarCena);

        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', voltarCena);
        });
    }

    encerrarPartida() {
        if (this.partidaEncerrada) return;

        this.partidaEncerrada = true;
        this.jogador.setVelocityX(0);

        if (this.eventoSpawn) this.eventoSpawn.remove(false);
        if (this.eventoDificuldade) this.eventoDificuldade.remove(false);

        this.itensComida.clear(true, true);

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

        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.restart();
            });
        });
    }
}