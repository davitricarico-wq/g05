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
        // Define a chave única da cena no gerenciador do Phaser
        super({ key: "jogoLazer" });
    }

    /**
     * @method init
     * @description Inicializa e reseta variáveis de estado toda vez que a cena começa.
     * Crucial para evitar bugs quando o jogador morre e a fase é reiniciada.
     */
    init() {
        this.pontos = 0; 
        
        // Flags de Controle de Fluxo
        this.instrucoesLidas = false;
        this.ganhou = false; 
        this.jogoAcabou = false; 
        this.minigameFinalizado = false;
        this.isPropulsao = false; // Controle de animação travada na cama elástica
        
        this.ultimoTempoMs = 0; 

        // Reseta o tempo global do minigame para não acumular de tentativas anteriores falhas
        gameState.tempoLazerTotal = 0; 
    }

    /**
     * @method create
     * @description Constrói os elementos visuais, a física, os inputs e a UI do jogo.
     */
    create() {
        // Desativa a HUD principal do pet virtual para focar na interface limpa do minigame
        this.scene.stop("HUD");

        // Sistema de áudio global
        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        // === UI: BOTÃO VOLTAR ===
        // Criado com interatividade e feedback visual (Hover) para boa UX
        this.botaoVoltar = this.add.text(60, 50, "Voltar", {
            fontFamily: "Arial", fontSize: "24px", color: "#ffffff",
            stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true });

        this.botaoVoltar.on("pointerover", () => this.botaoVoltar.setStyle({ color: "#ffdd00" }));
        this.botaoVoltar.on("pointerout",  () => this.botaoVoltar.setStyle({ color: "#ffffff" }));
        this.botaoVoltar.on("pointerdown", () => {
            this.scene.start("cenaLazer"); // Aborta o jogo e volta pro menu de lazer
        });

        // === CONFIGURAÇÃO DO MUNDO FÍSICO ===
        this.physics.world.gravity.y = 800; // Gravidade padrão para o pulo ter um "peso" agradável

        // Calcula dinamicamente o tamanho da tela para o cenário responsivo
        const largura = this.scale.width;
        const altura = this.scale.height;
        const alturaImgBg = this.textures.get("bgLazer").getSourceImage().height;
        const escalaBg = altura / alturaImgBg;

        // TileSprite cria um fundo que pode se repetir infinitamente (ótimo para runners)
        this.fundo = this.add.tileSprite(0, 0, 8000, altura, "bgLazer").setOrigin(0, 0);
        this.fundo.setTileScale(escalaBg, escalaBg); 

        // Define as barreiras invisíveis do mundo (limite da fase é 8000px de largura)
        const alturaDoChao = altura * 0.9;
        this.physics.world.setBounds(0, 0, 8000, alturaDoChao);
        this.cameras.main.setBounds(0, 0, 8000, altura);

        // === JOGADOR (Cachorro) ===
        // Puxa o sprite correto dependendo da evolução do pet no estado global
        const spriteCorrendo = gameState.pets.cachorroJoao ? 'cachorroJoaoCorrendo' : (gameState.pets.cachorroHeroi ? 'cachorroHeroiCorrendo' : 'cachorroCorrendo'); 

        this.cachorro = this.physics.add.sprite(largura * 0.15, alturaDoChao - 200, spriteCorrendo);
        this.cachorro.setCollideWorldBounds(true); // Impede de cair para fora do chão definido
        this.cachorro.setDepth(10); 
        
        // Define a proporção visual do pet selecionado
        this.escalaBase = gameState.pets.cachorroJoao ? 0.7 : (gameState.pets.cachorroHeroi ? 0.18 : 0.5);
        this.cachorro.setScale(this.escalaBase); 
        
        // Ajuste fino da Hitbox (Caixa de Colisão):
        // É diminuída em relação ao tamanho da imagem para ser mais "justa" com o jogador (Forgiving UI)
        let dogW = this.cachorro.width;
        let dogH = this.cachorro.height;
        this.cachorro.body.setSize(dogW * 0.7, dogH * 0.5);
        this.cachorro.body.setOffset(dogW * 0.15, dogH * 0.5);

        // Sistema de Animação de corrida infinita
        if (this.anims.exists('correr')) this.anims.remove('correr');

        this.anims.create({
            key: 'correr',
            frames: this.anims.generateFrameNumbers(spriteCorrendo, { start: 0, end: 1 }),
            frameRate: 7, 
            repeat: -1 
        });
        this.cachorro.anims.play('correr', true);

        // A câmera segue o jogador com um offset, deixando mais espaço na frente para ver obstáculos
        this.cameras.main.startFollow(this.cachorro, true, 1, 1, -largura * 0.2, 0);
        
        // === CONTROLES ===
        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaSpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // === OBJETOS DO CENÁRIO ===
        // Grupos sem gravidade e imóveis (não são empurrados pelo jogador)
        this.petiscos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.obstaculos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.camasElasticas = this.physics.add.group({ allowGravity: false, immovable: true });

        this.gerarPercurso(alturaDoChao);

        // Regras de colisão do motor físico (Arcade Physics)
        this.physics.add.overlap(this.cachorro, this.petiscos, this.coletarPetisco, null, this);
        this.physics.add.collider(this.cachorro, this.obstaculos, this.baterNoObstaculo, null, this);
        this.physics.add.collider(this.cachorro, this.camasElasticas, this.usarCamaElastica, null, this);

        // === HUD INTERNA ===
        this.textoPontos = this.add.text(largura - 30, 30, 'Petiscos: 0', { 
            fontFamily: '"Press Start 2P", monospace', fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

        this.textoTempo = this.add.text(largura / 2, 30, `Tempo: ${gameState.tempoLazerTotal}s`, { 
            fontFamily: '"Press Start 2P", monospace', fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(20);

        /**
         * @callback handleResizeLazer
         * @description Mantém o jogo responsivo ajustando câmera, fundo e HUD
         */
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

            // Reajusta a tela de instruções se ela estiver ativa
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

        // Prevenção de Memory Leak: Limpa listeners se a cena for desligada
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeLazer);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });
        
        // Pausa a física e exibe o tutorial antes da corrida iniciar de fato
        this.mostrarInstrucoes();
        this.physics.pause();
        this.cachorro.anims.pause();
    }

    /**
     * @method update
     * @description Game Loop (executado a ~60 FPS). Controla a progressão e inputs contínuos.
     */
    update() {
        if (!this.instrucoesLidas || this.jogoAcabou) return; 

        // Lógica de cronômetro local baseada no clock interno do Phaser
        const agora = this.time.now;
        if (agora - this.ultimoTempoMs >= 1000) {
            const segundosPassados = Math.floor((agora - this.ultimoTempoMs) / 1000);
            gameState.tempoLazerTotal += segundosPassados;
            this.ultimoTempoMs = agora;
            this.textoTempo.setText(`Tempo: ${gameState.tempoLazerTotal}s`);
        }

        // Fail-safe: Se o jogador bugar e passar reto do item final da vitória, reseta o jogo
        if (this.petiscaoFinal && this.petiscaoFinal.active) {
            if (this.cachorro.x > this.petiscaoFinal.x + 100) {
                this.scene.restart(); 
            }
        }

        // Dificuldade Progressiva: Fica mais rápido conforme avança no eixo X (até um limite de 700)
        let velocidadeAtual = Math.min(300 + (this.cachorro.x * 0.05), 700);
        this.cachorro.setVelocityX(velocidadeAtual);
        // Aumenta a velocidade da animação em proporção à velocidade de movimento (feedback visual realista)
        this.cachorro.anims.timeScale = velocidadeAtual / 300; 

        const noChao = this.cachorro.body.blocked.down || this.cachorro.body.touching.down;

        // Trava os controles e encerra se o jogador pegar o super petisco final e tocar no chão
        if (this.ganhou) {
            if (noChao) {
                this.jogoAcabou = true;
                this.physics.pause();
                this.cachorro.anims.pause();
                this.mostrarTextoVitoria();
            }
            return; 
        }

        // === PROCESSAMENTO DE INPUTS ===
        const querPular = this.teclado.up.isDown || Phaser.Input.Keyboard.JustDown(this.teclaSpace);
        
        if (querPular) {
            this.pular();
        } else if (this.teclado.down.isDown) {
            this.abaixar(noChao);
        } else {
            // Retorna o cachorro à escala e forma normais ao soltar os botões
            this.cachorro.setScale(this.escalaBase, this.escalaBase); 
        }

        // Lógica visual da animação (Pausa a perna do cachorro quando está voando)
        if (!noChao) {
            this.cachorro.anims.pause(this.cachorro.anims.currentAnim.frames[0]);
        } else {
            if (this.cachorro.anims.isPaused) this.cachorro.anims.resume();
            if (!this.cachorro.anims.isPlaying) this.cachorro.play('correr', true);
        }
    }

    /**
     * @method mostrarInstrucoes
     * @description Exibe o tutorial em uma modal. Bloqueia o jogo até interação do usuário.
     */
    mostrarInstrucoes() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.fundoInstrucao = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85)
            .setDepth(200).setScrollFactor(0).setInteractive(); 

        this.imgInstrucao = this.add.image(cx, cy, "comoJogarLazer")
            .setDepth(201).setScrollFactor(0).setInteractive();

        // Responsive 'contain' logic para a imagem de instruções
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaFinal = Math.min(limiteLargura / this.imgInstrucao.width, limiteAltura / this.imgInstrucao.height);
        this.imgInstrucao.setScale(escalaFinal);

        this.textoIniciar = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 40, "[ Clique ou aperte ESPAÇO para começar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
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
        if (noChao) {
            this.cachorro.setVelocityY(-550); // Aplica o vetor de força pra cima
            this.cachorro.setFrame(0); 
        }
    }

    /**
     * @method abaixar
     * @description Se no ar, força a queda rápida (Dive). Se no chão, "esmaga" 
     * a escala vertical do sprite para ele passar por baixo de coisas.
     */
    abaixar(noChao) {
        if (this.jogoAcabou) return;
        if (!noChao) {
            this.cachorro.setVelocityY(1000); // Queda brusca
        } 
        
        // Esmaga a altura em 18% para criar o efeito visual de rastejar
        this.cachorro.setScale(this.escalaBase, this.escalaBase * 0.82); 
    }

    /**
     * @method gerarPercurso
     * @description Instancia todos os obstáculos e itens baseados em posições de X.
     * Gera uma distribuição semi-aleatória ("Shuffle" garante que terá itens bons e estragados na fase).
     */
    gerarPercurso(alturaDoChao) {
        let fimDaFase = 7000;
        // Array fixo de probabilidades para garantir balanceamento (Nunca terá só ruins ou só bons)
        let tiposPetiscos = [true, true, true, false, false, false, false, false];
        Phaser.Utils.Array.Shuffle(tiposPetiscos); // Embaralha a ordem

        for (let x = 600; x <= fimDaFase; x += 800) {
            let posX = x + 400; 

            if (x === fimDaFase) {
                // Instancia o Desafio Final (Cama Elástica + Super Petisco)
                let cama = this.camasElasticas.create(posX, alturaDoChao - 60, 'camaElastica').setScale(0.4).setDepth(5);
                cama.body.setSize(cama.width * 0.4, cama.height * 0.1); 
                cama.body.setOffset(cama.width * 0.4, cama.height * 0.5); 

                let yPetiscao = alturaDoChao - 400; 
                let petiscoAlto = this.petiscos.create(posX + 350, yPetiscao, 'petisco').setScale(0.3).setDepth(5);
                petiscoAlto.body.setSize(petiscoAlto.width * 0.6, petiscoAlto.height * 0.6);
                petiscoAlto.body.setOffset(petiscoAlto.width * 0.2, petiscoAlto.height * 0.2);
                petiscoAlto.tint = 0xffd700; // Coloração dourada para destacar a vitória
                petiscoAlto.isSuper = true;
                this.petiscaoFinal = petiscoAlto; // Guarda referência para garantir o win no Update()
            } else {
                // Instancia um obstáculo terrestre
                let obs = this.obstaculos.create(posX, alturaDoChao - 50, 'obstaculo').setScale(2).setDepth(5);
                let raio = obs.width * 0.30; 
                obs.body.setCircle(raio, obs.width * 0.35, obs.height * 0.4); // Hitbox circular perdoa pequenos erros do jogador

                // Instancia um petisco no ar
                let yPetisco = alturaDoChao - 180; 
                let petisco = this.petiscos.create(x, yPetisco, 'petisco').setScale(0.15).setDepth(5);
                petisco.body.setSize(petisco.width * 0.6, petisco.height * 0.6);
                petisco.body.setOffset(petisco.width * 0.2, petisco.height * 0.2);

                let ehEstragado = tiposPetiscos.shift(); // Pega do array embaralhado
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
     * @description Desativa a física padrão da Arcade e realiza um cálculo matemático 
     * cinematemático manual para garantir que o pulo final caia exatamente no lugar certo.
     */
    usarCamaElastica(cachorro, cama) {
        if (this.isPropulsao || this.jogoAcabou || this.ganhou) return;
        this.isPropulsao = true; // Trava outras ações
        cachorro.body.moves = false; // Desativa motor de física nativo

        const xi = cachorro.x;
        const yi = cachorro.y;
        const duracaoTotal = 0.3; // Segundos que o salto deve durar
        const xf = xi + 150;      // Distância que ele vai pular pra frente
        const yf = yi - 100;      // Altura do salto

        // Fórmulas de cinemática (MRUV)
        const velocidadeX = (xf - xi) / duracaoTotal;
        const aceleracaoY = (2 * (yf - yi)) / Math.pow(duracaoTotal, 2);

        let tempoAtual = 0;
        let tempoAnterior = performance.now();

        // Loop customizado usando o renderizador do navegador
        const atualizarFrame = (tempoFrame) => {
            let dt = (tempoFrame - tempoAnterior) / 1000; 
            tempoAnterior = tempoFrame;
            tempoAtual += dt;

            if (tempoAtual > duracaoTotal) tempoAtual = duracaoTotal;

            // Aplica as posições frame a frame
            cachorro.x = xi + (velocidadeX * tempoAtual);
            cachorro.y = yi + (aceleracaoY * Math.pow(tempoAtual, 2)) / 2;

            if (tempoAtual < duracaoTotal) {
                requestAnimationFrame(atualizarFrame); 
            } else {
                // Finaliza o salto e devolve o controle da física ao Phaser
                cachorro.body.moves = true;
                cachorro.setVelocityY(aceleracaoY * tempoAtual); 
                this.time.delayedCall(1000, () => { this.isPropulsao = false; });
            }
        };
        requestAnimationFrame(atualizarFrame);
    }

    /**
     * @method coletarPetisco
     * @description Lógica de recompensa. Penaliza o score e pinta o pet de vermelho se for veneno.
     */
    coletarPetisco(cachorro, petisco) {
        petisco.disableBody(true, true); // Some com o objeto com segurança

        if (petisco.isEstragado) {
            this.pontos = Math.max(0, this.pontos - 1); // Evita score negativo
            cachorro.tint = 0xff0000; // Feedback visual de dano
            this.time.delayedCall(500, () => { cachorro.clearTint(); }); // Remove a cor após meio segundo
        } else {
            this.pontos += 1;
            if (petisco.isSuper) this.vencerJogo(); // Se pegou o ouro do final, aciona a vitória
        }
        
        this.textoPontos.setText('Petiscos: ' + this.pontos);
        this.events.emit("atualizarHUD"); 
    }

    baterNoObstaculo() {
        // Punição severa (Morte súbita) - Reinicia a cena limpa
        this.scene.restart();
    }

    vencerJogo() {
        if (this.jogoAcabou) return; 
        this.ganhou = true; // Trigger que vai ser lido no Update() quando ele tocar o chão
    }

    mostrarTextoVitoria() {
        const meioX = this.cameras.main.worldView.x + (this.scale.width / 2);
        const meioY = this.scale.height / 2;

        this.add.text(meioX, meioY, 'FASE CONCLUIDA!', {
            fontFamily: '"Press Start 2P", monospace', fontSize: '40px', fill: '#00ff00',
            stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(30);
        
        // Segura a tela por 2 segundos pra admiração antes de ir pra tela de pontuação
        this.time.delayedCall(2000, () => {
            this.finalizarMinigame();
        });
    }
    
    /**
     * @method finalizarMinigame
     * @description Calcula os bônus ganhos, atualiza os status globais (fome, lazer, etc) 
     * e decide para qual tela o usuário deve ir.
     */
    finalizarMinigame() {
        if (this.minigameFinalizado) return;
        this.minigameFinalizado = true;

        const estrelas = this.calcularEstrelas(this.pontos);
        const moedas = this.calcularMoedas(estrelas);
        const reducaoLazer = this.calcularLazer(estrelas);

        // Dar Moedas apenas na primeira vitória do pet na sessão atual
        const cachorroAtivo = gameState.pets.cachorroJoao ? 'joao' : (gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo');
        if (!gameState.recompensas.lazer[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.lazer[cachorroAtivo] = true;
        }

        // Reduz a "fome de brincadeira" do pet com base na performance
        // (No jogo, barras zeradas = Pet Feliz/Satisfeito)
        let lazerAtual = gameState.barras.lazer !== undefined ? gameState.barras.lazer : 11;
        gameState.barras.lazer = Phaser.Math.Clamp(lazerAtual - reducaoLazer, 0, 11); 

        // Checa se o usuário zerou todas as necessidades (condição para liberar coisas extras ou voltar pra home geral)
        const barrasZero = 
          gameState.barras.comida <= 0 &&
          gameState.barras.lazer <= 0 &&
          gameState.barras.limpeza <= 0 &&
          gameState.barras.saude <= 0;

        // === CONSTRUÇÃO DO POPUP FINAL ===
        let imagemFeedback = estrelas === 3 ? "feeedback3estrelas" : (estrelas === 2 ? "feedback2estrelas" : "feedback1estrela");

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(100).setScrollFactor(0).setInteractive(); 

        const telaFeedback = this.add.image(cx, cy, imagemFeedback).setDepth(101).setScrollFactor(0).setInteractive();
        const escalaFinal = Math.min((this.scale.width * 0.8) / telaFeedback.width, (this.scale.height * 0.8) / telaFeedback.height);
        telaFeedback.setScale(escalaFinal);

        // Alinhamento dinâmico dos textos baseados nas fatias (proporção) da imagem de fundo
        let posMoedasY = cy + (telaFeedback.displayHeight * 0.12);
        this.add.text(cx -12, posMoedasY, `${moedas} Moedas`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

        let posTempoY = cy - 20 + (telaFeedback.displayHeight * 0.35); 
        this.add.text(cx, posTempoY, `${gameState.tempoLazerTotal}s`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Clique ou ESPAÇO para continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        
        this.tweens.add({ targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        // Função de Saída (Roteamento)
        const voltarParaMenu = () => {
            if (barrasZero) {
                this.scene.start("cenaPrincipal"); // Se acabou os afazeres, volta ao quarto do pet
            } else {
                this.scene.start("cenaLazer"); // Senão, volta ao menu de lazer
            }
        };
        
        fundoFeedback.on('pointerdown', voltarParaMenu);
        telaFeedback.on('pointerdown', voltarParaMenu);
        this.time.delayedCall(200, () => { this.input.keyboard.once('keydown-SPACE', voltarParaMenu); });
    }
    
    // Regras matemáticas de pontuação e recompensa baseadas em "Score vs Target"
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
        if (estrelas === 3) return 11; // Satisfez o pet completamente
        if (estrelas === 2) return 5;  
        return 2; // Desempenho ruim ganha pouca recompensa nas barras
    }
}