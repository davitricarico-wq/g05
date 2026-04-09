/**
 * @class Barra
 * @description Gerencia o componente visual das barras de status/necessidade do pet 
 */
export class Barra {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - A cena do Phaser onde a barra será instanciada e renderizada.
     * @param {number} x - Posição X (horizontal) da barra na tela.
     * @param {number} y - Posição Y (vertical) da barra na tela.
     * @param {number} [valor=11] - Nível inicial de necessidade do pet (Padrão: 11 - Barra totalmente vazia).
     */
    constructor(scene, x, y, valor = 11) {
        // Armazena a referência da cena para manipulações futuras, caso necessário
        this.scene = scene;
        
        // Define o estado inicial da necessidade
        this.valor = valor;
        
        // Cria o elemento visual na tela utilizando o spritesheet "barra".
        // A escala em 1.5 melhora a visibilidade e clareza da UI em monitores maiores/mobile.
        this.sprite = scene.add.sprite(x, y, "barra").setScale(1.5);
        
        // Aplica o frame correto logo no momento da criação do objeto
        this.atualizarBarra();
    }

    /**
     * @method atualizarBarra
     * @description Sincroniza o valor lógico da necessidade (0 a 11) com o frame visual 
     * correspondente do spritesheet (0 a 10).
     */
    atualizarBarra() {
        this.valor = Phaser.Math.Clamp(this.valor, 0, 11);
        const frame = Math.min(Math.floor(this.valor), 10);
        this.sprite.setFrame(frame);
    }

    /**
     * @method alterar
     * @description Manipula o status da barra de forma dinâmica (incrementando ou decrementando).
     * @param {number} delta - Quantidade a ser somada ou subtraída.
     */
    alterar(delta) {
        // Aplica a alteração já travando (Clamp) dentro do limite aceitável (0 a 11)
        this.valor = Phaser.Math.Clamp(this.valor + delta, 0, 11);
        
        // Aciona imediatamente a atualização visual para dar feedback em tempo real ao jogador
        this.atualizarBarra();
    }
}