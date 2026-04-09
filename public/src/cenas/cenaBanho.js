import { gameState, iniciarMusicaAleatoria } from "../main.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";

/**
 * Cena do minigame de banho. Gerencia a máquina de estados do pet,
 * emissão de partículas via object pooling e colisões com Arcade Physics.
 * @extends Phaser.Scene
 */
export class cenaBanho extends Phaser.Scene {
    constructor() {
        super({ key: "cenaBanho" });
    }

    /** Reset de todas as variáveis de estado. Chamado automaticamente no restart da cena. */
    init() {
        this.ferramentaAtiva = null;

        this.acumuladorAgua = 0;
        this.progressoMolhar = 0;
        this.tempoSecando = 0;
        this.quantidadeEspuma = 0;

        // Posição anterior do ponteiro — usada para detectar fricção (delta de movimento)
        this.ultimoX = 0;
        this.ultimoY = 0;
        
        /** @type {GerenciadorCachorros} */
        this.gerenciadorCachorros = null;
        this.cachorro = null;

        this.tempoDecorridoMs = 0;
        this.tempoDecorrido = 0;
        this.banhoEmAndamento = false;
        this.banhoFinalizado = false;
    }

    create() {
        if (!this.scene.isActive("HUD")) this.scene.launch("HUD");
        else if (this.scene.isSleeping("HUD")) this.scene.wake("HUD");
        this.scene.bringToTop("HUD");

        if (gameState.musicaLigada) iniciarMusicaAleatoria(this);

        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0);
        
        // Usa o estado salvo do cachorro ativo para não resetar para \"sujo\" a cada abertura da cena.
        const estadoPersistido = cachorrosBase[indiceAtivo].estado || "sujo";
        this.estadoCachorro = estadoPersistido;
        cachorrosBase[indiceAtivo].estado = this.estadoCachorro;

        const largura = this.scale.width;
        const altura = this.scale.height;
        const areaX = largura - (largura * 0.2);
        const areaY = altura;

        gameState.banheiro = this.add.image(areaX / 2, areaY / 2, "bgBanheiro")
            .setDisplaySize(areaX, areaY)
            .setDepth(-1);

        this.textoTempo = this.add.text(areaX / 2, 40, 'Tempo: 0s', {
            fontFamily: '"Press Start 2P", Arial', fontSize: "20px",
            color: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(10);

        const larguraBarra = 300;
        this.barraProgressoBg = this.add.rectangle(areaX / 2, 80, larguraBarra, 24, 0x000000, 0.6)
            .setDepth(10)
            .setStrokeStyle(2, 0xffffff);
        this.barraProgressoFill = this.add.rectangle((areaX / 2) - (larguraBarra / 2), 80, 0, 24, 0x44aaff, 1)
            .setOrigin(0, 0.5)
            .setDepth(11);
        this.textoProgresso = this.add.text(areaX / 2, 80, 'Preparando...', {
            fontFamily: '"Press Start 2P", Arial', fontSize: "12px",
            color: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(12);

        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);
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
        this.pulgas.setVisible(gameState.pulga);

        this.containerCachorro = this.add.container(areaX / 2, areaY * 0.65, [this.cachorro.sprite, this.pulgas]);
        this.containerCachorro.setScale(areaY * 0.0006);

        this.physics.add.existing(this.cachorro.sprite);
        this.cachorro.sprite.body.setAllowGravity(false);
        this.cachorro.sprite.body.immovable = true;
        gameState.cachorro = this.cachorro.sprite;
        this.atualizarEstadoCachorroAnimacao();

        // Layout das ferramentas em proporções relativas à tela
        const yFerramentas = areaY * 0.88;
        this.posicaoInicialSabao    = { x: (areaX / 2) - (areaX * 0.25), y: yFerramentas };
        this.posicaoInicialChuveiro = { x: areaX / 2,                     y: yFerramentas };
        this.posicaoInitialToalha   = { x: (areaX / 2) + (areaX * 0.25), y: yFerramentas };

        const escalaFerramentas = areaY * 0.0005;

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

        [gameState.sabao, gameState.chuveiro, gameState.toalha].forEach(tool => {
            this.physics.add.existing(tool);
            tool.body.setAllowGravity(false);
        });

        // Hitbox reduzida: obriga o jogador a posicionar a ferramenta diretamente sobre o pet
        const reduzirHitbox = (ferramenta, fator) => {
            const w = ferramenta.width;
            const h = ferramenta.height;
            ferramenta.body.setSize(w * fator, h * fator);
            ferramenta.body.setOffset(w * ((1 - fator) / 2), h * ((1 - fator) / 2));
        };
        reduzirHitbox(gameState.sabao, 0.3);
        reduzirHitbox(gameState.toalha, 0.3);

        gameState.bolhas = this.physics.add.group({ maxSize: 80 });
        gameState.gotas  = this.physics.add.group({ maxSize: 160 });

        this.colisaoGotaCachorro = this.physics.add.overlap(
            gameState.gotas, this.cachorro.sprite,
            (obj1, obj2) => {
                if (this.banhoFinalizado) return;
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
                    this.colisaoGotaCachorro.active = false; // Desativa overlap desnecessário após transição de estado
                }
            }
        );

        // Gota que acerta espuma: enxágua progressivamente o sabão do pet
        this.physics.add.overlap(gameState.gotas, gameState.bolhas, (gota, bolha) => {
            if (this.banhoFinalizado) return;
            this.reciclarObjeto(gota);
            this.reciclarObjeto(bolha);
            if (this.ferramentaAtiva === "chuveiro" && (this.estadoCachorro === "ensaboado" || this.estadoCachorro === "lavando")) {
                this.estadoCachorro = "lavando";
                this.cachorro.dados.estado = "lavando";
                this.quantidadeEspuma = Math.max(0, this.quantidadeEspuma - 1);
            }
        });

        gameState.sabao.on("pointerdown",    () => this.alternarFerramenta("sabao"));
        gameState.chuveiro.on("pointerdown", () => this.alternarFerramenta("chuveiro"));
        gameState.toalha.on("pointerdown",   () => this.alternarFerramenta("toalha"));

        this.criarAnimacoes();

        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.cameras.main.fadeIn(200, 0, 0, 0);

        this.iniciarPartida = () => {
            this.tempoDecorridoMs = 0;
            this.tempoDecorrido = 0;
            this.textoTempo.setText('Tempo: 0s');
            this.banhoEmAndamento = true;
        };

        if (!gameState.instrucoesBanhoVistas) this.mostrarInstrucoes(this.iniciarPartida);
        else this.iniciarPartida();
    }

    update(tempo, delta) {
        if (this.banhoFinalizado) return;

        if (this.banhoEmAndamento) {
            this.tempoDecorridoMs += delta;
            this.tempoDecorrido = Math.floor(this.tempoDecorridoMs / 1000);
            this.textoTempo.setText(`Tempo: ${this.tempoDecorrido}s`);
        }

        this.atualizarBarraVisual();

        const raioHitboxCachorro = (this.containerCachorro.getBounds().width / 2) * 0.8;
        this.atualizarSabao(raioHitboxCachorro);
        this.atualizarChuveiro(delta);
        this.atualizarToalha(raioHitboxCachorro);
        this.limparGotas();

        // Hot-swap: troca o cachorro ativo em resposta a evento externo da UI
        if (gameState.trocar) {
            this.cachorro = this.gerenciadorCachorros.cachorroAtual;
            gameState.cachorro = this.cachorro.sprite;
            this.escalaBaseCachorro = {
                x: this.cachorro.sprite.scaleX || this.cachorro.sprite.scale,
                y: this.cachorro.sprite.scaleY || this.cachorro.sprite.scale
            };

            this.estadoCachorro = "sujo";
            this.cachorro.dados.estado = "sujo";
            this.quantidadeEspuma = 0;
            this.acumuladorAgua = 0;
            this.progressoMolhar = 0;
            this.tempoSecando = 0;
            this.ferramentaAtiva = null;
            this.atualizarEstadoCachorroAnimacao();

            if (this.containerCachorro) {
                this.containerCachorro.removeAll(false);
                this.containerCachorro.add(this.cachorro.sprite);
                if (this.pulgas) this.containerCachorro.add(this.pulgas);
            }

            gameState.sabao.setInteractive({ useHandCursor: true });
            gameState.chuveiro.setInteractive({ useHandCursor: true });
            gameState.toalha.setInteractive({ useHandCursor: true });

            if (!this.cachorro.sprite.body) this.physics.add.existing(this.cachorro.sprite);
            this.cachorro.sprite.body.setAllowGravity(false);
            this.cachorro.sprite.body.immovable = true;

            // Recria o overlap vinculado ao novo sprite
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

        if (this.pulgas) this.pulgas.setVisible(gameState.pulga);

        if (this.estadoCachorro === "molhado_sujo" && this.quantidadeEspuma >= 50) {
            this.estadoCachorro = "ensaboado";
            this.atualizarEstadoCachorroAnimacao();
            this.cameras.main.flash(200, 255, 255, 255);
            this.animarCachorro();
            this.mostrarTextoFlutuante("Ensaboado!\nUse o chuveiro.", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
            this.animarFerramenta(gameState.sabao, false);
            this.retornarPosicaoInicial("sabao");
            this.ferramentaAtiva = null;
        }

        if (this.estadoCachorro === "lavando" && this.quantidadeEspuma <= 0) {
            this.estadoCachorro = "molhado_limpo";
            this.atualizarEstadoCachorroAnimacao();
            // Remove bolhas órfãs que escaparam à detecção normal de física
            gameState.bolhas.children.iterate((bolha) => { if (bolha && bolha.active) this.reciclarObjeto(bolha); });
            this.animarCachorro();
            this.mostrarTextoFlutuante("Enxaguado!\nAgora a toalha.", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
            this.animarFerramenta(gameState.chuveiro, false);
            this.retornarPosicaoInicial("chuveiro");
            this.ferramentaAtiva = null;
        }
    }

    /** Interpola largura e cor da barra de progresso conforme o estado atual do banho. */
    atualizarBarraVisual() {
        let porcentagem = 0;
        let texto = "Pronto!";
        let cor = 0x00ff00;

        if (this.estadoCachorro === "sujo") {
            porcentagem = this.progressoMolhar / 25; texto = "Molhar"; cor = 0x44aaff;
        } else if (this.estadoCachorro === "molhado_sujo") {
            porcentagem = this.quantidadeEspuma / 50; texto = "Ensaboar"; cor = 0xffffff;
        } else if (this.estadoCachorro === "ensaboado" || this.estadoCachorro === "lavando") {
            porcentagem = (50 - this.quantidadeEspuma) / 50; texto = "Enxaguar"; cor = 0x44aaff;
        } else if (this.estadoCachorro === "molhado_limpo") {
            porcentagem = this.tempoSecando / 90; texto = "Secar"; cor = 0xffaa00;
        }

        this.barraProgressoFill.width = 300 * Phaser.Math.Clamp(porcentagem, 0, 1);
        this.barraProgressoFill.setFillStyle(cor);
        this.textoProgresso.setText(texto);
    }

    /** Move a ferramenta suavemente até o ponteiro usando LERP. */
    moverFerramenta(ferramenta) {
        ferramenta.x = Phaser.Math.Linear(ferramenta.x, this.input.activePointer.x, 0.5);
        ferramenta.y = Phaser.Math.Linear(ferramenta.y, this.input.activePointer.y, 0.5);
        ferramenta.body.updateFromGameObject();
    }

    /**
     * Emite bolhas de espuma enquanto o sabão é arrastado sobre o pet.
     * Exige deslocamento mínimo de 5px para evitar emissão com ferramenta parada.
     * @param {number} raioHitbox Raio efetivo do collider do cachorro.
     */
    atualizarSabao(raioHitbox) {
        if (this.ferramentaAtiva !== "sabao") return;
        const sabao = gameState.sabao;
        this.moverFerramenta(sabao);

        const moveu = Math.abs(sabao.x - this.ultimoX) > 5 || Math.abs(sabao.y - this.ultimoY) > 5;
        const distancia = Phaser.Math.Distance.Between(sabao.x, sabao.y, this.containerCachorro.x, this.containerCachorro.y);

        if (distancia < raioHitbox && this.estadoCachorro === "molhado_sujo" && this.quantidadeEspuma < 50 && moveu) {
            this.criarBolha();
        }

        this.ultimoX = sabao.x;
        this.ultimoY = sabao.y;
    }

    /**
     * Emite gotas a cada 50ms enquanto o chuveiro está ativo.
     * @param {number} delta Delta do game loop em milissegundos.
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
     * Seca o pet enquanto a toalha é arrastada sobre ele de forma contínua.
     * Interromper o movimento reseta o progresso de secagem.
     * @param {number} raioHitbox Raio efetivo do collider do cachorro.
     */
    atualizarToalha(raioHitbox) {
        if (this.ferramentaAtiva !== "toalha") {
            this.tempoSecando = 0;
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
                if (this.tempoSecando >= 90) this.finalizarBanho();
            }
        } else {
            this.tempoSecando = 0;
        }

        this.ultimoX = toalha.x;
        this.ultimoY = toalha.y;
    }

    /**
     * Ativa/desativa uma ferramenta. Bloqueia a seleção fora de ordem para evitar soft-locks.
     * @param {'sabao'|'chuveiro'|'toalha'} nomeFerramenta
     */
    alternarFerramenta(nomeFerramenta) {
        if (this.banhoFinalizado) return;

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

        // Clicou na ferramenta já ativa: devolve ao slot de origem
        if (this.ferramentaAtiva === nomeFerramenta) {
            this.animarFerramenta(this.pegarFerramenta(nomeFerramenta), false);
            this.retornarPosicaoInicial(nomeFerramenta);
            this.ferramentaAtiva = null;
            return;
        }

        if (this.ferramentaAtiva) {
            this.animarFerramenta(this.pegarFerramenta(this.ferramentaAtiva), false);
            this.retornarPosicaoInicial(this.ferramentaAtiva);
        }

        this.ferramentaAtiva = nomeFerramenta;
        this.animarFerramenta(this.pegarFerramenta(nomeFerramenta), true);
    }

    /** Finaliza o banho, calcula estrelas/moedas, atualiza o estado global e exibe o painel de resultado. */
    finalizarBanho() {
        this.banhoEmAndamento = false;
        this.banhoFinalizado = true;
        this.estadoCachorro = "limpo";
        this.atualizarBarraVisual();
        this.atualizarEstadoCachorroAnimacao();
        this.animarCachorro();
        this.criarExplosaoBrilhos();

        gameState.barras.limpeza = Phaser.Math.Clamp(gameState.barras.limpeza - 11, 0, 11);

        const tempoFinal = this.tempoDecorrido;
        let estrelas = tempoFinal > 40 ? 1 : tempoFinal > 20 ? 2 : 3;
        let moedas   = estrelas === 3 ? 20 : estrelas === 2 ? 10 : 5;

        // Bônus de moedas concedido apenas uma vez por cachorro
        const cachorroAtivo = gameState.pets.cachorroJoao ? 'joao' : (gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo');
        if (!gameState.recompensas.banho[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.banho[cachorroAtivo] = true;
        }

        gameState.sabao.disableInteractive();
        gameState.chuveiro.disableInteractive();
        gameState.toalha.disableInteractive();
        this.animarFerramenta(gameState.toalha, false);
        this.retornarPosicaoInicial("toalha");
        this.ferramentaAtiva = null;
        this.tempoSecando = 0;

        this.time.delayedCall(1200, () => { this.mostrarPainelResultado(estrelas, moedas, tempoFinal); });
    }

    /**
     * Exibe o painel de resultado com estrelas, moedas e tempo. Clique reinicia a cena.
     * @param {number} estrelas
     * @param {number} moedas
     * @param {number} segundos
     */
    mostrarPainelResultado(estrelas, moedas, segundos) {
        this.scene.bringToTop();

        let imagemFeedback = "feedback1estrela";
        if (estrelas === 3) imagemFeedback = "feeedback3estrelas";
        else if (estrelas === 2) imagemFeedback = "feedback2estrelas";

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        const fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8)
            .setDepth(200).setScrollFactor(0).setInteractive();
        const telaFeedback = this.add.image(cx, cy, imagemFeedback)
            .setDepth(201).setScrollFactor(0).setInteractive();

        const escalaFinal = Math.min(
            (this.scale.width * 0.8) / telaFeedback.width,
            (this.scale.height * 0.8) / telaFeedback.height
        );
        telaFeedback.setScale(escalaFinal);

        this.add.text(cx - 12, cy + (telaFeedback.displayHeight * 0.12), `${moedas} Moedas`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(202);

        this.add.text(cx - 20, cy + (telaFeedback.displayHeight * 0.35), `${segundos}s`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(202);

        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Clique para Sair ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(202).setScrollFactor(0);

        this.tweens.add({ targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const voltarCena = () => this.scene.restart();
        fundoFeedback.on('pointerdown', voltarCena);
        telaFeedback.on('pointerdown', voltarCena);
    }

    /** Retorna a ferramenta à posição original com animação Back.easeOut. */
    retornarPosicaoInicial(nomeFerramenta) {
        const ferramenta = this.pegarFerramenta(nomeFerramenta);
        const pos = this.pegarPosicaoInicial(nomeFerramenta);
        if (!ferramenta || !pos) return;
        this.tweens.add({ targets: ferramenta, x: pos.x, y: pos.y, duration: 300, ease: "Back.easeOut" });
    }

    /** Squash & Stretch no sprite do cachorro para feedback visual de transição de estado. */
    animarCachorro() {
        const target = this.cachorro?.sprite || gameState.cachorro;
        if (!target) return;
        const escalaX = this.escalaBaseCachorro.x || 1;
        const escalaY = this.escalaBaseCachorro.y || 1;
        this.tweens.add({ targets: target, scaleY: escalaY * 0.85, scaleX: escalaX * 1.15, duration: 150, yoyo: true, ease: "Quad.easeInOut" });
    }

    /** Mapeia o estado lógico do banho para o frame de animação correspondente no spritesheet. */
    atualizarEstadoCachorroAnimacao() {
        if (!this.cachorro) return;
        let estadoAnim = "sujo";
        if (["molhado_sujo", "ensaboado", "lavando", "molhado_limpo"].includes(this.estadoCachorro)) estadoAnim = "ensaboado";
        else if (this.estadoCachorro === "limpo") estadoAnim = "limpo";
        this.cachorro.mudarEstado(estadoAnim);
        const dadosCachorro = cachorrosBase.find(c => c.id === this.cachorro.dados.id) || cachorrosBase[0];
        if (dadosCachorro) dadosCachorro.estado = this.estadoCachorro;
        gameState.cachorro = this.cachorro.sprite;
    }

    /** Recupera uma bolha do pool e a posiciona com variação aleatória próxima ao sabão. */
    criarBolha() {
        const variacaoX = Phaser.Math.RND.between(-30, 30);
        const variacaoY = Phaser.Math.RND.between(-30, 30);
        const bolha = gameState.bolhas.get(gameState.sabao.x + variacaoX, gameState.sabao.y + variacaoY, "bolhas");
        if (!bolha) return;
        bolha.setActive(true).setVisible(true).setScale(0.13).clearTint();
        bolha.body.enable = true;
        bolha.body.reset(gameState.sabao.x + variacaoX, gameState.sabao.y + variacaoY);
        bolha.body.setSize(bolha.displayWidth, bolha.displayHeight, true);
        this.quantidadeEspuma += 1;
    }

    /** Recupera uma gota do pool e aplica velocidade vertical para simular queda d'água. */
    criarGota() {
        const variacaoX = Phaser.Math.RND.between(-15, 15);
        const x = gameState.chuveiro.x + variacaoX;
        const y = gameState.chuveiro.y + gameState.chuveiro.displayHeight / 2;
        const gota = gameState.gotas.get(x, y, "agua");
        if (!gota) return;
        gota.setActive(true).setVisible(true);
        gota.body.enable = true;
        gota.body.reset(x, y);
        gota.setScale(0.1);
        gota.play("aguaAnim", true);
        gota.body.setSize(gota.displayWidth, gota.displayHeight, true);
        gota.body.setVelocityY(200);
    }

    /** Devolve ao pool gotas que saíram da viewport. */
    limparGotas() {
        gameState.gotas.children.iterate((gota) => {
            if (gota && gota.active && gota.y > this.scale.height + 120) this.reciclarObjeto(gota);
        });
    }

    /** Desativa um objeto físico e o move para fora da tela, devolvendo-o ao pool. */
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

    /** Aplica escala de feedback (+10%) ao selecionar, ou restaura o tamanho original ao soltar. */
    animarFerramenta(ferramenta, ativa) {
        if (!ferramenta) return;
        const escalaAlvo = ativa ? ferramenta.escalaOriginal * 1.1 : ferramenta.escalaOriginal;
        this.tweens.add({ targets: ferramenta, scale: escalaAlvo, duration: 150, ease: "Back.easeOut" });
    }

    /**
     * Exibe um texto flutuante animado que sobe e some após 3 segundos.
     * @param {string} texto
     * @param {number} x
     * @param {number} y
     * @param {string} [cor="#ffffff"]
     */
    mostrarTextoFlutuante(texto, x, y, cor = "#ffffff") {
        const txt = this.add.text(x, y, texto, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "28px",
            fill: cor, stroke: "#000000", strokeThickness: 5, align: "center"
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: txt, y: y - 100, alpha: 0, duration: 3000, ease: "Power1", onComplete: () => txt.destroy() });
    }

    /** Emite 25 partículas douradas ao redor do cachorro para celebrar o banho concluído. */
    criarExplosaoBrilhos() {
        for (let i = 0; i < 25; i++) {
            const x = gameState.cachorro.x + Phaser.Math.Between(-150, 150);
            const y = gameState.cachorro.y + Phaser.Math.Between(-150, 150);
            const brilho = this.add.image(x, y, "bolhas").setScale(0).setDepth(5).setTint(0xffd700);
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
     * Exibe a tela de instruções bloqueando o game loop até o jogador clicar.
     * @param {Function} callbackInicio Chamado ao fechar as instruções.
     */
    mostrarInstrucoes(callbackInicio) {
        this.scene.bringToTop();
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        const fundoEscuro = this.add.rectangle(centroX, centroY, 8000, 8000, 0x000000, 0.7)
            .setDepth(300).setInteractive();
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
            gameState.instrucoesBanhoVistas = true;
            this.scene.bringToTop("HUD");
            if (callbackInicio) callbackInicio();
        };

        fundoEscuro.on('pointerdown', fecharInstrucoes);
        telaInstrucao.on('pointerdown', fecharInstrucoes);
    }
}