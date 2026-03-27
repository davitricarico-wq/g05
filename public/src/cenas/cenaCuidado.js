// Importação do estado global para persistência de dados (moedas, saúde, progresso)
import { gameState } from "../main.js";
 //Cena de Minigame: Remoção de Pulgas
 //Utiliza o motor de física Arcade para gerenciar colisões e movimentos erráticos.

export class cenaCuidado extends Phaser.Scene {
    constructor() {
        super({ key: "cenaCuidado" });

        // CONFIGURAÇÕES DAS VARIÁVEIS
        this.totalPulgas = 12;          // Quantidade de alvos necessária para vencer
        this.pulgasRemovidas = 0;       // Contador de progresso atual
        this.pontuacao = 0;             
        this.minigameFinalizado = false; // Trava de segurança para evitar múltiplos gatilhos de vitória
        this.pincaEquipada = false;     // Controle de estado do cursor customizado
        this.bonusMeioGanho = false;    // Flag para disparar evento de 50% de conclusão
        this.pulgaSegurada = null;      // Referência ao objeto atualmente em "Drag"

        // Controle de fluxo de interface (UX)
        this.instrucoesLidas = false;
    }

    create() {
        
        //GESTÃO DE CENAS E HUD
        //Paramos a HUD para que os cliques no minigame não ativem botões do menu lateral por acidente.
         
        this.scene.stop("HUD");
        this.transicao = false;

        const largura = this.scale.width;
        const altura = this.scale.height;

        //O background muda dinamicamente se o jogador estiver com o "Cachorro Herói" ativo no gameState. 
        const bgAtivo = gameState.pets.cachorroHeroi ? "bgCuidadoHeroi" : "bgCuidado";

        // Renderização do fundo com preenchimento total da tela 
        this.fundo = this.add.image(largura / 2, altura / 2, bgAtivo)
            .setDisplaySize(largura, altura);

        
         //Garante que o jogo não quebre caso o asset da pinça falhe; ele gera um desenho vetorial na hora.
         
        this.garantirTexturaPinca();

        //Limpa os dados de rodadas anteriores para permitir o replay.
        this.pulgasRemovidas = 0;
        this.pontuacao = 0;
        this.minigameFinalizado = false;
        this.pincaEquipada = false;
        this.bonusMeioGanho = false;
        this.pulgaSegurada = null;
        this.instrucoesLidas = false;

        // Garantia de que o contador de moedas existe antes de manipular valores
        gameState.cobasiCoins = gameState.cobasiCoins ?? 0;

         //A bandeja funciona como o "Goal" (objetivo).
         //  É para onde o jogador deve arrastar as pulgas.
          this.bandeja = this.add.image(largura / 2, altura * 0.85, "bandeja")
            .setDepth(5)
            .setScale(0.5); 

       
         //Aqui é criado um grupo físico. Em vez de criar/destruir sprites, o Phaser recicla esses objetos,
        this.pulgas = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: this.totalPulgas
        });

        // Inicialização da interface de texto (HUD interna do minigame)
        this.criarTextosInfo();
        
        // Instancia o objeto da pinça que servirá de cursor
        this.criarFerramentaPinca();
        
        // Distribui as pulgas na tela de forma aleatória (Spawn inicial)
        this.spawnPulgasIniciais();

       
         //captura da pulga
         //Quando o jogador clica, buscamos a pulga mais próxima num raio de 50px.
            this.input.on('pointerdown', (pointer) => {
            if (!this.instrucoesLidas || !this.pincaEquipada || this.minigameFinalizado || this.pulgaSegurada) return;
            
            let pulgaMaisProxima = null;
            let menorDistancia = 50; 
            
            this.pulgas.children.iterate((pulga) => {
                if (!pulga || !pulga.active) return;
                const distancia = Phaser.Math.Distance.Between(pointer.x, pointer.y, pulga.x, pulga.y);
                if (distancia < menorDistancia) {
                    menorDistancia = distancia;
                    pulgaMaisProxima = pulga;
                }
            });

            if (pulgaMaisProxima) {
                this.pulgaSegurada = pulgaMaisProxima;
                this.tweens.killTweensOf(pulgaMaisProxima); // Para o movimento aleatório enquanto segura
                this.pulgaSegurada.setScale(0.15); // Efeito visual de "levantar" a pulga
            }
        });

       
         //Lógica de  ao soltar o clique, verificamos se a pulga está dentro dos limites da bandeja.
         
        this.input.on('pointerup', (pointer) => {
            if (this.pulgaSegurada) {
                const areaBandeja = this.bandeja.getBounds();
                
                // Verificação geométrica de colisão entre o ponto do mouse e o retângulo da bandeja
                if (Phaser.Geom.Rectangle.ContainsPoint(areaBandeja, pointer)) {
                    this.capturarPulga(this.pulgaSegurada);
                } else {
                    // Se soltar no lugar errado, ela volta ao tamanho normal e foge novamente
                    this.pulgaSegurada.setScale(0.12);
                    this.moverPulga(this.pulgaSegurada); 
                }
                this.pulgaSegurada = null;
            }
        });

        //Responsividade
        // Recalcula posições de fundos, bandejas e textos caso a janela mude de tamanho.
        
        const handleResize = (gameSize) => {
            const novaLargura = gameSize.width;
            const novaAltura = gameSize.height;

            this.cameras.resize(novaLargura, novaAltura);
            
            if (this.fundo) {
                this.fundo.setDisplaySize(novaLargura, novaAltura).setPosition(novaLargura / 2, novaAltura / 2);
            }

            if (this.textoTempo) this.textoTempo.setPosition(20, 30);
            if (this.textoProgresso) this.textoProgresso.setPosition(novaLargura - 20, 30);

            if (this.bandeja) {
                this.bandeja.setPosition(novaLargura / 2, novaAltura * 0.85);
            }

            // Garante que a pinça não "suma" se o jogador redimensionar sem estar com ela equipada
            if (this.pinca && !this.pincaEquipada) {
                this.pinca.setPosition(novaLargura / 2, novaAltura * 0.7);
            }

            // Reposiciona pulgas ativas para não ficarem fora da tela 
            this.pulgas.children.iterate((pulga) => {
                if (pulga && pulga.active && pulga !== this.pulgaSegurada) {
                    pulga.x = Phaser.Math.Clamp(pulga.x, 50, novaLargura - 50);
                    pulga.y = Phaser.Math.Clamp(pulga.y, 80, novaAltura - 80);
                }
            });
        };

        this.scale.on("resize", handleResize);

        // Limpeza de eventos ao encerrar a cena para evitar vazamento de memória (Memory Leak)
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResize);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });

        // Inicia o fluxo visual pelo modal de ajuda
        this.mostrarInstrucoes();
    }

    update() {
        
         //LOOP DE ATUALIZAÇÃO (60 FPS)
         //Sincroniza a posição da pinça e da pulga segurada com o movimento do mouse/toque.
         
        if (!this.instrucoesLidas || !this.pincaEquipada || this.minigameFinalizado) return;

        const ponteiro = this.input.activePointer;
        
        if (this.pinca) {
            // Pequeno ajuste de offset (18, 14) para a pinça alinhar visualmente com a ponta do cursor
            this.pinca.setPosition(ponteiro.x + 18, ponteiro.y + 14);
        }

        if (this.pulgaSegurada) {
            this.pulgaSegurada.setPosition(ponteiro.x, ponteiro.y);
        }
    }

    
     //MODAL DE INSTRUÇÕES 
     //Cria um fundo escuro interativo que bloqueia o jogo até o clique de início.
    mostrarInstrucoes() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.fundoInstrucao = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85)
            .setDepth(200).setInteractive(); 

        this.imgInstrucao = this.add.image(cx, cy, "comoJogarPulgas").setDepth(201);

        // Escalonamento uniforme da imagem de instrução (não distorce)
        const escala = Math.min((this.scale.width * 0.8) / this.imgInstrucao.width, (this.scale.height * 0.8) / this.imgInstrucao.height);
        this.imgInstrucao.setScale(escala);

        this.textoIniciar = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 40, "[ Clique para começar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(201);
        
        // Efeito visual pulsante no texto de início
        this.tweens.add({ targets: this.textoIniciar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const comecarJogo = () => {
            this.fundoInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.textoIniciar.destroy();
            this.iniciarMinigameAposInstrucoes();
        };

        this.fundoInstrucao.on('pointerdown', comecarJogo);
        this.input.keyboard.once('keydown-SPACE', comecarJogo);
    }
    
    iniciarMinigameAposInstrucoes() {
        this.instrucoesLidas = true;
        this.tempoInicialMs = this.time.now;
        
        // Timer que chama a função de atualização de tempo a cada 100ms
        this.timerEvent = this.time.addEvent({
            delay: 100, callback: this.atualizarTextoTempo, callbackScope: this, loop: true
        });
        
        // Dá vida às pulgas: elas começam a correr aleatoriamente pela tela
        this.pulgas.children.iterate((pulga) => {
            if (pulga && pulga.active) this.moverPulga(pulga);
        });
        
        this.mostrarPopupInstrucaoPinca();
    }

    
     
     //Usa Tweens para mover a pulga para coordenadas X, Y aleatórias repetidamente.
     
    moverPulga(pulga) {
        if (!pulga.active || this.minigameFinalizado) return;

        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const y = Phaser.Math.Between(80, this.scale.height - 80);

        this.tweens.add({
            targets: pulga,
            x: x,
            y: y,
            duration: Phaser.Math.Between(1800, 3200), // Velocidades diferentes para cada pulga
            ease: "Sine.easeInOut",
            onComplete: () => { this.moverPulga(pulga); } // Recursividade: move para outro lugar ao chegar
        });
    }

  
     //Calcula as estrelas com base no tempo e atualiza o estado global de saúde.
     finalizarMinigame() {
        if (this.minigameFinalizado) return;
        this.minigameFinalizado = true;
        this.input.setDefaultCursor("default");

        const segundos = Math.ceil((this.time.now - this.tempoInicialMs) / 1000);
        
        // Definição de Rank: 3 estrelas (<=30s), 2 estrelas (<=55s), 1 estrela (>55s)
        const estrelas = segundos <= 30 ? 3 : segundos <= 55 ? 2 : 1;
        const moedas = estrelas === 3 ? 20 : estrelas === 2 ? 10 : 0;

        // Persistência: Dá moedas apenas na primeira vez que limpa o pet na sessão
        const cachorroAtivo = gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo';
        if (!gameState.recompensas.cuidado[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.cuidado[cachorroAtivo] = true;
        }

        gameState.pulga = false; // O cachorro agora está visualmente limpo nas outras cenas
        this.mostrarPainelResultado(estrelas, moedas, segundos);
    }

    
}