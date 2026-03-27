// Importa o estado global do jogo para sincronização de dados
import { gameState } from "../main.js";
// Importa as definições base dos animais disponíveis
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";
// Importa a classe responsável por instanciar e gerenciar a lógica dos pets
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";

// Exporta a cena responsável pela mecânica de banho e higiene do animal
export class cenaBanho extends Phaser.Scene {
    constructor() {
        // Define a chave identificadora da cena no Phaser
        super({ key: "cenaBanho" });

        // Inicialização de variáveis de controle: ferramenta em uso e contadores de progresso
        this.ferramentaAtiva = null;
        this.acumuladorAgua = 0;
        this.tempoSecando = 0;
        this.quantidadeEspuma = 0;
        
        // Armazena coordenadas prévias para detectar se o jogador está movimentando o mouse/toque
        this.ultimoX = 0;
        this.ultimoY = 0;
        
        // Define o estado inicial do fluxo de limpeza do cachorro
        this.estadoCachorro = "sujo"; 
        this.gerenciadorCachorros = null;
        this.cachorro = null;
    }

    create() {
        // Gerenciamento da interface de usuário (HUD): inicia ou acorda a cena para garantir visibilidade
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD");
        } else if (this.scene.isSleeping("HUD")) {
            this.scene.wake("HUD");
        }
        this.scene.bringToTop("HUD");
        
        // Reinicializa contadores ao entrar na cena para evitar erros de persistência de sessões anteriores
        this.ferramentaAtiva = null;
        this.acumuladorAgua = 0;
        this.tempoSecando = 0;
        this.quantidadeEspuma = 0;

        // Recupera qual pet está sendo exibido no momento (Cachorro Caramelo ou Herói)
        const indiceAtivo = gameState.pets.cachorroHeroi ? 1 : 0;
        this.estadoCachorro = cachorrosBase[indiceAtivo]?.estado || "sujo";
        cachorrosBase[indiceAtivo].estado = this.estadoCachorro;

        // Cálculos de dimensionamento responsivo e definição da área útil de interação
        const largura = this.scale.width;
        const altura = this.scale.height;
        const areaX = largura - (largura * 0.2); 
        const areaY = altura;

        // Define a imagem de fundo do banheiro e ajusta para preencher a tela
        gameState.banheiro = this.add.image(areaX / 2, areaY / 2, "bgBanheiro")
            .setDisplaySize(areaX, areaY)
            .setDepth(-1);

        // Criação da entidade do cachorro através do gerenciador e armazenamento de sua escala base
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);
        this.escalaBaseCachorro = { x: this.cachorro.sprite.scaleX || this.cachorro.sprite.scale, y: this.cachorro.sprite.scaleY || this.cachorro.sprite.scale };

        // Registro da animação das pulgas caso ainda não exista no cache global
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 1,  
                repeat: -1     
            });
        }

        // Configuração visual dos parasitas e controle de visibilidade conforme o estado do pet
        this.pulgas = this.add.sprite(0, 0, "pulgas").setOrigin(0.5).setScale(areaY * 0.0015);
        this.pulgas.play("pulgaAnim");
        this.pulgas.setVisible(gameState.pulga); 

        // Container para agrupar o cachorro e as pulgas, facilitando transformações coordenadas
        this.containerCachorro = this.add.container(
            areaX / 2, 
            areaY * 0.65, 
            [this.cachorro.sprite, this.pulgas]
        );
        this.containerCachorro.setScale(areaY * 0.0006);

        // Ativação de física no sprite do animal para detecção de colisões com ferramentas
        this.physics.add.existing(this.cachorro.sprite);
        this.cachorro.sprite.body.setAllowGravity(false);
        this.cachorro.sprite.body.immovable = true;
        gameState.cachorro = this.cachorro.sprite;

        this.atualizarEstadoCachorroAnimacao();

        // Configuração posicional das ferramentas de banho no rodapé da área útil
        const yFerramentas = areaY * 0.88;
        this.posicaoInicialSabao = { x: (areaX / 2) - (areaX * 0.25), y: yFerramentas };
        this.posicaoInicialChuveiro = { x: areaX / 2, y: yFerramentas };
        this.posicaoInitialToalha = { x: (areaX / 2) + (areaX * 0.25), y: yFerramentas };
        const escalaFerramentas = areaY * 0.0005;

        // Instanciação e configuração de interatividade para o sabão, chuveiro e toalha
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

        // Habilita física nas ferramentas para monitorar sobreposição com o pet
        [gameState.sabao, gameState.chuveiro, gameState.toalha].forEach(tool => {
            this.physics.add.existing(tool);
            tool.body.setAllowGravity(false);
        });

        // Ajuste fino das caixas de colisão para tornar a interação mais precisa e orgânica
        const reduzirHitbox = (ferramenta, fator) => {
            const w = ferramenta.width;
            const h = ferramenta.height;
            ferramenta.body.setSize(w * fator, h * fator);
            ferramenta.body.setOffset(w * ((1 - fator) / 2), h * ((1 - fator) / 2));
        };

        reduzirHitbox(gameState.sabao, 0.3);
        reduzirHitbox(gameState.toalha, 0.3);

        // Grupos de partículas com limite máximo para otimização de performance (Object Pooling)
        gameState.bolhas = this.physics.add.group({ maxSize: 80 });
        gameState.gotas = this.physics.add.group({ maxSize: 160 });

        // Lógica de colisão: quando a água encosta nas bolhas, elas são removidas
        this.physics.add.overlap(gameState.gotas, gameState.bolhas, (gota, bolha) => {
            this.reciclarObjeto(bolha);
            if (this.ferramentaAtiva === "chuveiro") {
                this.quantidadeEspuma = Math.max(0, this.quantidadeEspuma - 1);
            }
        });

        // Configura eventos de clique para alternar entre as ferramentas de limpeza
        gameState.sabao.on("pointerdown", () => this.alternarFerramenta("sabao"));
        gameState.chuveiro.on("pointerdown", () => this.alternarFerramenta("chuveiro"));
        gameState.toalha.on("pointerdown", () => this.alternarFerramenta("toalha"));

        this.criarAnimacoes();

        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.cameras.main.fadeIn(200, 0, 0, 0);

        // Exibe instruções se for a primeira vez que o usuário acessa o banho
        if (!gameState.instrucoesBanhoVistas) {
            this.mostrarInstrucoes();
        }
    }

    update(tempo, delta) {
        // Define o raio de interação baseado no tamanho visual do pet no container
        const raioHitboxCachorro = (this.containerCachorro.getBounds().width / 2) * 0.8; 

        // Atualização contínua das mecânicas de ensaboar, enxaguar e secar
        this.atualizarSabao(raioHitboxCachorro);
        this.atualizarChuveiro(delta, raioHitboxCachorro);
        this.atualizarToalha(raioHitboxCachorro);
        this.limparGotas();

        // Monitora sinalização global para troca de pet durante a execução da cena
        if (gameState.trocar) {
            this.cachorro = this.gerenciadorCachorros.cachorroAtual;
            gameState.cachorro = this.cachorro.sprite;
            this.escalaBaseCachorro = { x: this.cachorro.sprite.scaleX || this.cachorro.sprite.scale, y: this.cachorro.sprite.scaleY || this.cachorro.sprite.scale };

            // Reseta o progresso de limpeza ao trocar de animal
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

        // Mantém as pulgas visíveis apenas se houver infestação no estado global
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga);
        }

        // Transição: pet sujo -> pet ensaboado (quando acumula espuma suficiente)
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

        // Transição: lavando -> molhado (quando toda a espuma é removida pelo enxágue)
        if (this.estadoCachorro === "lavando" && this.quantidadeEspuma <= 0) {
            this.estadoCachorro = "molhado";
            this.atualizarEstadoCachorroAnimacao();
            
            // Destrói bolhas remanescentes para garantir limpeza visual completa
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

    // Suaviza o movimento das ferramentas seguindo o ponteiro (Interpolação Linear)
    moverFerramenta(ferramenta) {
        ferramenta.x = Phaser.Math.Linear(ferramenta.x, this.input.activePointer.x, 0.5);
        ferramenta.y = Phaser.Math.Linear(ferramenta.y, this.input.activePointer.y, 0.5);
        ferramenta.body.updateFromGameObject(); 
    }

    // Lógica da mecânica de ensaboar: cria bolhas apenas se houver movimento sobre o pet
    atualizarSabao(raioHitbox) {
        if (this.ferramentaAtiva !== "sabao") return;

        const sabao = gameState.sabao;
        this.ultimoX = sabao.x;
        this.ultimoY = sabao.y;

        this.moverFerramenta(sabao);

        // Calcula delta de movimento para evitar criação de bolhas com o mouse parado
        const moveu = Math.abs(sabao.x - this.ultimoX) > 5 || Math.abs(sabao.y - this.ultimoY) > 5;
        const distancia = Phaser.Math.Distance.Between(sabao.x, sabao.y, this.containerCachorro.x, this.containerCachorro.y);
        const estaNoCachorro = distancia < raioHitbox;

        if (estaNoCachorro && this.estadoCachorro === "sujo" && this.quantidadeEspuma < 50 && moveu) {
            this.criarBolha();
        }
    }

    // Lógica da mecânica de enxágue: gera gotas de água e altera estado para lavagem
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

        // Emite gotas periodicamente baseando-se no tempo delta do frame
        if (this.estadoCachorro === "lavando" || this.estadoCachorro === "ensaboado") {
            this.acumuladorAgua += delta;
            if (this.acumuladorAgua >= 70) {
                this.acumuladorAgua = 0;
                this.criarGota();
            }
        }
    }

    // Lógica da mecânica de secagem: incrementa progresso ao manter a toalha sobre o pet molhado
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

            // Finaliza o banho: reseta barras de status e concede moedas como prêmio
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

                // Desativa as ferramentas após conclusão do processo
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

    // Gerencia a seleção lógica de ferramentas, impedindo o uso fora de ordem (UX)
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

        // Desativa a ferramenta se ela já estiver ativa (Toggle)
        if (this.ferramentaAtiva === nomeFerramenta) {
            this.animarFerramenta(this.pegarFerramenta(nomeFerramenta), false);
            this.retornarPosicaoInicial(nomeFerramenta);
            this.ferramentaAtiva = null;
            return;
        }
        
        // Se outra ferramenta estiver ativa, retorna ela para a base antes de pegar a nova
        if (this.ferramentaAtiva) {
            this.animarFerramenta(this.pegarFerramenta(this.ferramentaAtiva), false);
            this.retornarPosicaoInicial(this.ferramentaAtiva);
        }
        
        this.ferramentaAtiva = nomeFerramenta;
        this.animarFerramenta(this.pegarFerramenta(nomeFerramenta), true);
    }

    // Anima a volta suave das ferramentas para seus respectivos suportes
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

    // Executa uma animação de impacto (squash) no pet como feedback visual
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

    // Sincroniza a aparência visual (sprite) com o estado lógico de limpeza
    atualizarEstadoCachorroAnimacao() {
        if (!this.cachorro) return;
        const estadoAnim = (this.estadoCachorro === "limpo") ? "limpo" : (this.estadoCachorro === "sujo") ? "sujo" : "ensaboado";
        this.cachorro.mudarEstado(estadoAnim);
        const dadosCachorro = cachorrosBase.find(c => c.id === this.cachorro.dados.id) || cachorrosBase[0];
        if (dadosCachorro) dadosCachorro.estado = this.estadoCachorro;
        gameState.cachorro = this.cachorro.sprite;
    }

    // Instancia uma bolha de sabão com posição randômica próxima ao sabão
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

    // Instancia uma gota de água que cai verticalmente a partir do chuveiro
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

    // Monitora gotas que saíram da tela e as desativa para reuso no pool
    limparGotas() {
        gameState.gotas.children.iterate((gota) => {
            if (!gota || !gota.active) return;
            if (gota.y > this.scale.height + 120) {
                this.reciclarObjeto(gota);
            }
        });
    }

    // Função genérica para desativar e esconder objetos de física (reciclagem)
    reciclarObjeto(objeto) {
        if (!objeto) return;
        if (objeto.body) {
            objeto.body.stop();
            objeto.body.enable = false;
        }
        objeto.setActive(false).setVisible(false);
        objeto.setPosition(-200, -200); 
    }

    // Cria os registros de animação baseados nos spritesheets carregados
    criarAnimacoes() {
        if (!this.anims.exists("aguaAnim")) {
            this.anims.create({ key: "aguaAnim", frames: this.anims.generateFrameNumbers("agua", { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        }
    }

    // Feedback visual de escala quando uma ferramenta é "pega" pelo jogador
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

    // Exibe textos de aviso ou recompensa que flutuam e desaparecem suavemente
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

    // Gera um efeito de partículas douradas para celebrar a limpeza final do pet
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

    // Funções auxiliares para buscar instâncias de ferramentas e posições no gameState
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
    
    // Cria um modal de instruções que sobrepõe a cena com um fundo escurecido
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

        // Garante que a imagem do tutorial caiba proporcionalmente na tela do usuário
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;

        const escalaX = limiteLargura / telaInstrucao.width;
        const escalaY = limiteAltura / telaInstrucao.height;

        const escalaFinal = Math.min(escalaX, escalaY);
        telaInstrucao.setScale(escalaFinal);

        // Define o encerramento do tutorial e limpa os elementos da tela
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