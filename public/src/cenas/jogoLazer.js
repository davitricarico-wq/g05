// Importa o estado global do jogo
import { gameState } from "../main.js"; 

// Define a classe da cena do minigame de lazer
export class jogoLazer extends Phaser.Scene {
    constructor() {
        super({ key: "jogoLazer" });
    }

    // Inicializa variáveis de controle da cena
    init() {
        this.pontos = 0; 
        this.instrucoesLidas = false;
        this.ganhou = false; 
        this.jogoAcabou = false; 
        this.minigameFinalizado = false;
        this.isPropulsao = false; 
        this.ultimoTempoMs = 0; // Controle de tempo local

        // AQUI: Reseta o tempo global toda vez que a cena (ou a partida) inicia
        gameState.tempoLazerTotal = 0; 
    }

    create() {
        // Interrompe a HUD principal para focar no minigame
        this.scene.stop("HUD");

        // Configura o botão de voltar com interatividade e efeitos visuais
        this.botaoVoltar = this.add.text(60, 50, "Voltar", {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true });

        this.botaoVoltar.on("pointerover", () => this.botaoVoltar.setStyle({ color: "#ffdd00" }));
        this.botaoVoltar.on("pointerout",  () => this.botaoVoltar.setStyle({ color: "#ffffff" }));
        this.botaoVoltar.on("pointerdown", () => {
            this.scene.start("cenaLazer");
        });

        // Define a gravidade do mundo físico
        this.physics.world.gravity.y = 800;

        // Gerencia a transição de áudio entre o tutorial e o minigame
        if (!gameState.musicaMenuPrincipal) {
            gameState.musicaMenuPrincipal = this.sound.add("musicaMenuPrincipal", { loop: true, volume: 0.5 });
        }
        if (gameState.musicaTutorial?.isPlaying) {
            gameState.musicaTutorial.stop();
        }
        if (!gameState.musicaMenuPrincipal.isPlaying) {
            gameState.musicaMenuPrincipal.play();
        }
        gameState.musica = gameState.musicaMenuPrincipal;

        // Configura o fundo infinito (TileSprite) com ajuste de escala
        const largura = this.scale.width;
        const altura = this.scale.height;
        const alturaImgBg = this.textures.get("bgLazer").getSourceImage().height;
        const escalaBg = altura / alturaImgBg;

        this.fundo = this.add.tileSprite(0, 0, 8000, altura, "bgLazer").setOrigin(0, 0);
        this.fundo.setTileScale(escalaBg, escalaBg); 

        // Define os limites do mundo físico e da câmera
        const alturaDoChao = altura * 0.9;
        this.physics.world.setBounds(0, 0, 8000, alturaDoChao);
        this.cameras.main.setBounds(0, 0, 8000, altura);

        // Define o sprite do cachorro com base na evolução (Heroi ou Caramelo)
        const spriteCorrendo = gameState.pets.cachorroJoao ? 'cachorroJoaoCorrendo' : (gameState.pets.cachorroHeroi ? 'cachorroHeroiCorrendo' : 'cachorroCorrendo'); 

        // Cria o sprite do jogador e ajusta sua caixa de colisão (hitbox)
        this.cachorro = this.physics.add.sprite(largura * 0.15, alturaDoChao - 200, spriteCorrendo);
        this.cachorro.setCollideWorldBounds(true);
        
        // --- MUDANÇA DA ESCALA ---
        // Define a escala base dependendo do pet
        this.escalaBase = gameState.pets.cachorroJoao ? 0.4 : (gameState.pets.cachorroHeroi ? 0.18 : 0.5);
        this.cachorro.setScale(this.escalaBase); 
        // -------------------------

        this.cachorro.setDepth(10); 
        
        let dogW = this.cachorro.width;
        let dogH = this.cachorro.height;
        this.cachorro.body.setSize(dogW * 0.7, dogH * 0.5);
        this.cachorro.body.setOffset(dogW * 0.15, dogH * 0.5);

        // Cria e inicia a animação de corrida
        if (this.anims.exists('correr')) {
            this.anims.remove('correr');
        }

        this.anims.create({
            key: 'correr',
            frames: this.anims.generateFrameNumbers(spriteCorrendo, { start: 0, end: 1 }),
            frameRate: 7, 
            repeat: -1 
        });
        this.cachorro.anims.play('correr', true);

        // Faz a câmera seguir o cachorro horizontalmente
        this.cameras.main.startFollow(this.cachorro, true, 1, 1, -largura * 0.2, 0);
        
        // Mapeia as teclas de controle (setas e espaço)
        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaSpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Cria grupos físicos para petiscos, obstáculos e camas elásticas
        this.petiscos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.obstaculos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.camasElasticas = this.physics.add.group({ allowGravity: false, immovable: true });

        // Gera os elementos do cenário ao longo do percurso
        this.gerarPercurso(alturaDoChao);

        // Define as regras de colisão e sobreposição
        this.physics.add.overlap(this.cachorro, this.petiscos, this.coletarPetisco, null, this);
        this.physics.add.collider(this.cachorro, this.obstaculos, this.baterNoObstaculo, null, this);
        this.physics.add.collider(this.cachorro, this.camasElasticas, this.usarCamaElastica, null, this);

        // Cria o texto de pontuação fixo na tela
        this.textoPontos = this.add.text(largura - 30, 30, 'Petiscos: 0', { 
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '24px', 
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

        // LÓGICA DO TEMPO NO TOPO
        this.textoTempo = this.add.text(largura / 2, 30, `Tempo: ${gameState.tempoLazerTotal}s`, { 
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '24px', 
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(20);

        // Função para manter a responsividade em caso de redimensionamento da janela
        const handleResizeLazer = (tamanhoTela) => {
            const { width: w, height: h } = tamanhoTela;
            this.fundo.setSize(9000, h);
            const novaEscalaBg = h / alturaImgBg;
            this.fundo.setTileScale(novaEscalaBg, novaEscalaBg);

            const novaAlturaDoChao = h * 0.9;
            this.physics.world.setBounds(0, 0, 9000, novaAlturaDoChao);
            this.cameras.main.setBounds(0, 0, 9000, h);
            
            this.textoPontos.setPosition(w - 30, 30);
            this.textoTempo.setPosition(w / 2, 30);
            this.botaoVoltar.setPosition(60, 50);

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

        // Limpa listeners ao fechar a cena para evitar vazamento de memória
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeLazer);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });
        
        // Pausa o jogo e exibe as instruções iniciais
        this.mostrarInstrucoes();
        this.physics.pause();
        this.cachorro.anims.pause();
    }

    update() {
        // Impede a execução da lógica se as instruções estiverem na tela ou o jogo acabar
        if (!this.instrucoesLidas || this.jogoAcabou) return; 

        // CALCULO DO TEMPO
        const agora = this.time.now;
        if (agora - this.ultimoTempoMs >= 1000) {
            const segundosPassados = Math.floor((agora - this.ultimoTempoMs) / 1000);
            gameState.tempoLazerTotal += segundosPassados;
            this.ultimoTempoMs = agora;
            this.textoTempo.setText(`Tempo: ${gameState.tempoLazerTotal}s`);
        }

        // Reinicia a fase se o jogador ultrapassar o petisco final sem pegá-lo
        if (this.petiscaoFinal && this.petiscaoFinal.active) {
            if (this.cachorro.x > this.petiscaoFinal.x + 100) {
                this.scene.restart(); 
            }
        }

        // Calcula a velocidade progressiva e sincroniza com o tempo da animação
        let velocidadeAtual = Math.min(300 + (this.cachorro.x * 0.05), 700);
        this.cachorro.setVelocityX(velocidadeAtual);
        this.cachorro.anims.timeScale = velocidadeAtual / 300; 

        // Verifica se o pet está em contato com o chão
        const noChao = this.cachorro.body.blocked.down || this.cachorro.body.touching.down;

        // Lógica de finalização após atingir a meta
        if (this.ganhou) {
            if (noChao) {
                this.jogoAcabou = true;
                this.physics.pause();
                this.cachorro.anims.pause();
                this.mostrarTextoVitoria();
            }
            return; 
        }

        // Processa comandos de pulo e abaixar
        const querPular = this.teclado.up.isDown || Phaser.Input.Keyboard.JustDown(this.teclaSpace);
        
        if (querPular) {
            this.pular();
        } else if (this.teclado.down.isDown) {
            this.abaixar(noChao);
        } else {
            // --- MUDANÇA DA ESCALA AO LEVANTAR ---
            this.cachorro.setScale(this.escalaBase, this.escalaBase); 
        }

        // Controla o estado da animação com base no contato com o solo
        if (!noChao) {
            this.cachorro.anims.pause(this.cachorro.anims.currentAnim.frames[0]);
        } else {
            if (this.cachorro.anims.isPaused) {
                this.cachorro.anims.resume();
            }
            if (!this.cachorro.anims.isPlaying) {
                this.cachorro.play('correr', true);
            }
        }
    }

    // Cria overlay de instruções com texto animado
    mostrarInstrucoes() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.fundoInstrucao = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85)
            .setDepth(200).setScrollFactor(0).setInteractive(); 

        this.imgInstrucao = this.add.image(cx, cy, "comoJogarLazer")
            .setDepth(201).setScrollFactor(0).setInteractive();

        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaX = limiteLargura / this.imgInstrucao.width;
        const escalaY = limiteAltura / this.imgInstrucao.height;
        this.imgInstrucao.setScale(Math.min(escalaX, escalaY));

        this.textoIniciar = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 40, "[ Clique ou aperte ESPAÇO para começar ]", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "15px",
            color: "#ffffff"
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
        this.tweens.add({
            targets: this.textoIniciar, alpha: 0.5, duration: 600, yoyo: true, loop: -1
        });

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
        
        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', iniciar);
        });
    }

    // Libera a física e animações após ler as instruções
    iniciarMinigameAposInstrucoes() {
        this.instrucoesLidas = true;
        this.ultimoTempoMs = this.time.now;
        this.physics.resume();
        this.cachorro.anims.resume();
    }

    // Aplica impulso vertical para o pulo
    pular() {
        if (this.jogoAcabou) return; 
        const noChao = this.cachorro.body.blocked.down || this.cachorro.body.touching.down;
        if (noChao) {
            this.cachorro.setVelocityY(-550);
            this.cachorro.setFrame(0); 
        }
    }

    // Achata o sprite e aplica força para baixo ao agachar
    abaixar(noChao) {
        if (this.jogoAcabou) return;
        if (!noChao) {
            this.cachorro.setVelocityY(1000); 
        } 
        // --- MUDANÇA DA ESCALA AO AGACHAR ---
        // Ele vai manter a largura original (escalaBase) e amassar a altura em proporção
        this.cachorro.setScale(this.escalaBase, this.escalaBase * 0.82); 
    }

    // Distribui obstáculos e petiscos (bons e estragados) ao longo da fase
    gerarPercurso(alturaDoChao) {
        let fimDaFase = 7000;
        let tiposPetiscos = [true, true, true, false, false, false, false, false];
        Phaser.Utils.Array.Shuffle(tiposPetiscos);

        for (let x = 600; x <= fimDaFase; x += 800) {
            let posX = x + 400; 

            if (x === fimDaFase) {
                // Cria a cama elástica final
                let cama = this.camasElasticas.create(posX, alturaDoChao - 60, 'camaElastica').setScale(0.4).setDepth(5);
                cama.body.setSize(cama.width * 0.4, cama.height * 0.1); 
                cama.body.setOffset(cama.width * 0.4, cama.height * 0.5); 

                // Cria o super petisco final (meta da fase)
                let yPetiscao = alturaDoChao - 400; 
                let petiscoAlto = this.petiscos.create(posX + 350, yPetiscao, 'petisco').setScale(0.3).setDepth(5);
                petiscoAlto.body.setSize(petiscoAlto.width * 0.6, petiscoAlto.height * 0.6);
                petiscoAlto.body.setOffset(petiscoAlto.width * 0.2, petiscoAlto.height * 0.2);
                petiscoAlto.tint = 0xffd700; 
                petiscoAlto.isSuper = true;
                this.petiscaoFinal = petiscoAlto;
            } else {
                // Cria obstáculos e petiscos regulares
                let obs = this.obstaculos.create(posX, alturaDoChao - 50, 'obstaculo').setScale(2).setDepth(5);
                let raio = obs.width * 0.30; 
                obs.body.setCircle(raio, obs.width * 0.35, obs.height * 0.4);

                // Altura original do petisco
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

    // Calcula trajetória parabólica manual ao tocar na cama elástica
    usarCamaElastica(cachorro, cama) {
        if (this.isPropulsao || this.jogoAcabou || this.ganhou) return;
        this.isPropulsao = true;
        cachorro.body.moves = false;

        const xi = cachorro.x;
        const yi = cachorro.y;
        const duracaoTotal = 0.3; 
        const xf = xi + 150; 
        const yf = yi - 100; 

        const velocidadeX = (xf - xi) / duracaoTotal;
        const aceleracaoY = (2 * (yf - yi)) / Math.pow(duracaoTotal, 2);

        let tempoAtual = 0;
        let tempoAnterior = performance.now();

        const atualizarFrame = (tempoFrame) => {
            let dt = (tempoFrame - tempoAnterior) / 1000; 
            tempoAnterior = tempoFrame;
            tempoAtual += dt;

            if (tempoAtual > duracaoTotal) tempoAtual = duracaoTotal;

            let posicaoX = xi + (velocidadeX * tempoAtual);
            let velocidadeY = aceleracaoY * tempoAtual; 
            let posicaoY = yi + (aceleracaoY * Math.pow(tempoAtual, 2)) / 2;
            
            cachorro.x = posicaoX;
            cachorro.y = posicaoY;

            if (tempoAtual < duracaoTotal) {
                requestAnimationFrame(atualizarFrame); 
            } else {
                cachorro.body.moves = true;
                cachorro.setVelocityY(velocidadeY); 
                this.time.delayedCall(1000, () => { this.isPropulsao = false; });
            }
        };
        requestAnimationFrame(atualizarFrame);
    }

    // Gerencia a coleta de itens e efeitos no HUD
    coletarPetisco(cachorro, petisco) {
        petisco.disableBody(true, true); 
        if (petisco.isEstragado) {
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

    // Reinicia a cena em caso de colisão com obstáculos
    baterNoObstaculo() {
        this.scene.restart();
    }

    // Define o estado de vitória
    vencerJogo() {
        if (this.jogoAcabou) return; 
        this.ganhou = true; 
    }

    // Exibe mensagem centralizada de conclusão de fase
    mostrarTextoVitoria() {
        const meioX = this.cameras.main.worldView.x + (this.scale.width / 2);
        const meioY = this.scale.height / 2;

        this.add.text(meioX, meioY, 'FASE CONCLUIDA!', {
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '40px', 
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(30);
        
        this.time.delayedCall(2000, () => {
            this.finalizarMinigame();
        });
    }
    
    // Processa recompensas (moedas e barras) e exibe tela de feedback final
    finalizarMinigame() {
        if (this.minigameFinalizado) return;
        this.minigameFinalizado = true;

        const estrelas = this.calcularEstrelas(this.pontos);
        const moedas = this.calcularMoedas(estrelas);
        const reducaoLazer = this.calcularLazer(estrelas);

        const cachorroAtivo = gameState.pets.cachorroJoao ? 'joao' : (gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo');
        if (!gameState.recompensas.lazer[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.lazer[cachorroAtivo] = true;
        }

        let lazerAtual = gameState.barras.lazer !== undefined ? gameState.barras.lazer : 11;
        gameState.barras.lazer = Phaser.Math.Clamp(lazerAtual - reducaoLazer, 0, 11); 

        // Verificar se todas as barras estão zeradas para voltar à cena principal
        const barrasZero = 
          gameState.barras.comida <= 0 &&
          gameState.barras.lazer <= 0 &&
          gameState.barras.limpeza <= 0 &&
          gameState.barras.saude <= 0;

        let imagemFeedback = estrelas === 3 ? "feeedback3estrelas" : (estrelas === 2 ? "feedback2estrelas" : "feedback1estrela");

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(100).setScrollFactor(0).setInteractive(); 

        const telaFeedback = this.add.image(cx, cy, imagemFeedback).setDepth(101).setScrollFactor(0).setInteractive();
        const escalaFinal = Math.min((this.scale.width * 0.8) / telaFeedback.width, (this.scale.height * 0.8) / telaFeedback.height);
        telaFeedback.setScale(escalaFinal);

        // TEXTOS NO POPUP DE FINALIZAÇÃO
        // Posição correspondente à palavra "PONTOS/MOEDAS" do asset
        let posMoedasY = cy + (telaFeedback.displayHeight * 0.12);
        this.add.text(cx -12, posMoedasY, `${moedas} Moedas`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

        // Posição correspondente à palavra "TEMPO" do asset
        let posTempoY = cy - 20 + (telaFeedback.displayHeight * 0.35); 
        this.add.text(cx, posTempoY, `${gameState.tempoLazerTotal}s`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);


        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Clique ou ESPAÇO para continuar ]", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "15px",
            color: "#ffffff"
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        
        this.tweens.add({ targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const voltarParaMenu = () => {
            if (barrasZero) {
                this.scene.start("cenaPrincipal");
            } else {
                this.scene.start("cenaLazer"); 
            }
        };
        
        fundoFeedback.on('pointerdown', voltarParaMenu);
        telaFeedback.on('pointerdown', voltarParaMenu);
        this.time.delayedCall(200, () => { this.input.keyboard.once('keydown-SPACE', voltarParaMenu); });
    }
    
    // Funções auxiliares para cálculo de progresso e recompensas
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