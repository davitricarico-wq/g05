// Importa o estado global do jogo para sincronização de dados
import { gameState } from "../main.js";
// Importa as definições base dos animais disponíveis
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";
// Importa a classe responsável por instanciar e gerenciar a lógica dos pets
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";

// Exporta a cena responsável pela mecânica de banho e higiene do animal
export class cenaBanho extends Phaser.Scene {
    constructor() {
        super({ key: "cenaBanho" });
    }

    init() {
        this.ferramentaAtiva = null;
        this.acumuladorAgua = 0;
        this.progressoMolhar = 0; 
        this.tempoSecando = 0;
        this.quantidadeEspuma = 0;
        
        this.ultimoX = 0;
        this.ultimoY = 0;
        
        this.estadoCachorro = "sujo"; 
        this.gerenciadorCachorros = null;
        this.cachorro = null;

        // Variáveis para o timer e controle da partida
        this.tempoDecorridoMs = 0;
        this.tempoDecorrido = 0;
        this.banhoEmAndamento = false;
        this.banhoFinalizado = false;
    }

    create() {
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD");
        } else if (this.scene.isSleeping("HUD")) {
            this.scene.wake("HUD");
        }
        this.scene.bringToTop("HUD");

        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0);
        this.estadoCachorro = cachorrosBase[indiceAtivo]?.estado || "sujo";
        
        if (this.estadoCachorro !== "limpo") this.estadoCachorro = "sujo"; 
        cachorrosBase[indiceAtivo].estado = this.estadoCachorro;

        const largura = this.scale.width;
        const altura = this.scale.height;
        const areaX = largura - (largura * 0.2); 
        const areaY = altura;

        gameState.banheiro = this.add.image(areaX / 2, areaY / 2, "bgBanheiro")
            .setDisplaySize(areaX, areaY)
            .setDepth(-1);

        // UI - Temporizador e Barra de Progresso
        this.textoTempo = this.add.text(areaX / 2, 40, 'Tempo: 0s', {
            fontFamily: '"Press Start 2P", Arial', fontSize: "20px", color: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(10);

        const larguraBarra = 300;
        this.barraProgressoBg = this.add.rectangle(areaX / 2, 80, larguraBarra, 24, 0x000000, 0.6).setDepth(10);
        this.barraProgressoBg.setStrokeStyle(2, 0xffffff);
        this.barraProgressoFill = this.add.rectangle((areaX / 2) - (larguraBarra / 2), 80, 0, 24, 0x44aaff, 1).setOrigin(0, 0.5).setDepth(11);
        
        this.textoProgresso = this.add.text(areaX / 2, 80, 'Preparando...', {
            fontFamily: '"Press Start 2P", Arial', fontSize: "12px", color: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(12);

        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);
        this.escalaBaseCachorro = { x: this.cachorro.sprite.scaleX || this.cachorro.sprite.scale, y: this.cachorro.sprite.scaleY || this.cachorro.sprite.scale };

        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 1,  
                repeat: -1     
            });
        }

        this.pulgas = this.add.sprite(0, 0, "pulgas").setOrigin(0.5).setScale(areaY * 0.0015);
        this.pulgas.play("pulgaAnim");
        this.pulgas.setVisible(gameState.pulga); 

        this.containerCachorro = this.add.container(
            areaX / 2, 
            areaY * 0.65, 
            [this.cachorro.sprite, this.pulgas]
        );
        this.containerCachorro.setScale(areaY * 0.0006);

        this.physics.add.existing(this.cachorro.sprite);
        this.cachorro.sprite.body.setAllowGravity(false);
        this.cachorro.sprite.body.immovable = true;
        gameState.cachorro = this.cachorro.sprite;

        this.atualizarEstadoCachorroAnimacao();

        const yFerramentas = areaY * 0.88;
        this.posicaoInicialSabao = { x: (areaX / 2) - (areaX * 0.25), y: yFerramentas };
        this.posicaoInicialChuveiro = { x: areaX / 2, y: yFerramentas };
        this.posicaoInitialToalha = { x: (areaX / 2) + (areaX * 0.25), y: yFerramentas };
        const escalaFerramentas = areaY * 0.0005;

        gameState.sabao = this.add.sprite(this.posicaoInicialSabao.x, this.posicaoInicialSabao.y, "sabao").setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.sabao.escalaOriginal = escalaFerramentas * 0.28; 
        gameState.sabao.setScale(gameState.sabao.escalaOriginal);
        
        gameState.chuveiro = this.add.sprite(this.posicaoInicialChuveiro.x, this.posicaoInicialChuveiro.y, "chuveiro").setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.chuveiro.escalaOriginal = escalaFerramentas * 0.36; 
        gameState.chuveiro.setScale(gameState.chuveiro.escalaOriginal);
        
        gameState.toalha = this.add.sprite(this.posicaoInitialToalha.x, this.posicaoInitialToalha.y, "toalha").setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.toalha.escalaOriginal = escalaFerramentas * 0.36; 
        gameState.toalha.setScale(gameState.toalha.escalaOriginal);

        [gameState.sabao, gameState.chuveiro, gameState.toalha].forEach(tool => {
            this.physics.add.existing(tool);
            tool.body.setAllowGravity(false);
        });

        const reduzirHitbox = (ferramenta, fator) => {
            const w = ferramenta.width;
            const h = ferramenta.height;
            ferramenta.body.setSize(w * fator, h * fator);
            ferramenta.body.setOffset(w * ((1 - fator) / 2), h * ((1 - fator) / 2));
        };

        reduzirHitbox(gameState.sabao, 0.3);
        reduzirHitbox(gameState.toalha, 0.3);

        gameState.bolhas = this.physics.add.group({ maxSize: 80 });
        gameState.gotas = this.physics.add.group({ maxSize: 160 });

        // 1. ÁGUA x CACHORRO
        this.colisaoGotaCachorro = this.physics.add.overlap(gameState.gotas, this.cachorro.sprite, (obj1, obj2) => {
            if (this.banhoFinalizado) return;
            const gota = (obj1 === this.cachorro.sprite) ? obj2 : obj1;
            
            if (this.estadoCachorro === "sujo") {
                this.reciclarObjeto(gota); 

                if (this.ferramentaAtiva === "chuveiro") {
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
            }
        });

        // 2. ÁGUA x ESPUMA
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

        gameState.sabao.on("pointerdown", () => this.alternarFerramenta("sabao"));
        gameState.chuveiro.on("pointerdown", () => this.alternarFerramenta("chuveiro"));
        gameState.toalha.on("pointerdown", () => this.alternarFerramenta("toalha"));

        this.criarAnimacoes();

        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.cameras.main.fadeIn(200, 0, 0, 0);

        // Função de inicio para o timer
        this.iniciarPartida = () => {
            this.tempoDecorridoMs = 0;
            this.tempoDecorrido = 0;
            this.textoTempo.setText('Tempo: 0s');
            this.banhoEmAndamento = true;
        };

        if (!gameState.instrucoesBanhoVistas) {
            this.mostrarInstrucoes(this.iniciarPartida);
        } else {
            this.iniciarPartida();
        }
    }

    update(tempo, delta) {
        if (this.banhoFinalizado) return;

        if (this.banhoEmAndamento) {
            // Acumula o tempo isolado da cena
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

        // Lógica de trocar de cachorro
        if (gameState.trocar) {
            // Reestabelecer tudo para a troca
            this.cachorro = this.gerenciadorCachorros.cachorroAtual;
            gameState.cachorro = this.cachorro.sprite;
            this.escalaBaseCachorro = { x: this.cachorro.sprite.scaleX || this.cachorro.sprite.scale, y: this.cachorro.sprite.scaleY || this.cachorro.sprite.scale };

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

            if (!this.cachorro.sprite.body) {
                this.physics.add.existing(this.cachorro.sprite);
            }
            this.cachorro.sprite.body.setAllowGravity(false);
            this.cachorro.sprite.body.immovable = true;

            if (this.colisaoGotaCachorro) this.colisaoGotaCachorro.destroy();
            this.colisaoGotaCachorro = this.physics.add.overlap(
                gameState.gotas, 
                this.cachorro.sprite, 
                (obj1, obj2) => {
                    const gota = (obj1 === this.cachorro.sprite) ? obj2 : obj1;
                    if (this.estadoCachorro === "sujo") {
                        this.reciclarObjeto(gota);
                        if (this.ferramentaAtiva === "chuveiro") {
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
                    }
                }
            );

            gameState.trocar = false;
        }

        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga);
        }

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
            
            gameState.bolhas.children.iterate((bolha) => {
                if (bolha && bolha.active) this.reciclarObjeto(bolha);
            });

            this.animarCachorro(); 
            this.mostrarTextoFlutuante("Enxaguado!\nAgora a toalha.", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
            
            this.animarFerramenta(gameState.chuveiro, false);
            this.retornarPosicaoInicial("chuveiro");
            this.ferramentaAtiva = null;
        }
    }

    atualizarBarraVisual() {
        let porcentagem = 0;
        let texto = "Pronto!";
        let cor = 0x00ff00;

        if (this.estadoCachorro === "sujo") {
            porcentagem = this.progressoMolhar / 25;
            texto = "Molhar";
            cor = 0x44aaff;
        } else if (this.estadoCachorro === "molhado_sujo") {
            porcentagem = this.quantidadeEspuma / 50;
            texto = "Ensaboar";
            cor = 0xffffff;
        } else if (this.estadoCachorro === "ensaboado" || this.estadoCachorro === "lavando") {
            porcentagem = (50 - this.quantidadeEspuma) / 50;
            texto = "Enxaguar";
            cor = 0x44aaff;
        } else if (this.estadoCachorro === "molhado_limpo") {
            porcentagem = this.tempoSecando / 90;
            texto = "Secar";
            cor = 0xffaa00;
        }

        porcentagem = Phaser.Math.Clamp(porcentagem, 0, 1);
        this.barraProgressoFill.width = 300 * porcentagem;
        this.barraProgressoFill.setFillStyle(cor);
        this.textoProgresso.setText(texto);
    }

    moverFerramenta(ferramenta) {
        ferramenta.x = Phaser.Math.Linear(ferramenta.x, this.input.activePointer.x, 0.5);
        ferramenta.y = Phaser.Math.Linear(ferramenta.y, this.input.activePointer.y, 0.5);
        ferramenta.body.updateFromGameObject(); 
    }

    atualizarSabao(raioHitbox) {
        if (this.ferramentaAtiva !== "sabao") return;

        const sabao = gameState.sabao;
        this.moverFerramenta(sabao);

        const moveu = Math.abs(sabao.x - this.ultimoX) > 5 || Math.abs(sabao.y - this.ultimoY) > 5;
        const distancia = Phaser.Math.Distance.Between(sabao.x, sabao.y, this.containerCachorro.x, this.containerCachorro.y);
        const estaNoCachorro = distancia < raioHitbox;

        if (estaNoCachorro && this.estadoCachorro === "molhado_sujo" && this.quantidadeEspuma < 50 && moveu) {
            this.criarBolha();
        }

        this.ultimoX = sabao.x;
        this.ultimoY = sabao.y;
    }

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

    atualizarToalha(raioHitbox) {
        if (this.ferramentaAtiva !== "toalha") {
            this.tempoSecando = 0;
            return;
        }

        this.moverFerramenta(gameState.toalha);

        if (this.estadoCachorro !== "molhado_limpo") return;

        const distancia = Phaser.Math.Distance.Between(gameState.toalha.x, gameState.toalha.y, this.containerCachorro.x, this.containerCachorro.y);
        const estaNoCachorro = distancia < raioHitbox;

        if (estaNoCachorro) {
            this.tempoSecando += 1;
            if (this.tempoSecando >= 90) {
                this.finalizarBanho();
            }
        } else {
            this.tempoSecando = 0; 
        }
    }

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

    finalizarBanho() {
        this.banhoEmAndamento = false;
        this.banhoFinalizado = true;
        
        // Garante que a barra feche em 100% "Pronto!"
        this.estadoCachorro = "limpo";
        this.atualizarBarraVisual();
        
        this.atualizarEstadoCachorroAnimacao();
        this.animarCachorro(); 
        this.criarExplosaoBrilhos(); 

        gameState.barras.limpeza = Phaser.Math.Clamp(gameState.barras.limpeza - 11, 0, 11); 
        
        // Lógica de Estrelas baseada no tempo
        const tempoFinal = this.tempoDecorrido;
        let estrelas = 3;
        if (tempoFinal > 40) {
            estrelas = 1;
        } else if (tempoFinal > 20) {
            estrelas = 2;
        }

        // Lógica de Moedas
        let moedas = 5;
        if (estrelas === 3) moedas = 20;
        else if (estrelas === 2) moedas = 10;

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

        // Aguarda um instante e chama o popup final
        this.time.delayedCall(1200, () => {
            this.mostrarPainelResultado(estrelas, moedas, tempoFinal);
        });
    }

    mostrarPainelResultado(estrelas, moedas, segundos) {
        // Traz a cena de banho inteira para cima do HUD para exibir o painel
        this.scene.bringToTop();

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

        const fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8).setDepth(200).setScrollFactor(0).setInteractive(); 
        const telaFeedback = this.add.image(cx, cy, imagemFeedback).setDepth(201).setScrollFactor(0).setInteractive();

        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaFinal = Math.min(limiteLargura / telaFeedback.width, limiteAltura / telaFeedback.height);
        telaFeedback.setScale(escalaFinal);

        // Ajusta as posições Y baseadas na imagem do feedback
        let posMoedasY = cy + (telaFeedback.displayHeight * 0.12);
        this.add.text(cx - 12, posMoedasY, `${moedas} Moedas`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(202);

        let posTempoY = cy + (telaFeedback.displayHeight * 0.35); 
        this.add.text(cx - 20, posTempoY, `${segundos}s`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(202);

        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Clique para Sair ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(202).setScrollFactor(0);
        
        this.tweens.add({ targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        const voltarCena = () => {
            this.scene.restart(); 
        };

        fundoFeedback.on('pointerdown', voltarCena);
        telaFeedback.on('pointerdown', voltarCena);
    }

    retornarPosicaoInicial(nomeFerramenta) {
        const ferramenta = this.pegarFerramenta(nomeFerramenta);
        const pos = this.pegarPosicaoInicial(nomeFerramenta);
        if (!ferramenta || !pos) return;

        this.tweens.add({ targets: ferramenta, x: pos.x, y: pos.y, duration: 300, ease: "Back.easeOut" });
    }

    animarCachorro() {
        const target = this.cachorro?.sprite || gameState.cachorro;
        if (!target) return;
        
        const escalaX = this.escalaBaseCachorro.x || 1;
        const escalaY = this.escalaBaseCachorro.y || 1;

        this.tweens.add({ targets: target, scaleY: escalaY * 0.85, scaleX: escalaX * 1.15, duration: 150, yoyo: true, ease: "Quad.easeInOut" });
    }

    atualizarEstadoCachorroAnimacao() {
        if (!this.cachorro) return;
        
        let estadoAnim = "sujo";
        
        if (this.estadoCachorro === "molhado_sujo" || 
            this.estadoCachorro === "ensaboado" || 
            this.estadoCachorro === "lavando" || 
            this.estadoCachorro === "molhado_limpo") {
            estadoAnim = "ensaboado";
        } 
        else if (this.estadoCachorro === "limpo") {
            estadoAnim = "limpo";
        }

        this.cachorro.mudarEstado(estadoAnim);
        
        const dadosCachorro = cachorrosBase.find(c => c.id === this.cachorro.dados.id) || cachorrosBase[0];
        if (dadosCachorro) dadosCachorro.estado = this.estadoCachorro;
        gameState.cachorro = this.cachorro.sprite;
    }

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

    limparGotas() {
        gameState.gotas.children.iterate((gota) => {
            if (gota && gota.active && gota.y > this.scale.height + 120) {
                this.reciclarObjeto(gota);
            }
        });
    }

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

    animarFerramenta(ferramenta, ativa) {
        if (!ferramenta) return;
        const escalaAlvo = ativa ? ferramenta.escalaOriginal * 1.1 : ferramenta.escalaOriginal;
        this.tweens.add({ targets: ferramenta, scale: escalaAlvo, duration: 150, ease: "Back.easeOut" });
    }

    mostrarTextoFlutuante(texto, x, y, cor = "#ffffff") {
        const txt = this.add.text(x, y, texto, { fontFamily: '"Press Start 2P", Arial', fontSize: "28px", fill: cor, stroke: "#000000", strokeThickness: 5, align: "center" }).setOrigin(0.5).setDepth(50);
        this.tweens.add({ targets: txt, y: y - 100, alpha: 0, duration: 3000, ease: "Power1", onComplete: () => txt.destroy() });
    }

    criarExplosaoBrilhos() {
        for (let i = 0; i < 25; i++) {
            const x = gameState.cachorro.x + Phaser.Math.Between(-150, 150);
            const y = gameState.cachorro.y + Phaser.Math.Between(-150, 150);
            const brilho = this.add.image(x, y, "bolhas").setScale(0).setDepth(5).setTint(0xffd700); 
            this.tweens.add({ targets: brilho, scale: Phaser.Math.FloatBetween(0.05, 0.15), y: y - Phaser.Math.Between(50, 150), alpha: 0, duration: Phaser.Math.Between(1000, 2000), ease: "Sine.easeOut", onComplete: () => brilho.destroy() });
        }
    }

    pegarFerramenta(nomeFerramenta) {
        if (nomeFerramenta === "sabao") return gameState.sabao;
        if (nomeFerramenta === "chuveiro") return gameState.chuveiro;
        if (nomeFerramenta === "toalha") return gameState.toalha;
        return null;
    }

    pegarPosicaoInicial(nomeFerramenta) {
        if (nomeFerramenta === "sabao") return this.posicaoInicialSabao;
        if (nomeFerramenta === "chuveiro") return this.posicaoInicialChuveiro;
        if (nomeFerramenta === "toalha") return this.posicaoInitialToalha;
        return null;
    }
    
    mostrarInstrucoes(callbackInicio) {
        // Traz a cena de banho para cima do HUD para exibir as instruções
        this.scene.bringToTop();

        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        const fundoEscuro = this.add.rectangle(centroX, centroY, 8000, 8000, 0x000000, 0.7).setDepth(300).setInteractive();
        const telaInstrucao = this.add.image(centroX, centroY, "instrucaoBanho").setDepth(301).setInteractive({ useHandCursor: true }); 

        const escalaFinal = Math.min((this.scale.width * 0.8) / telaInstrucao.width, (this.scale.height * 0.8) / telaInstrucao.height);
        telaInstrucao.setScale(escalaFinal);

        const fecharInstrucoes = () => {
            fundoEscuro.destroy();
            telaInstrucao.destroy();
            gameState.instrucoesBanhoVistas = true; 
            
            // Retorna o HUD para a frente ao fechar as instruções
            this.scene.bringToTop("HUD");
            
            if(callbackInicio) callbackInicio();
        };

        fundoEscuro.on('pointerdown', fecharInstrucoes);
        telaInstrucao.on('pointerdown', fecharInstrucoes);
    }
}