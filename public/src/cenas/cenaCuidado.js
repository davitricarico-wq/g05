// o objeto global gameState do arquivo principal
import { gameState } from "../main.js";

// Cena responsável pelo minigame de remover pulgas
export class cenaCuidado extends Phaser.Scene {
    constructor() {
        super({ key: "cenaCuidado" });

        // Variáveis de controle do minigame
        this.totalPulgas = 12;          
        this.pulgasRemovidas = 0;       
        this.pontuacao = 0;             
        this.minigameFinalizado = false;
        this.pincaEquipada = false;     
        this.bonusMeioGanho = false;    
        this.pulgaSegurada = null; 

        // Variável para saber se as instruções foram fechadas
        this.instrucoesLidas = false;
    }

    create() {
         // Para garantir que a HUD não fique ativa ao iniciar
        this.scene.stop("HUD");
        this.transicao = false;

        const largura = this.scale.width;
        const altura = this.scale.height;

        // --- MUDANÇA AQUI: Define o background com base no cachorro ativo ---
        const bgAtivo = gameState.pets.cachorroHeroi ? "bgCuidadoHeroi" : "bgCuidado";

        // Fundo
        this.fundo = this.add.image(largura / 2, altura / 2, bgAtivo)
            .setDisplaySize(largura, altura);

        this.garantirTexturaPinca();

        // Reset variáveis
        this.pulgasRemovidas = 0;
        this.pontuacao = 0;
        this.minigameFinalizado = false;
        this.pincaEquipada = false;
        this.bonusMeioGanho = false;
        this.pulgaSegurada = null;
        this.instrucoesLidas = false;

        gameState.cobasiCoins = gameState.cobasiCoins ?? 0;

        // Posição da Bandeja (Responsiva: Centro inferior)
        this.bandeja = this.add.image(largura / 2, altura * 0.85, "bandeja")
            .setDepth(5)
            .setScale(0.5); 

        // Grupo de pulgas
        this.pulgas = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: this.totalPulgas
        });

        // Elementos discretos de info no topo
        this.criarTextosInfo();
        
        this.criarFerramentaPinca();
        
        // Cria pulgas, mas elas ficam paradas até ler instruções
        this.spawnPulgasIniciais();

        // --- LÓGICA DE PEGAR E SOLTAR ---
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
                this.tweens.killTweensOf(pulgaMaisProxima); 
                this.pulgaSegurada.setScale(0.15); 
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (this.pulgaSegurada) {
                const areaBandeja = this.bandeja.getBounds();
                if (Phaser.Geom.Rectangle.ContainsPoint(areaBandeja, pointer)) {
                    this.capturarPulga(this.pulgaSegurada);
                } else {
                    this.pulgaSegurada.setScale(0.12);
                    this.moverPulga(this.pulgaSegurada); 
                }
                this.pulgaSegurada = null;
            }
        });

        // --- LÓGICA DE RESPONSIVIDADE (RESIZE) ---
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

            if (this.pinca && !this.pincaEquipada) {
                this.pinca.setPosition(novaLargura / 2, novaAltura * 0.7);
            }

            this.pulgas.children.iterate((pulga) => {
                if (pulga && pulga.active && pulga !== this.pulgaSegurada) {
                    pulga.x = Phaser.Math.Clamp(pulga.x, 50, novaLargura - 50);
                    pulga.y = Phaser.Math.Clamp(pulga.y, 80, novaAltura - 80);
                }
            });

            // Resize das instruções, se estiverem abertas
            if (this.fundoInstrucao && this.fundoInstrucao.active) {
                this.fundoInstrucao.setPosition(novaLargura / 2, novaAltura / 2).setSize(novaLargura, novaAltura);
                if (this.imgInstrucao && this.imgInstrucao.active) {
                    this.imgInstrucao.setPosition(novaLargura / 2, novaAltura / 2);
                    if (this.textoIniciar && this.textoIniciar.active) {
                        this.textoIniciar.setPosition(novaLargura / 2, novaAltura / 2 + (this.imgInstrucao.displayHeight / 2) + 40);
                    }
                }
            }
        };

        this.scale.on("resize", handleResize);

        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResize);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });

        // Chama o painel de instruções substituindo o código antigo
        this.mostrarInstrucoes();
    }

    update() {
        if (!this.instrucoesLidas || !this.pincaEquipada || this.minigameFinalizado) return;

        const ponteiro = this.input.activePointer;
        
        if (this.pinca) {
            this.pinca.setPosition(ponteiro.x + 18, ponteiro.y + 14);
        }

        if (this.pulgaSegurada) {
            this.pulgaSegurada.setPosition(ponteiro.x, ponteiro.y);
        }
    }

    // ==========================================
    //       FUNÇÕES DE INÍCIO / INSTRUÇÕES
    // ==========================================
    mostrarInstrucoes() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // Fundo escurecido
        this.fundoInstrucao = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85)
            .setDepth(200)
            .setScrollFactor(0)
            .setInteractive(); 

        // Imagem de instrução
        this.imgInstrucao = this.add.image(cx, cy, "comoJogarPulgas")
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

        const comecarJogo = () => {
            this.fundoInstrucao.destroy();
            this.imgInstrucao.destroy();
            this.textoIniciar.destroy();
            this.iniciarMinigameAposInstrucoes();
        };

        this.fundoInstrucao.on('pointerdown', comecarJogo);
        this.imgInstrucao.on('pointerdown', comecarJogo);
        this.input.keyboard.once('keydown-SPACE', comecarJogo);
    }
    
    iniciarMinigameAposInstrucoes() {
        this.instrucoesLidas = true;
        this.tempoInicialMs = this.time.now;
        this.timerEvent = this.time.addEvent({
            delay: 100, callback: this.atualizarTextoTempo, callbackScope: this, loop: true
        });
        
        this.pulgas.children.iterate((pulga) => {
            if (pulga && pulga.active) this.moverPulga(pulga);
        });
        
        this.mostrarPopupInstrucaoPinca();
    }

    // ==========================================
    //          MECÂNICAS DO JOGO
    // ==========================================
    mostrarPopupInstrucaoPinca() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;
        const textoPopup = this.add.text(cx, cy, "Clique na Pinca\npara equipar!", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "16px", color: "#ffd166",
            stroke: "#000000", strokeThickness: 8, align: "center"
        }).setOrigin(0.5).setDepth(80);
        
        this.time.delayedCall(2000, () => { textoPopup.destroy(); });
    }

    criarTextosInfo() {
        this.textoTempo = this.add.text(20, 30, "Tempo: 0s", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "20px", color: "#ffffff",
            stroke: "#000000", strokeThickness: 5
        }).setOrigin(0, 0).setDepth(50);

        this.textoProgresso = this.add.text(this.scale.width - 20, 30, `Pulgas: 0/${this.totalPulgas}`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "20px", color: "#ffffff",
            stroke: "#000000", strokeThickness: 4
        }).setOrigin(1, 0).setDepth(50);
    }

    criarFerramentaPinca() {
        this.pinca = this.add.image(this.scale.width / 2, this.scale.height * 0.7, "pincaTool")
            .setDepth(60).setInteractive({ useHandCursor: true });

        const escala = Math.min(140 / this.pinca.width, 140 / this.pinca.height, 1.2);
        this.pinca.setScale(escala);

        this.pinca.on("pointerdown", () => {
            if (this.pincaEquipada) return;
            this.pincaEquipada = true;
            this.input.setDefaultCursor("none"); 
            this.pinca.disableInteractive();
        });
    }

    spawnPulgasIniciais() {
        for (let i = 0; i < this.totalPulgas; i++) this.spawnPulga();
    }

    spawnPulga() {
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const y = Phaser.Math.Between(80, this.scale.height - 80); 
        const pulga = this.pulgas.get(x, y, "pulga1");
        if (!pulga) return;
        pulga.setActive(true).setVisible(true);
        pulga.body.setAllowGravity(false);
        pulga.setScale(0.12).setDepth(10);
    }

    capturarPulga(pulga) {
        if (!pulga.active) return;
        this.tweens.killTweensOf(pulga);
        pulga.setActive(false).setVisible(false);
        if (pulga.body) pulga.body.enable = false;

        this.pulgasRemovidas++;
        this.textoProgresso.setText(`Pulgas: ${this.pulgasRemovidas}/${this.totalPulgas}`);

        if (this.pulgasRemovidas === 6 && !this.bonusMeioGanho) {
            this.bonusMeioGanho = true;
            gameState.barras.saude = Phaser.Math.Clamp(gameState.barras.saude - 5, 0, 11);
            this.mostrarPopupMetade();
        }

        if (this.pulgasRemovidas >= this.totalPulgas) {
            gameState.barras.saude = Phaser.Math.Clamp(gameState.barras.saude - 11, 0, 11);
            this.finalizarMinigame();
        }
    }

    mostrarPopupMetade() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 5;
        const larguraFundo = Math.min(700, this.scale.width * 0.9);

        const fundo = this.add.rectangle(cx, cy, larguraFundo, 50, 0x000000, 0.8)
            .setStrokeStyle(4, 0x9be564).setDepth(20);
        const texto = this.add.text(cx, cy, "Metade das\npulgas removidas!", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff", align: "center"
        }).setOrigin(0.5).setDepth(81);

        this.time.delayedCall(2000, () => { fundo.destroy(); texto.destroy(); });
    }

    moverPulga(pulga) {
        this.tweens.killTweensOf(pulga);
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const y = Phaser.Math.Between(80, this.scale.height - 80);
        this.tweens.add({
            targets: pulga, x, y, duration: Phaser.Math.Between(1800, 3200), ease: "Sine.easeInOut",
            onComplete: () => { if (pulga.active && !this.minigameFinalizado) this.moverPulga(pulga); }
        });
    }

    atualizarTextoTempo() {
        if (!this.instrucoesLidas || this.minigameFinalizado) return;
        const segundos = Math.floor((this.time.now - this.tempoInicialMs) / 1000);
        this.textoTempo.setText(`Tempo: ${segundos}s`);
    }

    // ==========================================
    //        FUNÇÕES DE TELA FINAL
    // ==========================================
    finalizarMinigame() {
        if (this.minigameFinalizado) return;
        this.minigameFinalizado = true;
        this.input.setDefaultCursor("default");

        const segundos = Math.ceil((this.time.now - this.tempoInicialMs) / 1000);
        const estrelas = this.calcularEstrelas(segundos);
        const moedas = this.calcularMoedas(estrelas);

        const cachorroAtivo = gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo';
        if (!gameState.recompensas.cuidado[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.cuidado[cachorroAtivo] = true;
        }

        gameState.pulga = false;
        this.mostrarPainelResultado(estrelas, moedas, segundos);
    }

    calcularEstrelas(segundos) {
        if (segundos <= 30) return 3; 
        if (segundos <= 55) return 2; 
        return 1; 
    }

    calcularMoedas(estrelas) {
        if (estrelas === 3) return 20;
        if (estrelas === 2) return 10;
        return 0; 
    }

    mostrarPainelResultado(estrelas, moedas, segundos) {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const imagemFeedback = estrelas === 3 ? "feeedback3estrelas" : 
                               estrelas === 2 ? "feedback2estrelas" : "feedback1estrela";

        // Fundo escurecido atrás do feedback
        const fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(100).setInteractive(); 

        // Imagem principal de feedback
        const telaFeedback = this.add.image(cx, cy, imagemFeedback).setDepth(101);

        // Ajuste de tamanho da imagem (80% da tela)
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaFinal = Math.min(limiteLargura / telaFeedback.width, limiteAltura / telaFeedback.height);
        telaFeedback.setScale(escalaFinal);

        // Textos de pontuação em cima do painel
        const textoMoedas = this.add.text(cx, cy + (telaFeedback.displayHeight * 0.1), `Cobasi Coins: +${moedas}`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "16px", color: "#9be564"
        }).setOrigin(0.5).setDepth(102);

        // Texto piscante para orientar o clique
        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Clique para continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(102);
        
        this.tweens.add({ targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        // Eventos de clique para retornar à cena de veterinário
        const fecharPainel = () => { this.scene.start("cenaVeterinario"); };
        fundoFeedback.on('pointerdown', fecharPainel);
        telaFeedback.setInteractive().on('pointerdown', fecharPainel);
    }

    garantirTexturaPinca() {
        if (this.textures.exists("pincaTool")) return;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.lineStyle(10, 0xdddddd);
        g.beginPath();
        g.moveTo(14, 122); g.lineTo(54, 12);
        g.moveTo(44, 122); g.lineTo(72, 12);
        g.strokePath();
        g.fillStyle(0x555555); g.fillCircle(63, 12, 6);
        g.generateTexture("pincaTool", 88, 132);
        g.destroy();
    }
}