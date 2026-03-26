import { gameState } from "../main.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";

export class cenaBanho extends Phaser.Scene {
    constructor() {
        super({ key: "cenaBanho" });

        this.ferramentaAtiva = null;
        this.acumuladorAgua = 0;
        this.tempoSecando = 0;
        this.quantidadeEspuma = 0;
        
        this.ultimoX = 0;
        this.ultimoY = 0;
        
        this.estadoCachorro = "sujo"; 
        this.gerenciadorCachorros = null;
        this.cachorro = null;
    }

    create() {
        // ================= SETUP DO HUD =================
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD");
        } else if (this.scene.isSleeping("HUD")) {
            this.scene.wake("HUD");
        }
        this.scene.bringToTop("HUD");
        
        // ================= RESET GERAL =================
        this.ferramentaAtiva = null;
        this.acumuladorAgua = 0;
        this.tempoSecando = 0;
        this.quantidadeEspuma = 0;

        const indiceAtivo = gameState.pets.cachorroHeroi ? 1 : 0;
        this.estadoCachorro = cachorrosBase[indiceAtivo]?.estado || "sujo";
        cachorrosBase[indiceAtivo].estado = this.estadoCachorro;

        // ================= CÁLCULO DE TELA =================
        const largura = this.scale.width;
        const altura = this.scale.height;
        const areaX = largura - (largura * 0.2); 
        const areaY = altura;

        // ================= FUNDO =================
        gameState.banheiro = this.add.image(areaX / 2, areaY / 2, "bgBanheiro")
            .setDisplaySize(areaX, areaY)
            .setDepth(-1);

        // ================= CACHORRO E PULGAS =================
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);
        
        // Salva a escala base original para não bugar a animação de pulo
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

        // ================= FERRAMENTAS =================
        const yFerramentas = areaY * 0.88;
        this.posicaoInicialSabao = { x: (areaX / 2) - (areaX * 0.25), y: yFerramentas };
        this.posicaoInicialChuveiro = { x: areaX / 2, y: yFerramentas };
        this.posicaoInicialToalha = { x: (areaX / 2) + (areaX * 0.25), y: yFerramentas };
        const escalaFerramentas = areaY * 0.0005;

        gameState.sabao = this.add.sprite(this.posicaoInicialSabao.x, this.posicaoInicialSabao.y, "sabao")
            .setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.sabao.escalaOriginal = escalaFerramentas * 0.28; 
        gameState.sabao.setScale(gameState.sabao.escalaOriginal);
        
        gameState.chuveiro = this.add.sprite(this.posicaoInicialChuveiro.x, this.posicaoInicialChuveiro.y, "chuveiro")
            .setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.chuveiro.escalaOriginal = escalaFerramentas * 0.36; 
        gameState.chuveiro.setScale(gameState.chuveiro.escalaOriginal);
        
        gameState.toalha = this.add.sprite(this.posicaoInicialToalha.x, this.posicaoInicialToalha.y, "toalha")
            .setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.toalha.escalaOriginal = escalaFerramentas * 0.36; 
        gameState.toalha.setScale(gameState.toalha.escalaOriginal);

        [gameState.sabao, gameState.chuveiro, gameState.toalha].forEach(tool => {
            this.physics.add.existing(tool);
            tool.body.setAllowGravity(false);
        });

        // --- Ajustando Hitboxes (Tamanho Físico) do Sabão e Toalha ---
        const reduzirHitbox = (ferramenta, fator) => {
            const w = ferramenta.width;
            const h = ferramenta.height;
            // Define o tamanho reduzido e centraliza usando o offset
            ferramenta.body.setSize(w * fator, h * fator);
            ferramenta.body.setOffset(w * ((1 - fator) / 2), h * ((1 - fator) / 2));
        };

        reduzirHitbox(gameState.sabao, 0.3);  // Deixa a hitbox com 30% do tamanho
        reduzirHitbox(gameState.toalha, 0.3); // Deixa a hitbox com 30% do tamanho


        // ================= FÍSICA E PARTÍCULAS =================
        gameState.bolhas = this.physics.add.group({ maxSize: 80 });
        gameState.gotas = this.physics.add.group({ maxSize: 160 });

        this.physics.add.overlap(gameState.gotas, gameState.bolhas, (gota, bolha) => {
            this.reciclarObjeto(bolha);
            if (this.ferramentaAtiva === "chuveiro") {
                this.quantidadeEspuma = Math.max(0, this.quantidadeEspuma - 1);
            }
        });

        // Eventos
        gameState.sabao.on("pointerdown", () => this.alternarFerramenta("sabao"));
        gameState.chuveiro.on("pointerdown", () => this.alternarFerramenta("chuveiro"));
        gameState.toalha.on("pointerdown", () => this.alternarFerramenta("toalha"));

        this.criarAnimacoes();

        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.cameras.main.fadeIn(200, 0, 0, 0);

        // ================= TELA DE INSTRUÇÕES =================
        if (!gameState.instrucoesBanhoVistas) {
            this.mostrarInstrucoes();
        }
    }

    update(tempo, delta) {
        // Reduzimos o multiplicador de 1.2 para 0.8 para exigir que a ferramenta chegue mais perto
        const raioHitboxCachorro = (this.containerCachorro.getBounds().width / 2) * 0.8; 

        this.atualizarSabao(raioHitboxCachorro);
        this.atualizarChuveiro(delta, raioHitboxCachorro);
        this.atualizarToalha(raioHitboxCachorro);
        this.limparGotas();

        if (gameState.trocar) {
            this.cachorro = this.gerenciadorCachorros.cachorroAtual;
            gameState.cachorro = this.cachorro.sprite;
            this.escalaBaseCachorro = { x: this.cachorro.sprite.scaleX || this.cachorro.sprite.scale, y: this.cachorro.sprite.scaleY || this.cachorro.sprite.scale };

            this.estadoCachorro = "sujo";
            this.cachorro.dados.estado = "sujo";
            this.quantidadeEspuma = 0;
            this.acumuladorAgua = 0;
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

            gameState.trocar = false;
        }

        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga);
        }

        if (this.estadoCachorro === "sujo" && this.quantidadeEspuma >= 50) {
            this.estadoCachorro = "ensaboado";
            this.atualizarEstadoCachorroAnimacao();
            this.cameras.main.flash(200, 255, 255, 255); 
            this.animarCachorro(); 
            this.mostrarTextoFlutuante("Pronto!\nUse o chuveiro.", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
            
            this.animarFerramenta(gameState.sabao, false);
            this.retornarPosicaoInicial("sabao");
            this.ferramentaAtiva = null; 
        }

        if (this.estadoCachorro === "lavando" && this.quantidadeEspuma <= 0) {
            this.estadoCachorro = "molhado";
            this.atualizarEstadoCachorroAnimacao();
            
            gameState.bolhas.children.iterate((bolha) => {
                if (bolha && bolha.active) this.reciclarObjeto(bolha);
            });

            this.animarCachorro(); 
            this.mostrarTextoFlutuante("Agora use\na toalha!", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
            
            this.animarFerramenta(gameState.chuveiro, false);
            this.retornarPosicaoInicial("chuveiro");
            this.ferramentaAtiva = null;
        }
    }

    moverFerramenta(ferramenta) {
        ferramenta.x = Phaser.Math.Linear(ferramenta.x, this.input.activePointer.x, 0.5);
        ferramenta.y = Phaser.Math.Linear(ferramenta.y, this.input.activePointer.y, 0.5);
        ferramenta.body.updateFromGameObject(); 
    }

    atualizarSabao(raioHitbox) {
        if (this.ferramentaAtiva !== "sabao") return;

        const sabao = gameState.sabao;
        this.ultimoX = sabao.x;
        this.ultimoY = sabao.y;

        this.moverFerramenta(sabao);

        const moveu = Math.abs(sabao.x - this.ultimoX) > 5 || Math.abs(sabao.y - this.ultimoY) > 5;
        const distancia = Phaser.Math.Distance.Between(sabao.x, sabao.y, this.containerCachorro.x, this.containerCachorro.y);
        const estaNoCachorro = distancia < raioHitbox;

        if (estaNoCachorro && this.estadoCachorro === "sujo" && this.quantidadeEspuma < 50 && moveu) {
            this.criarBolha();
        }
    }

    atualizarChuveiro(delta, raioHitbox) {
        if (this.ferramentaAtiva !== "chuveiro") {
            this.acumuladorAgua = 0;
            return;
        }

        this.moverFerramenta(gameState.chuveiro);

        const distancia = Phaser.Math.Distance.Between(gameState.chuveiro.x, gameState.chuveiro.y, this.containerCachorro.x, this.containerCachorro.y);
        const estaNoCachorro = distancia < raioHitbox;

        if (estaNoCachorro && this.estadoCachorro === "ensaboado") {
            this.estadoCachorro = "lavando";
            this.cachorro.dados.estado = "lavando";
        }

        if (this.estadoCachorro === "lavando" || this.estadoCachorro === "ensaboado") {
            this.acumuladorAgua += delta;
            if (this.acumuladorAgua >= 70) {
                this.acumuladorAgua = 0;
                this.criarGota();
            }
        }
    }

    atualizarToalha(raioHitbox) {
        if (this.ferramentaAtiva !== "toalha") {
            this.tempoSecando = 0;
            return;
        }

        this.moverFerramenta(gameState.toalha);

        if (this.estadoCachorro !== "molhado") return;

        const distancia = Phaser.Math.Distance.Between(gameState.toalha.x, gameState.toalha.y, this.containerCachorro.x, this.containerCachorro.y);
        const estaNoCachorro = distancia < raioHitbox;

        if (estaNoCachorro) {
            this.tempoSecando += 1;

            if (this.tempoSecando >= 90) {
                this.estadoCachorro = "limpo";
                this.atualizarEstadoCachorroAnimacao();
                this.animarCachorro(); 
                this.criarExplosaoBrilhos(); 

                gameState.barras.limpeza = Phaser.Math.Clamp(gameState.barras.limpeza - 11, 0, 11); 
                
                const cachorroAtivo = gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo';
                if (!gameState.recompensas.banho[cachorroAtivo]) { 
                    gameState.cobasiCoins += 20; 
                    gameState.recompensas.banho[cachorroAtivo] = true; 
                    this.mostrarTextoFlutuante("+20 Moedas!", this.containerCachorro.x, this.containerCachorro.y - 100, "#ffd700");
                }

                gameState.sabao.disableInteractive();
                gameState.chuveiro.disableInteractive();
                gameState.toalha.disableInteractive();
                
                this.animarFerramenta(gameState.toalha, false);
                this.retornarPosicaoInicial("toalha");
                this.ferramentaAtiva = null;
                this.tempoSecando = 0;
            }
        } else {
            this.tempoSecando = 0; 
        }
    }

    alternarFerramenta(nomeFerramenta) {
        if (nomeFerramenta === "chuveiro" && this.estadoCachorro !== "ensaboado" && this.estadoCachorro !== "lavando") {
            this.mostrarTextoFlutuante("Ensaboe\nprimeiro!", gameState.chuveiro.x, gameState.chuveiro.y - 60, "#ff4444");
            this.retornarPosicaoInicial(nomeFerramenta);
            return;
        }
        if (nomeFerramenta === "toalha" && this.estadoCachorro !== "molhado") {
            this.mostrarTextoFlutuante("Use o\nchuveiro!", gameState.toalha.x, gameState.toalha.y - 60, "#ff4444");
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

    retornarPosicaoInicial(nomeFerramenta) {
        const ferramenta = this.pegarFerramenta(nomeFerramenta);
        const pos = this.pegarPosicaoInicial(nomeFerramenta);
        if (!ferramenta || !pos) return;

        this.tweens.add({
            targets: ferramenta,
            x: pos.x,
            y: pos.y,
            duration: 300,
            ease: "Back.easeOut"
        });
    }

    animarCachorro() {
        const target = this.cachorro?.sprite || gameState.cachorro;
        if (!target) return;
        
        const escalaX = this.escalaBaseCachorro.x || 1;
        const escalaY = this.escalaBaseCachorro.y || 1;

        this.tweens.add({
            targets: target,
            scaleY: escalaY * 0.85, 
            scaleX: escalaX * 1.15, 
            duration: 150,
            yoyo: true, 
            ease: "Quad.easeInOut"
        });
    }

    atualizarEstadoCachorroAnimacao() {
        if (!this.cachorro) return;
        const estadoAnim = (this.estadoCachorro === "limpo") ? "limpo" : (this.estadoCachorro === "sujo") ? "sujo" : "ensaboado";
        this.cachorro.mudarEstado(estadoAnim);
        const dadosCachorro = cachorrosBase.find(c => c.id === this.cachorro.dados.id) || cachorrosBase[0];
        if (dadosCachorro) dadosCachorro.estado = this.estadoCachorro;
        gameState.cachorro = this.cachorro.sprite;
    }

    criarBolha() {
        const variacaoX = Phaser.Math.RND.between(-30, 30);
        const variacaoY = Phaser.Math.RND.between(-30, 30);
        const x = gameState.sabao.x + variacaoX;
        const y = gameState.sabao.y + variacaoY;
        
        const bolha = gameState.bolhas.get(x, y, "bolhas");
        if (!bolha) return;

        bolha.setActive(true).setVisible(true);
        bolha.setScale(0.13);
        bolha.clearTint(); 
        bolha.body.enable = true;
        bolha.body.reset(x, y);
        bolha.body.setSize(bolha.displayWidth, bolha.displayHeight, true);
        
        this.quantidadeEspuma += 1;
    }

    criarGota() {
        const x = gameState.chuveiro.x;
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
            if (!gota || !gota.active) return;
            if (gota.y > this.scale.height + 120) {
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
        this.tweens.add({
            targets: ferramenta,
            scale: escalaAlvo,
            duration: 150,
            ease: "Back.easeOut"
        });
    }

    mostrarTextoFlutuante(texto, x, y, cor = "#ffffff") {
        const txt = this.add.text(x, y, texto, {
            fontFamily: '"Press Start 2P"', 
            fontSize: "28px",               
            fill: cor,
            stroke: "#000000",
            strokeThickness: 5,
            align: "center"
        }).setOrigin(0.5).setDepth(10);

        this.tweens.add({
            targets: txt,
            y: y - 100, 
            alpha: 0,   
            duration: 3000, 
            ease: "Power1",
            onComplete: () => txt.destroy() 
        });
    }

    criarExplosaoBrilhos() {
        for (let i = 0; i < 25; i++) {
            const x = gameState.cachorro.x + Phaser.Math.Between(-150, 150);
            const y = gameState.cachorro.y + Phaser.Math.Between(-150, 150);
            const brilho = this.add.image(x, y, "bolhas").setScale(0).setDepth(5);
            brilho.setTint(0xffd700); 

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
        if (nomeFerramenta === "sabao") return gameState.sabao;
        if (nomeFerramenta === "chuveiro") return gameState.chuveiro;
        if (nomeFerramenta === "toalha") return gameState.toalha;
        return null;
    }

    pegarPosicaoInicial(nomeFerramenta) {
        if (nomeFerramenta === "sabao") return this.posicaoInicialSabao;
        if (nomeFerramenta === "chuveiro") return this.posicaoInicialChuveiro;
        if (nomeFerramenta === "toalha") return this.posicaoInicialToalha;
        return null;
    }
    
    mostrarInstrucoes() {
        this.scene.bringToTop();

        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        const fundoEscuro = this.add.rectangle(centroX, centroY, 8000, 8000, 0x000000, 0.7)
            .setDepth(100)
            .setInteractive();

        const telaInstrucao = this.add.image(centroX, centroY, "instrucaoBanho")
            .setDepth(101)
            .setInteractive({ useHandCursor: true }); 

        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;

        const escalaX = limiteLargura / telaInstrucao.width;
        const escalaY = limiteAltura / telaInstrucao.height;

        const escalaFinal = Math.min(escalaX, escalaY);
        telaInstrucao.setScale(escalaFinal);

        const fecharInstrucoes = () => {
            fundoEscuro.destroy();
            telaInstrucao.destroy();
            
            gameState.instrucoesBanhoVistas = true; 
            
            this.scene.bringToTop("HUD");
        };

        fundoEscuro.on('pointerdown', fecharInstrucoes);
        telaInstrucao.on('pointerdown', fecharInstrucoes);
    }
}