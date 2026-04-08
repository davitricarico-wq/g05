// Importação do estado global para persistência de dados (moedas, saúde, progresso)
import { gameState } from "../main.js";
// Imports do sistema de cachorro
import { GerenciadorCachorros } from "../componentes/controleCachorro/gerenciadorCachorros.js";
import { cachorrosBase } from "../componentes/controleCachorro/cachorrosBase.js";

export class cenaLazer extends Phaser.Scene {
    constructor() {
        super({ key: "cenaLazer" });
    }

    create() {
        // inicializa a hud caso ela não esteja ativa e garante que fique no topo
        if (!this.scene.isActive("HUD")) {
            this.scene.launch("HUD");
        }
        this.scene.bringToTop("HUD");

        // define as dimensões e proporções baseadas na escala da tela
        const largura = this.scale.width;
        const altura = this.scale.height;
        const posicaoX = largura - largura * 0.2;
        const posicaoY = altura;

        // adiciona a imagem de fundo da cena
        this.fundo = this.add.image(posicaoX / 2, posicaoY / 2, "bgLazer")
            .setDisplaySize(posicaoX, posicaoY);
   
        // inicializa o gerenciador e cria o pet na origem para o container
        this.gerenciadorCachorros = new GerenciadorCachorros(this);
        const indiceAtivo = gameState.pets.cachorroJoao ? 2 : (gameState.pets.cachorroHeroi ? 1 : 0)
        this.cachorro = this.gerenciadorCachorros.criarCachorro(0, 0, cachorrosBase[indiceAtivo]);
        
        const elementosContainer = [this.cachorro.sprite];

        // configura a animação das pulgas se ela ainda não existir no cache
        if (!this.anims.exists("pulgaAnim")) {
            this.anims.create({
                key: "pulgaAnim",
                frames: this.anims.generateFrameNumbers("pulgas", { start: 0, end: 1 }), 
                frameRate: 1,
                repeat: -1
            });
        }

        // cria o sprite da pulga e define sua escala e visibilidade inicial
        this.pulgas = this.add.sprite(0, 0, "pulgas")
            .setOrigin(0.5)
            .setScale(posicaoY * 0.0015); 

        this.pulgas.play("pulgaAnim");
        this.pulgas.setVisible(gameState.pulga);

        // agrupa o cachorro e a pulga na lista de elementos do container
        elementosContainer.push(this.pulgas);

        // cria o container para tratar o pet e as pulgas como um único objeto
        this.containerCachorro = this.add.container(
            posicaoX / 1.95, 
            posicaoY / 1.5, 
            elementosContainer
        );

        // define a escala do grupo completo e configura a física do sprite principal
        this.containerCachorro.setScale(posicaoY * 0.0006);
        this.physics.add.existing(this.cachorro.sprite);
        this.cachorro.sprite.body.setAllowGravity(false);
        this.cachorro.sprite.body.immovable = true;

        // configura o botão de petisco com interatividade e efeitos de escala
        this.petiscoBtn = this.add.image(posicaoX / 1.2, posicaoY / 1.1, 'petisco');
        this.petiscoBtn.setScale(0.2); 
        this.petiscoBtn.setInteractive({ useHandCursor: true });

        // define os eventos de clique e passagem de mouse para o botão
        this.petiscoBtn.on('pointerdown', () => {
            this.scene.start('jogoLazer');
        });

        this.petiscoBtn.on('pointerover', () => {
            this.petiscoBtn.setScale(0.25); 
        });

        this.petiscoBtn.on('pointerout', () => {
            this.petiscoBtn.setScale(0.2); 
        });

        // exibe a tela de instruções caso o jogador ainda não as tenha visto
        if (!gameState.instrucoesLazerVistas) {
            this.mostrarInstrucoes(posicaoX, posicaoY);
        }
    }
    
    update(){
        // monitora a necessidade de trocar o pet ou atualizar as pulgas em tempo real
        if (gameState.trocar) {
            this.gerenciadorCachorros.mudarParaCachorroAtivo();
            gameState.trocar = false;
        }
        
        if (this.pulgas) {
            this.pulgas.setVisible(gameState.pulga);
        }
    }

    // método para criar o overlay de instruções e gerenciar o fechamento
    mostrarInstrucoes(posicaoX, posicaoY) {
        this.scene.bringToTop();

        const centroX = this.scale.width / 2;
        const centroY = this.scale.height / 2;

        // cria um fundo escuro para destacar as instruções
        const fundoEscuro = this.add.rectangle(centroX, centroY, 8000, 8000, 0x000000, 0.7)
            .setDepth(100)
            .setInteractive();

        const telaInstrucao = this.add.image(centroX, centroY, 'instrucaoLazer')
            .setDepth(101)
            .setInteractive({ useHandCursor: true }); 

        // calcula a escala correta para que a imagem caiba na tela do usuário
        const limiteLargura = this.scale.width * 0.8;
        const limiteAltura = this.scale.height * 0.8;
        const escalaX = limiteLargura / telaInstrucao.width;
        const escalaY = limiteAltura / telaInstrucao.height;
        const escalaFinal = Math.min(escalaX, escalaY);
        telaInstrucao.setScale(escalaFinal);

        // define a função de fechamento que limpa os objetos e restaura a hud
        const fecharInstrucoes = () => {
            fundoEscuro.destroy();
            telaInstrucao.destroy();
            gameState.instrucoesLazerVistas = true; 
            this.scene.bringToTop("HUD");
        };

        fundoEscuro.on('pointerdown', fecharInstrucoes);
        telaInstrucao.on('pointerdown', fecharInstrucoes);
    }
}