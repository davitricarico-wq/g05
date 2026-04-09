// Importa o estado global (para ler/gravar progresso), o motor de perguntas 
// do quiz e o banco de dados com as informações dos cachorros.
import { gameState } from "../main.js";
import { GerenciadorQuiz } from "./gerenciadorQuiz.js";
import { cachorrosBase } from "./controleCachorro/cachorrosBase.js";

/**
 * @class CenaPopups
 * @extends Phaser.Scene
 * @description Cena dedicada a gerenciar telas de aviso, transição de fases, 
 * instruções e o sistema de Quiz. Funciona como uma camada superior (overlay).
 */
export class CenaPopups extends Phaser.Scene {
    constructor() {
        super({ key: "CenaPopups" });
    }

    create() {
        // Inicializa o gerenciador de quiz e reseta o progresso dele
        this.quiz = new GerenciadorQuiz();
        this.quiz.reiniciar();
        
        // Flag para evitar que o jogador clique várias vezes na resposta
        this.exibindoFeedback = false; 
        
        // Garante que esta cena fique desenhada por cima de todas as outras (HUD, Principal, etc.)
        this.scene.bringToTop();

        // Pega as coordenadas centrais da tela atual
        const telaCentroX = this.scale.width / 2;
        const telaCentroY = this.scale.height / 2;

        // Cria um fundo escuro semi-transparente (alpha 0.7) que cobre toda a tela.
        this.overlayEscuro = this.add.rectangle(telaCentroX, telaCentroY, this.scale.width, this.scale.height, 0x000000, 0.7)
            .setInteractive();

        // DIRECIONAMENTO DE FLUXO: Verifica o estado global para decidir qual popup exibir
        if (gameState.aguardandoEvolucao) {
            // O pet completou as missões e precisa crescer/mudar de fase
            this.exibirPopupEvolucao();
        } else if (gameState.exibirQuiz) {
            // É hora de responder ao questionário educativo
            this.mostrarQuiz();
        } else if (!gameState.instrucaoMissaoVista) {
            // É a primeira vez do jogador, mostra a ficha do animal e regras
            this.mostrarFicha();
        }

        // caso o jogador mude o tamanho da janela do navegador ou gire o celular.
        const handleResizePopups = (size) => {
            // Trava de segurança para evitar erros se a cena já foi destruída
            if (!this.scene.isActive() || !this.cameras || !this.cameras.main) return;

            const novaLargura = this.scale.width;
            const novaAltura = this.scale.height;
            const novoCentroX = novaLargura / 2;
            const novoCentroY = novaAltura / 2;

            // Ajusta o fundo escuro
            if (this.overlayEscuro && this.overlayEscuro.active) {
                this.overlayEscuro.setSize(novaLargura, novaAltura);
                this.overlayEscuro.setPosition(novoCentroX, novoCentroY);
            }

            // Reposiciona dinamicamente cada elemento possível caso ele esteja ativo na tela
            if (this.imgEvolucao && this.imgEvolucao.active) this.imgEvolucao.setPosition(novoCentroX, novoCentroY);
            if (this.txtEvolucao && this.txtEvolucao.active) this.txtEvolucao.setPosition(novoCentroX, novoCentroY + 180);
            if (this.containerFicha && this.containerFicha.active) this.containerFicha.setPosition(novoCentroX, novoCentroY);
            if (this.txtContinuarFicha && this.txtContinuarFicha.active) this.txtContinuarFicha.setPosition(novoCentroX, novoCentroY + 200);
            if (this.containerQuiz && this.containerQuiz.active) this.containerQuiz.setPosition(novoCentroX, novoCentroY);
            
            // Reposiciona imagens de instrução e seus respectivos textos de botão
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

        // Salva a referência da função e adiciona o ouvinte de evento
        this.handleResizePopups = handleResizePopups;
        this.scale.on("resize", handleResizePopups);

        // Limpeza de memória: remove o evento de resize quando a cena for fechada
        this.events.on('shutdown', () => {
            this.scale.off("resize", this.handleResizePopups);
        });
    }
    
    /**
     * @method mostrarQuiz
     * @description Monta a interface da pergunta atual do quiz usando Containers do Phaser.
     */
    mostrarQuiz() {
        // Limpa instâncias antigas para não encavalar elementos na tela
        if (this.containerQuiz) this.containerQuiz.destroy();
        if (this.containerFeedback) this.containerFeedback.destroy();
        if (this.feedbackText) this.feedbackText.destroy();
        this.exibindoFeedback = false;

        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        // Container agrupa vários objetos visuais. Se mover o container, move tudo junto.
        this.containerQuiz = this.add.container(centroX, centroY).setSize(800, 500);
        const fundoQuiz = this.add.rectangle(0, 0, 800, 500, 0xf0e8bb).setOrigin(0.5);
        this.containerQuiz.add(fundoQuiz);

        // Texto indicando o progresso (ex: Pergunta 1/5)
        const progresso = `Pergunta ${this.quiz.indiceAtual + 1}/${this.quiz.perguntas.length}`;
        const txtProgresso = this.add.text(0, -220, progresso, {
            fontFamily: '"Press Start 2P"', fontSize: "12px", color: "#666666"
        }).setOrigin(0.5);
        this.containerQuiz.add(txtProgresso);

        // Puxa a pergunta atual da classe GerenciadorQuiz
        const perguntaAtual = this.quiz.obterPerguntaAtual();
        const txtPergunta = this.add.text(0, -180, perguntaAtual.texto, {
            fontFamily: '"Press Start 2P", Arial', fontSize: "16px", color: "#000000",
            wordWrap: { width: 750 }, align: "center", lineSpacing: 10
        }).setOrigin(0.5);
        this.containerQuiz.add(txtPergunta);

        // Cria os botões dinamicamente com base nas opções da pergunta
        const botoesQuiz = [];
        perguntaAtual.opcoes.forEach((opcao, index) => {
            const posY = -60 + (index * 75);
            const btnFundo = this.add.rectangle(0, posY, 760, 65, 0xffffff)
                .setInteractive({ useHandCursor: true })
                .setStrokeStyle(2, 0x000000); // Borda preta
            const txtOpcao = this.add.text(0, posY, opcao, {
                fontFamily: 'Arial', fontSize: "15px", color: "#000000",
                wordWrap: { width: 740 }, align: "left"
            }).setOrigin(0.5);

            this.containerQuiz.add([btnFundo, txtOpcao]);
            botoesQuiz.push({ btn: btnFundo, txt: txtOpcao, indice: index, correta: index === perguntaAtual.indiceCorreto });

            // Lógica de clique na opção do quiz
            btnFundo.on('pointerdown', () => {
                if (this.exibindoFeedback) return; // Evita duplos cliques
                this.exibindoFeedback = true;
                
                // Valida a resposta no gerenciador
                const acertou = this.quiz.responder(index);

                // Feedback visual imediato nos botões
                botoesQuiz.forEach(item => {
                    item.btn.disableInteractive(); // Bloqueia todos os botões
                    item.btn.setStrokeStyle(2, 0x000000);
                    if (item.correta) {
                        item.btn.setFillStyle(0x90EE90); // Pinta a certa de verde
                    } else if (item.indice === index && !acertou) {
                        item.btn.setFillStyle(0xFF6B6B); // Pinta a errada clicada de vermelho
                    }
                });

                // Mostra o texto animado de "Correto" ou "Errado"
                this.exibirFeedbackResposta(acertou, perguntaAtual.indiceCorreto);
                
                // Espera 2 segundos (2000ms) para avançar a tela
                this.time.delayedCall(2000, () => {
                    if (this.quiz.avancarPergunta()) {
                        this.mostrarQuiz(); // Vai para próxima pergunta
                    } else {
                        this.exibirTelaResultados(); // Fim do quiz
                    }
                });
            });

            // Efeitos de Hover (Mouse por cima)
            btnFundo.on('pointerover', () => {
                if (!this.exibindoFeedback) btnFundo.setFillStyle(0xe0e0e0);
            });
            btnFundo.on('pointerout', () => {
                if (!this.exibindoFeedback) btnFundo.setFillStyle(0xffffff);
            });
        });
    }

    /**
     * @method exibirFeedbackResposta
     * @description Exibe uma mensagem de texto (Certo/Errado) com uma pequena animação.
     */
    exibirFeedbackResposta(acertou, indiceCorreto) {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;
        const texto = acertou ? "✓ CORRETO!" : "✗ ERRADO!";
        const cor = acertou ? "#00AA00" : "#FF0000";

        this.feedbackText = this.add.text(centroX, centroY + 230, texto, {
            fontFamily: '"Press Start 2P"', fontSize: "24px", color: cor,
            stroke: "#000000", strokeThickness: 3
        }).setOrigin(0.5);

        // Tween: Cria uma animação de "pulsação" no texto (escala vai de 0.8 a 1.1 e volta)
        this.tweens.add({
            targets: this.feedbackText,
            scale: { from: 0.8, to: 1.1 },
            duration: 200,
            yoyo: true // Retorna ao tamanho original
        });
    }

    /**
     * @method exibirTelaResultados
     * @description Exibe a pontuação final do jogador após responder todas as perguntas.
     */
    exibirTelaResultados() {
        // Limpeza visual
        if (this.containerQuiz) this.containerQuiz.destroy();
        if (this.containerFeedback) this.containerFeedback.destroy();
        if (this.feedbackText) this.feedbackText.destroy();

        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;
        
        // Cálculos matemáticos
        const resultado = this.quiz.obterPontuacao();
        const percentual = Math.round((resultado.acertos / resultado.total) * 100);

        // Montagem do Container de Resultado
        this.containerQuiz = this.add.container(centroX, centroY);
        const fundoResultado = this.add.rectangle(0, 0, 600, 450, 0xf0e8bb).setOrigin(0.5);
        const txtTitulo = this.add.text(0, -150, "RESULTADO FINAL", {
            fontFamily: '"Press Start 2P"', fontSize: "20px", color: "#000000"
        }).setOrigin(0.5);
        const txtScore = this.add.text(0, -60, `${resultado.acertos}/${resultado.total} acertos`, {
            fontFamily: '"Press Start 2P"', fontSize: "18px", color: "#000000"
        }).setOrigin(0.5);
        
        // Cor do percentual muda dependendo da nota (Verde para >= 70%, Vermelho para < 70%)
        const txtPercentual = this.add.text(0, 20, `${percentual}%`, {
            fontFamily: '"Press Start 2P"', fontSize: "32px",
            color: percentual >= 70 ? "#00AA00" : "#FF6B6B"
        }).setOrigin(0.5);
        
        const txtContinuar = this.add.text(0, 130, "[ Clique para Continuar ]", {
            fontFamily: '"Press Start 2P"', fontSize: "12px", color: "#ffffff",
            stroke: "#000000", strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.containerQuiz.add([fundoResultado, txtTitulo, txtScore, txtPercentual, txtContinuar]);
        
        // Lógica de saída do Quiz
        txtContinuar.on('pointerdown', () => {
            this.finalizarQuiz();
        });
        txtContinuar.on('pointerover', () => txtContinuar.setFill("#ffff00"));
        txtContinuar.on('pointerout', () => txtContinuar.setFill("#ffffff"));
    }

    /**
     * @method finalizarQuiz
     * @description Desmonta o quiz e decide se volta para o jogo ou vai para a tela de zeramento.
     */
    finalizarQuiz() {
        if (this.containerQuiz) this.containerQuiz.destroy();
        if (this.containerFeedback) this.containerFeedback.destroy();
        if (this.feedbackText) this.feedbackText.destroy();

        gameState.exibirQuiz = false;

        // Se estava no último estágio (Cachorro Sênior/João), significa que o jogo acabou.
        if (gameState.progressoCachorro === 2) {
            this.exibirPopupFinalJogo();
        } else {
            // Caso contrário, apenas fecha o popup e foca de volta no HUD e cena principal
            this.scene.bringToTop("HUD");
            this.scene.stop();
        }
    }

    /**
     * @method exibirPopupEvolucao
     * @description Mostra a mensagem de fim de fase (Round) e processa a passagem do tempo
     * do cachorro (Filhote -> Adulto -> Sênior) ajustando as variáveis no 'gameState'.
     */
    exibirPopupEvolucao() {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;
        let imagemConclusao = "";
        let textoEvolucao = "";

        // Determina qual placa de conclusão exibir com base no progresso atual
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
            fontFamily: '"Press Start 2P"', fontSize: "16px", fill: "#ffffff"
        }).setOrigin(0.5);

        // Ao clicar no botão de evoluir:
        this.imgEvolucao.on('pointerdown', () => {
            gameState.aguardandoEvolucao = false;
            
            // Lida com o Fim de Jogo (Chama o quiz final em vez de evoluir)
            if (gameState.progressoCachorro === 2) {
                this.imgEvolucao.destroy();
                this.txtEvolucao.destroy();
                gameState.barras = { comida: 11, lazer: 11, limpeza: 11, saude: 11 };
                gameState.exibirQuiz = true;
                this.mostrarQuiz();
                return;
            }

            // Lógica Padrão de Evolução (Troca de Fase)
            // NOTA: João (fase 2) não deve ter pulga
            if (gameState.progressoCachorro === 0) {
                // Passagem Filhote -> Adulto (Herói)
                gameState.pulga = true; // Herói tem pulga para o minigame de veterinário
                gameState.barras = { comida: 11, lazer: 11, limpeza: 11, saude: 11 };
                gameState.pets.cachorroCaramelo = false;
                gameState.pets.cachorroHeroi = true;  // Ativa cachorro Herói
                gameState.pets.cachorroJoao = false;
                gameState.progressoCachorro = 1;      // Atualiza progresso
                this.imgEvolucao.destroy();
                this.txtEvolucao.destroy();
                this.mostrarInstrucaoSegundaFase();
                
            } else if (gameState.progressoCachorro === 1) {
                // Passagem Adulto -> Sênior (João)
                // João descarta a pulga (está limpo e saudável)
                gameState.pulga = false;
                // Zera comida, limpeza e saúde para o jogador correr atrás de cuidar (dificuldade)
                gameState.barras = { comida: 0, lazer: 11, limpeza: 0, saude: 0 };
                gameState.pets.cachorroCaramelo = false;
                gameState.pets.cachorroHeroi = false;
                gameState.pets.cachorroJoao = true;   // Ativa cachorro João
                gameState.progressoCachorro = 2;
                this.imgEvolucao.destroy();
                this.txtEvolucao.destroy();
                this.mostrarInstrucaoTerceiraFase();
                return;
            }
        });
    }

    /**
     * @method exibirPopupFinalJogo
     * @description Tela de "Parabéns por zerar". Limpa o estado global e reinicia o loop do jogo.
     */
    exibirPopupFinalJogo() {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        this.imgFinal = this.add.image(centroX, centroY, "final")
            .setScale(1)
            .setInteractive({ useHandCursor: true });

        // Hard Reset do jogo
        this.imgFinal.on('pointerdown', () => {
            this.imgFinal.destroy();
            if (this.txtFinal) this.txtFinal.destroy(); // Proteção anti-bug
            
            // Reseta todas as variáveis globais para o estado inicial
            gameState.progressoCachorro = 0;
            gameState.pets = { cachorroCaramelo: true, cachorroHeroi: false, cachorroJoao: false };
            gameState.instrucaoMissaoVista = false;
            gameState.exibirQuiz = false;
            gameState.aguardandoEvolucao = false;
            gameState.pulga = true;
            gameState.barras = { comida: 11, lazer: 11, limpeza: 11, saude: 11 };
            
            // Para todas as cenas em execução
            this.scene.stop("HUD");
            this.scene.stop("cenaPrincipal");
            this.scene.stop();
            
            // Inicia a tela inicial
            this.scene.start("cenaInicial");
        });
    }
    
    // Mostra placa instruindo sobre a segunda fase (Adulto)
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
            // Dá um restart na cena principal para carregar os sprites do novo cachorro
            this.scene.get("cenaPrincipal").scene.restart();
        });
    }

    // Mostra placa instruindo sobre a terceira fase (Sênior)
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
            this.scene.get("cenaPrincipal").scene.restart(); // Reinicia com o cachorro Sênior
        });
    }

    /**
     * @method mostrarFicha
     * @description Exibe os dados técnicos (Lore/História e Status) do cachorro atual lendo do arquivo externo.
     */
    mostrarFicha() {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;
        
        // Lógica Ternária para selecionar do array: se é o João usa index 2, se herói 1, senão 0.
        const pet = cachorrosBase[gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0)];

        this.containerFicha = this.add.container(centroX, centroY)
            .setSize(500, 350)
            .setInteractive({ useHandCursor: true });

        const fundoFicha = this.add.rectangle(0, 0, 500, 350, 0xf0e8bb).setOrigin(0.5);
        const estiloPixel = { fontFamily: '"Press Start 2P", Arial', fontSize: "14px", color: "#000000" };

        // Preenche os textos puxando as chaves dinâmicas do objeto 'pet'
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
            // Ao invés de ir para o jogo direto, manda para a instrução inicial
            this.mostrarInstrucao();
        });
    }

    /**
     * @method mostrarInstrucao
     * @description Mostra a missão inicial do jogo após o fechamento da ficha do pet.
     */
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
            
            // Marca flag para não mostrar ficha/instrução novamente neste gameplay
            gameState.instrucaoMissaoVista = true; 
            
            // Destrói esta cena Overlay e libera o jogador na tela principal
            this.scene.bringToTop("HUD");
            this.scene.stop();
        });
    }
}