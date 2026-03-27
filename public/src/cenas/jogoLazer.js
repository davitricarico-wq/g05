import { gameState } from "../main.js"; // Ajuste os '../' se o caminho for diferente

export class jogoLazer extends Phaser.Scene {
    constructor() {
        super({ key: "jogoLazer" });
    }

    // Inicializa variaveis de controle de estado do jogo
    init() {
        this.pontos = 0; 
        this.instrucoesLidas = false;
        this.ganhou = false; // Indica se pegou o petisco final e esta no salto da vitoria
        this.jogoAcabou = false; // Indica se o jogo realmente deve parar
        this.minigameFinalizado = false;
        this.isPropulsao = false; // Trava para a animacao matematica da cama elastica
    }

    create() {
        // Garante que a HUD nao fique ativa ao iniciar
        this.scene.stop("HUD");

        // Configura o botao de voltar ao menu
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

        // Define gravidade do mundo
        this.physics.world.gravity.y = 800;

        // Gerencia musica da fase
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

        // Configura cenario e background
        const alturaImgBg = this.textures.get("bgLazer").getSourceImage().height;
        const escalaBg = altura / alturaImgBg;

        // Aumentado o cenario para 9000 para dar espaco para a parabola inteira
        this.fundo = this.add.tileSprite(0, 0, 9000, altura, "bgLazer").setOrigin(0, 0);
        this.fundo.setTileScale(escalaBg, escalaBg); 

        const alturaDoChao = altura * 0.9;
        
        // Limites do mundo fisico e da camera
        this.physics.world.setBounds(0, 0, 9000, alturaDoChao);
        this.cameras.main.setBounds(0, 0, 9000, altura);

        // Instancia o sprite do cachorro baseando-se no gameState
        const spriteCorrendo = gameState.pets.cachorroHeroi ? 'cachorroHeroiCorrendo' : 'cachorroCorrendo'; 

        this.cachorro = this.physics.add.sprite(largura * 0.15, alturaDoChao - 200, spriteCorrendo);
        this.cachorro.setCollideWorldBounds(true);
        this.cachorro.setScale(0.5); 
        this.cachorro.setDepth(10); 
        
        // Ajuste da hitbox do jogador
        let dogW = this.cachorro.width;
        let dogH = this.cachorro.height;
        this.cachorro.body.setSize(dogW * 0.7, dogH * 0.5);
        this.cachorro.body.setOffset(dogW * 0.15, dogH * 0.5);

        // Remove animacao anterior e recria
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

        // Configura a camera para seguir o cachorro
        this.cameras.main.startFollow(this.cachorro, true, 1, 1, -largura * 0.2, 0);
        
        // Configura os controles
        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaSpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Cria os grupos de elementos fisicos
        this.petiscos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.obstaculos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.camasElasticas = this.physics.add.group({ allowGravity: false, immovable: true });

        // Gera o nivel proceduralmente
        this.gerarPercurso(alturaDoChao);

        // Adiciona os colisores e overlaps
        this.physics.add.overlap(this.cachorro, this.petiscos, this.coletarPetisco, null, this);
        this.physics.add.collider(this.cachorro, this.obstaculos, this.baterNoObstaculo, null, this);
        this.physics.add.collider(this.cachorro, this.camasElasticas, this.usarCamaElastica, null, this);

        // Configura texto de interface
        this.textoPontos = this.add.text(largura - 30, 30, 'Petiscos: 0', { 
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '24px', 
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

        // Evento de redimensionamento de tela
        const handleResizeLazer = (tamanhoTela) => {
            const { width: w, height: h } = tamanhoTela;
            this.fundo.setSize(9000, h);
            const novaEscalaBg = h / alturaImgBg;
            this.fundo.setTileScale(novaEscalaBg, novaEscalaBg);

            const novaAlturaDoChao = h * 0.9;
            this.physics.world.setBounds(0, 0, 9000, novaAlturaDoChao);
            this.cameras.main.setBounds(0, 0, 9000, h);
            
            this.textoPontos.setPosition(w - 30, 30);
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

        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeLazer);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });
        
        // Exibe instrucoes e pausa tudo
        this.mostrarInstrucoes();
        this.physics.pause();
        this.cachorro.anims.pause();
    }

    update() {
        if (!this.instrucoesLidas || this.jogoAcabou) return; 

        // Checa condicao de derrota (passar direto pelo petisco)
        if (this.petiscaoFinal && this.petiscaoFinal.active && !this.ganhou) {
            if (this.cachorro.x > this.petiscaoFinal.x + 100) {
                this.scene.restart(); 
            }
        }

        // Se estiver executando a animacao matematica nao usa update padrao
        if (this.isPropulsao) return;

        const noChao = this.cachorro.body.blocked.down || this.cachorro.body.touching.down;

        // Logica para garantir que a parabola termine antes de pausar a tela
        if (this.ganhou) {
            if (noChao) {
                this.jogoAcabou = true;
                this.physics.pause();
                this.cachorro.anims.pause();
                this.mostrarTextoVitoria();
            }
            return; // Impede controles enquanto esta caindo apos ganhar
        }

        // Calcula velocidade progressiva baseada na posicao
        let velocidadeAtual = Math.min(300 + (this.cachorro.x * 0.05), 700);
        this.cachorro.setVelocityX(velocidadeAtual);
        this.cachorro.anims.timeScale = velocidadeAtual / 300; 

        // Controles de acao
        const querPular = this.teclado.up.isDown || Phaser.Input.Keyboard.JustDown(this.teclaSpace);
        
        if (querPular) {
            this.pular(noChao);
        } else if (this.teclado.down.isDown) {
            this.abaixar(noChao);
        } else {
            this.cachorro.setScale(0.5, 0.5); 
        }

        // Controle da reproducao de animacoes
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

    // Cria os elementos do painel de instrucoes
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

    // Libera as variaveis fisicas pos-leitura do tutorial
    iniciarMinigameAposInstrucoes() {
        this.instrucoesLidas = true;
        this.physics.resume();
        this.cachorro.anims.resume();
    }

    // Logica de pulo normal do personagem
    pular(noChao) {
        if (this.ganhou || this.jogoAcabou || !noChao) return; 
        this.cachorro.setVelocityY(-550);
        this.cachorro.setFrame(0); 
    }

    // Logica de agachamento/queda rapida
    abaixar(noChao) {
        if (this.ganhou || this.jogoAcabou) return;
        if (!noChao) {
            this.cachorro.setVelocityY(1000); 
        } 
        this.cachorro.setScale(0.5, 0.41); 
    }

    // Gera os obstaculos e petiscos ate o final da fase
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

                // Posicionamento exato para encontrar o apice do salto matematico
                let yPetiscao = alturaDoChao - 350; 
                let petiscoAlto = this.petiscos.create(posX + 350, yPetiscao, 'petisco').setScale(0.3).setDepth(5);
                
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

    // Modela a aceleracao MUV sem biblioteca grafica atendendo ao criterio de avaliacao
    usarCamaElastica(cachorro, cama) {
        if (this.isPropulsao || this.jogoAcabou || this.ganhou) return;
        this.isPropulsao = true;

        // Desliga a fisica nativa para dar lugar a matematica pura
        cachorro.body.moves = false;

        const xi = cachorro.x;
        const yi = cachorro.y;
        
        // Ajuste de altura e velocidade para que a parabola caiba na camera
        const duracaoTotal = 0.3; 
        const xf = xi + 150; 
        const yf = yi - 100; 

        // Eixo X (MU) e Eixo Y (MUV com v0 = 0)
        const velocidadeX = (xf - xi) / duracaoTotal;
        const aceleracaoY = (2 * (yf - yi)) / Math.pow(duracaoTotal, 2);

        let tempoAtual = 0;
        let tempoAnterior = performance.now();

        // Game loop manual da equacao parametrica
        const atualizarFrame = (tempoFrame) => {
            let dt = (tempoFrame - tempoAnterior) / 1000; 
            tempoAnterior = tempoFrame;
            tempoAtual += dt;

            if (tempoAtual > duracaoTotal) {
                tempoAtual = duracaoTotal;
            }

            let posicaoX = xi + (velocidadeX * tempoAtual);
            let velocidadeY = aceleracaoY * tempoAtual; 
            let posicaoY = yi + (aceleracaoY * Math.pow(tempoAtual, 2)) / 2;
            
            // Console.log obrigatorio na rubrica
            console.log(`[Eixo X - MU] Tempo: ${tempoAtual.toFixed(2)}s | Vel X: ${velocidadeX.toFixed(2)} px/s | Pos X: ${posicaoX.toFixed(2)}`);
            console.log(`[Eixo Y - MUV] Tempo: ${tempoAtual.toFixed(2)}s | Acel Y: ${aceleracaoY.toFixed(2)} px/s² | Vel Y: ${velocidadeY.toFixed(2)} px/s | Pos Y: ${posicaoY.toFixed(2)}`);

            cachorro.x = posicaoX;
            cachorro.y = posicaoY;

            if (tempoAtual < duracaoTotal) {
                requestAnimationFrame(atualizarFrame); 
            } else {
                console.log("Animacao matematica concluida. Devolvendo o controle a engine grafica.");
                
                // Religa a fisica devolvendo a velocidade final calculada
                cachorro.body.moves = true;
                cachorro.setVelocityY(velocidadeY); 
                
                this.time.delayedCall(1000, () => { this.isPropulsao = false; });
            }
        };

        requestAnimationFrame(atualizarFrame);
    }

    // Calcula os pontos e condicao de vitoria a partir do overlap
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

    // Reinicia caso bata no obstaculo normal
    baterNoObstaculo(cachorro, obstaculo) {
        if (this.ganhou) return; // Se ja pegou o petisco final, ignora colisoes pequenas
        this.scene.restart();
    }

    // Habilita a condicao de fim de fase (aguardara o chao no update)
    vencerJogo() {
        if (this.ganhou) return; 
        this.ganhou = true;
    }

    // Cria os elementos graficos da vitoria
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
    
    // Calcula recompensas e injeta a tela de feedback
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
            .setDepth(100).setScrollFactor(0).setInteractive(); 

        const telaFeedback = this.add.image(cx, cy, imagemFeedback)
            .setDepth(101).setScrollFactor(0).setInteractive();

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
    
    // Modificadores numericos
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