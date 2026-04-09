/**
 * @class Racao
 * @description Representa o componente visual e interativo de um item de ração na loja ou inventário.
 * Ele mescla os dados brutos do catálogo (nome, valor, nutrientes) com o objeto de jogo do Phaser (Sprite).
 */
export class Racao {

    /**
     * @static
     * @property {Racao|null} selecionada
     * @description Gerencia o estado global de seleção da ração.
     * * Padrão de Arquitetura: Sendo estática, essa variável pertence à Classe, e não às instâncias. 
     * Isso permite que todos os objetos 'Racao' criados saibam qual item está selecionado no momento, 
     * facilitando a criação de um comportamento de "Radio Button" (selecionar um desmarca o outro) 
     * sem precisar de um Gerenciador extra só para cuidar da UI.
     */
    static selecionada = null;

    /**
     * @constructor
     * @param {Phaser.Scene} scene - A cena do Phaser onde o item será renderizado (ex: CenaLoja).
     * @param {number} x - Posição horizontal (X) na tela.
     * @param {number} y - Posição vertical (Y) na tela.
     * @param {Object} dados - O objeto de dados importado do catálogo (ex: racaoPremiumPequeno).
     */
    constructor(scene, x, y, dados) {
        // Armazena a referência da cena para comunicação posterior
        this.scene = scene;

        // "Hydration" (Hidratação) do objeto:
        // Copia dinamicamente todas as propriedades do objeto 'dados' (nome, preco, nutrientes) 
        // diretamente para esta instância (this). Isso evita ter que escrever `this.nome = dados.nome`, etc.
        Object.assign(this, dados);

        // Instancia o sprite visual do item
        this.sprite = scene.add
            // Usa a chave de imagem que veio junto no objeto 'dados'
            .image(x, y, dados.sprite)      
            // Padroniza o tamanho do card na loja para alinhar o grid perfeitamente, 
            // independente do tamanho original da imagem importada.
            .setDisplaySize(144, 209)       
            // Habilita eventos de input (clique/toque) e altera o cursor do mouse para a "mãozinha"
            .setInteractive({ useHandCursor: true }); 

        // Registra o evento de clique/toque no item
        this.sprite.on("pointerdown", () => {

            // Se já existe uma ração selecionada no jogo, nós removemos o filtro de cor (Tint) dela
            // para que ela volte à aparência original.
            if (Racao.selecionada) {
                Racao.selecionada.sprite.clearTint();
            }

            // Define esta própria instância atual como a nova ração selecionada globalmente.
            Racao.selecionada = this;

            // Aplica um filtro de cor amarela (0xffff00) sobre este sprite para indicar ao jogador 
            // que este é o item ativo no momento.
            this.sprite.setTint(0xffff00);

            // Em vez da classe Racao tentar manipular o painel de texto diretamente, ela apenas 
            // verifica se a Cena possui uma função 'atualizarPainel' e passa a si mesma (this) como argumento.
            // Isso significa que o card da ração não precisa saber como o painel funciona por dentro.
            if (scene.atualizarPainel) {
                scene.atualizarPainel(this);
            }
        });
    }
}