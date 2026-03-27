export class Barra {
    constructor(scene, x, y, valor = 11) {
        // Cena onde a barra será exibida
        this.scene = scene;
        // Valor inicial da barra (entre 0 e 11, onde 11 é vazio)
        this.valor = valor;
        // Cria o sprite da barra na posição (x, y) usando o spritesheet "barra"
        this.sprite = scene.add.sprite(x, y, "barra").setScale(1.5);
        // Atualiza a barra para refletir o valor inicial
        this.atualizarBarra();
    }

    // Atualiza a barra visualmente de acordo com o valor atual
    atualizarBarra() {
        // Garante que o valor esteja entre 0 e 11
        this.valor = Phaser.Math.Clamp(this.valor, 0, 11);
        // Mapeia valor (0-11) para frame (0-10)
        // valor 0 → frame 0 (barra cheia)
        // valor 11 → frame 10 (barra vazia)
        const frame = Math.min(Math.floor(this.valor), 10);
        this.sprite.setFrame(frame);
    }

    // Altera o valor da barra (incremento ou decremento) e atualiza visualmente
    alterar(delta) {
        // Ajusta o valor somando delta e mantém dentro dos limites
        this.valor = Phaser.Math.Clamp(this.valor + delta, 0, 11);
        // Atualiza sprite para refletir novo valor
        this.atualizarBarra();
    }
}
