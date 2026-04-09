// Importa a classe do Cachorro, responsável pela renderização visual e animações
import { Cachorro } from "./cachorro.js";

// Importa o Singleton do estado global, que guarda o progresso, flags de pets e valores das barras
import { gameState } from "../../main.js";

// Importa o banco de dados local com as informações (lore/status) de cada pet
import { cachorrosBase } from "./cachorrosBase.js";

/**
 * @class GerenciadorCachorros
 * @description Implementa o padrão de projeto Manager (ou Controller). 
 * Ele é responsável por instanciar, destruir e manipular os pets na cena atual,
 * servindo como intermediário entre a lógica de negócios global (gameState) 
 * e a representação visual (classe Cachorro).
 */
export class GerenciadorCachorros {
    /**
     * @constructor
     * @param {Phaser.Scene} scene - A cena ativa do Phaser onde os pets serão inseridos.
     */
    constructor(scene) {
        // Armazena o contexto da cena para passar aos novos pets instanciados
        this.scene = scene;
        
        // Array para manter o rastreamento de todos os pets na tela.
        // Útil caso o jogo evolua para ter múltiplos pets simultâneos na mesma cena.
        this.cachorros = [];
        
        // Ponteiro para o pet principal que o jogador está interagindo no momento.
        this.cachorroAtual = null;
    }

    /**
     * @method criarCachorro
     * @description Fábrica (Factory) que instancia um novo pet na tela, já sincronizado 
     * com o status global de qual pet deve estar ativo no momento.
     * @param {number} x - Posição X da criação na tela.
     * @param {number} y - Posição Y da criação na tela.
     * @param {object} dados - Objeto contendo os status iniciais do pet.
     * @returns {Cachorro} Retorna a instância criada para uso imediato, se necessário.
     */
    criarCachorro(x, y, dados) {
        // Consulta as regras de negócio para descobrir qual sprite carregar
        const petAtivo = this.getSpriteKeyAtivo();
        
        // Instancia o objeto visual
        const cachorro = new Cachorro(this.scene, x, y, petAtivo, dados);
        
        // Registra o pet no array de controle do gerenciador
        this.cachorros.push(cachorro);
        
        // Define o foco do jogo para este novo pet
        this.cachorroAtual = cachorro;
        
        return cachorro;
    }

    /**
     * @method getIndiceCachorroAtivo
     * @description Resolve qual é o índice do pet no array `cachorrosBase` 
     * avaliando as flags de progressão do gameState.
     * @returns {number} O índice (0, 1 ou 2) correspondente ao pet.
     */
    getIndiceCachorroAtivo() {
        if (gameState.pets.cachorroJoao) return 2;
        if (gameState.pets.cachorroHeroi) return 1;
        // Fallback padrão: Cachorro Caramelo (Índice 0)
        return 0;
    }

    /**
     * @method getSpriteKeyAtivo
     * @description Retorna a string exata que mapeia a textura/imagem carregada no Phaser.
     * @returns {string} Chave de textura do Phaser.
     */
    getSpriteKeyAtivo() {
        if (gameState.pets.cachorroJoao) return "cachorroJoao";
        if (gameState.pets.cachorroHeroi) return "cachorroHeroi";
        return "cachorroCaramelo";
    }

    /**
     * @method getPetChaveAtiva
     * @description Retorna uma string simplificada usada para lógicas internas de identificação.
     * @returns {string} Nome simplificado do pet.
     */
    getPetChaveAtiva() {
        if (gameState.pets.cachorroJoao) return "joao";
        if (gameState.pets.cachorroHeroi) return "heroi";
        return "caramelo";
    }

    /**
     * @method mudarParaCachorroAtivo
     * @description Sincroniza forçadamente o pet visual atual na tela com os dados 
     * correspondentes no banco de dados e no estado global do jogo.
     */
    mudarParaCachorroAtivo() {
        // Safety check: se não houver pet na tela, aborta a operação.
        if (!this.cachorroAtual) return;
        
        const indice = this.getIndiceCachorroAtivo();
        const spriteKey = this.getSpriteKeyAtivo();

        // 1. Atualiza os dados locais com uma cópia limpa do banco de dados base
        this.cachorroAtual.dados = { ...cachorrosBase[indice] };
        
        // 2. Troca a textura gráfica e recria as animações correspondentes
        this.cachorroAtual.mudarSprite(spriteKey);
        
        // 3. Força o estado "sujo" inicial (Regra de negócio específica desta transição)
        this.cachorroAtual.dados.estado = "sujo";
        
        // 4. Aplica visualmente o estado
        this.cachorroAtual.atualizarAnimacao();
    }

    /**
     * @method mudarEstadoPorId
     * @description Busca um pet específico gerido por esta classe e altera seu estado visual.
     * @param {number} id - O ID único do cachorro (referente ao cachorrosBase).
     * @param {string} estado - O novo estado (do enum ESTADOS_CACHORRO).
     */
    mudarEstadoPorId(id, estado) {
        // Localiza o objeto da classe Cachorro dentro do array
        const cachorro = this.cachorros.find(c => c.dados.id === id);
        
        // Se a busca for bem sucedida, delega a troca de estado para a classe do pet
        if (cachorro) {
            cachorro.mudarEstado(estado);
        }
    }

    /**
     * @method verificarCompletude
     * @description Regra de Negócio Central (Condição de Vitória/Avanço). 
     * Verifica se todas as necessidades do pet foram saciadas (zeradas).
     */
    verificarCompletude() {
        // Lembrar: Lógica invertida! Valores em 0 ou abaixo (<=0) significam que a necessidade está Satisfeita.
        const barrasZero = 
            gameState.barras.comida <= 0 &&
            gameState.barras.lazer <= 0 &&
            gameState.barras.limpeza <= 0 &&
            gameState.barras.saude <= 0;

        // Verifica a vitória, mas TRAVA (Lock) usando o `aguardandoEvolucao`.
        // Sem essa trava, o update loop do jogo chamaria start() milhares de vezes por segundo, travando o jogo.
        if (barrasZero && gameState.progressoCachorro <= 2 && !gameState.aguardandoEvolucao) {
            // Aplica o lock para impedir repetições
            gameState.aguardandoEvolucao = true;
            
            // Transição de cena: O minigame acaba e o jogo volta ao fluxo principal
            this.scene.scene.start("cenaPrincipal");
        }
    }
    
    /**
     * @method mudarParaCachorroJoao
     * @description Setup completo do nível/fase do cachorro "João". 
     * Modifica intensamente o gameState configurando o desafio específico deste pet.
     */
    mudarParaCachorroJoao() {
        // Altera as flags lógicas para ativar exclusivamente o João
        gameState.pets.cachorroCaramelo = false;
        gameState.pets.cachorroHeroi = false;
        gameState.pets.cachorroJoao = true;
        
        // Atualiza variáveis de fluxo do jogo
        gameState.trocar = true;
        gameState.progressoCachorro = 2;
        
        // Setup de Dificuldade: O João já começa sem fome, limpo e saudável (0), 
        // mas precisa muito de lazer/diversão (11).
        gameState.barras.comida = 0;
        gameState.barras.lazer = 11;
        gameState.barras.limpeza = 0;
        gameState.barras.saude = 0;

        gameState.pulga = false; // Não há minigame de pulga nesta fase
        
        // Se houver um pet renderizado na tela, força a re-renderização visual
        if (this.cachorroAtual) {
            this.mudarParaCachorroAtivo();
        }
    }

    /**
     * @method mudarParaCachorroHeroi
     * @description Setup completo do nível/fase do cachorro "Herói".
     */
    mudarParaCachorroHeroi() {
        gameState.pets.cachorroCaramelo = false;
        gameState.pets.cachorroHeroi = true;
        gameState.pets.cachorroJoao = false;
        gameState.trocar = true;
        gameState.progressoCachorro = 1;
        
        // Setup de Dificuldade (Hard Mode): O Herói chega ao abrigo na pior situação possível.
        // Todas as necessidades estão críticas (11).
        gameState.barras.comida = 11;
        gameState.barras.lazer = 11;
        gameState.barras.limpeza = 11;
        gameState.barras.saude = 11;

        gameState.pulga = true; // Ativa mecânica ou desafio adicional
        
        if (this.cachorroAtual) {
            this.mudarParaCachorroAtivo();
        }
    }

    /**
     * @method mudarParaCachorroCaramelo
     * @description Retorna ao estado inicial/fase base do jogo (Cachorro Caramelo).
     */
    mudarParaCachorroCaramelo() {
        gameState.pets.cachorroCaramelo = true;
        gameState.pets.cachorroHeroi = false;
        gameState.pets.cachorroJoao = false;
        
        // Zera o progresso narrativo
        gameState.progressoCachorro = 0;
        
        if (this.cachorroAtual) {
            this.mudarParaCachorroAtivo();
        }
    }
}