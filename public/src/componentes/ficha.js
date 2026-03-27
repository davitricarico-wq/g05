// Importa a lista base com os dados dos cachorros disponíveis no jogo
import { cachorrosBase } from "./controleCachorro/cachorrosBase.js";

// Importa o estado global para sabermos qual cachorro o jogador está cuidando agora
import { gameState } from "../main.js";

// Exporta e define a classe da cena que mostra a ficha técnica do animal
export class ficha extends Phaser.Scene {
    
    // O construtor define o nome interno dessa cena para o Phaser chamá-la depois
    constructor() {
        super({ key: "ficha" });
    }

    // Função principal que monta os elementos visuais da cena na tela
    create() {
        // Cria uma variável vazia para armazenar as informações do cachorro atual
        let pet;
        
        // Verifica no estado global do jogo se o pet ativo no momento é o Herói
        if (gameState.pets.cachorroHeroi) {
            // Se for o Herói, pega os dados dele (posição 1 na nossa lista base)
            pet = cachorrosBase[1];
        } else {
            // Se não for o Herói, pega os dados do cachorro padrão, o Caramelo (posição 0)
            pet = cachorrosBase[0];
        }

        // Cria um agrupador (container) para manter todos os textos e o fundo juntos
        const fichaContainer = this.add.container(
            this.scale.width * 0.5,   // Posiciona o container no meio da tela na horizontal
            this.scale.height * 0.38  // Coloca o container um pouco mais para cima na vertical
        );

        // Cria um retângulo colorido (bege) para servir de papel/fundo da ficha
        const fundo = this.add.rectangle(0, 0, 500, 350, 0xf0e8bb);
        
        // Define o ponto central do retângulo como a origem para facilitar o alinhamento
        fundo.setOrigin(0.5);

        // Guarda as configurações de fonte, tamanho e cor para padronizar os textos
        const estiloPixel = {
            fontFamily: '"Press Start 2P"',
            fontSize: "14px",
            color: "#000000"
        };

        // Escreve o título principal no topo da ficha
        const titulo = this.add.text(-220, -120, `Ficha do Animal`, estiloPixel)
            .setOrigin(0, 0.5); // Origem à esquerda para o texto crescer para a direita

        // Puxa e escreve o nome do pet direto dos dados selecionados
        const nome = this.add.text(-220, -80, `Nome: ${pet.nome}`, estiloPixel)
            .setOrigin(0, 0.5);

        // Puxa e escreve o peso do cachorro
        const peso = this.add.text(-220, -40, `Peso: ${pet.peso}`, estiloPixel)
            .setOrigin(0, 0.5);

        // Puxa e escreve a idade do animal
        const idade = this.add.text(-220, 0, `Idade: ${pet.idade}`, estiloPixel)
            .setOrigin(0, 0.5);

        // Escreve o tamanho/porte do pet
        const porte = this.add.text(-220, 40, `Porte: ${pet.porte}`, estiloPixel)
            .setOrigin(0, 0.5);

        // Escreve a condição atual do cachorro (ex: sujo, limpo, etc.)
        const estado = this.add.text(-220, 80, `Estado: ${pet.estado}`, estiloPixel)
            .setOrigin(0, 0.5);

        // Escreve a história de resgate do pet mesclando o estilo base com novas regras
        const historia = this.add.text(-220, 120, `Historia: ${pet.historia}`, {
            ...estiloPixel,          // Copia a fonte e cor definidas lá em cima
            align: "left",           // Alinha o parágrafo à esquerda
            wordWrap: { width: 420 } // Configura a largura máxima para forçar a quebra de linha
        }).setOrigin(0, 0);

        // Pega todos os gráficos e textos criados e joga dentro do nosso container principal
        fichaContainer.add([fundo, titulo, nome, peso, idade, porte, estado, historia]);
    }
}