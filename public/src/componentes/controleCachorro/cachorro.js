// Importa o estado global do jogo, permitindo acesso a variáveis de progresso e persistência
import { gameState } from "../../main.js";

// Importa o dicionário/enum de estados possíveis do cachorro. 
// Manter isso em um arquivo separado ajuda a evitar erros de digitação e centraliza as regras.
import { ESTADOS_CACHORRO } from "./estadosCachorro.js";

/**
 * @class Cachorro
 * @description Entidade principal que representa o pet no jogo. 
 * Esta classe é responsável por gerenciar a renderização visual do cachorro, 
 * suas animações baseadas em estados (sujo, feliz, etc.) e sua evolução visual.
 */
export class Cachorro {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - A cena do Phaser onde o cachorro será renderizado.
     * @param {number} x - Posição inicial X na tela.
     * @param {number} y - Posição inicial Y na tela.
     * @param {string} pet - A chave (key) do spritesheet carregado no Phaser (ex: "cachorroCaramelo").
     * @param {object} dados - Objeto contendo os status atuais do pet (níveis, estado atual, etc).
     */
    constructor(scene, x, y, pet, dados) {
        // Armazena a referência da cena para acessar sistemas do Phaser (física, animações, etc.)
        this.scene = scene;
        
        // Guarda a chave da imagem/spritesheet base atual
        this.pet = pet;
        
        // Cópia independente (Shallow Copy) dos dados do pet.
        // O uso do spread operator (...) previne que alterações nesta instância mutem acidentalmente 
        // os dados originais passados por referência, protegendo a integridade do estado global.
        this.dados = { ...dados };
        
        // Coordenadas espaciais
        this.x = x;
        this.y = y;

        // Instancia o sprite visual do pet na cena
        this.sprite = scene.add.sprite(x, y, pet);

        // Gera e registra todas as animações possíveis para o spritesheet atual
        this.criarAnimacoes();
        
        // Sincroniza o visual na tela com o estado lógico inicial passado no construtor
        this.atualizarAnimacao();
    }

    /**
     * @method criarAnimacoes
     * @description Mapeia os frames do spritesheet para criar animações em loop.
     * Implementa um sistema de cache inteligente para não sobrecarregar a memória do jogo.
     */
    criarAnimacoes() {
        // Atalho para o gerenciador global de animações da cena
        const anims = this.scene.anims;

        // Dicionário que mapeia qual estado lógico corresponde a quais frames na imagem.
        // Por exemplo: O estado "LIMPO" usa o frame 0 (parado) e 1 (movimento).
        const configAnimacoes = {
            [ESTADOS_CACHORRO.FELIZ]: { start: 6, end: 7 },
            [ESTADOS_CACHORRO.SUJO]: { start: 2, end: 3 },
            [ESTADOS_CACHORRO.LIMPO]: { start: 0, end: 1 },
            [ESTADOS_CACHORRO.ENSABOADO]: { start: 4, end: 5 }
        };

        // Percorre a configuração e registra cada animação no motor do Phaser
        Object.entries(configAnimacoes).forEach(([estado, frames]) => {
            
            // Cria uma chave de animação única dinâmica (ex: "cachorro_cachorroCaramelo_SUJO")
            const key = `cachorro_${this.pet}_${estado}`;

            // PREVENÇÃO DE MEMORY LEAK:
            // O Phaser guarda animações globalmente. Se a animação já existir (ex: o jogador 
            // saiu e voltou para a cena), ignoramos a criação para não duplicar dados em memória.
            if (anims.exists(key)) return;

            // Registra a animação
            anims.create({
                key: key,
                frames: anims.generateFrameNumbers(this.pet, frames),
                frameRate: 4, // Velocidade tranquila, 4 quadros por segundo
                repeat: -1    // Loop infinito
            });
        });
    }

    /**
     * @method atualizarAnimacao
     * @description Sincroniza o sprite renderizado na tela com o estado lógico atual contido em `this.dados`.
     */
    atualizarAnimacao() {
        const estado = this.dados.estado;
        
        // Dá o play na animação montando a chave exata que foi registrada em `criarAnimacoes`
        this.sprite.play(`cachorro_${this.pet}_${estado}`);
    }

    /**
     * @method mudarEstado
     * @description Atualiza o status lógico do pet (Máquina de Estados) e já reflete no visual.
     * @param {string} novoEstado - O novo estado que o pet deve assumir (ex: passando de LIMPO para SUJO).
     */
    mudarEstado(novoEstado) {
        // Atualiza a fonte da verdade local
        this.dados.estado = novoEstado;
        
        // Dispara a troca visual
        this.atualizarAnimacao();
    }

    /**
     * @method mudarSprite
     * @description Altera o arquivo base de imagem do pet. 
     * * Regra de Negócio: Essencial para mecânicas de EVOLUÇÃO, CRESCIMENTO ou SKIN do pet.
     * @param {string} novoSprite - A chave do novo spritesheet (ex: de "cachorroFilhote" para "cachorroAdulto").
     */
    mudarSprite(novoSprite) {
        // Atualiza a referência da chave do sprite
        this.pet = novoSprite;
        
        // Troca a textura gráfica no objeto físico da tela sem precisar destruir e recriar o objeto
        this.sprite.setTexture(novoSprite);
        
        // Como a imagem mudou, precisamos registrar as animações para essa nova chave de textura
        this.criarAnimacoes();
        
        // Restaura a animação adequada ao estado atual, agora utilizando a nova arte
        this.atualizarAnimacao();
    }
}