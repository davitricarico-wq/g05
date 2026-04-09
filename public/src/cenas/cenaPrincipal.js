// Importa o estado global do jogo
import { gameState, iniciarMusica } from "../main.js"
// Importa as dependências para gestão e dados dos animais
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js"
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js"
// Importa o gerenciador do Quiz (AJUSTE O CAMINHO SE NECESSÁRIO)
import { GerenciadorQuiz } from "../componentes/gerenciadorQuiz.js"

// Cena responsável por gerenciar e exibir interfaces sobrepostas como fichas, evoluções e quizzes
class CenaPopups extends Phaser.Scene {
    constructor() {
        super({ key: "CenaPopups" });
    }

    create() {
        // Inicializa o gerenciador de quiz sempre do zero
        this.quiz = new GerenciadorQuiz();
        this.quiz.reiniciar();
        
        // Flag para rastrear se o feedback foi exibido
        this.exibindoFeedback = false;

        // Força esta cena inteira a vir para a frente de TUDO (incluindo a HUD)
        this.scene.bringToTop();

        // Cria um overlay escuro que cobre 100% da tela para bloquear a cena principal e a HUD
        const telaCentroX = this.scale.width / 2;
        const telaCentroY = this.scale.height / 2;
        
        this.overlayEscuro = this.add.rectangle(telaCentroX, telaCentroY, this.scale.width, this.scale.height, 0x000000, 0.7)
            .setInteractive(); // O setInteractive aqui é crucial: ele "engole" os cliques, impedindo de clicar na HUD atrás

        // Verifica o estado global para determinar qual interface deve ser renderizada
        if (gameState.aguardandoEvolucao) {
            this.exibirPopupEvolucao();
        } else if (gameState.exibirQuiz) {
            this.mostrarQuiz();
        } else if (!gameState.instrucaoMissaoVista) {
            this.mostrarFicha();
        }

        // Gerencia o reposicionamento dos elementos visuais quando o tamanho da tela muda
        const handleResizePopups = (size) => {
            if (!this.scene.isActive() || !this.cameras || !this.cameras.main) return;

            const novaLargura = this.scale.width;
            const novaAltura = this.scale.height;
            const novoCentroX = novaLargura / 2;
            const novoCentroY = novaAltura / 2;

            // Redimensiona e centraliza o overlay escuro
            if (this.overlayEscuro && this.overlayEscuro.active) {
                this.overlayEscuro.setSize(novaLargura, novaAltura);
                this.overlayEscuro.setPosition(novoCentroX, novoCentroY);
            }

            // Atualiza a posição de imagens e textos ativos conforme o novo centro calculado
            if (this.imgEvolucao && this.imgEvolucao.active) this.imgEvolucao.setPosition(novoCentroX, novoCentroY);
            if (this.txtEvolucao && this.txtEvolucao.active) this.txtEvolucao.setPosition(novoCentroX, novoCentroY + 180);

            if (this.containerFicha && this.containerFicha.active) this.containerFicha.setPosition(novoCentroX, novoCentroY);
            if (this.txtContinuarFicha && this.txtContinuarFicha.active) this.txtContinuarFicha.setPosition(novoCentroX, novoCentroY + 200);
            
            // Resize do Quiz
            if (this.containerQuiz && this.containerQuiz.active) {
                this.containerQuiz.setPosition(novoCentroX, novoCentroY);
            }

            if (this.imgInstrucao && this.imgInstrucao.active) {
                this.imgInstrucao.setPosition(novoCentroX, novoCentroY);
                if (this.txtContinuarInstrucao && this.txtContinuarInstrucao.active) {
                    const novoPosicaoTextoY = novoCentroY + (this.imgInstrucao.displayHeight / 2) + 30;
                    this.txtContinuarInstrucao.setPosition(novoCentroX, novoPosicaoTextoY);
                }
            }

            if (this.imgInstrucaoFase2 && this.imgInstrucaoFase2.active) {
                this.imgInstrucaoFase2.setPosition(novoCentroX, novoCentroY);
                if (this.txtContinuarFase2 && this.txtContinuarFase2.active) {
                    const novoPosicaoTextoF2Y = novoCentroY + (this.imgInstrucaoFase2.displayHeight / 2) + 30;
                    this.txtContinuarFase2.setPosition(novoCentroX, novoPosicaoTextoF2Y);
                }
            }

            if (this.imgInstrucaoFase3 && this.imgInstrucaoFase3.active) {
                this.imgInstrucaoFase3.setPosition(novoCentroX, novoCentroY);
                if (this.txtContinuarFase3 && this.txtContinuarFase3.active) {
                    const novoPosicaoTextoF3Y = novoCentroY + (this.imgInstrucaoFase3.displayHeight / 2) + 30;
                    this.txtContinuarFase3.setPosition(novoCentroX, novoPosicaoTextoF3Y);
                }
            }

            if (this.imgFinal && this.imgFinal.active) this.imgFinal.setPosition(novoCentroX, novoCentroY);
            if (this.txtFinal && this.txtFinal.active) this.txtFinal.setPosition(novoCentroX, novoCentroY + 180);
        };

        // Armazena referência para limpeza correta
        this.handleResizePopups = handleResizePopups;
        this.scale.on("resize", handleResizePopups);
        
        this.events.on('shutdown', () => {
            this.scale.off("resize", this.handleResizePopups);
        });
    }

    // --- FUNÇÃO DE QUIZ COM FEEDBACK VISUAL ---
    mostrarQuiz() {
        // Limpa o container anterior se existir (para quando avançar a pergunta)
        if (this.containerQuiz) this.containerQuiz.destroy(); 
        if (this.containerFeedback) this.containerFeedback.destroy();
        if (this.feedbackText) this.feedbackText.destroy();
        this.exibindoFeedback = false;

        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        this.containerQuiz = this.add.container(centroX, centroY).setSize(800, 500);
        
        // Fundo do quiz
        const fundoQuiz = this.add.rectangle(0, 0, 800, 500, 0xf0e8bb).setOrigin(0.5);
        this.containerQuiz.add(fundoQuiz);
        
        // Indicador de progresso
        const progresso = `Pergunta ${this.quiz.indiceAtual + 1}/${this.quiz.perguntas.length}`;
        const txtProgresso = this.add.text(0, -220, progresso, {
            fontFamily: '"Press Start 2P"',
            fontSize: "12px",
            color: "#666666"
        }).setOrigin(0.5);
        this.containerQuiz.add(txtProgresso);

        const perguntaAtual = this.quiz.obterPerguntaAtual();
        
        // Texto da Pergunta
        const txtPergunta = this.add.text(0, -180, perguntaAtual.texto, {
            fontFamily: '"Press Start 2P", Arial',
            fontSize: "16px",
            color: "#000000",
            wordWrap: { width: 750 },
            align: "center",
            lineSpacing: 10
        }).setOrigin(0.5);
        this.containerQuiz.add(txtPergunta);

        // Armazena referências dos botões para desabilitar depois do feedback
        const botoesQuiz = [];

        // Gera os botões das opções
        perguntaAtual.opcoes.forEach((opcao, index) => {
            const posY = -60 + (index * 75);
            
            const btnFundo = this.add.rectangle(0, posY, 760, 65, 0xffffff)
                .setInteractive({ useHandCursor: true })
                .setStrokeStyle(2, 0x000000);
                
            const txtOpcao = this.add.text(0, posY, opcao, {
                fontFamily: 'Arial',
                fontSize: "15px",
                color: "#000000",
                wordWrap: { width: 740 },
                align: "left"
            }).setOrigin(0.5);

            this.containerQuiz.add([btnFundo, txtOpcao]);
            botoesQuiz.push({ btn: btnFundo, txt: txtOpcao, indice: index, correta: index === perguntaAtual.indiceCorreto });

            // Evento de Clique na Opção
            btnFundo.on('pointerdown', () => {
                if (this.exibindoFeedback) return; // Previne múltiplos cliques durante feedback
                
                this.exibindoFeedback = true;
                const acertou = this.quiz.responder(index);
                
                // Desabilita todos os botões e mostra feedback
                botoesQuiz.forEach(item => {
                    item.btn.disableInteractive();
                    item.btn.setStrokeStyle(2, 0x000000);
                    
                    if (item.correta) {
                        // Verde para resposta correta
                        item.btn.setFillStyle(0x90EE90);
                    } else if (item.indice === index && !acertou) {
                        // Vermelho para resposta errada selecionada
                        item.btn.setFillStyle(0xFF6B6B);
                    }
                });
                
                // Exibe feedback
                this.exibirFeedbackResposta(acertou, perguntaAtual.indiceCorreto);
                
                // Avança após 2 segundos
                this.time.delayedCall(2000, () => {
                    if (this.quiz.avancarPergunta()) {
                        this.mostrarQuiz();
                    } else {
                        this.exibirTelaResultados();
                    }
                });
            });
            
            // Efeitos visuais de Hover no botão
            btnFundo.on('pointerover', () => {
                if (!this.exibindoFeedback) btnFundo.setFillStyle(0xe0e0e0);
            });
            btnFundo.on('pointerout', () => {
                if (!this.exibindoFeedback) btnFundo.setFillStyle(0xffffff);
            });
        });
    }
    
    exibirFeedbackResposta(acertou, indiceCorreto) {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;
        
        const texto = acertou ? "✓ CORRETO!" : "✗ ERRADO!";
        const cor = acertou ? "#00AA00" : "#FF0000";
        
        this.feedbackText = this.add.text(centroX, centroY + 230, texto, {
            fontFamily: '"Press Start 2P"',
            fontSize: "24px",
            color: cor,
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: this.feedbackText,
            scale: { from: 0.8, to: 1.1 },
            duration: 200,
            yoyo: true
        });
    }
    
    exibirTelaResultados() {
        if (this.containerQuiz) this.containerQuiz.destroy();
        if (this.containerFeedback) this.containerFeedback.destroy();
        if (this.feedbackText) this.feedbackText.destroy();
        
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;
        const resultado = this.quiz.obterPontuacao();
        const percentual = Math.round((resultado.acertos / resultado.total) * 100);
        
        this.containerQuiz = this.add.container(centroX, centroY);
        
        const fundoResultado = this.add.rectangle(0, 0, 600, 450, 0xf0e8bb).setOrigin(0.5);
        this.containerQuiz.add(fundoResultado);
        
        const txtTitulo = this.add.text(0, -150, "RESULTADO FINAL", {
            fontFamily: '"Press Start 2P"',
            fontSize: "20px",
            color: "#000000"
        }).setOrigin(0.5);
        
        const txtScore = this.add.text(0, -60, `${resultado.acertos}/${resultado.total} acertos`, {
            fontFamily: '"Press Start 2P"',
            fontSize: "18px",
            color: "#000000"
        }).setOrigin(0.5);
        
        const txtPercentual = this.add.text(0, 20, `${percentual}%`, {
            fontFamily: '"Press Start 2P"',
            fontSize: "32px",
            color: percentual >= 70 ? "#00AA00" : "#FF6B6B"
        }).setOrigin(0.5);
        
        const txtContinuar = this.add.text(0, 130, "[ Clique para Continuar ]", {
            fontFamily: '"Press Start 2P"',
            fontSize: "12px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.containerQuiz.add([fundoResultado, txtTitulo, txtScore, txtPercentual, txtContinuar]);
        
        txtContinuar.on('pointerdown', () => {
            this.finalizarQuiz();
        });
        
        txtContinuar.on('pointerover', () => txtContinuar.setFill("#ffff00"));
        txtContinuar.on('pointerout', () => txtContinuar.setFill("#ffffff"));
    }

    finalizarQuiz() {
        if (this.containerQuiz) this.containerQuiz.destroy();
        if (this.containerFeedback) this.containerFeedback.destroy();
        if (this.feedbackText) this.feedbackText.destroy();
        
        gameState.exibirQuiz = false;
        
        // Verifica se estamos no fim do jogo para mostrar o popup final
        if (gameState.progressoCachorro === 2) {
            this.exibirPopupFinalJogo();
        } else {
            // Caso o quiz fosse jogado em outro momento, apenas fecha a tela
            this.scene.bringToTop("HUD");
            this.scene.stop();
        }
    }
    // ----------------------------

    exibirPopupEvolucao() {
        const centroX = this.scale.width / 2; 
        const centroY = this.scale.height / 2;

        let imagemConclusao = "";
        let textoEvolucao = "";

        if (gameState.progressoCachorro === 0) {
            imagemConclusao = "conclusaoPrimeiroRound";
            textoEvolucao = "[ Clique para Evoluir! ]";
        } else if (gameState.progressoCachorro === 1) {
            imagemConclusao = "conclusaoSegundoRound";
            textoEvolucao = "[ Clique para a Ultima Fase! ]";
        } else if (gameState.progressoCachorro === 2) {
            imagemConclusao = "conclusaoTerceiroRound";
            textoEvolucao = "[ Clique para Iniciar o Quiz Final ]";
        }

        this.imgEvolucao = this.add.image(centroX, centroY, imagemConclusao)
            .setScale(0.6)
            .setInteractive({ useHandCursor: true }); 
        
        this.txtEvolucao = this.add.text(centroX, centroY + 180, textoEvolucao, {
            fontFamily: '"Press Start 2P"', 
            fontSize: "16px", 
            fill: "#ffffff"
        }).setOrigin(0.5);

        this.imgEvolucao.on('pointerdown', () => {
            gameState.aguardandoEvolucao = false;

            // SE FOR O FIM DO 3º ROUND, CHAMA O QUIZ EM VEZ DE ACABAR O JOGO
            if (gameState.progressoCachorro === 2) {
                this.imgEvolucao.destroy();
                this.txtEvolucao.destroy();
                
                // CORREÇÃO: Resetamos as barras para que o verificarCompletude não seja 
                // acionado repetidamente em segundo plano, travando a Cena Principal!
                gameState.barras = { comida: 11, lazer: 11, limpeza: 11, saude: 11 };
                
                gameState.exibirQuiz = true;
                this.mostrarQuiz();
                return;
            }

            gameState.pulga = true;

            if (gameState.progressoCachorro === 0) {
                gameState.barras = { comida: 11, lazer: 11, limpeza: 11, saude: 11 };
                gameState.pets.cachorroCaramelo = false;
                gameState.pets.cachorroHeroi = true;
                gameState.pets.cachorroJoao = false;
                gameState.progressoCachorro = 1;

                this.imgEvolucao.destroy();
                this.txtEvolucao.destroy();
                this.mostrarInstrucaoSegundaFase();

            } else if (gameState.progressoCachorro === 1) {
                // João inicia com comida, limpeza e saúde cheias; lazer vazia.
                gameState.barras = { comida: 0, lazer: 11, limpeza: 0, saude: 0 };
                gameState.pets.cachorroCaramelo = false;
                gameState.pets.cachorroHeroi = false;
                gameState.pets.cachorroJoao = true;
                gameState.progressoCachorro = 2;

                this.imgEvolucao.destroy();
                this.txtEvolucao.destroy();
                this.mostrarInstrucaoTerceiraFase();
                return;
            }
        });
    }

    // NOVA FUNÇÃO: Tela de conclusão do jogo após o Quiz
    exibirPopupFinalJogo() {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        // Ajuste o nome da imagem aqui para a que representa o final real do jogo
        this.imgFinal = this.add.image(centroX, centroY, "final") 
            .setScale(1)
            .setInteractive({ useHandCursor: true }); 

        this.imgFinal.on('pointerdown', () => {
            this.imgFinal.destroy();
            this.txtFinal.destroy();
            
            // Reseta as variáveis globais para o começo do jogo
            gameState.progressoCachorro = 0;
            gameState.pets = { cachorroCaramelo: true, cachorroHeroi: false, cachorroJoao: false };
            gameState.instrucaoMissaoVista = false;
            gameState.barras = { comida: 11, lazer: 11, limpeza: 11, saude: 11 };
            
            this.scene.stop("HUD");
            this.scene.stop();
            this.scene.get("cenaPrincipal").scene.start("cenaInicial");
        });
    }

    mostrarInstrucaoSegundaFase() {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        this.imgInstrucaoFase2 = this.add.image(centroX, centroY, "instrucaoSegundaFase")
            .setScale(0.5)
            .setInteractive({ useHandCursor: true }); 

        this.txtContinuarFase2 = this.add.text(centroX, centroY + (this.imgInstrucaoFase2.displayHeight / 2) + 30, "[ Clique para comecar a 2a Fase ]", {
            fontFamily: '"Press Start 2P"', fontSize: "15px", color: "#ffffff", stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5);

        this.imgInstrucaoFase2.on("pointerdown", () => {
            this.imgInstrucaoFase2.destroy();
            this.txtContinuarFase2.destroy();
            
            this.scene.bringToTop("HUD");
            this.scene.stop();
            this.scene.get("cenaPrincipal").scene.restart();
        });
    }

    mostrarInstrucaoTerceiraFase() {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        this.imgInstrucaoFase3 = this.add.image(centroX, centroY, "instrucaoTerceiroRound")
            .setScale(0.5)
            .setInteractive({ useHandCursor: true }); 

        this.txtContinuarFase3 = this.add.text(centroX, centroY + (this.imgInstrucaoFase3.displayHeight / 2) + 30, "[ Clique para comecar a 3a Fase ]", {
            fontFamily: '"Press Start 2P"', fontSize: "15px", color: "#ffffff", stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5);

        this.imgInstrucaoFase3.on("pointerdown", () => {
            this.imgInstrucaoFase3.destroy();
            this.txtContinuarFase3.destroy();
            
            this.scene.bringToTop("HUD");
            this.scene.stop();
            this.scene.get("cenaPrincipal").scene.restart();
        });
    }

    mostrarFicha() {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        const pet = cachorrosBase[gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0)];
        
        this.containerFicha = this.add.container(centroX, centroY)
            .setSize(500, 350) 
            .setInteractive({ useHandCursor: true }); 

        const fundoFicha = this.add.rectangle(0, 0, 500, 350, 0xf0e8bb).setOrigin(0.5);
        const estiloPixel = { fontFamily: '"Press Start 2P", Arial', fontSize: "14px", color: "#000000" };

        this.containerFicha.add([
            fundoFicha,
            this.add.text(-220, -120, `Ficha do Animal`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, -80, `Nome: ${pet.nome}`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, -40, `Peso: ${pet.peso}`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, 0, `Idade: ${pet.idade}`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, 40, `Porte: ${pet.porte}`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, 80, `Estado: ${pet.estado}`, estiloPixel).setOrigin(0, 0.5),
            this.add.text(-220, 120, `História: ${pet.historia}`, { ...estiloPixel, align: "left", wordWrap: { width: 420 } }).setOrigin(0, 0)
        ]);

        this.txtContinuarFicha = this.add.text(centroX, centroY + 200, "[ Clique para continuar ]", {
            fontFamily: '"Press Start 2P"', fontSize: "15px", color: "#ffffff", stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5);

        this.containerFicha.on("pointerdown", () => {
            this.containerFicha.destroy();
            this.txtContinuarFicha.destroy();
            this.mostrarInstrucao(); 
        });
    }

    mostrarInstrucao() {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoMissao")
            .setScale(0.5)
            .setInteractive({ useHandCursor: true }); 

        this.txtContinuarInstrucao = this.add.text(centroX, centroY + (this.imgInstrucao.displayHeight / 2) + 30, "[ Clique para comecar ]", {
            fontFamily: '"Press Start 2P"', fontSize: "15px", color: "#ffffff", stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5);

        this.imgInstrucao.on("pointerdown", () => {
            this.imgInstrucao.destroy();
            this.txtContinuarInstrucao.destroy();
            gameState.instrucaoMissaoVista = true;

            this.scene.bringToTop("HUD");
            this.scene.stop();
        });
    }
}

// Cena central do jogo que integra o cenário, o pet e chama as interfaces acessórias
export class cenaPrincipal extends Phaser.Scene {
    constructor() {
        super({ key: "cenaPrincipal" })
    }

    create() {
        // Inicializa a interface de status hud e a coloca em primeiro plano
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD")
        }
        this.scene.bringToTop("HUD")

        if (gameState.musicaLigada) {
            iniciarMusica(this, 'menuPrincipal', true);
        }

        // Registra e ativa a cena de popups
        if (!this.scene.get("CenaPopups")) {
            this.scene.add("CenaPopups", CenaPopups, false);
        }
        
        // Verifica também se é hora de exibir o quiz
        if (gameState.aguardandoEvolucao || !gameState.instrucaoMissaoVista || gameState.exibirQuiz) {
            if (!this.scene.isActive("CenaPopups")) {
                this.scene.launch("CenaPopups");
            }
            this.scene.bringToTop("CenaPopups");
        }



        // Configuração inicial do cenário respeitando a área útil de oitenta por cento da largura
        const larguraTotal = this.scale.width;
        const alturaTotal = this.scale.height;
        const areaUtilLargura = larguraTotal * 0.8; 

        this.bg = this.add
            .image(areaUtilLargura / 2, alturaTotal / 2, "bgPrincipal")
            .setDisplaySize(areaUtilLargura, alturaTotal)
            .setDepth(-1);

        // Instancia o cachorro dinamicamente
        this.gerenciadorCachorros = new GerenciadorCachorros(this)
        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0)
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo])

        // Criação e configuração da animação cíclica das pulgas
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 2,
                repeat: -1
            })
        }

        this.pulgas = this.add.sprite(0, 0, "pulgas")
            .setOrigin(0.5)
            .setScale(alturaTotal * 0.0015) 
            .play("pulgaAnim")
            .setVisible(gameState.pulga);

        // Agrupa o cachorro e as pulgas em um container
        this.containerCachorro = this.add.container(areaUtilLargura / 2, alturaTotal * 0.7, [
            this.cachorro.sprite, 
            this.pulgas
        ]);

        const escalaBase = alturaTotal * 0.0006;
        this.containerCachorro.setScale(escalaBase);

        // Lógica de redimensionamento
        const handleResizePrincipal = () => {
            if (!this.scene.isActive() || !this.cameras || !this.cameras.main) return;

            const novaLargura = this.scale.width;
            const novaAltura = this.scale.height;
            const novaAreaUtilLargura = novaLargura * 0.8;
            const novoCentroX = novaAreaUtilLargura / 2;
            const novoCentroY = novaAltura / 2;

            if (this.bg) {
                this.bg.setPosition(novoCentroX, novoCentroY).setDisplaySize(novaAreaUtilLargura, novaAltura);
            }

            if (this.containerCachorro) {
                const novaEscala = novaAltura * 0.0006;
                this.containerCachorro.setPosition(novoCentroX, novaAltura * 0.7).setScale(novaEscala);
            }
        };

        this.scale.on("resize", handleResizePrincipal);
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizePrincipal);
        });

        this.cameras.main.setBounds(0, 0, larguraTotal, alturaTotal);
        this.cameras.main.fadeIn(200, 0, 0, 0);
    }

    update() {
        if (this.gerenciadorCachorros) {
            this.gerenciadorCachorros.verificarCompletude()
        }
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga)
        }
    }
}