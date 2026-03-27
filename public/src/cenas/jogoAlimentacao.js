// Importa o estado global do jogo
import { gameState } from "../main.js";

// Import adicionado para acessar a racao selecionada na cena anterior
import { Racao } from "../componentes/controleRacoes/racoes.js"; 

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
        
        // Nova flag para pausar o jogo enquanto as instrucoes sao exibidas
        this.mostrandoInstrucoes = true; 
    }

    // Carrega todas as imagens necessarias antes do jogo comecar
    preload() {
        this.load.image('bgFoodScene', 'assets/tela-alimentação/bgRacao.png');
        this.load.image('dogPlayer', 'assets/dogPlayer.png');
        this.load.image('foodNormal', 'assets/foodNormal.png');
        this.load.image('foodSuperPremium', 'assets/foodSuperPremium.png');
        this.load.image('foodChocolate', 'assets/foodChocolate.png');
        this.load.image('heart', 'assets/heart.png');
        this.load.image('retornoInicio', 'assets/retornoInicio.png');
    }

    // Configura todos os elementos visuais e fisicos quando a cena inicia
    create() {
        
        // Esconde a interface principal do jogo para nao atrapalhar o minigame
        if (this.scene.isActive("HUD")) {
            this.scene.sleep("HUD");
        }

        // Cria o botao de voltar no canto superior esquerdo da tela
        this.botaoVoltar = this.add.text(60, 50, "←", {
            fontFamily: "Arial",
            fontSize: "52px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

        // Muda a cor do botao de voltar quando o ponteiro do mouse passa por cima
        this.botaoVoltar.on("pointerover", () => this.botaoVoltar.setStyle({ color: "#ffdd00" }));
        
        // Retorna o botao a cor original quando o mouse sai
        this.botaoVoltar.on("pointerout",  () => this.botaoVoltar.setStyle({ color: "#ffffff" }));
        
        // Executa a acao de sair do minigame e voltar para a cena de comida
        this.botaoVoltar.on("pointerdown", () => {
            if (this.scene.isSleeping("cenaHUD")) { this.scene.wake("cenaHUD"); }
            this.scene.start("cenaComida");
        });

        // Define as medidas da tela baseadas no tamanho atual do jogo
        this.larguraTela = this.scale.width;
        this.alturaTela = this.scale.height;
        this.chaoY = this.alturaTela - 90;

        // Adiciona a imagem de fundo preenchendo a tela toda
        this.fundo = this.add.image(this.larguraTela / 2, this.alturaTela / 2, 'bgFoodScene')
            .setDisplaySize(this.larguraTela, this.alturaTela)
            .setDepth(-1);

        // Cria o jogador com fisica e aplica gravidade para ele poder pular e cair
        this.jogador = this.physics.add.sprite(this.larguraTela / 2, this.chaoY, gameState.pets.cachorroHeroi ? 'cachorroHeroiBoca' : 'dogPlayer');
        
        // Impede que o jogador ultrapasse as bordas da tela
        this.jogador.setCollideWorldBounds(true);
        this.jogador.body.allowGravity = true;
        
        // Define a forca da gravidade puxando o cachorro para baixo
        this.jogador.setGravityY(1200); 
        this.jogador.setScale(0.15);
        this.velocidadeJogador = 560;

        // Limita a area do mundo fisico ao tamanho da tela
        this.physics.world.setBounds(0, 0, this.larguraTela, this.alturaTela);

        // Cria o grupo fisico que vai guardar os itens caindo
        this.itensComida = this.physics.add.group();
        
        // Configura o jogo para detectar quando o cachorro encosta em um item de comida
        this.physics.add.overlap(this.jogador, this.itensComida, this.coletarItem, null, this);

        // Adiciona o texto de pontuacao na tela
        this.textoPontuacao = this.add.text(100, 45, 'Pontuacao: 0', {
            fontFamily: '"Press Start 2P"',
            fontSize: "18px",
            color: '#1f1f1f'
        }).setDepth(10);

        // Cria os icones de coracao representando as vidas do jogador no canto direito
        this.iconesVida = [];
        for (let i = 0; i < this.vidasMaximas; i++) {
            const coracao = this.add.image(this.larguraTela - 40 - (i * 60), 35, 'heart')
                .setScale(0.25)
                .setDepth(10);
            this.iconesVida.push(coracao);
        }
        
        // Garante que a interface mostre a quantidade inicial correta de vidas
        this.atualizarHUDVidas();

        // Configura as teclas de controle como setas direcionais espaco e teclas a w d
        this.cursors = this.input.keyboard.createCursorKeys();
        this.teclaA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.teclaD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.teclaW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.teclaEspaco = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Funcao para manter tudo organizado se o jogador redimensionar a tela do navegador
        const handleResizeAlimentacao = (gameSize) => {
            this.larguraTela = gameSize.width;
            this.alturaTela = gameSize.height;
            this.chaoY = this.alturaTela - 90;

            this.cameras.resize(this.larguraTela, this.alturaTela);

            this.fundo.setDisplaySize(this.larguraTela, this.alturaTela).setPosition(this.larguraTela / 2, this.alturaTela / 2);
            this.jogador.setPosition(this.larguraTela / 2, this.chaoY);
            this.textoPontuacao.setPosition(20, 20);

            this.iconesVida.forEach((icone, i) => {
                icone.setPosition(this.larguraTela - 40 - (i * 45), 35);
            });

            this.botaoVoltar.setPosition(60, 50);
            this.physics.world.setBounds(0, 0, this.larguraTela, this.alturaTela);
            
            // Reajusta a tela de instrucoes caso ela ainda esteja aberta
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

        // Escuta o evento de mudanca de tamanho da tela
        this.scale.on("resize", handleResizeAlimentacao);

        // Remove os ouvintes de evento quando a cena fechar para evitar erros na memoria
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeAlimentacao);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });

        // Chama a tela de como jogar em vez de iniciar o jogo direto
        this.mostrarComoJogar();
    }

    // Atualiza as acoes do jogo repetidamente a cada quadro
    update() {
        
        // Bloqueia a movimentacao e fisica se a partida encerrou ou se esta lendo as instrucoes
        if (this.partidaEncerrada || this.mostrandoInstrucoes) return;

        // Mantem o jogador no chao e limpa a velocidade de queda se ele pousar
        if (this.jogador.y >= this.chaoY) {
            this.jogador.y = this.chaoY; 
            
            if (this.jogador.body.velocity.y > 0) {
                this.jogador.setVelocityY(0);
            }

            // Verifica se o jogador apertou o botao de pulo
            const querPular = Phaser.Input.Keyboard.JustDown(this.teclaEspaco) || 
                              Phaser.Input.Keyboard.JustDown(this.teclaW) || 
                              Phaser.Input.Keyboard.JustDown(this.cursors.up);

            // Aplica uma forca para cima fazendo o personagem pular
            if (querPular) {
                this.jogador.setVelocityY(-650); 
            }
        }

        // Verifica se o jogador esta apertando para ir para a esquerda ou para a direita
        const indoEsquerda = this.cursors.left.isDown || this.teclaA.isDown;
        const indoDireita = this.cursors.right.isDown || this.teclaD.isDown;

        // Move o jogador na direcao escolhida e vira a imagem dele para o lado certo
        if (indoEsquerda) {
            this.jogador.setVelocityX(-this.velocidadeJogador);
            this.jogador.setFlipX(true);
        } else if (indoDireita) {
            this.jogador.setVelocityX(this.velocidadeJogador);
            this.jogador.setFlipX(false);
        } else {
            // Deixa o jogador parado caso nao aperte nada
            this.jogador.setVelocityX(0);
        }

        // Percorre cada comida caindo e verifica se ela passou da tela para punir o jogador
        this.itensComida.getChildren().forEach((item) => {
            if (item.y > this.alturaTela + item.displayHeight) {
                this.tratarItemPerdido(item);
            }
        });
    }

    // Cria a tela inicial de introducao e ensina o jogador a jogar
    mostrarComoJogar() {
        const cx = this.larguraTela / 2;
        const cy = this.alturaTela / 2;

        // Cria um fundo escuro e transparente que bloqueia cliques
        this.fundoInstrucao = this.add.rectangle(cx, cy, this.larguraTela, this.alturaTela, 0x000000, 0.8)
            .setDepth(200)
            .setScrollFactor(0)
            .setInteractive(); 

        // Adiciona a imagem contendo as regras na frente de tudo
        this.imgInstrucao = this.add.image(cx, cy, "comoJogarRacao")
            .setDepth(201)
            .setScrollFactor(0)
            .setInteractive();

        // Faz um calculo rapido para garantir que a imagem caiba inteira em telas pequenas
        const limiteLargura = this.larguraTela * 0.8;
        const limiteAltura = this.alturaTela * 0.8;
        const escalaX = limiteLargura / this.imgInstrucao.width;
        const escalaY = limiteAltura / this.imgInstrucao.height;
        this.imgInstrucao.setScale(Math.min(escalaX, escalaY));

        // Cria o texto informativo orientando como fechar a tela
        this.textoIniciar = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 40, "[ Clique ou aperte ESPAÇO para começar ]", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "15px",
            color: "#ffffff"
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
        // Faz o texto piscar de forma suave mudando a transparencia
        this.tweens.add({
            targets: this.textoIniciar, alpha: 0.5, duration: 600, yoyo: true, loop: -1
        });

        // Funcao que deleta a tela de instrucoes e da a largada na partida
        const comecarJogo = () => {
            this.fundoInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.textoIniciar.destroy();
            this.iniciarPartida();
        };

        // Permite comecar clicando em qualquer lugar ou pressionando a tecla espaco
        this.fundoInstrucao.on('pointerdown', comecarJogo);
        this.imgInstrucao.on('pointerdown', comecarJogo);
        this.input.keyboard.once('keydown-SPACE', comecarJogo);
    }

    // Libera a partida para comecar de verdade apos fechar as regras
    iniciarPartida() {
        
        // Altera a flag para liberar as interacoes do cachorro no update
        this.mostrandoInstrucoes = false; 

        // Aciona o gerador principal que fara as racoes despencarem do ceu
        this.criarEventoSpawn();

        // Inicia um relogio escondido que deixa o jogo mais veloz e dificil com o passar do tempo
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

    // Configura o evento continuo que gera novos itens na tela repetidamente
    criarEventoSpawn() {
        if (this.eventoSpawn) {
            this.eventoSpawn.remove(false);
        }
        this.eventoSpawn = this.time.addEvent({
            delay: this.intervaloSpawn,
            loop: true,
            callback: this.spawnarItem,
            callbackScope: this
        });
    }

    // Funcao responsavel por colocar uma nova comida caindo la do topo
    spawnarItem() {
        
        // Cancela a criacao se o jogo estiver pausado ou terminado
        if (this.partidaEncerrada || this.mostrandoInstrucoes) return;

        // Decide aleatoriamente qual tipo de comida vai nascer e a posicao horizontal dela
        const tipoSorteado = this.sortearTipoItem();
        const x = Phaser.Math.Between(40, this.larguraTela - 40);
        const item = this.itensComida.create(x, -40, tipoSorteado.key);

        // Desliga a gravidade padrao e empurra o item para baixo para controlar o peso de queda dele
        item.body.allowGravity = false;
        item.setVelocityY(this.velocidadeQueda + Phaser.Math.Between(-25, 25));
        
        // Salva informacoes ocultas dentro do item para sabermos o que ele faz ao tocar nele
        item.setData('tipo', tipoSorteado.tipo);
        item.setData('pontos', tipoSorteado.pontos);
        item.setData('penalidade', tipoSorteado.penalidade);
        item.setData('dano', tipoSorteado.dano);
        item.setData('cura', tipoSorteado.cura);

        // Ajusta o tamanho da imagem dependendo de qual pacote de racao ou objeto foi gerado
        if (tipoSorteado.tipo === 'superPremium') {
            item.setScale(0.13);
        } else if (tipoSorteado.tipo === 'chocolate') {
            item.setScale(0.19);
        } else {
            item.setScale(0.18);
        }
    }

    // Cria as regras de probabilidade para determinar o que vai cair
    sortearTipoItem() {
        const chance = Phaser.Math.Between(1, 100);
        
        // Maioria das vezes sera racao comum
        if (chance <= 70) {
            return { tipo: 'normal', key: 'foodNormal', pontos: 10, penalidade: 5, dano: 0, cura: 0 };
        }
        // Tem risco de cair chocolate que tira vida
        if (chance <= 92) {
            return { tipo: 'chocolate', key: 'foodChocolate', pontos: 0, penalidade: 0, dano: 1, cura: 0 };
        }
        // Chance rara de cair super premium que da muito ponto e recupera saude
        return { tipo: 'superPremium', key: 'foodSuperPremium', pontos: 25, penalidade: 5, dano: 0, cura: 1 };
    }

    // Evento disparado no exato momento que o modelo do cachorro encosta em um item
    coletarItem(jogador, item) {
        if (this.partidaEncerrada) return;

        // Adiciona os pontos vinculados aquele objeto na carteira do jogador
        this.pontuacao += item.getData('pontos');

        // Confere se o item machuca o cachorro e aplica o desconto se necessario
        const dano = item.getData('dano');
        if (dano > 0) this.alterarVidas(-dano);

        // Confere se o item cura e devolve uma vida perdida se for o caso
        const cura = item.getData('cura');
        if (cura > 0) this.alterarVidas(cura);

        // Atualiza a visualizacao do placar e destrói o objeto coletado
        this.atualizarHUDPontuacao();
        item.destroy();

        // Se bater a meta de pontos finaliza como vitoria
        if (this.pontuacao >= 150) {
            this.finalizarMinigame();
        }
    }

    // Pune o jogador reduzindo sua pontuacao caso deixe um objeto importante cair ate o fim
    tratarItemPerdido(item) {
        const penalidade = item.getData('penalidade');
        
        // Desconta os pontos respeitando o zero como limite inferior
        if (penalidade > 0) {
            this.pontuacao = Math.max(0, this.pontuacao - penalidade);
            this.atualizarHUDPontuacao();
        }
        
        // Remove da memoria o item que sumiu pelo chao
        item.destroy();
    }

    // Calcula e processa qualquer mudanca nos coracoes do cachorro
    alterarVidas(valor) {
        
        // Soma ou subtrai garantindo que o resultado nao extrapole os limites do array
        this.vidas = Phaser.Math.Clamp(this.vidas + valor, 0, this.vidasMaximas);
        this.atualizarHUDVidas();

        // Se zerar totalmente a vida inicia o processo de derrota
        if (this.vidas <= 0) {
            this.encerrarPartida();
        }
    }

    // Refresca o valor de texto na tela principal mostrando os numeros novos
    atualizarHUDPontuacao() {
        this.textoPontuacao.setText('Pontuacao: ' + this.pontuacao);
    }

    // Passa pelos icones de coracao e esconde os necessarios de acordo com o total restante
    atualizarHUDVidas() {
        this.iconesVida.forEach((icone, index) => {
            icone.setVisible(index < this.vidas);
        });
    }

    // Processa a vitoria garantindo as recompensas finais e travando o minigame
    finalizarMinigame() {
        if (this.partidaEncerrada) return;
        
        // Congela o andamento do estado e breca a velocidade horizontal do animal
        this.partidaEncerrada = true;
        this.jogador.setVelocityX(0);

        // Cancela a maquina geradora de comida e encerra a evolucao da dificuldade
        if (this.eventoSpawn) this.eventoSpawn.remove(false);
        if (this.eventoDificuldade) this.eventoDificuldade.remove(false);

        // Varre a tela limpando tudo que ainda estava despencando
        this.itensComida.clear(true, true);

        // Analisa quão bem o jogador foi e faz as contas do premio
        const estrelas = this.calcularEstrelas(this.vidas);
        const moedas = this.calcularMoedas(estrelas);

        // Confere de qual pet estamos tratando antes de depositar
        const cachorroAtivo = gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo';
        
        // Adiciona as recompensas a conta principal se for o primeiro sucesso neste minigame
        if (!gameState.recompensas.alimentacao[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.alimentacao[cachorroAtivo] = true;
        }

        // --- NOVA LÓGICA DA BARRINHA DE FOME ---
        if (gameState.superPremium) {
            // Ração Super Premium: enche a barra totalmente (frame 0)
            gameState.barras.comida = 0;
        } else if (gameState.standart) {
            // Ração Standard: diminui o valor da barra de fome em 6 (sendo 0 = cheio)
            // Usamos Math.max para garantir que nunca ficará menor que 0.
            gameState.barras.comida = Math.max(0, gameState.barras.comida - 6);
        } else {
            // Fallback: diminui 6 caso entre no minigame sem ter comprado ração.
            gameState.barras.comida = Math.max(0, gameState.barras.comida - 6);
        }

        // Limpa as variáveis para a próxima vez que for jogar/comprar
        gameState.superPremium = false;
        gameState.standart = false;

        // Aciona o painel grafico que exibe seu saldo e suas estrelas no fim
        this.mostrarPainelResultado(estrelas);
    }

    // Determina a classificacao do jogador puramente olhando para os danos recebidos
    calcularEstrelas(vidas) {
        if (vidas >= 3) return 3; 
        if (vidas === 2) return 2; 
        return 1;                  
    }

    // Traduz a nota do jogador em valores numericos reais da moeda do jogo
    calcularMoedas(estrelas) {
        if (estrelas === 3) return 20;
        if (estrelas === 2) return 10;
        return 5; 
    }

    // Cria os visuais da tela de premiacao encobrindo a bagunca da tela original
    mostrarPainelResultado(estrelas) {
        let imagemFeedback = "";
        
        // Aponta qual asset exato deve ser buscado com base na nota calculada antes
        if (estrelas === 3) {
            imagemFeedback = "feeedback3estrelas"; 
        } else if (estrelas === 2) {
            imagemFeedback = "feedback2estrelas";
        } else {
            imagemFeedback = "feedback1estrela";
        }

        const cx = this.larguraTela / 2;
        const cy = this.alturaTela / 2;

        // Camada escurecida para isolar o plano de fundo
        const fundoFeedback = this.add.rectangle(cx, cy, this.larguraTela, this.alturaTela, 0x000000, 0.8)
            .setDepth(100)
            .setScrollFactor(0)
            .setInteractive(); 

        // O quadro real de feedback carregado como uma imagem
        const telaFeedback = this.add.image(cx, cy, imagemFeedback)
            .setDepth(101)
            .setScrollFactor(0)
            .setInteractive();

        // Encolhe os elementos gentilmente para nao ultrapassar a resolucao em displays mobiles
        const limiteLargura = this.larguraTela * 0.8;
        const limiteAltura = this.alturaTela * 0.8;
        const escalaX = limiteLargura / telaFeedback.width;
        const escalaY = limiteAltura / telaFeedback.height;
        const escalaFinal = Math.min(escalaX, escalaY);
        telaFeedback.setScale(escalaFinal);

        // Insere a instrucao para a proxima etapa posicionada bem em baixo do quadro
        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Pressione ESPAÇO ou Clique ]", {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "15px",
            color: "#ffffff"
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        
        // Aplica uma oscilacao suave na transparencia do recado textual
        this.tweens.add({
            targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1
        });

        // Encerra oficialmente este documento mudando de volta a sala principal
        const voltarCena = () => {
            this.scene.start("cenaComida");
        };

        // Escuta os toques para engatilhar a saida
        fundoFeedback.on('pointerdown', voltarCena);
        telaFeedback.on('pointerdown', voltarCena);

        // Libera que pulem essa janela usando o teclado tambem caso possuam um
        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', voltarCena);
        });
    }

    // Cuida exclusivamente dos cenarios onde todas as vidas zeram acionando um fracasso absoluto
    encerrarPartida() {
        if (this.partidaEncerrada) return;

        // Tranca toda a interatividade de acao desativando a gravidade artificial e o input
        this.partidaEncerrada = true;
        this.jogador.setVelocityX(0);

        // Derrete as correntes temporais suspendendo os geradores aleatorios
        if (this.eventoSpawn) this.eventoSpawn.remove(false);
        if (this.eventoDificuldade) this.eventoDificuldade.remove(false);

        // Varre do mundo todas as caixas colisionaveis de racao para estancar a confusao visual
        this.itensComida.clear(true, true);

        // Apaga o fundo cobrindo o luto da perda sob uma pelicula sombria
        this.add.rectangle(this.larguraTela / 2, this.alturaTela / 2, this.larguraTela, this.alturaTela, 0x000000, 0.55)
            .setDepth(20);

        // Imprime em fonte grande evidenciando que falharam o desafio atual
        this.add.text(this.larguraTela / 2, this.alturaTela / 2 - 60, 'GAME OVER', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(21);

        // Recapitula em tela o teto atingido de pontuacao ate aquele instante de perda
        this.add.text(this.larguraTela / 2, this.alturaTela / 2, 'Pontuacao final: ' + this.pontuacao, {
            fontFamily: 'Arial',
            fontSize: '30px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(21);

        // Dita a regra que comanda o reinicio do espaco para uma nova tentativa fresca
        this.add.text(this.larguraTela / 2, this.alturaTela / 2 + 55, 'Pressione ESPAÇO para reiniciar', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(21);

        // Liga a chave do monitoramento na barra de espaco que reinicia todo este contexto
        this.time.delayedCall(200, () => {
            this.input.keyboard.once('keydown-SPACE', () => {
                this.scene.restart();
            });
        });
    }
}