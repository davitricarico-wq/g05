/**
 * @class Barra
 * @description Gerencia o componente visual das barras de status/necessidade do pet 
 * (Ex: Fome, Lazer, Saúde, Limpeza). 
 * * ATENÇÃO PARA A REGRA DE NEGÓCIO INVERTIDA: Neste jogo, o valor representa a "necessidade". 
 * O valor 0 significa que a necessidade está "satisfeita" (barra cheia), enquanto 11 
 * significa que a necessidade está no nível máximo/crítico (barra vazia).
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
        // Safety Check (Clamp): Evita que bugs matemáticos deixem o valor menor que 0 ou maior que 11,
        // o que causaria quebra na renderização por tentar buscar um frame inexistente.
        this.valor = Phaser.Math.Clamp(this.valor, 0, 11);
        
        // Mapeamento lógico-visual:
        // Math.min é usado para garantir a correspondência correta dos índices.
        // - Valor 0 (Sem necessidade/Satisfeito) → Acessa o frame 0 (Arte da barra cheia).
        // - Valor 11 (Necessidade máxima/Crítico) → Acessa o frame 10 (Arte da barra vazia).
        const frame = Math.min(Math.floor(this.valor), 10);
        this.sprite.setFrame(frame);
    }

    /**
     * @method alterar
     * @description Manipula o status da barra de forma dinâmica (incrementando ou decrementando).
     * @param {number} delta - Quantidade a ser somada ou subtraída.
     * * Casos de uso:
     * - alterar(-3): O pet comeu ou brincou. A necessidade diminui, fazendo a barra visualmente encher.
     * - alterar(+1): O tempo passou (Tick). A necessidade aumenta, fazendo a barra visualmente esvaziar.
     */
    alterar(delta) {
        // Aplica a alteração já travando (Clamp) dentro do limite aceitável (0 a 11)
        this.valor = Phaser.Math.Clamp(this.valor + delta, 0, 11);
        
        // Aciona imediatamente a atualização visual para dar feedback em tempo real ao jogador
        this.atualizarBarra();
    }
}