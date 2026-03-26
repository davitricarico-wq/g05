import { gameState } from "../main.js"; // Ajuste os '../' se o caminho for diferente!

export class jogoLazer extends Phaser.Scene {
    constructor() {
        super({ key: "jogoLazer" });
    }

    /**
     * O init() é executado TODA VEZ que a cena é (re)iniciada.
     * É o lugar certo para resetar variáveis de pontuação e estado!
     */
    init() {
        this.pontos = 0; 
        this.instrucoesLidas = false;
        this.jogoAcabou = false;
        this.minigameFinalizado = false;
    }

    create() {
        // Para garantir que a HUD não fique ativa ao iniciar
        this.scene.stop("HUD");

        // Botão voltar
        this.botaoVoltar = this.add.text(60, 50, "Voltar", {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true });

        this.botaoVoltar.on("pointerover", () => this.botaoVoltar.setStyle({ color: "#ffdd00" }));
        this.botaoVoltar.on("pointerout",  () => this.botaoVoltar.setStyle({ color: "#ffffff" }));
        this.botaoVoltar.on("pointerdown", () => this.scene.start("cenaLazer"));

        this.physics.world.gravity.y = 800;

        // --------------- MÚSICA ----------------
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

        const largura = this.scale.width;
        const altura = this.scale.height;

        // ---------------- CENÁRIO E BACKGROUND ----------------
        const alturaImgBg = this.textures.get("bgLazer").getSourceImage().height;
        const escalaBg = altura / alturaImgBg;

        this.fundo = this.add.tileSprite(0, 0, 8000, altura, "bgLazer").setOrigin(0, 0);
        this.fundo.setTileScale(escalaBg, escalaBg); 

        const alturaDoChao = altura * 0.9;
        
        // Limites do mundo físico e da câmera
        this.physics.world.setBounds(0, 0, 8000, alturaDoChao);
        this.cameras.main.setBounds(0, 0, 8000, altura);

        // ---------------- CACHORRO (JOGADOR) ----------------
        // Define qual sprite usar baseado no gameState
        const spriteCorrendo = gameState.pets.cachorroHeroi ? 'cachorroHeroiCorrendo' : 'cachorroCorrendo'; 

        this.cachorro = this.physics.add.sprite(largura * 0.15, alturaDoChao - 200, spriteCorrendo);
        this.cachorro.setCollideWorldBounds(true);
        this.cachorro.setScale(0.5); 
        this.cachorro.setDepth(10); 
        
        // Ajuste da Hitbox do Cachorro
        let dogW = this.cachorro.width;
        let dogH = this.cachorro.height;
        this.cachorro.body.setSize(dogW * 0.7, dogH * 0.5);
        this.cachorro.body.setOffset(dogW * 0.15, dogH * 0.5);

        // Remove a animação 'correr' anterior se existir (evita erro ao reiniciar a cena com outro cachorro)
        if (this.anims.exists('correr')) {
            this.anims.remove('correr');
        }

        // Animação de corrida (agora usa a variável spriteCorrendo)
        this.anims.create({
            key: 'correr',
            frames: this.anims.generateFrameNumbers(spriteCorrendo, { start: 0, end: 1 }),
            frameRate: 7, 
            repeat: -1 
        });
        this.cachorro.anims.play('correr', true);

        // A câmera segue o cachorro
        this.cameras.main.startFollow(this.cachorro, true, 1, 1, -largura * 0.2, 0);
        
        // ---------------- CONTROLES ----------------
        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaSpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // ---------------- GRUPOS DE FÍSICA ----------------
        this.petiscos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.obstaculos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.camasElasticas = this.physics.add.group({ allowGravity: false, immovable: true });

        // Gera os obstáculos e petiscos pela fase
        this.gerarPercurso(alturaDoChao);

        // ---------------- COLISÕES ----------------
        this.physics.add.overlap(this.cachorro, this.petiscos, this.coletarPetisco, null, this);
        this.physics.add.collider(this.cachorro, this.obstaculos, this.baterNoObstaculo, null, this);
        this.physics.add.collider(this.cachorro, this.camasElasticas, this.usarCamaElastica, null, this);

        // ---------------- UI (HUD LOCAL) ----------------
        this.textoPontos = this.add.text(largura - 30, 30, 'Petiscos: 0', { 
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '24px', 
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

        // ---------------- REDIMENSIONAMENTO (RESIZE) ----------------
        const handleResizeLazer = (tamanhoTela) => {
            const { width: w, height: h } = tamanhoTela;
            this.fundo.setSize(8000, h);
            const novaEscalaBg = h / alturaImgBg;
            this.fundo.setTileScale(novaEscalaBg, novaEscalaBg);

            const novaAlturaDoChao = h * 0.9;
            this.physics.world.setBounds(0, 0, 8000, novaAlturaDoChao);
            this.cameras.main.setBounds(0, 0, 8000, h);
            
            this.textoPontos.setPosition(w - 30, 30);
            this.botaoVoltar.setPosition(60, 50);

            // Resize das instruções, se estiverem abertas
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

        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeLazer);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });
        
        this.scene.stop("HUD");

        // --- MOSTRA INSTRUÇÕES E DEPOIS PAUSA O JOGO ---
        this.mostrarInstrucoes();
        this.physics.pause();
        this.cachorro.anims.pause();
    }

    update() {
        if (!this.instrucoesLidas || this.jogoAcabou) return; 

        // --- VERIFICA SE PASSOU DIRETO PELO PETISCÃO (DERROTA) ---
        if (this.petiscaoFinal && this.petiscaoFinal.active) {
            if (this.cachorro.x > this.petiscaoFinal.x + 100) {
                this.scene.restart(); 
            }
        }

        // --- VELOCIDADE PROGRESSIVA ---
        let velocidadeAtual = Math.min(300 + (this.cachorro.x * 0.05), 700);
        this.cachorro.setVelocityX(velocidadeAtual);
        
        this.cachorro.anims.timeScale = velocidadeAtual / 300; 

        const noChao = this.cachorro.body.blocked.down || this.cachorro.body.touching.down;

        // --- CONTROLES (Agora com a tecla Espaço!) ---
        const querPular = this.teclado.up.isDown || Phaser.Input.Keyboard.JustDown(this.teclaSpace);
        
        if (querPular) {
            this.pular();
        } else if (this.teclado.down.isDown) {
            this.abaixar(noChao);
        } else {
            this.cachorro.setScale(0.5, 0.5); 
        }

        // --- CONTROLE DE ANIMAÇÕES ---
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

    // ========================================================
    //                  TUTORIAL / INSTRUÇÕES
    // ========================================================
    mostrarInstrucoes() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // Fundo escurecido
        this.fundoInstrucao = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85)
            .setDepth(200)
            .setScrollFactor(0)
            .setInteractive(); 

        // Imagem de instrução
        this.imgInstrucao = this.add.image(cx, cy, "comoJogarLazer")
            .setDepth(201)
            .setScrollFactor(0)
            .setInteractive();

        // Ajuste de escala responsiva
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaX = limiteLargura / this.imgInstrucao.width;
        const escalaY = limiteAltura / this.imgInstrucao.height;
        this.imgInstrucao.setScale(Math.min(escalaX, escalaY));

        // Texto pulsante
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
        
        // Delay rápido para evitar que o clique na tela anterior acione o pulo das instruções sem querer
        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', iniciar);
        });
    }

    iniciarMinigameAposInstrucoes() {
        this.instrucoesLidas = true;
        this.physics.resume();
        this.cachorro.anims.resume();
    }
    // ========================================================

    pular() {
        if (this.jogoAcabou) return; 

        const noChao = this.cachorro.body.blocked.down || this.cachorro.body.touching.down;

        if (noChao) {
            this.cachorro.setVelocityY(-550);
            this.cachorro.setFrame(0); 
        }
    }

    abaixar(noChao) {
        if (this.jogoAcabou) return;

        if (!noChao) {
            this.cachorro.setVelocityY(1000); 
        } 
        
        this.cachorro.setScale(0.5, 0.41); 
    }

    gerarPercurso(alturaDoChao) {
        let fimDaFase = 7000;
        let tiposPetiscos = [true, true, true, false, false, false, false, false];
        
        Phaser.Utils.Array.Shuffle(tiposPetiscos);

        for (let x = 600; x <= fimDaFase; x += 800) {
            let posX = x + 400; 

            if (x === fimDaFase) {
                let cama = this.camasElasticas.create(posX, alturaDoChao - 60, 'camaElastica').setScale(0.4).setDepth(5);
                cama.body.setSize(cama.width * 0.4, cama.height * 0.1); 
                cama.body.setOffset(cama.width * 0.4, cama.height * 0.5); 

                let yPetiscao = alturaDoChao - 450; 
                let petiscoAlto = this.petiscos.create(posX + 300, yPetiscao, 'petisco').setScale(0.3).setDepth(5);
                
                petiscoAlto.body.setSize(petiscoAlto.width * 0.6, petiscoAlto.height * 0.6);
                petiscoAlto.body.setOffset(petiscoAlto.width * 0.2, petiscoAlto.height * 0.2);
                
                petiscoAlto.tint = 0xffd700; 
                petiscoAlto.isSuper = true;

                this.petiscaoFinal = petiscoAlto;
            } 
            else {
                let obs = this.obstaculos.create(posX, alturaDoChao - 50, 'obstaculo').setScale(2).setDepth(5);
                let raio = obs.width * 0.30; 
                obs.body.setCircle(raio, obs.width * 0.35, obs.height * 0.4);

                let yPetisco = alturaDoChao - 150; 
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

    usarCamaElastica(cachorro, cama) {
        if (cachorro.body.velocity.y >= 0) {
            const constanteElasticaK = 800;  
            const deformacaoX = 0.6;         
            const forcaElastica = constanteElasticaK * deformacaoX; 
            const puloBase = 550;
            const velocidadeFinal = -(puloBase + forcaElastica); 
            
            cachorro.setVelocityY(velocidadeFinal);
            cachorro.setScale(0.5, 0.5); 
            cachorro.setFrame(0); 
        }
    }

    coletarPetisco(cachorro, petisco) {
        petisco.disableBody(true, true); 
        
        if (petisco.isEstragado) {
            this.pontos = Math.max(0, this.pontos - 1);
            this.textoPontos.setText('Petiscos: ' + this.pontos);
            
            cachorro.tint = 0xff0000;
            this.time.delayedCall(500, () => {
                cachorro.clearTint(); 
            });

        } else {
            this.pontos += 1;
            this.textoPontos.setText('Petiscos: ' + this.pontos);
            
            if (petisco.isSuper) {
                this.vencerJogo();
            }
        }
        
        this.events.emit("atualizarHUD"); 
    }

    baterNoObstaculo(cachorro, obstaculo) {
        this.scene.restart();
    }

    vencerJogo() {
        if (this.jogoAcabou) return; 
        this.jogoAcabou = true;

        this.physics.pause();
        this.cachorro.anims.pause();

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
    
    finalizarMinigame() {
        if (this.minigameFinalizado) return;
        this.minigameFinalizado = true;
        this.input.setDefaultCursor("default");

        const estrelas = this.calcularEstrelas(this.pontos);
        const moedas = this.calcularMoedas(estrelas);
        const reducaoLazer = this.calcularLazer(estrelas);

        const cachorroAtivo = gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo';
        if (!gameState.recompensas.lazer[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.lazer[cachorroAtivo] = true;
        }

        let lazerAtual = gameState.barras.lazer !== undefined ? gameState.barras.lazer : 11;
        let novoLazer = lazerAtual - reducaoLazer;
        gameState.barras.lazer = Phaser.Math.Clamp(novoLazer, 0, 11); 

        // --- LÓGICA DA TELA DE FEEDBACK ---
        
        let imagemFeedback = "";
        
        if (estrelas === 3) {
            imagemFeedback = "feeedback3estrelas"; 
        } else if (estrelas === 2) {
            imagemFeedback = "feedback2estrelas";
        } else {
            imagemFeedback = "feedback1estrela";
        }

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(100)
            .setScrollFactor(0)
            .setInteractive(); 

        const telaFeedback = this.add.image(cx, cy, imagemFeedback)
            .setDepth(101)
            .setScrollFactor(0)
            .setInteractive();

        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;

        const escalaX = limiteLargura / telaFeedback.width;
        const escalaY = limiteAltura / telaFeedback.height;

        const escalaFinal = Math.min(escalaX, escalaY);
        telaFeedback.setScale(escalaFinal);

        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Clique ou aperte ESPACO para continuar ]", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "15px",
            color: "#ffffff"
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        
        this.tweens.add({
            targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1
        });

        const voltarParaMenu = () => {
            this.scene.start("cenaLazer");
        };

        fundoFeedback.on('pointerdown', voltarParaMenu);
        telaFeedback.on('pointerdown', voltarParaMenu);

        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', voltarParaMenu);
        });

    }
    
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