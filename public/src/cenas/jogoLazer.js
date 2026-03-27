// Importa o estado global do jogo
import { gameState } from "../main.js"; 

// Define a classe da cena do minigame de lazer
export class jogoLazer extends Phaser.Scene {
    constructor() {
        super({ key: "jogoLazer" });
    }

    // O metodo init e executado toda vez que a cena e iniciada
    // E o lugar certo para resetar variaveis de pontuacao e estado
    init() {
        this.pontos = 0; 
        this.instrucoesLidas = false;
        this.ganhou = false; // Indica se pegou o petisco final e esta no salto da vitoria
        this.jogoAcabou = false; // Indica se o jogo realmente deve parar
        this.minigameFinalizado = false;
        this.isPropulsao = false; // Trava para a animacao matematica da cama elastica
    }

    // Configura todos os elementos visuais e fisicos quando a cena inicia
    create() {
        // Garante que a interface principal nao fique ativa ao iniciar o minigame
        this.scene.stop("HUD");

        // Cria o botao de voltar no canto superior esquerdo da tela
        this.botaoVoltar = this.add.text(60, 50, "Voltar", {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true });

        // Muda a cor do botao de voltar quando o ponteiro do mouse passa por cima
        this.botaoVoltar.on("pointerover", () => this.botaoVoltar.setStyle({ color: "#ffdd00" }));
        
        // Retorna o botao a cor original quando o mouse sai
        this.botaoVoltar.on("pointerout",  () => this.botaoVoltar.setStyle({ color: "#ffffff" }));
        
        // Executa a acao de sair do minigame e voltar para a cena de lazer
        this.botaoVoltar.on("pointerdown", () => this.scene.start("cenaLazer"));

        // Define a forca da gravidade puxando as coisas para baixo nesta cena
        this.physics.world.gravity.y = 800;

        // Configura e controla a musica de fundo
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

        // Define as medidas da tela baseadas no tamanho atual do jogo
        const largura = this.scale.width;
        const altura = this.scale.height;

        // Calcula a proporcao para a imagem de fundo preencher a tela corretamente
        const alturaImgBg = this.textures.get("bgLazer").getSourceImage().height;
        const escalaBg = altura / alturaImgBg;

        // Adiciona a imagem de fundo que vai se repetindo ao longo da fase
        this.fundo = this.add.tileSprite(0, 0, 8000, altura, "bgLazer").setOrigin(0, 0);
        this.fundo.setTileScale(escalaBg, escalaBg); 

        // Define a altura limite que simula o chao
        const alturaDoChao = altura * 0.9;
        
        // Limita a area do mundo fisico e o quanto a camera pode andar
        this.physics.world.setBounds(0, 0, 8000, alturaDoChao);
        this.cameras.main.setBounds(0, 0, 8000, altura);

        // Define qual imagem de cachorro usar baseado no progresso salvo
        const spriteCorrendo = gameState.pets.cachorroHeroi ? 'cachorroHeroiCorrendo' : 'cachorroCorrendo'; 

        // Cria o jogador com fisica e o posiciona na tela
        this.cachorro = this.physics.add.sprite(largura * 0.15, alturaDoChao - 200, spriteCorrendo);
        this.cachorro.setCollideWorldBounds(true);
        this.cachorro.setScale(0.5); 
        this.cachorro.setDepth(10); 
        
        // Ajusta a caixa de colisao do cachorro para ficar mais precisa
        let dogW = this.cachorro.width;
        let dogH = this.cachorro.height;
        this.cachorro.body.setSize(dogW * 0.7, dogH * 0.5);
        this.cachorro.body.setOffset(dogW * 0.15, dogH * 0.5);

        // Remove a animacao antiga se existir para evitar erros ao reiniciar a cena
        if (this.anims.exists('correr')) {
            this.anims.remove('correr');
        }

        // Cria a animacao do cachorro correndo e ja da o play
        this.anims.create({
            key: 'correr',
            frames: this.anims.generateFrameNumbers(spriteCorrendo, { start: 0, end: 1 }),
            frameRate: 7, 
            repeat: -1 
        });
        this.cachorro.anims.play('correr', true);

        // Configura a camera para seguir os movimentos do cachorro
        this.cameras.main.startFollow(this.cachorro, true, 1, 1, -largura * 0.2, 0);
        
        // Configura as teclas de controle do jogo
        this.teclado = this.input.keyboard.createCursorKeys();
        this.teclaSpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Cria os grupos que vao gerenciar as fisicas dos objetos espalhados pela fase
        this.petiscos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.obstaculos = this.physics.add.group({ allowGravity: false, immovable: true });
        this.camasElasticas = this.physics.add.group({ allowGravity: false, immovable: true });

        // Chama a funcao que espalha os obstaculos e petiscos pela pista
        this.gerarPercurso(alturaDoChao);

        // Define o que acontece quando o cachorro encosta nos elementos da fase
        this.physics.add.overlap(this.cachorro, this.petiscos, this.coletarPetisco, null, this);
        this.physics.add.collider(this.cachorro, this.obstaculos, this.baterNoObstaculo, null, this);
        this.physics.add.collider(this.cachorro, this.camasElasticas, this.usarCamaElastica, null, this);

        // Adiciona o texto de pontuacao fixo na tela
        this.textoPontos = this.add.text(largura - 30, 30, 'Petiscos: 0', { 
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '24px', 
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

        // Funcao para manter tudo organizado se o jogador redimensionar a tela do navegador
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

            // Reajusta a tela de instrucoes caso ela ainda esteja aberta
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

        // Escuta o evento de mudanca de tamanho da tela
        this.scale.on("resize", handleResizeLazer);

        // Remove os ouvintes de evento quando a cena fechar para limpar a memoria
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeLazer);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });
        
        this.scene.stop("HUD");

        // Mostra a tela de instrucoes e congela a fisica e as animacoes ate o jogador iniciar
        this.mostrarInstrucoes();
        this.physics.pause();
        this.cachorro.anims.pause();
    }

    // Atualiza as acoes do jogo repetidamente a cada quadro
    update() {
        // Ignora os updates se o jogador ainda estiver lendo as instrucoes ou se ja perdeu/ganhou
        if (!this.instrucoesLidas || this.jogoAcabou) return; 

        // Confere se o jogador vacilou e passou direto pelo petiscao final
        if (this.petiscaoFinal && this.petiscaoFinal.active) {
            if (this.cachorro.x > this.petiscaoFinal.x + 100) {
                // Reinicia a fase como punicao
                this.scene.restart(); 
            }
        }

        // Calcula a velocidade do cachorro que aumenta conforme ele avanca no percurso
        let velocidadeAtual = Math.min(300 + (this.cachorro.x * 0.05), 700);
        this.cachorro.setVelocityX(velocidadeAtual);
        
        // Acelera a animacao das patas para condizer com a velocidade de movimento
        this.cachorro.anims.timeScale = velocidadeAtual / 300; 

        // Descobre se o cachorro esta tocando o chao no momento
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
            // Restaura o tamanho normal do cachorro caso nao esteja agachando
            this.cachorro.setScale(0.5, 0.5); 
        }

        // Controla quando a animacao de corrida deve rodar ou pausar
        if (!noChao) {
            // Pausa a animacao quando esta no ar
            this.cachorro.anims.pause(this.cachorro.anims.currentAnim.frames[0]);
        } else {
            // Despausa e garante que ele volte a mexer as pernas ao tocar no chao
            if (this.cachorro.anims.isPaused) {
                this.cachorro.anims.resume();
            }
            if (!this.cachorro.anims.isPlaying) {
                this.cachorro.play('correr', true);
            }
        }
    }

    // Cria a tela inicial de introducao e ensina o jogador a jogar
    mostrarInstrucoes() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // Cria um fundo escuro que bloqueia os cliques no jogo atras dele
        this.fundoInstrucao = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85)
            .setDepth(200).setScrollFactor(0).setInteractive(); 

        // Mostra a imagem contendo os controles
        this.imgInstrucao = this.add.image(cx, cy, "comoJogarLazer")
            .setDepth(201).setScrollFactor(0).setInteractive();

        // Garante que a imagem caiba inteira mesmo em telas de celular
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaX = limiteLargura / this.imgInstrucao.width;
        const escalaY = limiteAltura / this.imgInstrucao.height;
        this.imgInstrucao.setScale(Math.min(escalaX, escalaY));

        // Cria o recado piscante orientando como fechar o tutorial
        this.textoIniciar = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 40, "[ Clique ou aperte ESPAÇO para começar ]", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "15px",
            color: "#ffffff"
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
        // Aplica o efeito visual de piscar no texto
        this.tweens.add({
            targets: this.textoIniciar, alpha: 0.5, duration: 600, yoyo: true, loop: -1
        });

        // Funcao que limpa a tela de instrucoes da memoria
        const iniciar = () => {
            if(!this.instrucoesLidas) {
                this.fundoInstrucao.destroy();
                this.imgInstrucao.destroy();
                this.textoIniciar.destroy();
                this.iniciarMinigameAposInstrucoes();
            }
        };

        // Permite comecar clicando na tela
        this.fundoInstrucao.on('pointerdown', iniciar);
        this.imgInstrucao.on('pointerdown', iniciar);
        
        // Espera um segundinho antes de permitir fechar com ESPACO para evitar pulos sem querer
        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', iniciar);
        });
    }

    // Libera a fase, destravando a fisica e animacoes
    iniciarMinigameAposInstrucoes() {
        this.instrucoesLidas = true;
        this.physics.resume();
        this.cachorro.anims.resume();
    }

    // Executa a logica do pulo
    pular() {
        if (this.jogoAcabou) return; 

        // Checa se ele tem apoio nos pes antes de impulsionar para cima
        const noChao = this.cachorro.body.blocked.down || this.cachorro.body.touching.down;

        if (noChao) {
            this.cachorro.setVelocityY(-550);
            this.cachorro.setFrame(0); 
        }
    }

    // Executa a logica de agachar e forca a queda caso esteja no ar
    abaixar(noChao) {
        if (this.jogoAcabou) return;

        // Se estiver pulando, cai com muito peso de uma vez
        if (!noChao) {
            this.cachorro.setVelocityY(1000); 
        } 
        
        // Achata a proporcao do cachorro para ele passar por baixo das coisas
        this.cachorro.setScale(0.5, 0.41); 
    }

    // Cria todo o mapa da corrida espalhando itens e perigos
    gerarPercurso(alturaDoChao) {
        let fimDaFase = 7000;
        
        // Controla a proporcao de petiscos bons e estragados na geracao
        let tiposPetiscos = [true, true, true, false, false, false, false, false];
        Phaser.Utils.Array.Shuffle(tiposPetiscos);

        // Um loop que avanca espacando os desafios no cenario
        for (let x = 600; x <= fimDaFase; x += 800) {
            let posX = x + 400; 

            // Configura o trecho final que garante a vitoria
            if (x === fimDaFase) {
                let cama = this.camasElasticas.create(posX, alturaDoChao - 60, 'camaElastica').setScale(0.4).setDepth(5);
                cama.body.setSize(cama.width * 0.4, cama.height * 0.1); 
                cama.body.setOffset(cama.width * 0.4, cama.height * 0.5); 

                // Posicionamento exato para encontrar o apice do salto matematico
                let yPetiscao = alturaDoChao - 350; 
                let petiscoAlto = this.petiscos.create(posX + 350, yPetiscao, 'petisco').setScale(0.3).setDepth(5);
                
                petiscoAlto.body.setSize(petiscoAlto.width * 0.6, petiscoAlto.height * 0.6);
                petiscoAlto.body.setOffset(petiscoAlto.width * 0.2, petiscoAlto.height * 0.2);
                
                // Colore o petisco final de dourado
                petiscoAlto.tint = 0xffd700; 
                petiscoAlto.isSuper = true;

                // Guarda a referencia dele para sabermos se o jogador deixou passar
                this.petiscaoFinal = petiscoAlto;
            } 
            // Configura o trajeto normal do percurso
            else {
                let obs = this.obstaculos.create(posX, alturaDoChao - 50, 'obstaculo').setScale(2).setDepth(5);
                let raio = obs.width * 0.30; 
                // Ajusta a colisao do obstaculo para ser circular e mais justa
                obs.body.setCircle(raio, obs.width * 0.35, obs.height * 0.4);

                let yPetisco = alturaDoChao - 150; 
                let petisco = this.petiscos.create(x, yPetisco, 'petisco').setScale(0.15).setDepth(5);
                
                petisco.body.setSize(petisco.width * 0.6, petisco.height * 0.6);
                petisco.body.setOffset(petisco.width * 0.2, petisco.height * 0.2);

                // Decide se este petisco especifico fara mal ou bem
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

    // Lida com o que ocorre quando o cachorro come as recompensas do chao
    coletarPetisco(cachorro, petisco) {
        // Remove a comida da tela imediatamente
        petisco.disableBody(true, true); 
        
        // Puni o jogador por pegar o lanche ruim
        if (petisco.isEstragado) {
            this.pontos = Math.max(0, this.pontos - 1);
            this.textoPontos.setText('Petiscos: ' + this.pontos);
            
            // Fica piscando em vermelho pra sinalizar o erro
            cachorro.tint = 0xff0000;
            this.time.delayedCall(500, () => {
                cachorro.clearTint(); 
            });

        // Recompensa o jogador
        } else {
            this.pontos += 1;
            this.textoPontos.setText('Petiscos: ' + this.pontos);
            
            // Dispara o fim da fase de sucesso se for o petisco gigantesco
            if (petisco.isSuper) {
                this.vencerJogo();
            }
        }
        
        this.events.emit("atualizarHUD"); 
    }

    // O que acontece se tropecar nas barreiras
    baterNoObstaculo(cachorro, obstaculo) {
        // Como o erro e fatal reseta o level todo
        this.scene.restart();
    }

    // Para o cachorro e anuncia que o jogador completou a fase
    vencerJogo() {
        if (this.jogoAcabou) return; 
        this.jogoAcabou = true;

        // Congela o cachorro no ar se necessario
        this.physics.pause();
        this.cachorro.anims.pause();

    // Cria os elementos graficos da vitoria
    mostrarTextoVitoria() {
        const meioX = this.cameras.main.worldView.x + (this.scale.width / 2);
        const meioY = this.scale.height / 2;

        // Estampa a mensagem de vitoria bem no meio da visualizacao
        this.add.text(meioX, meioY, 'FASE CONCLUIDA!', {
            fontFamily: '"Press Start 2P", monospace', 
            fontSize: '40px', 
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(30);
        
        // Aguarda dois segundos pra pessoa ler antes de abrir o placar
        this.time.delayedCall(2000, () => {
            this.finalizarMinigame();
        });
    }
    
    // Calcula os lucros salva no historico principal e levanta a janela de saida
    finalizarMinigame() {
        if (this.minigameFinalizado) return;
        this.minigameFinalizado = true;
        this.input.setDefaultCursor("default");

        // Faz as contas basicas da premiacao usando os pontos acumulados
        const estrelas = this.calcularEstrelas(this.pontos);
        const moedas = this.calcularMoedas(estrelas);
        const reducaoLazer = this.calcularLazer(estrelas);

        // Valida se o usuario escolheu o modelo heroi ou caramelo e insere moedas se for a primeira vez
        const cachorroAtivo = gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo';
        if (!gameState.recompensas.lazer[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.lazer[cachorroAtivo] = true;
        }

        // Mexe na necessidade fisiologica do pet reduzindo a energia sobressalente
        let lazerAtual = gameState.barras.lazer !== undefined ? gameState.barras.lazer : 11;
        let novoLazer = lazerAtual - reducaoLazer;
        gameState.barras.lazer = Phaser.Math.Clamp(novoLazer, 0, 11); 

        // Define qual tela visual usar no feedback de acordo com quão bem a pessoa jogou
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

        // Fundo escuro protetor
        const fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(100).setScrollFactor(0).setInteractive(); 

        // Imagem decorativa de nota final
        const telaFeedback = this.add.image(cx, cy, imagemFeedback)
            .setDepth(101).setScrollFactor(0).setInteractive();

        // Faz o quadrado ficar num tamanho bom pros celulares tambem
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;

        const escalaX = limiteLargura / telaFeedback.width;
        const escalaY = limiteAltura / telaFeedback.height;

        const escalaFinal = Math.min(escalaX, escalaY);
        telaFeedback.setScale(escalaFinal);

        // Orientacao extra de como proceder pra sair dali
        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Clique ou aperte ESPACO para continuar ]", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "15px",
            color: "#ffffff"
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        
        // Efeito de transicao no texto
        this.tweens.add({
            targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1
        });

        // Volta pro hub geral finalizando de vez o mini game
        const voltarParaMenu = () => {
            this.scene.start("cenaLazer");
        };

        // Permite fechar clicando no fundo ou no desenho
        fundoFeedback.on('pointerdown', voltarParaMenu);
        telaFeedback.on('pointerdown', voltarParaMenu);

        // Previne um missclick com o teclado aguardando os 200 milisegundos
        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', voltarParaMenu);
        });

    }
    
    // Tira as notas baseado nas regras de pontuacao bruta do labirinto
    calcularEstrelas(pontos) {
        if (pontos >= 5) return 3; 
        if (pontos >= 3) return 2; 
        return 1;                  
    }

    // Devolve o saldo pro jogador gastar depois baseado nas notas
    calcularMoedas(estrelas) {
        if (estrelas === 3) return 20;
        if (estrelas === 2) return 10;
        return 5; 
    }

    // Calcula o quanto o cachorro cansou baseado no numero de estrelas obtidas
    calcularLazer(estrelas) {
        if (estrelas === 3) return 11;
        if (estrelas === 2) return 5;  
        return 2;                      
    }
}