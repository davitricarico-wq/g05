// Importa o estado global para persistência de dados (moedas, status de recompensas, pets ativos)
// e a função utilitária para gerenciar a trilha sonora
import { gameState, iniciarMusicaAleatoria } from "../main.js";

/**
 * @class cenaCuidado
 * @extends Phaser.Scene
 * @description Cena responsável pelo minigame de "Cuidado Veterinário" (Remoção de Pulgas).
 * O jogador deve usar duas ferramentas sequencialmente (Espirrador para abater, Pinça para recolher)
 * dentro de um limite de tempo. Possui design responsivo e mecânicas de "Drag and Drop" customizadas.
 */
export class cenaCuidado extends Phaser.Scene {
    constructor() {
        // Define a chave de identificação única da cena no Phaser
        super({ key: "cenaCuidado" });

        this.totalPulgas = 12;          // Quantidade de pulgas a serem geradas
        this.pulgasRemovidas = 0;       // Contador de progresso atual
        this.pontuacao = 0;             // Pontuação bruta acumulada
        this.minigameFinalizado = false;// Flag de estado para travar interações no fim do jogo
        
        this.ferramentaEquipada = null; // Guarda a string da ferramenta ativa ('espirrador' ou 'pinca')
        this.pulgaSegurada = null;      // Referência ao sprite da pulga que está sendo arrastada
        this.bonusMeioGanho = false;    // Flag para evitar múltiplos disparos do evento de 50% concluído

        this.tempoLimite = 50;          // Tempo total em segundos
        this.tempoRestante = 50;        // Tempo decrescente em tempo real

        this.instrucoesLidas = false;   // Bloqueia o jogo até o usuário fechar o tutorial inicial
    }

    /**
     * @method create
     * @description Inicializa os componentes visuais, física, eventos de input e UI da cena.
     */
    create() {
        
        // Desativa a cena de HUD principal para focar exclusivamente na UI do minigame
        this.scene.stop("HUD");
        this.transicao = false;

        // Inicia a música de fundo se o jogador habilitou nas configurações
        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }

        const largura = this.scale.width;
        const altura = this.scale.height;

        // Seleciona a imagem de fundo correspondente ao cachorro ativo no estado global
        const bgAtivo = gameState.pets.cachorroJoao ? "bgCuidadoJoao" : 
                       (gameState.pets.cachorroHeroi ? "bgCuidadoHeroi" : "bgCuidado");

        // Renderiza e dimensiona o fundo para preencher toda a tela
        this.fundo = this.add.image(largura / 2, altura / 2, bgAtivo)
            .setDisplaySize(largura, altura); 

        // Garante que os estados voltem ao padrão caso a cena seja reiniciada
        this.pulgasRemovidas = 0;
        this.pontuacao = 0; 
        this.minigameFinalizado = false;
        this.ferramentaEquipada = null;
        this.bonusMeioGanho = false;
        this.pulgaSegurada = null;
        this.instrucoesLidas = false;
        this.tempoRestante = this.tempoLimite;
        gameState.cobasiCoins = gameState.cobasiCoins ?? 0;

        // Bandeja de coleta de pulgas (posicionada na base da tela)
        this.bandeja = this.add.image(largura / 2, altura * 0.85, "bandeja")
            .setDepth(5)
            .setScale(0.5); 

        // Grupo de física para as pulgas (facilita iteração e gerenciamento em massa)
        this.pulgas = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: this.totalPulgas
        });

        // Configuração de animação do Espirrador (Feedback visual de uso)
        if (!this.anims.exists('anim_spray')) {
            this.anims.create({
                key: 'anim_spray',
                frames: this.anims.generateFrameNumbers('espirradorPulgas', { start: 1, end: 2 }),
                frameRate: 10,
                yoyo: true // Faz a animação "ir e voltar" suavemente
            });
        }

        // Constrói a UI da cena (Textos, Ícones e Botões)
        this.criarTextosInfo();
        this.criarFerramentasUI();
        this.spawnPulgasIniciais();

        // Evento global de clique/toque na tela
        this.input.on('pointerdown', (pointer) => {
            // Early return: Ignora interações se o jogo estiver bloqueado, finalizado ou se já estiver arrastando
            if (!this.instrucoesLidas || !this.ferramentaEquipada || this.minigameFinalizado || this.pulgaSegurada) return;
            
            let pulgaMaisProxima = null;
            let menorDistancia = 60; // Raio máximo de hit-detection (60 pixels)
            
            // Busca a pulga mais próxima do cursor dentro do raio estipulado
            this.pulgas.children.iterate((pulga) => {
                if (!pulga || !pulga.active) return;
                const distancia = Phaser.Math.Distance.Between(pointer.x, pointer.y, pulga.x, pulga.y);
                
                if (distancia < menorDistancia) {
                    menorDistancia = distancia;
                    pulgaMaisProxima = pulga;
                }
            });

            // Lógica de abate (Espirrador)
            if (this.ferramentaEquipada === 'espirrador') {
                this.cursorEspirrador.play('anim_spray');
                this.cursorEspirrador.once('animationcomplete', () => {
                    this.cursorEspirrador.setFrame(0);
                });

                // Abate a pulga se estiver viva
                if (pulgaMaisProxima && pulgaMaisProxima.getData('estado') === 'viva') {
                    pulgaMaisProxima.setData('estado', 'morta');
                    this.tweens.killTweensOf(pulgaMaisProxima); // Interrompe o movimento caótico
                    pulgaMaisProxima.setFlipY(true);            // Feedback visual: vira de cabeça para baixo
                    pulgaMaisProxima.setTint(0xcccccc);         // Feedback visual: escurece a textura
                }
            } 
            // Lógica de coleta (Pinça)
            else if (this.ferramentaEquipada === 'pinca') {
                // Só permite agarrar pulgas previamente abatidas
                if (pulgaMaisProxima && pulgaMaisProxima.getData('estado') === 'morta') {
                    this.pulgaSegurada = pulgaMaisProxima;
                    this.pulgaSegurada.setScale(0.15); // Aumenta levemente para dar sensação de destaque
                }
            }
        });

        // Evento de liberação de clique/toque (Drop)
        this.input.on('pointerup', (pointer) => {
            if (this.pulgaSegurada && this.ferramentaEquipada === 'pinca') {
                const areaBandeja = this.bandeja.getBounds();

                // Hit-detection geométrico para checar se soltou em cima da bandeja
                if (Phaser.Geom.Rectangle.ContainsPoint(areaBandeja, pointer)) {
                    this.capturarPulga(this.pulgaSegurada);
                } else {
                    // Se errou a bandeja, restaura a escala original
                    this.pulgaSegurada.setScale(0.12); 
                }
                this.pulgaSegurada = null; // Limpa a referência
            }
        });

        // --- SISTEMA DE RESPONSIVIDADE ---
        const handleResize = (gameSize) => {
            const novaLargura = gameSize.width;
            const novaAltura = gameSize.height;

            this.cameras.resize(novaLargura, novaAltura);
            
            if (this.fundo) {
                this.fundo.setDisplaySize(novaLargura, novaAltura).setPosition(novaLargura / 2, novaAltura / 2); 
            }

            if (this.textoTempo) this.textoTempo.setPosition(20, 30);
            if (this.textoProgresso) this.textoProgresso.setPosition(novaLargura - 20, 30);
            if (this.bandeja) this.bandeja.setPosition(novaLargura / 2, novaAltura * 0.85);
            if (this.iconeEspirrador) this.iconeEspirrador.setPosition(novaLargura * 0.2, novaAltura * 0.85);
            if (this.iconePinca) this.iconePinca.setPosition(novaLargura * 0.8, novaAltura * 0.85);

            // Mantém as pulgas dentro dos limites visuais da tela em caso de rotação de dispositivo
            this.pulgas.children.iterate((pulga) => {
                if (pulga && pulga.active && pulga !== this.pulgaSegurada) {
                    pulga.x = Phaser.Math.Clamp(pulga.x, 50, novaLargura - 50);
                    pulga.y = Phaser.Math.Clamp(pulga.y, 80, novaAltura - 80);
                }
            });

            // Responsividade dos modais/instruções
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

        // Limpeza de eventos globais ao destruir a cena
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResize);
            this.input.keyboard.removeListener('keydown-SPACE'); 
        });

        // Dispara o overlay de tutorial
        this.mostrarInstrucoes();
    }

    /**
     * @method update
     * @description Game Loop - Atualiza a lógica frame a frame.
     * Utilizado primariamente para vincular o cursor customizado à posição real do mouse/touch.
     */
    update() {
        if (!this.instrucoesLidas || !this.ferramentaEquipada || this.minigameFinalizado) return;

        const ponteiro = this.input.activePointer;
        
        // Aplica offset aos cursores visuais para que a "ponta" da ferramenta alinhe com o clique real
        if (this.ferramentaEquipada === 'espirrador' && this.cursorEspirrador) {
            this.cursorEspirrador.setPosition(ponteiro.x + 30, ponteiro.y + 30);
        } else if (this.ferramentaEquipada === 'pinca' && this.cursorPinca) {
            this.cursorPinca.setPosition(ponteiro.x + 18, ponteiro.y + 14);
        }

        // Lógica de arrasto em tempo real
        if (this.pulgaSegurada) {
            this.pulgaSegurada.setPosition(ponteiro.x, ponteiro.y);
        }
    }

    /**
     * @method mostrarInstrucoes
     * @description Exibe o painel flutuante inicial ensinando o jogador.
     */
    mostrarInstrucoes() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.fundoInstrucao = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.85)
            .setDepth(200).setScrollFactor(0).setInteractive(); 

        this.imgInstrucao = this.add.image(cx, cy, "comoJogarPulgas")
            .setDepth(201).setScrollFactor(0).setInteractive();

        // Escala a imagem do tutorial garantindo margens
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaX = limiteLargura / this.imgInstrucao.width;
        const escalaY = limiteAltura / this.imgInstrucao.height;
        this.imgInstrucao.setScale(Math.min(escalaX, escalaY)); 

        this.textoIniciar = this.add.text(cx, cy + (this.imgInstrucao.displayHeight / 2) + 40, "[ Clique ou aperte ESPAÇO para começar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);
        
        // Efeito de "Blink/Piscar" para o texto de iniciar
        this.tweens.add({
            targets: this.textoIniciar, alpha: 0.5, duration: 600, yoyo: true, loop: -1
        });

        // Callback de fechamento do modal
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
    
    /**
     * @method iniciarMinigameAposInstrucoes
     * @description Dispara o fluxo lógico do jogo de fato, ativando timer e movimento.
     */
    iniciarMinigameAposInstrucoes() {
        this.instrucoesLidas = true;
        this.tempoInicialMs = this.time.now;
        
        // Cria o laço do cronômetro (Roda a cada 100ms para alta precisão de UI)
        this.timerEvent = this.time.addEvent({
            delay: 100, callback: this.atualizarTextoTempo, callbackScope: this, loop: true
        });
        
        // Inicia as rotinas de patrulha/movimentação das pulgas
        this.pulgas.children.iterate((pulga) => {
            if (pulga && pulga.active) this.moverPulga(pulga);
        });
        
        this.mostrarPopupInstrucaoFerramentas();
    }

    /**
     * @method mostrarPopupInstrucaoFerramentas
     * @description Exibe um lembrete visual de 3 segundos no centro da tela.
     */
    mostrarPopupInstrucaoFerramentas() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;
        const textoPopup = this.add.text(cx, cy, "MATE as pulgas com o Espirrador,\ndepois PEGUE com a Pinça!", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "16px", color: "#ffd166",
            stroke: "#000000", strokeThickness: 8, align: "center"
        }).setOrigin(0.5).setDepth(80);
        
        this.time.delayedCall(3000, () => { textoPopup.destroy(); });
    }

    /**
     * @method criarTextosInfo
     * @description Cria o cabeçalho contendo HUD de tempo e progresso.
     */
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

    /**
     * @method criarFerramentasUI
     * @description Cria as ferramentas clicáveis e prepara os cursores visuais (invisíveis por padrão).
     */
    criarFerramentasUI() {
        const altura = this.scale.height;
        const largura = this.scale.width;

        this.iconeEspirrador = this.add.sprite(largura * 0.2, altura * 0.85, 'espirradorPulgas', 0)
            .setDepth(60).setScale(0.4); 

        this.iconePinca = this.add.image(largura * 0.8, altura * 0.85, 'pinca')
            .setDepth(60).setScale(0.3); 

        // Definição de HitAreas circulares para melhor UX nos ícones
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

        // Sprites que seguirão o mouse (cursores customizados)
        this.cursorEspirrador = this.add.sprite(0, 0, 'espirradorPulgas', 0)
            .setDepth(100).setScale(0.5).setVisible(false); 
            
        this.cursorPinca = this.add.image(0, 0, 'pinca')
            .setDepth(100).setScale(0.3).setVisible(false); 

        // Bindings de botões
        this.iconeEspirrador.on("pointerdown", () => this.equiparFerramenta('espirrador'));
        this.iconePinca.on("pointerdown", () => this.equiparFerramenta('pinca'));
    }

    /**
     * @method desequiparFerramentas
     * @description Limpa a seleção atual, restaura cursores padrão e reseta alphas.
     */
    desequiparFerramentas() {
        this.ferramentaEquipada = null;
        this.input.setDefaultCursor("default");
        
        if (this.cursorEspirrador) this.cursorEspirrador.setVisible(false);
        if (this.cursorPinca) this.cursorPinca.setVisible(false);
        
        if (this.iconeEspirrador) this.iconeEspirrador.setAlpha(1);
        if (this.iconePinca) this.iconePinca.setAlpha(1);

        // Se o jogador desequipar no meio de um arrasto, solta a pulga
        if (this.pulgaSegurada) {
            this.pulgaSegurada.setScale(0.12);
            this.pulgaSegurada = null;
        }
    }

    /**
     * @method equiparFerramenta
     * @description Alterna entre o uso do Spray ou Pinça. Esconde o cursor do SO.
     * @param {string} nomeFerramenta - Chave de identificação da ferramenta desejada.
     */
    equiparFerramenta(nomeFerramenta) {
        // Toggle (Clica na equipada = desequipa)
        if (this.ferramentaEquipada === nomeFerramenta) {
            this.desequiparFerramentas();
            return;
        }

        this.ferramentaEquipada = nomeFerramenta;
        this.input.setDefaultCursor("none"); // Oculta o mouse do sistema operacional

        if (nomeFerramenta === 'espirrador') {
            this.cursorEspirrador.setVisible(true);
            this.cursorPinca.setVisible(false);
            // Alpha 0.5 atua como feedback de interface de "botão pressionado"
            this.iconeEspirrador.setAlpha(0.5);
            this.iconePinca.setAlpha(1);
        } else if (nomeFerramenta === 'pinca') {
            this.cursorEspirrador.setVisible(false);
            this.cursorPinca.setVisible(true);
            this.iconePinca.setAlpha(0.5);
            this.iconeEspirrador.setAlpha(1);
        }
    }

    /**
     * @method spawnPulgasIniciais
     * @description Delegação estruturada para criação do grupo original.
     */
    spawnPulgasIniciais() {
        for (let i = 0; i < this.totalPulgas; i++) this.spawnPulga();
    }

    /**
     * @method spawnPulga
     * @description Instancia um sprite de pulga no grupo físico e define seu estado inicial.
     */
    spawnPulga() {
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const y = Phaser.Math.Between(80, this.scale.height - 80); 
        const pulga = this.pulgas.get(x, y, "pulga1");
        
        if (!pulga) return;
        
        pulga.setActive(true).setVisible(true);
        pulga.body.setAllowGravity(false); // O minigame é top-down/abstrato, não usa gravidade
        pulga.setScale(0.12).setDepth(10); 
        pulga.setData('estado', 'viva'); // Chave customizada crucial para a lógica do jogo
    }

    /**
     * @method capturarPulga
     * @description Trata a lógica ao colocar uma pulga na bandeja com sucesso.
     * @param {Phaser.GameObjects.Sprite} pulga - Sprite que foi coletado.
     */
    capturarPulga(pulga) {
        if (!pulga.active) return;
        
        // Remove totalmente a pulga da cena e da física
        this.tweens.killTweensOf(pulga);
        pulga.setActive(false).setVisible(false);
        if (pulga.body) pulga.body.enable = false;

        this.pulgasRemovidas++;
        this.pontuacao += 50; 
        this.textoProgresso.setText(`Bandeja: ${this.pulgasRemovidas}/${this.totalPulgas}`);

        // Milestone de Metade (Aumenta o status de saúde do cachorro e exibe aviso)
        if (this.pulgasRemovidas === 6 && !this.bonusMeioGanho) {
            this.bonusMeioGanho = true;
            // O valor de 'saude' parece operar no formato "quanto menor = mais saudável"
            gameState.barras.saude = Phaser.Math.Clamp(gameState.barras.saude - 5, 0, 11);
            this.mostrarPopupMetade();
        }

        // Condição de Vitória Completa
        if (this.pulgasRemovidas >= this.totalPulgas) {
            gameState.barras.saude = Phaser.Math.Clamp(gameState.barras.saude - 11, 0, 11);
            this.finalizarMinigame();
        }
    }

    /**
     * @method mostrarPopupMetade
     * @description Overlay visual confirmando progresso de 50%.
     */
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

    /**
     * @method moverPulga
     * @description Rotina recursiva utilizando Tweens para mover a pulga viva aleatoriamente pela tela.
     * @param {Phaser.GameObjects.Sprite} pulga - Sprite que deve iniciar a patrulha.
     */
    moverPulga(pulga) {
        // Bloqueia movimento se estiver morta
        if (pulga.getData('estado') !== 'viva') return; 

        // Garante que não empilhemos múltiplos tweens
        this.tweens.killTweensOf(pulga);
        
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const y = Phaser.Math.Between(80, this.scale.height - 80);
        
        this.tweens.add({
            targets: pulga, x, y, 
            duration: Phaser.Math.Between(1800, 3200), // Duração variante traz naturalidade/aleatoriedade
            ease: "Sine.easeInOut",
            onComplete: () => { 
                // Chamada recursiva ao finalizar o movimento, perpetuando o ciclo enquanto o jogo rodar
                if (pulga.active && !this.minigameFinalizado && pulga.getData('estado') === 'viva') {
                    this.moverPulga(pulga); 
                }
            }
        });
    }

    /**
     * @method atualizarTextoTempo
     * @description Callback atrelado ao evento de tempo contínuo que calcula o relógio decrescente.
     */
    atualizarTextoTempo() {
        if (!this.instrucoesLidas || this.minigameFinalizado) return;
        
        const segundosPassados = Math.floor((this.time.now - this.tempoInicialMs) / 1000);
        this.tempoRestante = Math.max(0, this.tempoLimite - segundosPassados);
        
        this.textoTempo.setText(`Tempo: ${this.tempoRestante}s`);

        // Condição de Derrota Total
        if (this.tempoRestante === 0) {
            this.perderMinigame();
        }
    }

    /**
     * @method perderMinigame
     * @description Manipula a transição para Game Over (falta de tempo).
     */
    perderMinigame() {
        if (this.minigameFinalizado) return;
        this.minigameFinalizado = true;
        this.input.setDefaultCursor("default");
        
        if (this.cursorEspirrador) this.cursorEspirrador.setVisible(false);
        if (this.cursorPinca) this.cursorPinca.setVisible(false);

        // Congela todas as pulgas
        this.pulgas.children.iterate((pulga) => {
            this.tweens.killTweensOf(pulga);
        });

        // Exibe 0 estrelas / 0 moedas
        this.mostrarPainelResultado(0, 0, 0); 
    }

    /**
     * @method finalizarMinigame
     * @description Conclui com sucesso. Atribui pontuações, grava estado global e limpa entidades físicas.
     */
    finalizarMinigame() {
        if (this.minigameFinalizado) return;
        this.minigameFinalizado = true;
        this.input.setDefaultCursor("default");
        
        if(this.cursorEspirrador) this.cursorEspirrador.setVisible(false);
        if(this.cursorPinca) this.cursorPinca.setVisible(false);

        // Atualiza a máquina de estado global curando o pet atual
        gameState.pulga = false;
        gameState.cachorroTemPulga = false;
        
        this.pulgas.children.iterate((pulga) => {
            if (!pulga) return;
            pulga.setVisible(false);
            pulga.setActive(false);
            if (pulga.body) pulga.body.enable = false;
            this.tweens.killTweensOf(pulga);
        });

        const estrelas = this.calcularEstrelas(this.tempoRestante);
        const moedas = this.calcularMoedas(estrelas);

        // Atribui recompensas baseado no pet selecionado (Apenas se já não recebeu antes)
        const cachorroAtivo = gameState.pets.cachorroJoao ? 'joao' : (gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo');
        if (!gameState.recompensas.cuidado[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.cuidado[cachorroAtivo] = true;
        }

        // Fluxo narrativo condicional (Trigger de evento)
        if (gameState.pets.cachorroJoao && !gameState.exibirQuiz) {
            gameState.exibirQuiz = true;
        }

        this.mostrarPainelResultado(estrelas, moedas, this.tempoRestante); 
    }

    /**
     * @method calcularEstrelas
     * @description Sistema dinâmico de pontuação 3 estrelas baseado no tempo ágil.
     * @param {number} tempoRestante 
     * @returns {number} Quantidade de estrelas conquistadas.
     */
    calcularEstrelas(tempoRestante) {
        if (tempoRestante >= 25) return 3; 
        if (tempoRestante >= 10) return 2; 
        return 1; 
    }

    /**
     * @method calcularMoedas
     * @description Retorno monetário in-game associado ao nível de estrela.
     * @param {number} estrelas 
     * @returns {number} Quantidade de moedas.
     */
    calcularMoedas(estrelas) {
        if (estrelas === 3) return 20;
        if (estrelas === 2) return 10;
        return 0; 
    }

    /**
     * @method mostrarPainelResultado
     * @description Instancia o modal final de feedback informando estrelas e recompensas recebidas.
     * E gerencia o roteamento dinâmico de cenas ao concluir o minigame.
     * @param {number} estrelas 
     * @param {number} moedas 
     * @param {number} segundos 
     */
    mostrarPainelResultado(estrelas, moedas, segundos) {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // Seleção de asset por qualidade da vitória
        const imagemFeedback = estrelas === 3 ? "feeedback3estrelas" : 
                               estrelas === 2 ? "feedback2estrelas" : "feedback1estrela"; // O fallback cobre 1 estrela ou Game Over (0)

        // Backdrop negro opaco
        const fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(100).setInteractive(); 

        const telaFeedback = this.add.image(cx, cy, imagemFeedback).setDepth(101);

        // Garante que o popup não estoure os limites da tela (Responsividade)
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaFinal = Math.min(limiteLargura / telaFeedback.width, limiteAltura / telaFeedback.height);
        telaFeedback.setScale(escalaFinal); 

        // Rótulos de recompensas dinamicamente calculados em cima do popup gerado
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

        // Transição de cenas com base no cachorro equipado (Branching Narrative)
        const fecharPainel = () => { 
            if (gameState.pets.cachorroJoao) {
                this.scene.start("cenaPrincipal");
            } else {
                // A maioria dos cachorros retorna à cena do veterinário
                this.scene.start("cenaVeterinario");
            }
        };
        
        // Finaliza ao clicar em qualquer lugar da tela
        fundoFeedback.on('pointerdown', fecharPainel);
        telaFeedback.setInteractive().on('pointerdown', fecharPainel);
    }
}