// Importa o estado global (gameState) para sincronizar moedas, barras de status e a função de áudio
import { gameState, iniciarMusicaAleatoria } from "../main.js";
// Importa o banco de dados estático contendo as propriedades vitais de cada cachorro
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";
// Importa o gerenciador responsável por instanciar, animar e trocar os sprites dos cachorros na tela
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";

/**
 * @class cenaBanho
 * @extends Phaser.Scene
 * @description Cena do minigame de banho. Gerencia uma máquina de estados linear para o pet 
 * (sujo -> molhado -> ensaboado -> enxaguado -> limpo). Destaca-se pelo uso de Object Pooling 
 * para partículas (gotas/bolhas) visando alta performance, e física Arcade para detecção de interações.
 */
export class cenaBanho extends Phaser.Scene {
    constructor() {
        super({ key: "cenaBanho" });
    }

    /**
     * @method init
     * @description Ciclo de vida inicial do Phaser. Fundamental para "limpar" o terreno sempre 
     * que a cena sofre um restart. Garante que variáveis não fiquem presas em estados fantasmas da partida anterior.
     */
    init() {
        // Controle da ferramenta em uso pelo jogador
        this.ferramentaAtiva = null;

        // Acumuladores lógicos para a progressão de cada etapa do banho
        this.acumuladorAgua = 0;   // Tempo entre a geração de cada gota
        this.progressoMolhar = 0;  // Quantas gotas acertaram o pet
        this.tempoSecando = 0;     // Tempo (em frames/ticks) que a toalha esfregou o pet
        this.quantidadeEspuma = 0; // Quantidade de bolhas ativas no corpo do pet

        // Variáveis de rastreio de ponteiro (mouse/touch) usadas para calcular o Delta (deslocamento).
        // Isso garante que o jogador está *esfregando* a ferramenta, e não apenas segurando parada.
        this.ultimoX = 0;
        this.ultimoY = 0;
        
        /** @type {GerenciadorCachorros} Referência tipada do gerenciador para ajudar o IntelliSense da IDE */
        this.gerenciadorCachorros = null;
        this.cachorro = null;

        // Gerenciamento de tempo e fluxo da partida
        this.tempoDecorridoMs = 0;
        this.tempoDecorrido = 0;
        this.banhoEmAndamento = false;
        this.banhoFinalizado = false;
    }

    /**
     * @method create
     * @description Montagem visual e física da cena. É onde os *colliders*, as UI e as mecânicas nascem.
     */
    create() {
        // Sincroniza e garante que a HUD do jogo esteja ativa e sempre desenhada por cima desta cena
        if (!this.scene.isActive("HUD")) this.scene.launch("HUD");
        else if (this.scene.isSleeping("HUD")) this.scene.wake("HUD");
        this.scene.bringToTop("HUD");

        if (gameState.musicaLigada) iniciarMusicaAleatoria(this);

        // Define qual cachorro renderizar com base no estado global (João = 2, Herói = 1, Padrão = 0)
        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0);
        
        // Usa o estado salvo do cachorro ativo para não resetar para "sujo" injustamente
        // caso o jogador abra e feche a cena repetidas vezes.
        const estadoPersistido = cachorrosBase[indiceAtivo].estado || "sujo";
        this.estadoCachorro = estadoPersistido;
        cachorrosBase[indiceAtivo].estado = this.estadoCachorro;

        // Cálculos de responsividade (Reserva 20% da direita para a HUD)
        const largura = this.scale.width;
        const altura = this.scale.height;
        const areaX = largura - (largura * 0.2);
        const areaY = altura;

        // Fundo do banheiro
        gameState.banheiro = this.add.image(areaX / 2, areaY / 2, "bgBanheiro")
            .setDisplaySize(areaX, areaY)
            .setDepth(-1);

        // Configura o texto de tempo e progresso, posicionando-os dinamicamente com base na área útil calculada
        this.textoTempo = this.add.text(areaX / 2, 40, 'Tempo: 0s', {
            fontFamily: '"Press Start 2P", Arial', fontSize: "20px",
            color: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(10);

        // Construção da barra de progresso dinâmica (fundo + preenchimento)
        const larguraBarra = 300;
        this.barraProgressoBg = this.add.rectangle(areaX / 2, 80, larguraBarra, 24, 0x000000, 0.6)
            .setDepth(10)
            .setStrokeStyle(2, 0xffffff);
            
        // Adiciona a barra de preenchimento por cima do fundo, com largura inicial 0 (vazia)
        this.barraProgressoFill = this.add.rectangle((areaX / 2) - (larguraBarra / 2), 80, 0, 24, 0x44aaff, 1)
            .setOrigin(0, 0.5)
            .setDepth(11);
            
        this.textoProgresso = this.add.text(areaX / 2, 80, 'Preparando...', {
            fontFamily: '"Press Start 2P", Arial', fontSize: "12px",
            color: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(12);

        // Seta o cachorro no estado correto (sujo, molhado, ensaboado, etc) com base no progresso persistido
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);
        
        // Cacheia a escala original para aplicar o efeito "Squash & Stretch" futuramente sem distorcer o pet
        this.escalaBaseCachorro = {
            x: this.cachorro.sprite.scaleX || this.cachorro.sprite.scale,
            y: this.cachorro.sprite.scaleY || this.cachorro.sprite.scale
        };

        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }),
                frameRate: 1, repeat: -1
            });
        }

        this.pulgas = this.add.sprite(0, 0, "pulgas").setOrigin(0.5).setScale(areaY * 0.0015);
        this.pulgas.play("pulgaAnim");
        this.pulgas.setVisible(gameState.pulga); // Só aparece se o estado global ditar que há pulgas

        // Agrupa cachorro e pulga para escalonar/posicionar juntos
        this.containerCachorro = this.add.container(areaX / 2, areaY * 0.65, [this.cachorro.sprite, this.pulgas]);
        this.containerCachorro.setScale(areaY * 0.0006);

        // Injeta física Arcade no sprite do cachorro para detectar colisões com a água/sabão.
        // immovable = true impede que as gotas empurrem o cachorro para baixo.
        this.physics.add.existing(this.cachorro.sprite);
        this.cachorro.sprite.body.setAllowGravity(false);
        this.cachorro.sprite.body.immovable = true;
        gameState.cachorro = this.cachorro.sprite;
        this.atualizarEstadoCachorroAnimacao();

        // Setup das ferramentas (sabão, chuveiro e toalha) posicionadas dinamicamente com base na área útil calculada.
        const yFerramentas = areaY * 0.88;
        this.posicaoInicialSabao    = { x: (areaX / 2) - (areaX * 0.25), y: yFerramentas };
        this.posicaoInicialChuveiro = { x: areaX / 2,                     y: yFerramentas };
        this.posicaoInitialToalha   = { x: (areaX / 2) + (areaX * 0.25), y: yFerramentas };

        const escalaFerramentas = areaY * 0.0005;

        // Instancia as ferramentas salvando suas referências globais
        gameState.sabao = this.add.sprite(this.posicaoInicialSabao.x, this.posicaoInicialSabao.y, "sabao")
            .setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.sabao.escalaOriginal = escalaFerramentas * 0.28;
        gameState.sabao.setScale(gameState.sabao.escalaOriginal);

        gameState.chuveiro = this.add.sprite(this.posicaoInicialChuveiro.x, this.posicaoInicialChuveiro.y, "chuveiro")
            .setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.chuveiro.escalaOriginal = escalaFerramentas * 0.36;
        gameState.chuveiro.setScale(gameState.chuveiro.escalaOriginal);

        gameState.toalha = this.add.sprite(this.posicaoInitialToalha.x, this.posicaoInitialToalha.y, "toalha")
            .setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.toalha.escalaOriginal = escalaFerramentas * 0.36;
        gameState.toalha.setScale(gameState.toalha.escalaOriginal);

        // Injeta os corpos físicos nas ferramentas
        [gameState.sabao, gameState.chuveiro, gameState.toalha].forEach(tool => {
            this.physics.add.existing(tool);
            tool.body.setAllowGravity(false);
        });

        /**
         * @function reduzirHitbox
         * @description Hack vital de Level Design: Reduz a caixa de colisão da ferramenta para 
         * obrigar o jogador a colocar o 'centro' da ferramenta exatamente em cima do pet,
         * evitando que ele limpe o cachorro esfregando nas bordas invisíveis da imagem.
         */
        const reduzirHitbox = (ferramenta, fator) => {
            const w = ferramenta.width;
            const h = ferramenta.height;
            ferramenta.body.setSize(w * fator, h * fator);
            ferramenta.body.setOffset(w * ((1 - fator) / 2), h * ((1 - fator) / 2));
        };
        reduzirHitbox(gameState.sabao, 0.3);
        reduzirHitbox(gameState.toalha, 0.3);

        // Cria grupos limitados de física. Se o maxSize for atingido, ele não cria mais objetos,
        // apenas reaproveita os que já existem. Isso é ouro para manter o jogo a 60 FPS no celular.
        gameState.bolhas = this.physics.add.group({ maxSize: 80 });
        gameState.gotas  = this.physics.add.group({ maxSize: 160 });

        
        // Regra 1: Gota de Água x Cachorro
        this.colisaoGotaCachorro = this.physics.add.overlap(
            gameState.gotas, this.cachorro.sprite,
            (obj1, obj2) => {
                if (this.banhoFinalizado) return;
                
                // Extrai quem é a gota independente da ordem dos parâmetros
                const gota = (obj1 === this.cachorro.sprite) ? obj2 : obj1;
                
                // Validação de estado: O cachorro só recebe progresso de água se estiver no estado correto
                if (this.estadoCachorro !== "sujo" || this.ferramentaAtiva !== "chuveiro") return;

                this.reciclarObjeto(gota); // Devolve a gota ao Pool assim que bate no cachorro
                this.progressoMolhar += 1;

                // Transição de Estado: Terminou de molhar
                if (this.progressoMolhar >= 25) {
                    this.estadoCachorro = "molhado_sujo";
                    this.atualizarEstadoCachorroAnimacao();
                    this.animarCachorro(); // Feedback visual (Squash & Stretch)
                    this.mostrarTextoFlutuante("Molhado!\nUse o sabão.", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
                    
                    // Retorna a ferramenta para a prateleira automaticamente
                    this.animarFerramenta(gameState.chuveiro, false);
                    this.retornarPosicaoInicial("chuveiro");
                    this.ferramentaAtiva = null;
                    this.progressoMolhar = 0;
                    
                    // Otimização: Desliga este overlap já que a etapa da água suja acabou
                    this.colisaoGotaCachorro.active = false; 
                }
            }
        );

        // Regra 2: Gota de Água x Bolha de Sabão (Ação de Enxaguar)
        this.physics.add.overlap(gameState.gotas, gameState.bolhas, (gota, bolha) => {
            if (this.banhoFinalizado) return;
            
            // Recicla ambos para simular a água destruindo a espuma
            this.reciclarObjeto(gota);
            this.reciclarObjeto(bolha);
            
            // Só reduz o sabão se a fase atual exigir enxágue
            if (this.ferramentaAtiva === "chuveiro" && (this.estadoCachorro === "ensaboado" || this.estadoCachorro === "lavando")) {
                this.estadoCachorro = "lavando";
                this.cachorro.dados.estado = "lavando";
                this.quantidadeEspuma = Math.max(0, this.quantidadeEspuma - 1);
            }
        });

        // Eventos de seleção de ferramentas
        gameState.sabao.on("pointerdown",    () => this.alternarFerramenta("sabao"));
        gameState.chuveiro.on("pointerdown", () => this.alternarFerramenta("chuveiro"));
        gameState.toalha.on("pointerdown",   () => this.alternarFerramenta("toalha"));

        this.criarAnimacoes();

        // Efeito de entrada suave da câmera
        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.cameras.main.fadeIn(200, 0, 0, 0);

        // Inicializador principal do jogo
        this.iniciarPartida = () => {
            this.tempoDecorridoMs = 0;
            this.tempoDecorrido = 0;
            this.textoTempo.setText('Tempo: 0s');
            this.banhoEmAndamento = true;
        };

        // Orquestração do tutorial (bloqueia o inicio caso o player nunca tenha jogado)
        if (!gameState.instrucoesBanhoVistas) this.mostrarInstrucoes(this.iniciarPartida);
        else this.iniciarPartida();
    }

    /**
     * @method update
     * @description O Game Loop. Chamado a cada frame. Lida com lógicas contínuas (arrastar, timers).
     * @param {number} tempo Timestamp atual.
     * @param {number} delta Tempo transcorrido desde o último frame (usado para cálculos fluidos independetes de framerate).
     */
    update(tempo, delta) {
        if (this.banhoFinalizado) return;

        // Atualização do Timer
        if (this.banhoEmAndamento) {
            this.tempoDecorridoMs += delta;
            this.tempoDecorrido = Math.floor(this.tempoDecorridoMs / 1000);
            this.textoTempo.setText(`Tempo: ${this.tempoDecorrido}s`);
        }

        this.atualizarBarraVisual();

        // Roda a lógica específica de cada ferramenta a cada frame
        const raioHitboxCachorro = (this.containerCachorro.getBounds().width / 2) * 0.8;
        this.atualizarSabao(raioHitboxCachorro);
        this.atualizarChuveiro(delta);
        this.atualizarToalha(raioHitboxCachorro);
        this.limparGotas(); // Remove gotas órfãs que caíram para fora da tela

        // Se o player trocar de cachorro na HUD lateral no meio do banho, o sistema captura essa flag e refatora o estado
        if (gameState.trocar) {
            this.cachorro = this.gerenciadorCachorros.cachorroAtual;
            gameState.cachorro = this.cachorro.sprite;
            
            // Re-cacheia a escala do novo dog
            this.escalaBaseCachorro = {
                x: this.cachorro.sprite.scaleX || this.cachorro.sprite.scale,
                y: this.cachorro.sprite.scaleY || this.cachorro.sprite.scale
            };

            // Reseta toda a máquina de estado do minigame severamente
            this.estadoCachorro = "sujo";
            this.cachorro.dados.estado = "sujo";
            this.quantidadeEspuma = 0;
            this.acumuladorAgua = 0;
            this.progressoMolhar = 0;
            this.tempoSecando = 0;
            this.ferramentaAtiva = null;
            this.atualizarEstadoCachorroAnimacao();

            // Atualiza o container visual removendo o antigo e colocando o novo
            if (this.containerCachorro) {
                this.containerCachorro.removeAll(false);
                this.containerCachorro.add(this.cachorro.sprite);
                if (this.pulgas) this.containerCachorro.add(this.pulgas);
            }

            gameState.sabao.setInteractive({ useHandCursor: true });
            gameState.chuveiro.setInteractive({ useHandCursor: true });
            gameState.toalha.setInteractive({ useHandCursor: true });

            // Reinjetar a física no novo sprite
            if (!this.cachorro.sprite.body) this.physics.add.existing(this.cachorro.sprite);
            this.cachorro.sprite.body.setAllowGravity(false);
            this.cachorro.sprite.body.immovable = true;

            // Como o objeto físico antigo foi destruído, é obrigatório recriar o Overlap atrelado ao novo sprite
            if (this.colisaoGotaCachorro) this.colisaoGotaCachorro.destroy();
            this.colisaoGotaCachorro = this.physics.add.overlap(
                gameState.gotas, this.cachorro.sprite,
                (obj1, obj2) => {
                    const gota = (obj1 === this.cachorro.sprite) ? obj2 : obj1;
                    if (this.estadoCachorro !== "sujo" || this.ferramentaAtiva !== "chuveiro") return;
                    this.reciclarObjeto(gota);
                    this.progressoMolhar += 1;
                    
                    if (this.progressoMolhar >= 25) {
                        this.estadoCachorro = "molhado_sujo";
                        this.atualizarEstadoCachorroAnimacao();
                        this.animarCachorro();
                        this.mostrarTextoFlutuante("Molhado!\nUse o sabão.", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
                        this.animarFerramenta(gameState.chuveiro, false);
                        this.retornarPosicaoInicial("chuveiro");
                        this.ferramentaAtiva = null;
                        this.progressoMolhar = 0;
                        this.colisaoGotaCachorro.active = false;
                    }
                }
            );

            gameState.trocar = false;
        }

        // Sincroniza estado das pulgas visualmente
        if (this.pulgas) this.pulgas.setVisible(gameState.pulga);
        
        // Transição: Terminou de esfregar sabão
        if (this.estadoCachorro === "molhado_sujo" && this.quantidadeEspuma >= 50) {
            this.estadoCachorro = "ensaboado";
            this.atualizarEstadoCachorroAnimacao();
            this.cameras.main.flash(200, 255, 255, 255); // Efeito flash suave indicando checkpoint
            this.animarCachorro();
            this.mostrarTextoFlutuante("Ensaboado!\nUse o chuveiro.", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
            this.animarFerramenta(gameState.sabao, false);
            this.retornarPosicaoInicial("sabao");
            this.ferramentaAtiva = null;
        }

        // Transição: Terminou de enxaguar a espuma
        if (this.estadoCachorro === "lavando" && this.quantidadeEspuma <= 0) {
            this.estadoCachorro = "molhado_limpo";
            this.atualizarEstadoCachorroAnimacao();
            
            // Garbage Collection: Remove bolhas órfãs que escaparam à detecção normal da física
            gameState.bolhas.children.iterate((bolha) => { if (bolha && bolha.active) this.reciclarObjeto(bolha); });
            
            this.animarCachorro();
            this.mostrarTextoFlutuante("Enxaguado!\nAgora a toalha.", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
            this.animarFerramenta(gameState.chuveiro, false);
            this.retornarPosicaoInicial("chuveiro");
            this.ferramentaAtiva = null;
        }
    }

    /** Interpola cor, texto e largura da UI da barra de progresso conforme o passo atual da máquina de estados. */
    atualizarBarraVisual() {
        let porcentagem = 0;
        let texto = "Pronto!";
        let cor = 0x00ff00; // Verde

        if (this.estadoCachorro === "sujo") {
            porcentagem = this.progressoMolhar / 25; texto = "Molhar"; cor = 0x44aaff; // Azul
        } else if (this.estadoCachorro === "molhado_sujo") {
            porcentagem = this.quantidadeEspuma / 50; texto = "Ensaboar"; cor = 0xffffff; // Branco
        } else if (this.estadoCachorro === "ensaboado" || this.estadoCachorro === "lavando") {
            // Conta a % de quão vazia a quantidade de espuma está ficando
            porcentagem = (50 - this.quantidadeEspuma) / 50; texto = "Enxaguar"; cor = 0x44aaff; // Azul
        } else if (this.estadoCachorro === "molhado_limpo") {
            porcentagem = this.tempoSecando / 90; texto = "Secar"; cor = 0xffaa00; // Laranja
        }

        // Clamp garante que a barra nunca seja desenhada com valores negativos ou acima de 100%
        this.barraProgressoFill.width = 300 * Phaser.Math.Clamp(porcentagem, 0, 1);
        this.barraProgressoFill.setFillStyle(cor);
        this.textoProgresso.setText(texto);
    }

    /**
     * @method moverFerramenta
     * @description Move a ferramenta até o ponteiro do mouse/dedo do jogador utilizando interpolação linear (LERP).
     * Isso confere um "arrasto" (drag) macio e elástico em vez de teleportar a ferramenta instantaneamente.
     */
    moverFerramenta(ferramenta) {
        ferramenta.x = Phaser.Math.Linear(ferramenta.x, this.input.activePointer.x, 0.5);
        ferramenta.y = Phaser.Math.Linear(ferramenta.y, this.input.activePointer.y, 0.5);
        // Atualiza a hitboxtísica manulamente já que estamos sobrescrevendo a posição do sprite 
        ferramenta.body.updateFromGameObject();
    }

    /**
     * @method atualizarSabao
     * @description Emite bolhas de espuma enquanto o sabão é arrastado sobre o pet.
     * Possui um filtro mecânico: Exige deslocamento mínimo (Delta) de 5px para evitar
     * que o jogador pare o mouse no meio do cachorro e a barra complete sozinha.
     */
    atualizarSabao(raioHitbox) {
        if (this.ferramentaAtiva !== "sabao") return;
        const sabao = gameState.sabao;
        this.moverFerramenta(sabao);

        // Verifica se houve atrito/fricção (movimento real) desde o último frame
        const moveu = Math.abs(sabao.x - this.ultimoX) > 5 || Math.abs(sabao.y - this.ultimoY) > 5;
        // Valida se o sabão está sobre a hitbox aproximada do cachorro
        const distancia = Phaser.Math.Distance.Between(sabao.x, sabao.y, this.containerCachorro.x, this.containerCachorro.y);

        if (distancia < raioHitbox && this.estadoCachorro === "molhado_sujo" && this.quantidadeEspuma < 50 && moveu) {
            this.criarBolha();
        }

        this.ultimoX = sabao.x;
        this.ultimoY = sabao.y;
    }

    /**
     * @method atualizarChuveiro
     * @description Emite gotas a cada 50ms (controlado pelo Delta) enquanto o chuveiro está ativo nas mãos do player.
     */
    atualizarChuveiro(delta) {
        if (this.ferramentaAtiva !== "chuveiro") {
            this.acumuladorAgua = 0;
            return;
        }
        this.moverFerramenta(gameState.chuveiro);
        
        this.acumuladorAgua += delta;
        if (this.acumuladorAgua >= 50) {
            this.acumuladorAgua = 0;
            this.criarGota();
        }
    }

    /**
     * @method atualizarToalha
     * @description Seca o pet baseando-se em fricção constante (time based).
     * Se o jogador parar de mover a toalha no meio da ação, o progresso (`tempoSecando`) é resetado a 0!
     */
    atualizarToalha(raioHitbox) {
        if (this.ferramentaAtiva !== "toalha") {
            this.tempoSecando = 0; // Punição se soltar a ferramenta
            return;
        }
        this.moverFerramenta(gameState.toalha);
        if (this.estadoCachorro !== "molhado_limpo") return;

        const toalha = gameState.toalha;
        const moveu = Math.abs(toalha.x - this.ultimoX) > 5 || Math.abs(toalha.y - this.ultimoY) > 5;
        const distancia = Phaser.Math.Distance.Between(toalha.x, toalha.y, this.containerCachorro.x, this.containerCachorro.y);

        if (distancia < raioHitbox) {
            if (moveu) {
                this.tempoSecando += 1;
                // Ao atingir a fricção necessária de 90 ticks, vence a partida.
                if (this.tempoSecando >= 90) this.finalizarBanho();
            }
        } else {
            // Punição: Se afastar a toalha do cachorro, zera a barra.
            this.tempoSecando = 0;
        }

        this.ultimoX = toalha.x;
        this.ultimoY = toalha.y;
    }

    /**
     * @method alternarFerramenta
     * @description Sistema validador central. Ativa/desativa uma ferramenta, mas bloqueia o uso fora de ordem
     * (Ex: Tentar secar um cachorro sujo), emitindo um feedback de erro flutuante na tela, evitando Soft-Locks.
     */
    alternarFerramenta(nomeFerramenta) {
        if (this.banhoFinalizado) return;

        // -- VALIDAÇÕES DA MÁQUINA DE ESTADO --
        if (nomeFerramenta === "sabao" && this.estadoCachorro === "sujo") {
            this.mostrarTextoFlutuante("Molhe o pet\nprimeiro!", gameState.sabao.x, gameState.sabao.y - 60, "#ff4444");
            this.retornarPosicaoInicial(nomeFerramenta);
            return;
        }
        if (nomeFerramenta === "chuveiro" && this.estadoCachorro === "molhado_sujo") {
            this.mostrarTextoFlutuante("Passe o sabão!", gameState.chuveiro.x, gameState.chuveiro.y - 60, "#ff4444");
            this.retornarPosicaoInicial(nomeFerramenta);
            return;
        }
        if (nomeFerramenta === "toalha" && this.estadoCachorro !== "molhado_limpo") {
            this.mostrarTextoFlutuante("Ainda não\nterminou!", gameState.toalha.x, gameState.toalha.y - 60, "#ff4444");
            this.retornarPosicaoInicial(nomeFerramenta);
            return;
        }

        // Se o player clicou numa ferramenta que JÁ ESTÁ ativa, significa que ele quer "guardar" a ferramenta
        if (this.ferramentaAtiva === nomeFerramenta) {
            this.animarFerramenta(this.pegarFerramenta(nomeFerramenta), false);
            this.retornarPosicaoInicial(nomeFerramenta);
            this.ferramentaAtiva = null;
            return;
        }

        // Se já houver outra ferramenta nas mãos, devolve ela primeiro
        if (this.ferramentaAtiva) {
            this.animarFerramenta(this.pegarFerramenta(this.ferramentaAtiva), false);
            this.retornarPosicaoInicial(this.ferramentaAtiva);
        }

        // Equipa a nova ferramenta requisitada
        this.ferramentaAtiva = nomeFerramenta;
        this.animarFerramenta(this.pegarFerramenta(nomeFerramenta), true);
    }

    /**
     * @method finalizarBanho
     * @description Rotina de encerramento do game. Calcula pontuações, limpa barras vitais 
     * no gameState global e chama a UI de vitória.
     */
    finalizarBanho() {
        this.banhoEmAndamento = false;
        this.banhoFinalizado = true;
        this.estadoCachorro = "limpo";
        this.atualizarBarraVisual();
        this.atualizarEstadoCachorroAnimacao();
        this.animarCachorro();
        this.criarExplosaoBrilhos();

        // Cura o status de sujeira globalmente
        gameState.barras.limpeza = Phaser.Math.Clamp(gameState.barras.limpeza - 11, 0, 11);

        // Algoritmo de premiação (Time-Attack base)
        const tempoFinal = this.tempoDecorrido;
        let estrelas = tempoFinal > 40 ? 1 : tempoFinal > 20 ? 2 : 3;
        let moedas   = estrelas === 3 ? 20 : estrelas === 2 ? 10 : 5;

        // Regra de Economia: Bônus de moedas concedido apenas uma única vez por tipo de cachorro.
        const cachorroAtivo = gameState.pets.cachorroJoao ? 'joao' : (gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo');
        if (!gameState.recompensas.banho[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.banho[cachorroAtivo] = true;
        }

        // Desliga a interatividade das ferramentas para congelar o tabuleiro
        gameState.sabao.disableInteractive();
        gameState.chuveiro.disableInteractive();
        gameState.toalha.disableInteractive();
        this.animarFerramenta(gameState.toalha, false);
        this.retornarPosicaoInicial("toalha");
        this.ferramentaAtiva = null;
        this.tempoSecando = 0;

        // Abre o modal de pontuação com um pequeno delay cinemático
        this.time.delayedCall(1200, () => { this.mostrarPainelResultado(estrelas, moedas, tempoFinal); });
    }

    /** Monta dinamicamente a UI de resultados com texto informando os ganhos da rodada. */
    mostrarPainelResultado(estrelas, moedas, segundos) {
        // Correção de Camada: Garante que o painel escuro não fique atrás da HUD lateral
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaBanho");
        });

        let imagemFeedback = "feedback1estrela";
        if (estrelas === 3) imagemFeedback = "feeedback3estrelas";
        else if (estrelas === 2) imagemFeedback = "feedback2estrelas";

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(200).setScrollFactor(0).setInteractive();
        this.telaFeedback = this.add.image(cx, cy, imagemFeedback)
            .setDepth(201).setScrollFactor(0).setInteractive();

        const escalaFinal = Math.min(
            (this.scale.width * 0.8) / this.telaFeedback.width,
            (this.scale.height * 0.8) / this.telaFeedback.height
        );
        this.telaFeedback.setScale(escalaFinal);

        this.textoMoedas = this.add.text(cx - 12, cy + (this.telaFeedback.displayHeight * 0.12), `${moedas} Moedas`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(202);

        this.textoTempo = this.add.text(cx - 20, cy + (this.telaFeedback.displayHeight * 0.35), `${segundos}s`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(202);

        this.textoContinuar = this.add.text(cx, cy + (this.telaFeedback.displayHeight / 2) + 40, "[ Clique para Sair ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

        this.tweens.add({ targets: this.textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        // Função de escape em cadeia que limpa memória antes de ir pra próxima tela
        const voltarCena = () => {
            if (this.fundoFeedback) this.fundoFeedback.destroy();
            if (this.telaFeedback) this.telaFeedback.destroy();
            if (this.textoMoedas) this.textoMoedas.destroy();
            if (this.textoTempo) this.textoTempo.destroy();
            if (this.textoContinuar) this.textoContinuar.destroy();
            this.exibirDirecaoJogador();
        };
        
        this.fundoFeedback.on('pointerdown', voltarCena);
        this.telaFeedback.on('pointerdown', voltarCena);
    }

    /** Exibe o popup de direcionamento final (escolha do destino após a vitória) */
    exibirDirecaoJogador() {
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaBanho");
        });

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const fundoEscuro = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(200).setScrollFactor(0).setInteractive();
        const imgDirecao = this.add.image(cx, cy, "direcaoJogador")
            .setDepth(201).setScrollFactor(0).setInteractive({ useHandCursor: true });

        const escalaFinal = Math.min(
            (this.scale.width * 0.8) / imgDirecao.width,
            (this.scale.height * 0.8) / imgDirecao.height
        );
        imgDirecao.setScale(escalaFinal);

        const txtContinuar = this.add.text(cx, cy + (imgDirecao.displayHeight / 2) + 40, "[ Clique para Continuar ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

        this.tweens.add({ targets: txtContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const voltarCena = () => {
            // Devolve o topo hierárquico para a HUD antes de reiniciar a engine da cena
            this.scene.bringToTop("HUD");
            this.scene.restart();
        };
        
        fundoEscuro.on('pointerdown', voltarCena);
        imgDirecao.on('pointerdown', voltarCena);
    }

    /** * @method retornarPosicaoInicial
     * @description Utiliza uma interpolação elástica (Back.easeOut) para que a ferramenta
     * seja arremessada de volta para a prateleira com um leve balanço visual.
     */
    retornarPosicaoInicial(nomeFerramenta) {
        const ferramenta = this.pegarFerramenta(nomeFerramenta);
        const pos = this.pegarPosicaoInicial(nomeFerramenta);
        if (!ferramenta || !pos) return;
        this.tweens.add({ targets: ferramenta, x: pos.x, y: pos.y, duration: 300, ease: "Back.easeOut" });
    }

    /** * @method animarCachorro
     * @description Efeito de Squash & Stretch no sprite do cachorro para fornecer um 
     * feedback tátil visual sempre que ele passar por uma transição pesada de fase (ex: Ensaboado).
     */
    animarCachorro() {
        const target = this.cachorro?.sprite || gameState.cachorro;
        if (!target) return;
        const escalaX = this.escalaBaseCachorro.x || 1;
        const escalaY = this.escalaBaseCachorro.y || 1;
        
        // Esmaga a altura para 85% e alarga a largura em 115%. Em 150ms retorna ao original (yoyo).
        this.tweens.add({ targets: target, scaleY: escalaY * 0.85, scaleX: escalaX * 1.15, duration: 150, yoyo: true, ease: "Quad.easeInOut" });
    }

    /** Sincroniza a label de estado do Gerenciador com a frame contendo o desenho da sujeira no spritesheet. */
    atualizarEstadoCachorroAnimacao() {
        if (!this.cachorro) return;
        let estadoAnim = "sujo";
        
        // Agrupa os estados intermediários num único desenho ('ensaboado') que exibe sabão na sprite base
        if (["molhado_sujo", "ensaboado", "lavando", "molhado_limpo"].includes(this.estadoCachorro)) estadoAnim = "ensaboado";
        else if (this.estadoCachorro === "limpo") estadoAnim = "limpo";
        
        this.cachorro.mudarEstado(estadoAnim);
        
        // Atualiza a persistência local da classe do cachorro
        const dadosCachorro = cachorrosBase.find(c => c.id === this.cachorro.dados.id) || cachorrosBase[0];
        if (dadosCachorro) dadosCachorro.estado = this.estadoCachorro;
        
        gameState.cachorro = this.cachorro.sprite;
    }

    /** * @method criarBolha
     * @description Puxa uma bolha "morta" do pool, reativa seu collider físico e aplica uma 
     * variação aleatória de X,Y (Spread) em volta do mouse para parecer espuma orgânica.
     */
    criarBolha() {
        const variacaoX = Phaser.Math.RND.between(-30, 30);
        const variacaoY = Phaser.Math.RND.between(-30, 30);
        // O método .get() pega o primeiro objeto inativo do grupo para não instanciar memória nova
        const bolha = gameState.bolhas.get(gameState.sabao.x + variacaoX, gameState.sabao.y + variacaoY, "bolhas");
        if (!bolha) return; // Retorna nulo se o maxSize (80) já estiver lotado e ativo
        
        bolha.setActive(true).setVisible(true).setScale(0.13).clearTint();
        bolha.body.enable = true;
        bolha.body.reset(gameState.sabao.x + variacaoX, gameState.sabao.y + variacaoY);
        bolha.body.setSize(bolha.displayWidth, bolha.displayHeight, true);
        
        this.quantidadeEspuma += 1;
    }

    /** Puxa uma gota morta do pool, liga sua gravidade local/velocidade Y para simular física de chuveiro. */
    criarGota() {
        const variacaoX = Phaser.Math.RND.between(-15, 15);
        const x = gameState.chuveiro.x + variacaoX;
        // Spawna na base da imagem do chuveiro
        const y = gameState.chuveiro.y + gameState.chuveiro.displayHeight / 2; 
        
        const gota = gameState.gotas.get(x, y, "agua");
        if (!gota) return;
        
        gota.setActive(true).setVisible(true);
        gota.body.enable = true;
        gota.body.reset(x, y);
        gota.setScale(0.1);
        gota.play("aguaAnim", true);
        gota.body.setSize(gota.displayWidth, gota.displayHeight, true);
        gota.body.setVelocityY(200); // Força descendente na Arcade Physics
    }

    /** Loop de segurança. Varre as gotas e desativa aquelas que vazaram da área da câmera. */
    limparGotas() {
        gameState.gotas.children.iterate((gota) => {
            if (gota && gota.active && gota.y > this.scale.height + 120) this.reciclarObjeto(gota);
        });
    }

    /** * @method reciclarObjeto
     * @description O coração do Object Pooling. Desliga todas as características custosas de um objeto
     * (Física, Renderização e Update) e o joga para as coordenadas mortas (-200, -200) aguardando reuso.
     */
    reciclarObjeto(objeto) {
        if (!objeto) return;
        if (objeto.body) {
            objeto.body.stop();
            objeto.body.enable = false;
        }
        objeto.setActive(false).setVisible(false);
        objeto.setPosition(-200, -200);
    }

    criarAnimacoes() {
        if (!this.anims.exists("aguaAnim")) {
            this.anims.create({ key: "aguaAnim", frames: this.anims.generateFrameNumbers("agua", { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        }
    }

    /** Aumenta a ferramenta em 10% quando ativada pelo jogador como feedback interativo. */
    animarFerramenta(ferramenta, ativa) {
        if (!ferramenta) return;
        const escalaAlvo = ativa ? ferramenta.escalaOriginal * 1.1 : ferramenta.escalaOriginal;
        this.tweens.add({ targets: ferramenta, scale: escalaAlvo, duration: 150, ease: "Back.easeOut" });
    }

    /**
     * Exibe um texto de feedback flutuante (ex: "Ensaboado!") que sobe como um balão no ar
     * enquanto gradativamente perde opacidade, sendo destruído automaticamente no final do Tween.
     */
    mostrarTextoFlutuante(texto, x, y, cor = "#ffffff") {
        const txt = this.add.text(x, y, texto, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "28px",
            fill: cor, stroke: "#000000", strokeThickness: 5, align: "center"
        }).setOrigin(0.5).setDepth(50);
        
        this.tweens.add({ targets: txt, y: y - 100, alpha: 0, duration: 3000, ease: "Power1", onComplete: () => txt.destroy() });
    }

    /** * @method criarExplosaoBrilhos
     * @description Efeito especial (Particle Burst improvisado) disparado na finalização.
     * Calcula raios estelares saindo do centro do cachorro até desvanecerem.
     */
    criarExplosaoBrilhos() {
        for (let i = 0; i < 25; i++) {
            const x = gameState.cachorro.x + Phaser.Math.Between(-150, 150);
            const y = gameState.cachorro.y + Phaser.Math.Between(-150, 150);
            
            // Instancia bolhas colorizadas como ouro (0xffd700) 
            const brilho = this.add.image(x, y, "bolhas").setScale(0).setDepth(5).setTint(0xffd700);
            
            // O brilho infla, sobe pelo Y flutuante aleatório, dissolve no Alpha e morre.
            this.tweens.add({
                targets: brilho,
                scale: Phaser.Math.FloatBetween(0.05, 0.15),
                y: y - Phaser.Math.Between(50, 150),
                alpha: 0,
                duration: Phaser.Math.Between(1000, 2000),
                ease: "Sine.easeOut",
                onComplete: () => brilho.destroy()
            });
        }
    }

    /** Helpers de Mapeamento para resgatar instâncias globais com base numa string chave. */
    pegarFerramenta(nomeFerramenta) {
        if (nomeFerramenta === "sabao")    return gameState.sabao;
        if (nomeFerramenta === "chuveiro") return gameState.chuveiro;
        if (nomeFerramenta === "toalha")   return gameState.toalha;
        return null;
    }

    pegarPosicaoInicial(nomeFerramenta) {
        if (nomeFerramenta === "sabao")    return this.posicaoInicialSabao;
        if (nomeFerramenta === "chuveiro") return this.posicaoInicialChuveiro;
        if (nomeFerramenta === "toalha")   return this.posicaoInitialToalha;
        return null;
    }

    /**
     * @method mostrarInstrucoes
     * @description Gera um modal escuro na tela inicial (onboarding). Impede
     * que a lógica da função Update corra ou que o usuário perca timer antes de entender o jogo.
     */
    mostrarInstrucoes(callbackInicio) {
        // Atraso para que o Z-index passe do Gerenciador de Cenas do Phaser fique impecável contra a HUD
        this.time.delayedCall(50, () => {
            this.scene.bringToTop("cenaBanho");
        });

        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        const fundoEscuro = this.add.rectangle(centroX, centroY, 8000, 8000, 0x000000, 0.7)
            .setDepth(300).setInteractive(); // A interatividade absorve os cliques acidentais no cenário
            
        const telaInstrucao = this.add.image(centroX, centroY, "instrucaoBanho")
            .setDepth(301).setInteractive({ useHandCursor: true });

        const escalaFinal = Math.min(
            (this.scale.width * 0.8) / telaInstrucao.width,
            (this.scale.height * 0.8) / telaInstrucao.height
        );
        telaInstrucao.setScale(escalaFinal);

        const fecharInstrucoes = () => {
            fundoEscuro.destroy();
            telaInstrucao.destroy();
            gameState.instrucoesBanhoVistas = true; // Grava pra não repetir
            
            // Libera a HUD para interações do usuário (botões laterais)
            this.scene.bringToTop("HUD");
            if (callbackInicio) callbackInicio(); // Solta o cronômetro!
        };

        fundoEscuro.on('pointerdown', fecharInstrucoes);
        telaInstrucao.on('pointerdown', fecharInstrucoes);
    }
}