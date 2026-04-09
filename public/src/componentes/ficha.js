// Importa o banco de dados contendo as informações imutáveis dos pets (lore, status base)
import { cachorrosBase } from "./controleCachorro/cachorrosBase.js";

// Importa o Singleton do estado global, permitindo consultar qual pet o jogador está usando
import { gameState } from "../main.js";

/**
 * @class ficha
 * @extends Phaser.Scene
 * @description Cena responsável por renderizar a Interface de Usuário (UI) com a ficha técnica do pet.
 * * Arquitetura: Esta cena funciona como um "Modal" ou "Pop-up" informativo. Ela lê os dados 
 * do estado global para preencher dinamicamente os textos na tela.
 */
export class ficha extends Phaser.Scene {
    
    /**
     * @constructor
     * @description Registra a cena no gerenciador do Phaser com a chave "ficha".
     */
    constructor() {
        super({ key: "ficha" });
    }

    /**
     * @method create
     * @description Ciclo de vida do Phaser acionado ao iniciar a cena. Constrói todos os elementos visuais.
     */
    create() {
        // Variável local que guardará a referência do objeto do pet selecionado
        let pet;
        
        // Avalia as flags do gameState para mapear diretamente para o índice correto do banco de dados.
        if (gameState.pets.cachorroJoao) {
            pet = cachorrosBase[2];
        } else if (gameState.pets.cachorroHeroi) {
            pet = cachorrosBase[1];
        } else {
            // Fallback: Se nenhuma flag especial estiver ativa, exibe o Caramelo (índice 0)
            pet = cachorrosBase[0];
        }


        // Padrão de Projeto de UI: O Container age como uma "div" no HTML.
        // Ao invés de calcular a posição X e Y global de CADA texto, nós posicionamos 
        // o Container no centro/topo da tela e desenhamos os textos dentro dele usando 
        // coordenadas locais relativas (ex: -220, -120).
        const fichaContainer = this.add.container(
            this.scale.width * 0.5,  // Centralizado horizontalmente
            this.scale.height * 0.38 // Levemente acima do meio da tela na vertical
        );

        // Cria o "papel" de fundo da ficha (largura: 500, altura: 350, cor: bege)
        // Posição 0,0 porque está sendo desenhado NO CENTRO do Container.
        const fundo = this.add.rectangle(0, 0, 500, 350, 0xf0e8bb);
        fundo.setOrigin(0.5); // Centraliza o pivô do retângulo

        // Dicionário de estilos globais para reaproveitamento (DRY - Don't Repeat Yourself)
        const estiloPixel = {
            fontFamily: '"PRESS START 2P"', // Tipografia retrô
            fontSize: "14px",
            color: "#000000" // Cor preta para contrastar com o fundo bege
        };

        // Todos os textos abaixo usam coordenadas locais em relação ao centro do Container.
        // O `setOrigin(0, 0.5)` garante que o texto fique alinhado perfeitamente à esquerda.

        const titulo = this.add.text(-220, -120, `Ficha do Animal`, estiloPixel)
            .setOrigin(0, 0.5); 

        const nome = this.add.text(-220, -80, `Nome: ${pet.nome}`, estiloPixel)
            .setOrigin(0, 0.5);

        const peso = this.add.text(-220, -40, `Peso: ${pet.peso}`, estiloPixel)
            .setOrigin(0, 0.5);

        const idade = this.add.text(-220, 0, `Idade: ${pet.idade}`, estiloPixel)
            .setOrigin(0, 0.5);

        const porte = this.add.text(-220, 40, `Porte: ${pet.porte}`, estiloPixel)
            .setOrigin(0, 0.5);

        const estado = this.add.text(-220, 80, `Estado: ${pet.estado}`, estiloPixel)
            .setOrigin(0, 0.5);

        // Renderização da História (Lore)
        // Como a história pode ser um texto longo, usamos o recurso de "Word Wrap" do Phaser.
        const historia = this.add.text(-220, 120, `História: ${pet.historia}`, {
            // Usa o Spread Operator (...) para herdar a fonte e a cor da constante `estiloPixel`
            ...estiloPixel,          
            align: "left",           
            // Quebra a linha automaticamente caso o texto ultrapasse 420px de largura
            wordWrap: { width: 420 } 
        }).setOrigin(0, 0); // Origem (0,0) para que o texto expanda para a direita e para baixo.

        // Injeta todas as instâncias visuais dentro do Container.
        // A ordem de inserção importa: o fundo deve ser o primeiro para ficar atrás de todos os textos.
        fichaContainer.add([fundo, titulo, nome, peso, idade, porte, estado, historia]);
    }
}