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
        
        // Controle de ferramentas
        this.ferramentaEquipada = null; // Pode ser 'espirrador' ou 'pinca'
        this.pulgaSegurada = null; 
        this.bonusMeioGanho = false;    

        // Variáveis de tempo
        this.tempoLimite = 30;
        this.tempoRestante = 30;

        // Variável para saber se as instruções foram fechadas
        this.instrucoesLidas = false;
    }

    create() {
        // Para garantir que a HUD não fique ativa ao iniciar
        this.scene.stop("HUD");
        this.transicao = false;

        const largura = this.scale.width;
        const altura = this.scale.height;

        // Define o background com base no cachorro ativo
        const bgAtivo = gameState.pets.cachorroJoao ? "bgCuidadoJoao" : (gameState.pets.cachorroHeroi ? "bgCuidadoHeroi" : "bgCuidado");

        // Fundo
        this.fundo = this.add.image(largura / 2, altura / 2, bgAtivo)
            .setDisplaySize(largura, altura); 

        // Reset variáveis
        this.pulgasRemovidas = 0;
        this.pontuacao = 0; 
        this.minigameFinalizado = false;
        this.ferramentaEquipada = null;
        this.bonusMeioGanho = false;
        this.pulgaSegurada = null;
        this.instrucoesLidas = false;
        this.tempoRestante = this.tempoLimite;

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

        // Animação do Espirrador 
        if (!this.anims.exists('anim_spray')) {
            this.anims.create({
                key: 'anim_spray',
                frames: this.anims.generateFrameNumbers('espirradorPulgas', { start: 1, end: 2 }),
                frameRate: 10,
                yoyo: true 
            });
        }

        // Elementos discretos de info no topo
        this.criarTextosInfo();
        
        // Cria as ferramentas na interface (espirrador e pinça)
        this.criarFerramentasUI();
        
        // Cria pulgas
        this.spawnPulgasIniciais();

        // --- LÓGICA DE INTERAÇÃO COM AS PULGAS E FERRAMENTAS ---
        this.input.on('pointerdown', (pointer) => {
            if (!this.instrucoesLidas || !this.ferramentaEquipada || this.minigameFinalizado || this.pulgaSegurada) return;
            
            let pulgaMaisProxima = null;
            let menorDistancia = 60; 
            
            this.pulgas.children.iterate((pulga) => {
                if (!pulga || !pulga.active) return;
                const distancia = Phaser.Math.Distance.Between(pointer.x, pointer.y, pulga.x, pulga.y);
                if (distancia < menorDistancia) {
                    menorDistancia = distancia;
                    pulgaMaisProxima = pulga;
                }
            });

            // Lógica do Espirrador (Matar pulga)
            if (this.ferramentaEquipada === 'espirrador') {
                this.cursorEspirrador.play('anim_spray');
                this.cursorEspirrador.once('animationcomplete', () => {
                    this.cursorEspirrador.setFrame(0);
                });

                if (pulgaMaisProxima && pulgaMaisProxima.getData('estado') === 'viva') {
                    pulgaMaisProxima.setData('estado', 'morta');
                    this.tweens.killTweensOf(pulgaMaisProxima); 
                    pulgaMaisProxima.setFlipY(true); 
                    pulgaMaisProxima.setTint(0xcccccc); 
                }
            } 
            // Lógica da Pinça (Pegar pulga morta)
            else if (this.ferramentaEquipada === 'pinca') {
                if (pulgaMaisProxima && pulgaMaisProxima.getData('estado') === 'morta') {
                    this.pulgaSegurada = pulgaMaisProxima;
                    this.pulgaSegurada.setScale(0.15); 
                }
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (this.pulgaSegurada && this.ferramentaEquipada === 'pinca') {
                const areaBandeja = this.bandeja.getBounds();
                if (Phaser.Geom.Rectangle.ContainsPoint(areaBandeja, pointer)) {
                    this.capturarPulga(this.pulgaSegurada);
                } else {
                    // Se soltar fora da bandeja, ela apenas cai no lugar de volta
                    this.pulgaSegurada.setScale(0.12); 
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

            // Reposiciona ícones de ferramentas caso não estejam equipadas
            if (this.iconeEspirrador) this.iconeEspirrador.setPosition(novaLargura * 0.2, novaAltura * 0.85);
            if (this.iconePinca) this.iconePinca.setPosition(novaLargura * 0.8, novaAltura * 0.85);

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

        this.mostrarInstrucoes();
    }

    update() {
        if (!this.instrucoesLidas || !this.ferramentaEquipada || this.minigameFinalizado) return;

        const ponteiro = this.input.activePointer;
        
        // Move o cursor customizado de acordo com a ferramenta equipada
        if (this.ferramentaEquipada === 'espirrador' && this.cursorEspirrador) {
            this.cursorEspirrador.setPosition(ponteiro.x + 30, ponteiro.y + 30);
        } else if (this.ferramentaEquipada === 'pinca' && this.cursorPinca) {
            this.cursorPinca.setPosition(ponteiro.x + 18, ponteiro.y + 14);
        }

        if (this.pulgaSegurada) {
            this.pulgaSegurada.setPosition(ponteiro.x, ponteiro.y);
        }
    }

    // ==========================================
    //       FUNÇÕES DE INÍCIO / INSTRUÇÕES
    // ==========================================
    mostrarInstrucoes() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.fundoInstrucao = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85)
            .setDepth(200).setScrollFactor(0).setInteractive(); 

        this.imgInstrucao = this.add.image(cx, cy, "comoJogarPulgas")
            .setDepth(201).setScrollFactor(0).setInteractive();

        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaX = limiteLargura / this.imgInstrucao.width;
        const escalaY = limiteAltura / this.imgInstrucao.height;
        this.imgInstrucao.setScale(Math.min(escalaX, escalaY)); 

        this.textoIniciar = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 40, "[ Clique ou aperte ESPAÇO para começar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
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
        
        this.mostrarPopupInstrucaoFerramentas();
    }

    // ==========================================
    //           MECÂNICAS DO JOGO
    // ==========================================
    mostrarPopupInstrucaoFerramentas() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;
        const textoPopup = this.add.text(cx, cy, "MATE as pulgas com o Espirrador,\ndepois PEGUE com a Pinça!", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "16px", color: "#ffd166",
            stroke: "#000000", strokeThickness: 8, align: "center"
        }).setOrigin(0.5).setDepth(80);
        
        this.time.delayedCall(3000, () => { textoPopup.destroy(); });
    }

    criarTextosInfo() {
        this.textoTempo = this.add.text(20, 30, `Tempo: ${this.tempoLimite}s`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "20px", color: "#ffffff",
            stroke: "#000000", strokeThickness: 5
        }).setOrigin(0, 0).setDepth(50);

        this.textoProgresso = this.add.text(this.scale.width - 20, 30, `Bandeja: 0/${this.totalPulgas}`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "20px", color: "#ffffff",
            stroke: "#000000", strokeThickness: 4
        }).setOrigin(1, 0).setDepth(50);
    }

    criarFerramentasUI() {
        const altura = this.scale.height;
        const largura = this.scale.width;

        this.iconeEspirrador = this.add.sprite(largura * 0.2, altura * 0.85, 'espirradorPulgas', 0)
            .setDepth(60).setScale(0.4); 

        this.iconePinca = this.add.image(largura * 0.8, altura * 0.85, 'pinca')
            .setDepth(60).setScale(0.3); 

        const raioEspirrador = this.iconeEspirrador.width * 0.3; 
        this.iconeEspirrador.setInteractive({
            hitArea: new Phaser.Geom.Circle(this.iconeEspirrador.width / 2, this.iconeEspirrador.height / 2, raioEspirrador),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            useHandCursor: true
        });

        const raioPinca = this.iconePinca.width * 0.3; 
        this.iconePinca.setInteractive({
            hitArea: new Phaser.Geom.Circle(this.iconePinca.width / 2, this.iconePinca.height / 2, raioPinca),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            useHandCursor: true
        });

        // Cursores customizados escondidos inicialmente
        this.cursorEspirrador = this.add.sprite(0, 0, 'espirradorPulgas', 0)
            .setDepth(100).setScale(0.5).setVisible(false); 
            
        this.cursorPinca = this.add.image(0, 0, 'pinca')
            .setDepth(100).setScale(0.3).setVisible(false); 

        // Eventos de clique para trocar a ferramenta
        this.iconeEspirrador.on("pointerdown", () => this.equiparFerramenta('espirrador'));
        this.iconePinca.on("pointerdown", () => this.equiparFerramenta('pinca'));
    }

    desequiparFerramentas() {
        this.ferramentaEquipada = null;
        this.input.setDefaultCursor("default");
        
        // Esconde os cursores
        if (this.cursorEspirrador) this.cursorEspirrador.setVisible(false);
        if (this.cursorPinca) this.cursorPinca.setVisible(false);
        
        // Retorna a opacidade dos botões
        if (this.iconeEspirrador) this.iconeEspirrador.setAlpha(1);
        if (this.iconePinca) this.iconePinca.setAlpha(1);

        // Se o jogador estiver segurando a pulga e clicar para soltar a ferramenta
        if (this.pulgaSegurada) {
            this.pulgaSegurada.setScale(0.12);
            this.pulgaSegurada = null;
        }
    }

    equiparFerramenta(nomeFerramenta) {
        // Se a ferramenta clicada for a que já está equipada, desequipa.
        if (this.ferramentaEquipada === nomeFerramenta) {
            this.desequiparFerramentas();
            return;
        }

        this.ferramentaEquipada = nomeFerramenta;
        this.input.setDefaultCursor("none"); 

        if (nomeFerramenta === 'espirrador') {
            this.cursorEspirrador.setVisible(true);
            this.cursorPinca.setVisible(false);
            // Destaca o ícone do espirrador e opaca a pinça
            this.iconeEspirrador.setAlpha(0.5);
            this.iconePinca.setAlpha(1);
        } else if (nomeFerramenta === 'pinca') {
            this.cursorEspirrador.setVisible(false);
            this.cursorPinca.setVisible(true);
            // Destaca o ícone da pinça e opaca o espirrador
            this.iconePinca.setAlpha(0.5);
            this.iconeEspirrador.setAlpha(1);
        }
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
        pulga.setData('estado', 'viva'); 
    }

    capturarPulga(pulga) {
        if (!pulga.active) return;
        this.tweens.killTweensOf(pulga);
        pulga.setActive(false).setVisible(false);
        if (pulga.body) pulga.body.enable = false;

        this.pulgasRemovidas++;
        this.pontuacao += 50; 

        this.textoProgresso.setText(`Bandeja: ${this.pulgasRemovidas}/${this.totalPulgas}`);

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
        const texto = this.add.text(cx, cy, "Metade das\npulgas recolhidas!", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff", align: "center"
        }).setOrigin(0.5).setDepth(81);

        this.time.delayedCall(2000, () => { fundo.destroy(); texto.destroy(); });
    }

    moverPulga(pulga) {
        if (pulga.getData('estado') !== 'viva') return; 

        this.tweens.killTweensOf(pulga);
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const y = Phaser.Math.Between(80, this.scale.height - 80);
        this.tweens.add({
            targets: pulga, x, y, duration: Phaser.Math.Between(1800, 3200), ease: "Sine.easeInOut",
            onComplete: () => { 
                if (pulga.active && !this.minigameFinalizado && pulga.getData('estado') === 'viva') {
                    this.moverPulga(pulga); 
                }
            }
        });
    }

    atualizarTextoTempo() {
        if (!this.instrucoesLidas || this.minigameFinalizado) return;
        
        const segundosPassados = Math.floor((this.time.now - this.tempoInicialMs) / 1000);
        this.tempoRestante = Math.max(0, this.tempoLimite - segundosPassados);
        
        this.textoTempo.setText(`Tempo: ${this.tempoRestante}s`);

        if (this.tempoRestante === 0) {
            this.perderMinigame();
        }
    }

    // ==========================================
    //        FUNÇÕES DE TELA FINAL
    // ==========================================

    perderMinigame() {
        if (this.minigameFinalizado) return;
        this.minigameFinalizado = true;
        this.input.setDefaultCursor("default");
        
        if (this.cursorEspirrador) this.cursorEspirrador.setVisible(false);
        if (this.cursorPinca) this.cursorPinca.setVisible(false);

        this.pulgas.children.iterate((pulga) => {
            this.tweens.killTweensOf(pulga);
        });

        this.mostrarPainelResultado(0, 0, 0); 
    }

    finalizarMinigame() {
        if (this.minigameFinalizado) return;
        this.minigameFinalizado = true;
        this.input.setDefaultCursor("default");
        
        if(this.cursorEspirrador) this.cursorEspirrador.setVisible(false);
        if(this.cursorPinca) this.cursorPinca.setVisible(false);

        const estrelas = this.calcularEstrelas(this.tempoRestante);
        const moedas = this.calcularMoedas(estrelas);

        const cachorroAtivo = gameState.pets.cachorroJoao ? 'joao' : (gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo');
        if (!gameState.recompensas.cuidado[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.cuidado[cachorroAtivo] = true;
        }

        if (gameState.pets.cachorroJoao && !gameState.exibirQuiz) {
            gameState.exibirQuiz = true;
        }

        this.pulgas.children.iterate((pulga) => {
            this.tweens.killTweensOf(pulga);
        });

        this.mostrarPainelResultado(estrelas, moedas, this.tempoRestante); 
    }

    calcularEstrelas(tempoRestante) {
        if (tempoRestante >= 20) return 3; 
        if (tempoRestante >= 10) return 2; 
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
                               estrelas === 2 ? "feedback2estrelas" : "feedback1estrela"; // Obs: se não tiver imagem "feedback0estrelas", ele vai usar a de 1 estrela ao perder.

        const fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(100).setInteractive(); 

        const telaFeedback = this.add.image(cx, cy, imagemFeedback).setDepth(101);

        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaFinal = Math.min(limiteLargura / telaFeedback.width, limiteAltura / telaFeedback.height);
        telaFeedback.setScale(escalaFinal); 

        let posMoedasY = cy + (telaFeedback.displayHeight * 0.12);
        this.add.text(cx-12, posMoedasY, `${moedas} Moedas`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(102);

        let posTempoY = cy + (telaFeedback.displayHeight * 0.31); 
        this.add.text(cx-20, posTempoY, `${segundos}s`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64" 
        }).setOrigin(0.5).setDepth(102);

        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Clique para continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(102);
        
        this.tweens.add({ targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const fecharPainel = () => { this.scene.start("cenaVeterinario"); };
        fundoFeedback.on('pointerdown', fecharPainel);
        telaFeedback.setInteractive().on('pointerdown', fecharPainel);
    }
}