// Importa o objeto global gameState do arquivo principal
import { gameState } from "../main.js";
 
export class cenaConfiguracoes extends Phaser.Scene {
    constructor() {
        super({ key: 'cenaConfiguracoes' });
    }

    create() {

        // Fundo semitransparente — dá o visual de popup sobre a cena anterior
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000
        ).setAlpha(0.6).setDepth(0);

        // Ícone decorativo de configurações
        this.add.image(this.scale.width / 2, this.scale.height / 2, "configuracoes")
            .setScale(0.8)
            .setDepth(1);

        // Este botão encerra apenas a cena de configurações e retorna à
        // cenaInicial que estava rodando por baixo, sem reiniciá-la.
        const botaoFechar = this.add.image(
            this.scale.width / 2 + 65,
            this.scale.height / 2 - 145,
            "retornoInicio"
        )
            .setScale(0.3)
            .setInteractive({ useHandCursor: true })
            .setDepth(10);

        // Efeito visual ao passar o mouse
        botaoFechar.on('pointerover', () => {
            this.tweens.add({ targets: botaoFechar, scale: 0.36, duration: 150, ease: 'Power2' });
        });

        // Retorna ao tamanho normal ao sair com o mouse
        botaoFechar.on('pointerout', () => {
            this.tweens.add({ targets: botaoFechar, scale: 0.3, duration: 150, ease: 'Power2' });
        });

        // Fecha somente este popup; a cenaInicial continua intacta por baixo
        botaoFechar.on('pointerdown', () => {
            this.scene.stop('cenaConfiguracoes');
        });

        
        // Alternar música
        gameState.alternarMusica = this.criarAlternar(
            this.scale.width / 2 + 20, this.scale.height / 2 - 85, true,
            () => { gameState.musica.resume(); },   // Ao ligar
            () => { gameState.musica.pause(); }     // Ao desligar
        );

        // Alternar som
        gameState.alternarSom = this.criarAlternar(
            this.scale.width / 2 + 20, this.scale.height / 2 - 35, true,
            () => { console.log('Som ligado'); },
            () => { console.log('Som desligado'); }
        );

        // Alternar vibração
        gameState.alternarVibracao = this.criarAlternar(
            this.scale.width / 2 + 20, this.scale.height / 2 + 15, true,
            () => { console.log('Vibracao ligada'); },
            () => { console.log('Vibracao desligada'); }
        );

        // Responsividade
        const handleResizeConfiguracoes = () => {
            // Atualiza fundo semitransparente
            const fundoSemitransparente = this.children.getByName();
            this.children.each((child) => {
                if (child.type === 'Rectangle') {
                    child.setPosition(this.scale.width / 2, this.scale.height / 2)
                         .setSize(this.scale.width, this.scale.height);
                }
            });

            // Atualiza ícone decorativo
            this.children.each((child) => {
                if (child.texture?.key === 'configuracoes') {
                    child.setPosition(this.scale.width / 2, this.scale.height / 2);
                }
            });

            // Atualiza botão fechar
            this.children.each((child) => {
                if (child.texture?.key === 'retornoInicio') {
                    child.setPosition(this.scale.width / 2 + 260, this.scale.height / 2 - 320);
                }
            });

            // Atualiza os botões
            if (gameState.alternarMusica) {
                gameState.alternarMusica.botaoLigado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 - 85);
                gameState.alternarMusica.botaoDesligado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 - 85);
            }
            if (gameState.alternarSom) {
                gameState.alternarSom.botaoLigado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 - 35);
                gameState.alternarSom.botaoDesligado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 - 35);
            }
            if (gameState.alternarVibracao) {
                gameState.alternarVibracao.botaoLigado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 + 15);
                gameState.alternarVibracao.botaoDesligado.setPosition(this.scale.width / 2 + 20, this.scale.height / 2 + 15);
            }
        };

        this.scale.on("resize", handleResizeConfiguracoes);

        this.events.on('shutdown', () => {
            this.scale.off("resize", handleResizeConfiguracoes);
        });

        // Efeito de fade-in ao abrir popup
        this.cameras.main.fadeIn(150, 0, 0, 0);
    }

    /**
     * Cria um par de botões liga/desliga.
     *
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {boolean} estadoInicial - true = começa ligado
     * @param {function} aoLigar - Chamada ao ligar
     * @param {function} aoDesligar - Chamada ao desligar
     */
    criarAlternar(x, y, estadoInicial, aoLigar, aoDesligar) {
        // Botão ligado
        const botaoLigado = this.add.image(x, y, "botaoOn")
            .setScale(0.6).setInteractive({ useHandCursor: true }).setDepth(3);

        // Botão desligado
        const botaoDesligado = this.add.image(x, y, "botaoOff")
            .setScale(0.6).setInteractive({ useHandCursor: true }).setDepth(3);

        // Estado inicial
        let ligado = estadoInicial;
        botaoLigado.setVisible(ligado);
        botaoDesligado.setVisible(!ligado);

        // Evento ao clicar no botão ligado → desliga
        botaoLigado.on('pointerdown', () => {
            ligado = false;
            botaoLigado.setVisible(false);
            botaoDesligado.setVisible(true);
            if (aoDesligar) aoDesligar();
        });

        // Evento ao clicar no botão desligado → liga
        botaoDesligado.on('pointerdown', () => {
            ligado = true;
            botaoDesligado.setVisible(false);
            botaoLigado.setVisible(true);
            if (aoLigar) aoLigar();
        });

        return { botaoLigado, botaoDesligado };
    }

    update() {}
}
