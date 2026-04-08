// Importa o estado global do jogo para sincronização de dados entre diferentes cenas
import { gameState, iniciarMusicaAleatoria } from "../main.js";

// Importa as definições base dos animais disponíveis no jogo (provavelmente atributos visuais e IDs)
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";

// Importa a classe responsável por instanciar e gerenciar a lógica dos pets na tela
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";

// Exporta a cena responsável pela mecânica de banho e higiene do animal
export class cenaBanho extends Phaser.Scene {
    // O construtor define a chave de identificação única desta cena na engine
    constructor() {
        super({ key: "cenaBanho" });
    }

    // O método init é chamado antes do método create e serve para inicializar ou resetar as variáveis de estado da cena
    init() {
        // Guarda qual ferramenta o jogador está segurando no momento (sabão, chuveiro, toalha ou null)
        this.ferramentaAtiva = null;
        
        // Contadores para controlar o progresso de cada etapa do banho
        this.acumuladorAgua = 0;
        this.progressoMolhar = 0;
        this.tempoSecando = 0;
        this.quantidadeEspuma = 0;
        
        // Guarda a última posição registrada da ferramenta para calcular se o jogador está movimentando o mouse/dedo
        this.ultimoX = 0;
        this.ultimoY = 0;
        
        // Define o estado inicial do cachorro ao entrar na cena
        this.estadoCachorro = "sujo";
        
        // Referências para o gerenciador e o objeto do cachorro instanciado
        this.gerenciadorCachorros = null;
        this.cachorro = null;

        // Variáveis para o timer e controle do fluxo da partida
        this.tempoDecorridoMs = 0;
        this.tempoDecorrido = 0;
        this.banhoEmAndamento = false;
        this.banhoFinalizado = false;
    }

    // O método create é onde os elementos visuais, físicas e interações são instanciados na tela
    create() {
        // Verifica se a cena de HUD (Interface de Usuário) está ativa, se não, inicia ou acorda ela
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD");
        } else if (this.scene.isSleeping("HUD")) {
            this.scene.wake("HUD");
        }
        // Garante que a cena do HUD fique por cima de todas as outras
        this.scene.bringToTop("HUD");

        // Toca a música de fundo se as configurações do jogo permitirem
        if (gameState.musicaLigada) {
            iniciarMusicaAleatoria(this);
        }
        
        // Descobre qual cachorro está ativo no estado global para instanciar o modelo correto
        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0);
        
        // Garante que o cachorro não entre na cena de banho já limpo
        if (this.estadoCachorro !== "limpo") this.estadoCachorro = "sujo";
        cachorrosBase[indiceAtivo].estado = this.estadoCachorro;

        // Pega as dimensões da tela para posicionar os elementos proporcionalmente
        const largura = this.scale.width;
        const altura = this.scale.height;
        const areaX = largura - (largura * 0.2);
        const areaY = altura;

        // Adiciona a imagem de fundo do banheiro e joga ela para trás (depth negativo)
        gameState.banheiro = this.add.image(areaX / 2, areaY / 2, "bgBanheiro")
            .setDisplaySize(areaX, areaY)
            .setDepth(-1);

        // Adiciona o texto de tempo
        this.textoTempo = this.add.text(areaX / 2, 40, 'Tempo: 0s', {
            fontFamily: '"Press Start 2P", Arial', fontSize: "20px", color: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(10);

        // Cria a barra de progresso do banho (fundo escuro e preenchimento colorido)
        const larguraBarra = 300;
        this.barraProgressoBg = this.add.rectangle(areaX / 2, 80, larguraBarra, 24, 0x000000, 0.6).setDepth(10);
        this.barraProgressoBg.setStrokeStyle(2, 0xffffff);
        this.barraProgressoFill = this.add.rectangle((areaX / 2) - (larguraBarra / 2), 80, 0, 24, 0x44aaff, 1).setOrigin(0, 0.5).setDepth(11);
        
        // Texto que indica a ação atual que o jogador deve fazer
        this.textoProgresso = this.add.text(areaX / 2, 80, 'Preparando...', {
            fontFamily: '"Press Start 2P", Arial', fontSize: "12px", color: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(12);

        // Instancia o gerenciador de cachorros e cria o sprite do cachorro na tela
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);
        
        // Salva a escala original do cachorro para poder aplicar efeitos de "pulsar" depois sem distorcer
        this.escalaBaseCachorro = { x: this.cachorro.sprite.scaleX || this.cachorro.sprite.scale, y: this.cachorro.sprite.scaleY || this.cachorro.sprite.scale };

        // Cria a animação das pulgas caso ainda não exista no sistema do jogo
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }),
                frameRate: 1,  
                repeat: -1    
            });
        }

        // Adiciona o sprite das pulgas e inicia a animação, mostrando apenas se o estado indicar que tem pulga
        this.pulgas = this.add.sprite(0, 0, "pulgas").setOrigin(0.5).setScale(areaY * 0.0015);
        this.pulgas.play("pulgaAnim");
        this.pulgas.setVisible(gameState.pulga);

        // Cria um container (grupo visual) para juntar o cachorro e as pulgas, permitindo mover ou escalar tudo junto
        this.containerCachorro = this.add.container(
            areaX / 2,
            areaY * 0.65,
            [this.cachorro.sprite, this.pulgas]
        );
        this.containerCachorro.setScale(areaY * 0.0006);

        // Adiciona física ao sprite do cachorro para detectar colisões com a água/sabão, sem sofrer gravidade
        this.physics.add.existing(this.cachorro.sprite);
        this.cachorro.sprite.body.setAllowGravity(false);
        this.cachorro.sprite.body.immovable = true;
        gameState.cachorro = this.cachorro.sprite;

        // Atualiza a aparência do cachorro para refletir seu estado (neste caso, sujo)
        this.atualizarEstadoCachorroAnimacao();

        // Configura a posição inicial das três ferramentas do jogo (sabão, chuveiro, toalha)
        const yFerramentas = areaY * 0.88;
        this.posicaoInicialSabao = { x: (areaX / 2) - (areaX * 0.25), y: yFerramentas };
        this.posicaoInicialChuveiro = { x: areaX / 2, y: yFerramentas };
        this.posicaoInitialToalha = { x: (areaX / 2) + (areaX * 0.25), y: yFerramentas };
        const escalaFerramentas = areaY * 0.0005;

        // Instancia as ferramentas visuais, tornando-as clicáveis (interativas)
        gameState.sabao = this.add.sprite(this.posicaoInicialSabao.x, this.posicaoInicialSabao.y, "sabao").setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.sabao.escalaOriginal = escalaFerramentas * 0.28;
        gameState.sabao.setScale(gameState.sabao.escalaOriginal);
        
        gameState.chuveiro = this.add.sprite(this.posicaoInicialChuveiro.x, this.posicaoInicialChuveiro.y, "chuveiro").setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.chuveiro.escalaOriginal = escalaFerramentas * 0.36;
        gameState.chuveiro.setScale(gameState.chuveiro.escalaOriginal);
        
        gameState.toalha = this.add.sprite(this.posicaoInitialToalha.x, this.posicaoInitialToalha.y, "toalha").setInteractive({ useHandCursor: true }).setDepth(3);
        gameState.toalha.escalaOriginal = escalaFerramentas * 0.36;
        gameState.toalha.setScale(gameState.toalha.escalaOriginal);

        // Adiciona física às ferramentas para permitir detecção de área
        [gameState.sabao, gameState.chuveiro, gameState.toalha].forEach(tool => {
            this.physics.add.existing(tool);
            tool.body.setAllowGravity(false);
        });

        // Função auxiliar para diminuir a caixa de colisão (hitbox) das ferramentas, deixando a interação mais precisa
        const reduzirHitbox = (ferramenta, fator) => {
            const w = ferramenta.width;
            const h = ferramenta.height;
            ferramenta.body.setSize(w * fator, h * fator);
            ferramenta.body.setOffset(w * ((1 - fator) / 2), h * ((1 - fator) / 2));
        };

        reduzirHitbox(gameState.sabao, 0.3);
        reduzirHitbox(gameState.toalha, 0.3);

        // Cria grupos de física para gerenciar multiplos objetos ao mesmo tempo (bolhas e gotas), definindo um limite máximo para poupar memória
        gameState.bolhas = this.physics.add.group({ maxSize: 80 });
        gameState.gotas = this.physics.add.group({ maxSize: 160 });

        // Configuração de Colisão 1: ÁGUA vs CACHORRO
        this.colisaoGotaCachorro = this.physics.add.overlap(gameState.gotas, this.cachorro.sprite, (obj1, obj2) => {
            if (this.banhoFinalizado) return;
            
            // Identifica qual objeto é a gota na colisão
            const gota = (obj1 === this.cachorro.sprite) ? obj2 : obj1;
            
            // Se o cachorro estiver na fase de ser molhado
            if (this.estadoCachorro === "sujo") {
                this.reciclarObjeto(gota); // Destrói a gota visualmente

                // Se o chuveiro for a ferramenta em uso, aumenta o progresso
                if (this.ferramentaAtiva === "chuveiro") {
                    this.progressoMolhar += 1;
                    
                    // Se atingiu água suficiente, avança de fase
                    if (this.progressoMolhar >= 25) {
                        this.estadoCachorro = "molhado_sujo";
                        this.atualizarEstadoCachorroAnimacao();
                        this.animarCachorro();
                        this.mostrarTextoFlutuante("Molhado!\nUse o sabão.", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
                        
                        // Devolve a ferramenta ao lugar de origem
                        this.animarFerramenta(gameState.chuveiro, false);
                        this.retornarPosicaoInicial("chuveiro");
                        this.ferramentaAtiva = null;
                        this.progressoMolhar = 0;

                        // Desativa esta colisão para economizar processamento nas próximas fases
                        this.colisaoGotaCachorro.active = false;
                    }
                }
            }
        });

        // Configuração de Colisão 2: ÁGUA vs ESPUMA
        this.physics.add.overlap(gameState.gotas, gameState.bolhas, (gota, bolha) => {
            if (this.banhoFinalizado) return;
            // Destrói tanto a gota quanto a bolha (efeito de limpar o sabão)
            this.reciclarObjeto(gota);
            this.reciclarObjeto(bolha);

            // Reduz o contador de espuma quando a água acerta as bolhas
            if (this.ferramentaAtiva === "chuveiro" && (this.estadoCachorro === "ensaboado" || this.estadoCachorro === "lavando")) {
                this.estadoCachorro = "lavando";
                this.cachorro.dados.estado = "lavando";
                this.quantidadeEspuma = Math.max(0, this.quantidadeEspuma - 1);
            }
        });

        // Define os eventos de clique nas ferramentas
        gameState.sabao.on("pointerdown", () => this.alternarFerramenta("sabao"));
        gameState.chuveiro.on("pointerdown", () => this.alternarFerramenta("chuveiro"));
        gameState.toalha.on("pointerdown", () => this.alternarFerramenta("toalha"));

        // Prepara outras animações necessárias (como o movimento da água)
        this.criarAnimacoes();

        // Limita a área visual da câmera ao tamanho da tela e faz um efeito de fade in (surgir suavemente)
        this.cameras.main.setBounds(0, 0, this.scale.width, this.scale.height);
        this.cameras.main.fadeIn(200, 0, 0, 0);

        // Função encapsulada para iniciar a contagem de tempo da partida
        this.iniciarPartida = () => {
            this.tempoDecorridoMs = 0;
            this.tempoDecorrido = 0;
            this.textoTempo.setText('Tempo: 0s');
            this.banhoEmAndamento = true;
        };

        // Lógica de tutorial: só mostra as instruções se for a primeira vez do jogador
        if (!gameState.instrucoesBanhoVistas) {
            this.mostrarInstrucoes(this.iniciarPartida);
        } else {
            this.iniciarPartida();
        }
    }

    // O método update roda a cada frame do jogo (geralmente 60 vezes por segundo)
    // O parâmetro 'tempo' é o tempo total e 'delta' é o tempo em milissegundos desde o último frame
    update(tempo, delta) {
        if (this.banhoFinalizado) return;

        // Atualiza a lógica do cronômetro da cena
        if (this.banhoEmAndamento) {
            this.tempoDecorridoMs += delta;
            this.tempoDecorrido = Math.floor(this.tempoDecorridoMs / 1000); // Converte para segundos reais
            this.textoTempo.setText(`Tempo: ${this.tempoDecorrido}s`);
        }

        // Atualiza visualmente a barra e o texto baseado na fase do banho
        this.atualizarBarraVisual();

        // Calcula dinamicamente o raio do cachorro para saber se as ferramentas estão sobre ele
        const raioHitboxCachorro = (this.containerCachorro.getBounds().width / 2) * 0.8;

        // Processa as lógicas específicas de cada ferramenta
        this.atualizarSabao(raioHitboxCachorro);
        this.atualizarChuveiro(delta);
        this.atualizarToalha(raioHitboxCachorro);
        
        // Remove objetos que caíram para fora da tela
        this.limparGotas();

        // Lógica para quando o jogador troca de pet pela UI externa enquanto está na cena
        if (gameState.trocar) {
            // Atualiza a referência para o novo cachorro
            this.cachorro = this.gerenciadorCachorros.cachorroAtual;
            gameState.cachorro = this.cachorro.sprite;
            this.escalaBaseCachorro = { x: this.cachorro.sprite.scaleX || this.cachorro.sprite.scale, y: this.cachorro.sprite.scaleY || this.cachorro.sprite.scale };

            // Reseta todos os atributos da fase de banho para o novo pet
            this.estadoCachorro = "sujo";
            this.cachorro.dados.estado = "sujo";
            this.quantidadeEspuma = 0;
            this.acumuladorAgua = 0;
            this.progressoMolhar = 0;
            this.tempoSecando = 0;
            this.ferramentaAtiva = null;

            this.atualizarEstadoCachorroAnimacao();

            // Atualiza o container visual, trocando a imagem anterior pela nova
            if (this.containerCachorro) {
                this.containerCachorro.removeAll(false);
                this.containerCachorro.add(this.cachorro.sprite);
                if (this.pulgas) this.containerCachorro.add(this.pulgas);
            }

            // Garante que as ferramentas continuem clicáveis
            gameState.sabao.setInteractive({ useHandCursor: true });
            gameState.chuveiro.setInteractive({ useHandCursor: true });
            gameState.toalha.setInteractive({ useHandCursor: true });

            // Refaz a física no novo sprite
            if (!this.cachorro.sprite.body) {
                this.physics.add.existing(this.cachorro.sprite);
            }
            this.cachorro.sprite.body.setAllowGravity(false);
            this.cachorro.sprite.body.immovable = true;

            // Destrói e recria a regra de colisão de gotas para atrelar ao novo corpo físico
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

            // Confirma que a troca foi concluída
            gameState.trocar = false;
        }

        // Mantém a visibilidade das pulgas de acordo com a regra global
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga);
        }

        // Transição de Estado: O cachorro atingiu o limite de espuma
        if (this.estadoCachorro === "molhado_sujo" && this.quantidadeEspuma >= 50) {
            this.estadoCachorro = "ensaboado";
            this.atualizarEstadoCachorroAnimacao();
            
            // Cria um flash de luz na tela
            this.cameras.main.flash(200, 255, 255, 255);
            this.animarCachorro();
            this.mostrarTextoFlutuante("Ensaboado!\nUse o chuveiro.", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
            
            // Devolve o sabão para a bancada
            this.animarFerramenta(gameState.sabao, false);
            this.retornarPosicaoInicial("sabao");
            this.ferramentaAtiva = null;
        }

        // Transição de Estado: O sabão foi todo enxaguado
        if (this.estadoCachorro === "lavando" && this.quantidadeEspuma <= 0) {
            this.estadoCachorro = "molhado_limpo";
            this.atualizarEstadoCachorroAnimacao();
            
            // Remove quaisquer bolhas restantes na tela
            gameState.bolhas.children.iterate((bolha) => {
                if (bolha && bolha.active) this.reciclarObjeto(bolha);
            });

            this.animarCachorro();
            this.mostrarTextoFlutuante("Enxaguado!\nAgora a toalha.", this.containerCachorro.x, this.containerCachorro.y - 150, "#88ff88");
            
            // Devolve o chuveiro
            this.animarFerramenta(gameState.chuveiro, false);
            this.retornarPosicaoInicial("chuveiro");
            this.ferramentaAtiva = null;
        }
    }

    // Calcula e atualiza a barra que indica ao jogador o progresso da etapa atual
    atualizarBarraVisual() {
        let porcentagem = 0;
        let texto = "Pronto!";
        let cor = 0x00ff00; // Verde

        // Checa em que momento do jogo estamos para definir qual métrica calcular
        if (this.estadoCachorro === "sujo") {
            porcentagem = this.progressoMolhar / 25;
            texto = "Molhar";
            cor = 0x44aaff; // Azul
        } else if (this.estadoCachorro === "molhado_sujo") {
            porcentagem = this.quantidadeEspuma / 50;
            texto = "Ensaboar";
            cor = 0xffffff; // Branco
        } else if (this.estadoCachorro === "ensaboado" || this.estadoCachorro === "lavando") {
            porcentagem = (50 - this.quantidadeEspuma) / 50; // Calculo inverso porque estamos tirando espuma
            texto = "Enxaguar";
            cor = 0x44aaff; // Azul
        } else if (this.estadoCachorro === "molhado_limpo") {
            porcentagem = this.tempoSecando / 90;
            texto = "Secar";
            cor = 0xffaa00; // Laranja
        }

        // Garante que o valor fique estritamente entre 0 e 1, evitando erros visuais
        porcentagem = Phaser.Math.Clamp(porcentagem, 0, 1);
        
        // Aplica o tamanho na barra horizontal e a cor
        this.barraProgressoFill.width = 300 * porcentagem;
        this.barraProgressoFill.setFillStyle(cor);
        this.textoProgresso.setText(texto);
    }

    // Função auxiliar para fazer o objeto selecionado seguir o cursor/dedo de forma suave
    moverFerramenta(ferramenta) {
        ferramenta.x = Phaser.Math.Linear(ferramenta.x, this.input.activePointer.x, 0.5);
        ferramenta.y = Phaser.Math.Linear(ferramenta.y, this.input.activePointer.y, 0.5);
        // Atualiza a colisão junto com o objeto visual
        ferramenta.body.updateFromGameObject();
    }

    // Regras de como o sabão funciona
    atualizarSabao(raioHitbox) {
        if (this.ferramentaAtiva !== "sabao") return;

        const sabao = gameState.sabao;
        this.moverFerramenta(sabao);

        // Verifica se houve um movimento considerável desde o último frame (precisa esfregar)
        const moveu = Math.abs(sabao.x - this.ultimoX) > 5 || Math.abs(sabao.y - this.ultimoY) > 5;
        // Calcula a distância entre o centro do sabão e o centro do cachorro
        const distancia = Phaser.Math.Distance.Between(sabao.x, sabao.y, this.containerCachorro.x, this.containerCachorro.y);
        const estaNoCachorro = distancia < raioHitbox;

        // Se o cachorro precisa de sabão, o sabão está em cima dele, e está sendo movimentado: cria espuma
        if (estaNoCachorro && this.estadoCachorro === "molhado_sujo" && this.quantidadeEspuma < 50 && moveu) {
            this.criarBolha();
        }

        this.ultimoX = sabao.x;
        this.ultimoY = sabao.y;
    }

    // Regras de como o chuveiro funciona
    atualizarChuveiro(delta) {
        if (this.ferramentaAtiva !== "chuveiro") {
            this.acumuladorAgua = 0;
            return;
        }

        this.moverFerramenta(gameState.chuveiro);

        // O chuveiro dispara água constantemente com base no tempo passado (delta)
        this.acumuladorAgua += delta;
        if (this.acumuladorAgua >= 50) { // Dispara uma gota a cada 50ms
            this.acumuladorAgua = 0;
            this.criarGota();
        }
    }

    // Regras de como a toalha funciona
    atualizarToalha(raioHitbox) {
        if (this.ferramentaAtiva !== "toalha") {
            this.tempoSecando = 0; // O secar é perdido se o jogador parar
            return;
        }

        this.moverFerramenta(gameState.toalha);

        // Se o cachorro não está pronto para ser seco, não faz nada
        if (this.estadoCachorro !== "molhado_limpo") return;

        const toalha = gameState.toalha;
        
        // Verifica se a toalha se moveu o suficiente em relação ao último frame
        const moveu = Math.abs(toalha.x - this.ultimoX) > 5 || Math.abs(toalha.y - this.ultimoY) > 5;
        const distancia = Phaser.Math.Distance.Between(toalha.x, toalha.y, this.containerCachorro.x, this.containerCachorro.y);
        const estaNoCachorro = distancia < raioHitbox;

        if (estaNoCachorro) {
            // Só aumenta o progresso se estiver no cachorro E estiver em movimento
            if (moveu) {
                this.tempoSecando += 1;
                // Se esfregou por 90 frames, termina a fase e ganha o jogo
                if (this.tempoSecando >= 90) {
                    this.finalizarBanho();
                }
            }
        } else {
            // Zera caso o jogador tire a toalha de cima do pet antes de terminar
            this.tempoSecando = 0;
        }

        // Atualiza a última posição para o cálculo de fricção do próximo frame
        this.ultimoX = toalha.x;
        this.ultimoY = toalha.y;
    }

    // Gerencia o clique nos itens, para pegar, soltar ou dar feedback de erro
    alternarFerramenta(nomeFerramenta) {
        if (this.banhoFinalizado) return;

        // Impedimentos lógicos, o jogador tenta pegar o item na ordem errada
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

        // Se o jogador clica na mesma ferramenta que já está segurando, ela é devolvida para a mesa
        if (this.ferramentaAtiva === nomeFerramenta) {
            this.animarFerramenta(this.pegarFerramenta(nomeFerramenta), false);
            this.retornarPosicaoInicial(nomeFerramenta);
            this.ferramentaAtiva = null;
            return;
        }
        
        // Se já está segurando outra ferramenta, devolve a anterior primeiro
        if (this.ferramentaAtiva) {
            this.animarFerramenta(this.pegarFerramenta(this.ferramentaAtiva), false);
            this.retornarPosicaoInicial(this.ferramentaAtiva);
        }
        
        // Pega a nova ferramenta em mãos (aumentando a escala via animarFerramenta)
        this.ferramentaAtiva = nomeFerramenta;
        this.animarFerramenta(this.pegarFerramenta(nomeFerramenta), true);
    }

    // Lida com a finalização do minigame e a distribuição de recompensas
    finalizarBanho() {
        this.banhoEmAndamento = false;
        this.banhoFinalizado = true;
        
        // Garante que a barra feche em 100% visivelmente
        this.estadoCachorro = "limpo";
        this.atualizarBarraVisual();
        
        // Atualiza a arte final do pet e joga efeitos de partícula na tela
        this.atualizarEstadoCachorroAnimacao();
        this.animarCachorro();
        this.criarExplosaoBrilhos();

        // Subtrai o nível global de 'limpeza' (como se fosse sujeira) para ficar limpo em outras telas
        gameState.barras.limpeza = Phaser.Math.Clamp(gameState.barras.limpeza - 11, 0, 11);
        
        // Lógica de cálculo de Estrelas baseada na agilidade do jogador
        const tempoFinal = this.tempoDecorrido;
        let estrelas = 3; // Quanto mais rápido, mais estrelas
        if (tempoFinal > 40) {
            estrelas = 1;
        } else if (tempoFinal > 20) {
            estrelas = 2;
        }

        // Lógica de cálculo de Moedas recebidas baseada nas estrelas
        let moedas = 5;
        if (estrelas === 3) moedas = 20;
        else if (estrelas === 2) moedas = 10;

        // Verifica se é a primeira vez lavando esse pet para entregar as moedas (sistema de recompensa única)
        const cachorroAtivo = gameState.pets.cachorroJoao ? 'joao' : (gameState.pets.cachorroHeroi ? 'heroi' : 'caramelo');
        if (!gameState.recompensas.banho[cachorroAtivo]) {
            gameState.cobasiCoins += moedas;
            gameState.recompensas.banho[cachorroAtivo] = true;
        }

        // Trava os itens para o jogador não interagir mais
        gameState.sabao.disableInteractive();
        gameState.chuveiro.disableInteractive();
        gameState.toalha.disableInteractive();
        
        // Guarda a toalha no lugar
        this.animarFerramenta(gameState.toalha, false);
        this.retornarPosicaoInicial("toalha");
        this.ferramentaAtiva = null;
        this.tempoSecando = 0;

        // Aguarda pouco mais de 1 segundo para deixar o jogador ver as animações, e chama o popup de fim de jogo
        this.time.delayedCall(1200, () => {
            this.mostrarPainelResultado(estrelas, moedas, tempoFinal);
        });
    }

    // Tela de pontuação exibida ao final do jogo
    mostrarPainelResultado(estrelas, moedas, segundos) {
        // Traz a cena de banho inteira para cima do HUD para exibir o painel sobrepondo os menus globais
        this.scene.bringToTop();

        // Escolhe a imagem que tem o número certo de estrelas desenhadas
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

        // Cria um fundo escuro transparente sobrepondo tudo para dar destaque
        const fundoFeedback = this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.8).setDepth(200).setScrollFactor(0).setInteractive();
        const telaFeedback = this.add.image(cx, cy, imagemFeedback).setDepth(201).setScrollFactor(0).setInteractive();

        // Escala responsiva da imagem de resultado para não vazar da tela do usuário
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaFinal = Math.min(limiteLargura / telaFeedback.width, limiteAltura / telaFeedback.height);
        telaFeedback.setScale(escalaFinal);

        // Posiciona o texto da quantidade de moedas baseando-se na arte da imagem
        let posMoedasY = cy + (telaFeedback.displayHeight * 0.12);
        this.add.text(cx - 12, posMoedasY, `${moedas} Moedas`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(202);

        // Posiciona o texto de tempo usado
        let posTempoY = cy + (telaFeedback.displayHeight * 0.35);
        this.add.text(cx - 20, posTempoY, `${segundos}s`, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "22px", color: "#005e64"
        }).setOrigin(0.5).setDepth(202);

        // Cria o botão instrucional para voltar, e adiciona um Tween (animação na engine) para ele ficar piscando (opacidade alternando)
        const textoContinuar = this.add.text(cx, cy + (telaFeedback.displayHeight / 2) + 40, "[ Clique para Sair ]", {
            fontFamily: '"Press Start 2P", Arial', fontSize: "15px", color: "#ffffff"
        }).setOrigin(0.5).setDepth(202).setScrollFactor(0);
        
        this.tweens.add({ targets: textoContinuar, alpha: 0.5, duration: 600, yoyo: true, loop: -1 });

        // Ao clicar, recomeça toda esta cena
        const voltarCena = () => {
            this.scene.restart();
        };

        // Atribui o click à imagem e ao fundo
        fundoFeedback.on('pointerdown', voltarCena);
        telaFeedback.on('pointerdown', voltarCena);
    }

    // Move um objeto devolta à sua coordenada original utilizando uma animação de deslize
    retornarPosicaoInicial(nomeFerramenta) {
        const ferramenta = this.pegarFerramenta(nomeFerramenta);
        const pos = this.pegarPosicaoInicial(nomeFerramenta);
        if (!ferramenta || !pos) return;

        // Usa easing Back.easeOut para dar um leve efeito de rebote ("elástico") quando o objeto chega no lugar
        this.tweens.add({ targets: ferramenta, x: pos.x, y: pos.y, duration: 300, ease: "Back.easeOut" });
    }

    // Faz o cachorro pular ligeiramente na tela (esticando e encolhendo os eixos)
    animarCachorro() {
        const target = this.cachorro?.sprite || gameState.cachorro;
        if (!target) return;
        
        const escalaX = this.escalaBaseCachorro.x || 1;
        const escalaY = this.escalaBaseCachorro.y || 1;

        this.tweens.add({ targets: target, scaleY: escalaY * 0.85, scaleX: escalaX * 1.15, duration: 150, yoyo: true, ease: "Quad.easeInOut" });
    }

    // Sincroniza a variável de lógica interna de estado com a exibição de imagem no objeto "cachorro"
    atualizarEstadoCachorroAnimacao() {
        if (!this.cachorro) return;
        
        let estadoAnim = "sujo";
        
        // Se ele não está sujo nem 100% limpo, mostra o sprite de ensaboado/molhado
        if (this.estadoCachorro === "molhado_sujo" ||
            this.estadoCachorro === "ensaboado" ||
            this.estadoCachorro === "lavando" ||
            this.estadoCachorro === "molhado_limpo") {
            estadoAnim = "ensaboado";
        }
        else if (this.estadoCachorro === "limpo") {
            estadoAnim = "limpo";
        }

        // Chama o método interno do gerenciador para alterar o atlas/frame visual do pet
        this.cachorro.mudarEstado(estadoAnim);
        
        // Salva esse status nos dados globais também
        const dadosCachorro = cachorrosBase.find(c => c.id === this.cachorro.dados.id) || cachorrosBase[0];
        if (dadosCachorro) dadosCachorro.estado = this.estadoCachorro;
        gameState.cachorro = this.cachorro.sprite;
    }

    // Sistema de emissão de partículas: Retira uma bolha invisível do grupo (pool) e a recicla para aparecer
    criarBolha() {
        const variacaoX = Phaser.Math.RND.between(-30, 30);
        const variacaoY = Phaser.Math.RND.between(-30, 30);
        
        // O método get tenta achar um objeto desativado do grupo para reutilizar (pool pattern)
        const bolha = gameState.bolhas.get(gameState.sabao.x + variacaoX, gameState.sabao.y + variacaoY, "bolhas");
        if (!bolha) return; // Se atingiu o limite maxSize e todos estão ativos, ele não faz nada

        // Reativa física, visibilidade e redimensiona a bolha em relação a ponta do sabão
        bolha.setActive(true).setVisible(true).setScale(0.13).clearTint();
        bolha.body.enable = true;
        bolha.body.reset(gameState.sabao.x + variacaoX, gameState.sabao.y + variacaoY);
        bolha.body.setSize(bolha.displayWidth, bolha.displayHeight, true);
        
        this.quantidadeEspuma += 1;
    }

    // Mesmo padrão lógico de criar bolhas, mas cria gotas de água saindo da ponta do chuveiro
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
        // Da uma força pra baixo na gota, para simular gravidade no jato
        gota.body.setVelocityY(200);
    }

    // Verifica todas as gotas da tela, se passarem do chão invisível do banheiro, ela as devolve para o pool de recursos
    limparGotas() {
        gameState.gotas.children.iterate((gota) => {
            if (gota && gota.active && gota.y > this.scale.height + 120) {
                this.reciclarObjeto(gota);
            }
        });
    }

    // Função genérica que desativa objetos (como gotas ou bolhas) devolvendo-os ao estoque para não pesar a memória criando novos
    reciclarObjeto(objeto) {
        if (!objeto) return;
        if (objeto.body) {
            objeto.body.stop();
            objeto.body.enable = false;
        }
        objeto.setActive(false).setVisible(false);
        objeto.setPosition(-200, -200); // Esconde em coordenadas fora da tela, por segurança
    }

    // Prepara a animação das gotas trocando de frame em loop, simulando o efeito de água caindo
    criarAnimacoes() {
        if (!this.anims.exists("aguaAnim")) {
            this.anims.create({ key: "aguaAnim", frames: this.anims.generateFrameNumbers("agua", { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        }
    }

    // Faz a ferramenta aumentar de tamanho para indicar que o jogador "pegou" ela na mão
    animarFerramenta(ferramenta, ativa) {
        if (!ferramenta) return;
        const escalaAlvo = ativa ? ferramenta.escalaOriginal * 1.1 : ferramenta.escalaOriginal;
        this.tweens.add({ targets: ferramenta, scale: escalaAlvo, duration: 150, ease: "Back.easeOut" });
    }

    // Cria e exibe um texto dinâmico na tela para dicas do jogo que sobe e desaparece
    mostrarTextoFlutuante(texto, x, y, cor = "#ffffff") {
        const txt = this.add.text(x, y, texto, { fontFamily: '"Press Start 2P", Arial', fontSize: "28px", fill: cor, stroke: "#000000", strokeThickness: 5, align: "center" }).setOrigin(0.5).setDepth(50);
        // O tween muda a posição (y) e a opacidade (alpha) gradualmente antes de destruir o objeto
        this.tweens.add({ targets: txt, y: y - 100, alpha: 0, duration: 3000, ease: "Power1", onComplete: () => txt.destroy() });
    }

    // Efeito de partículas de estrelas quando o cachorro fica limpo
    criarExplosaoBrilhos() {
        for (let i = 0; i < 25; i++) {
            // Sorteia localizações ao redor do cachorro e cria "bolhas" alteradas por cor dourada (tint)
            const x = gameState.cachorro.x + Phaser.Math.Between(-150, 150);
            const y = gameState.cachorro.y + Phaser.Math.Between(-150, 150);
            const brilho = this.add.image(x, y, "bolhas").setScale(0).setDepth(5).setTint(0xffd700);
            
            // As estrelas crescem e flutuam para cima sumindo
            this.tweens.add({ targets: brilho, scale: Phaser.Math.FloatBetween(0.05, 0.15), y: y - Phaser.Math.Between(50, 150), alpha: 0, duration: Phaser.Math.Between(1000, 2000), ease: "Sine.easeOut", onComplete: () => brilho.destroy() });
        }
    }

    // Métodos utilitários simples que mapeiam uma string para o objeto respectivo
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
    
    // Função para mostrar um popup inicial ensinando a jogar antes que o timer comece
    mostrarInstrucoes(callbackInicio) {
        // Traz a cena de banho para cima do HUD para exibir as instruções limpas
        this.scene.bringToTop();

        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        // Fundo semitransparente que escurece o cenário
        const fundoEscuro = this.add.rectangle(centroX, centroY, 8000, 8000, 0x000000, 0.7).setDepth(300).setInteractive();
        const telaInstrucao = this.add.image(centroX, centroY, "instrucaoBanho").setDepth(301).setInteractive({ useHandCursor: true });

        // Cálculos para manter a imagem da instrução no tamanho correto em qualquer celular/monitor
        const escalaFinal = Math.min((this.scale.width * 0.8) / telaInstrucao.width, (this.scale.height * 0.8) / telaInstrucao.height);
        telaInstrucao.setScale(escalaFinal);

        // Ação executada ao clicar para fechar a tela de tutorial
        const fecharInstrucoes = () => {
            fundoEscuro.destroy();
            telaInstrucao.destroy();
            // Salva na memória global para não mostrar novamente na próxima partida
            gameState.instrucoesBanhoVistas = true;
            
            // Retorna o HUD principal para a frente ao fechar as instruções
            this.scene.bringToTop("HUD");
            
            // Ativa o contador de tempo passado como callback pela função create
            if(callbackInicio) callbackInicio();
        };

        // Permite fechar a janela clicando no fundo ou na própria imagem
        fundoEscuro.on('pointerdown', fecharInstrucoes);
        telaInstrucao.on('pointerdown', fecharInstrucoes);
    }
}