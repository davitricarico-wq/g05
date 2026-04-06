// Importa o estado global do jogo
import { gameState } from "../main.js"
// Importa as dependências para gestão e dados dos animais
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js"
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js"

// Cena responsável por gerenciar e exibir interfaces sobrepostas como fichas e evoluções
class CenaPopups extends Phaser.Scene {
    constructor() {
        super({ key: "CenaPopups" });
    }

    create() {
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
        } else if (!gameState.instrucaoMissaoVista) {
            this.mostrarFicha();
        }

        // Gerencia o reposicionamento dos elementos visuais quando o tamanho da tela muda
        const handleResizePopups = () => {
            if (!this.scene.isActive() || !this.cameras || !this.cameras.main) return;

            const novaLargura = this.scale.width;
            const novaAltura = this.scale.height;
            // Agora centralizamos na tela TODA, já que o popup cobre a HUD também
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
            
            if (this.imgInstrucao && this.imgInstrucao.active) {
                this.imgInstrucao.setPosition(novoCentroX, novoCentroY);
                if (this.txtContinuarInstrucao && this.txtContinuarInstrucao.active) {
                    const novoPosicaoTextoY = novoCentroY + (this.imgInstrucao.displayHeight / 2) + 30;
                    this.txtContinuarInstrucao.setPosition(novoCentroX, novoPosicaoTextoY);
                }
            }

            // Resize do novo popup da Fase 2
            if (this.imgInstrucaoFase2 && this.imgInstrucaoFase2.active) {
                this.imgInstrucaoFase2.setPosition(novoCentroX, novoCentroY);
                if (this.txtContinuarFase2 && this.txtContinuarFase2.active) {
                    const novoPosicaoTextoF2Y = novoCentroY + (this.imgInstrucaoFase2.displayHeight / 2) + 30;
                    this.txtContinuarFase2.setPosition(novoCentroX, novoPosicaoTextoF2Y);
                }
            }
        };

        // Adiciona o ouvinte de redimensionamento e garante sua remoção ao encerrar a cena
        this.scale.on("resize", handleResizePopups);
        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizePopups);
        });
    }

    // Cria a interface visual que indica a mudança de nível do animal
    exibirPopupEvolucao() {
        const centroX = this.scale.width / 2; // Centralizado em 100% da tela
        const centroY = this.scale.height / 2;

        this.imgEvolucao = this.add.image(centroX, centroY, "conclusaoPrimeiroRound")
            .setScale(0.6)
            .setInteractive({ useHandCursor: true }); 
        
        this.txtEvolucao = this.add.text(centroX, centroY + 180, "[ Clique para Evoluir! ]", {
            fontFamily: '"Press Start 2P"', 
            fontSize: "16px", 
            fill: "#ffffff"
        }).setOrigin(0.5);

        // Atualiza os dados do pet para a nova fase e avança
        this.imgEvolucao.on('pointerdown', () => {
            gameState.aguardandoEvolucao = false;
            gameState.pulga = true;

            if (gameState.progressoCachorro === 0) {
                gameState.barras = { comida: 11, lazer: 11, limpeza: 11, saude: 11 };
                gameState.pets.cachorroCaramelo = false;
                gameState.pets.cachorroHeroi = true;
                gameState.pets.cachorroJoao = false;
                gameState.progressoCachorro = 1;
            } else if (gameState.progressoCachorro === 1) {
                gameState.barras = { comida: 11, lazer: 0, limpeza: 11, saude: 11 };
                gameState.pets.cachorroCaramelo = false;
                gameState.pets.cachorroHeroi = false;
                gameState.pets.cachorroJoao = true;
                gameState.progressoCachorro = 2;
            }

            // Destrói os elementos atuais e mostra o próximo popup
            this.imgEvolucao.destroy();
            this.txtEvolucao.destroy();
            this.mostrarInstrucaoSegundaFase();
        });
    }

    // Função que mostra a instrução da Segunda Fase
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
            
            // Devolve a HUD para o topo antes de fechar a cena
            this.scene.bringToTop("HUD");

            // Para a cena de popups e reinicia a cena principal
            this.scene.stop();
            this.scene.get("cenaPrincipal").scene.restart();
        });
    }

    // Monta o container com as informações biográficas do animal ativo
    mostrarFicha() {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        const pet = cachorrosBase[gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0)];
        
        this.containerFicha = this.add.container(centroX, centroY)
            .setSize(500, 350) 
            .setInteractive({ useHandCursor: true }); 

        const fundoFicha = this.add.rectangle(0, 0, 500, 350, 0xf0e8bb).setOrigin(0.5);
        const estiloPixel = { fontFamily: '"Press Start 2P", Arial', fontSize: "14px", color: "#000000" };

        // Adiciona textos informativos ao container da ficha
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

        // Ao clicar, destrói a ficha e avança para as instruções da missão
        this.containerFicha.on("pointerdown", () => {
            this.containerFicha.destroy();
            this.txtContinuarFicha.destroy();
            this.mostrarInstrucao(); 
        });
    }

    // Exibe a imagem explicativa sobre os objetivos da missão atual
    mostrarInstrucao() {
        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        this.imgInstrucao = this.add.image(centroX, centroY, "instrucaoMissao")
            .setScale(0.5)
            .setInteractive({ useHandCursor: true }); 

        this.txtContinuarInstrucao = this.add.text(centroX, centroY + (this.imgInstrucao.displayHeight / 2) + 30, "[ Clique para comecar ]", {
            fontFamily: '"Press Start 2P"', fontSize: "15px", color: "#ffffff", stroke: "#000000", strokeThickness: 4
        }).setOrigin(0.5);

        // Finaliza o fluxo de popups e libera o controle para a cena principal
        this.imgInstrucao.on("pointerdown", () => {
            this.imgInstrucao.destroy();
            this.txtContinuarInstrucao.destroy();
            gameState.instrucaoMissaoVista = true;

            // Devolve a HUD para o topo antes de fechar a cena
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

        // Registra e ativa a cena de popups se houver necessidade de evoluir ou ler instruções
        if (!this.scene.get("CenaPopups")) {
            this.scene.add("CenaPopups", CenaPopups, false);
        }
        
        if (gameState.aguardandoEvolucao || !gameState.instrucaoMissaoVista) {
            if (!this.scene.isActive("CenaPopups")) {
                this.scene.launch("CenaPopups");
            }
            this.scene.bringToTop("CenaPopups");
        }

        // Controle da música de fundo garantindo a transição correta entre menus
        if (!gameState.musicaMenuPrincipal) {
            gameState.musicaMenuPrincipal = this.sound.add("musicaMenuPrincipal", { loop: true, volume: 0.5 })
        }
        if (gameState.musicaTutorial?.isPlaying) {
            gameState.musicaTutorial.stop();
        }
        if (!gameState.musicaMenuPrincipal.isPlaying) {
            gameState.musicaMenuPrincipal.play()
        }
        gameState.musica = gameState.musicaMenuPrincipal;

        // Configuração inicial do cenário respeitando a área útil de oitenta por cento da largura
        const larguraTotal = this.scale.width;
        const alturaTotal = this.scale.height;
        const areaUtilLargura = larguraTotal * 0.8; 

        this.bg = this.add
            .image(areaUtilLargura / 2, alturaTotal / 2, "bgPrincipal")
            .setDisplaySize(areaUtilLargura, alturaTotal)
            .setDepth(-1);

        // Instancia o cachorro dinamicamente conforme o índice ativo no estado do jogo
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

        // Agrupa o cachorro e as pulgas em um container para manipulação conjunta
        this.containerCachorro = this.add.container(areaUtilLargura / 2, alturaTotal * 0.7, [
            this.cachorro.sprite, 
            this.pulgas
        ]);

        const escalaBase = alturaTotal * 0.0006;
        this.containerCachorro.setScale(escalaBase);

        // Lógica de redimensionamento para manter o cenário e o pet centralizados na área útil
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

        // Configuração de câmera com efeito de transição inicial
        this.cameras.main.setBounds(0, 0, larguraTotal, alturaTotal);
        this.cameras.main.fadeIn(200, 0, 0, 0);
    }

    update() {
        // Verifica constantemente se os objetivos do cachorro foram atingidos e atualiza o estado das pulgas
        if (this.gerenciadorCachorros) {
            this.gerenciadorCachorros.verificarCompletude()
        }
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga)
        }
    }
}