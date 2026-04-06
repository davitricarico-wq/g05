// Importa a classe principal do Cachorro para podermos criar os pets na tela
import { Cachorro } from "./cachorro.js"

// Importa o estado global do jogo para acessarmos as necessidades, progresso e qual pet está ativo
import { gameState } from "../../main.js"

// Importa os dados básicos dos cachorros (nome, peso, história, etc.)
import { cachorrosBase } from "./cachorrosBase.js"

// Cria e exporta a classe que vai organizar e gerenciar todos os cachorros na cena
export class GerenciadorCachorros {
  
  // O construtor é executado quando iniciamos o gerenciador
  constructor(scene) {
    // Guarda a referência da cena do Phaser onde os cachorros vão aparecer
    this.scene = scene
    
    // Inicia uma lista vazia para guardar todos os cachorros criados
    this.cachorros = []
    
    // Variável que indica qual cachorro o jogador está controlando/cuidando no momento
    this.cachorroAtual = null
  }

  // Cria um novo cachorro, define as configurações dele e coloca na tela
  criarCachorro(x, y, dados) {
    // Seleciona o sprite ativo de acordo com o pet atual no estado do jogo
    const petAtivo = this.getSpriteKeyAtivo()
    
    // Instancia o objeto do cachorro usando a classe importada, passando as coordenadas e dados
    const cachorro = new Cachorro(this.scene, x, y, petAtivo, dados)
    
    // Adiciona este novo cachorro à nossa lista de gerenciamento
    this.cachorros.push(cachorro)
    
    // Define que este pet recém-criado é o foco atual do jogo
    this.cachorroAtual = cachorro
    
    // Retorna o objeto criado caso alguma outra parte do código precise usá-lo imediatamente
    return cachorro
  }

  getIndiceCachorroAtivo() {
    if (gameState.pets.cachorroJoao) return 2
    if (gameState.pets.cachorroHeroi) return 1
    return 0
  }

  getSpriteKeyAtivo() {
    if (gameState.pets.cachorroJoao) return "cachorroJoao"
    if (gameState.pets.cachorroHeroi) return "cachorroHeroi"
    return "cachorroCaramelo"
  }

  getPetChaveAtiva() {
    if (gameState.pets.cachorroJoao) return "joao"
    if (gameState.pets.cachorroHeroi) return "heroi"
    return "caramelo"
  }

  mudarParaCachorroAtivo() {
    if (!this.cachorroAtual) return
    const indice = this.getIndiceCachorroAtivo()
    const spriteKey = this.getSpriteKeyAtivo()

    this.cachorroAtual.dados = { ...cachorrosBase[indice] }
    this.cachorroAtual.mudarSprite(spriteKey)
    this.cachorroAtual.dados.estado = "sujo"
    this.cachorroAtual.atualizarAnimacao()
  }

  // Procura um cachorro específico usando o ID dele e muda o seu estado visual (sujo, feliz, etc.)
  mudarEstadoPorId(id, estado) {
    // Vasculha a lista de cachorros e encontra o primeiro que tiver o ID igual ao solicitado
    const cachorro = this.cachorros.find(c => c.dados.id === id)
    
    // Se encontrou o cachorro, usa o método interno dele para alterar o estado
    if (cachorro) {
      cachorro.mudarEstado(estado)
    }
  }

  // Confere se o jogador completou todas as tarefas de cuidar do cachorro
  verificarCompletude() {
    // Checa se todas as barras de necessidades (fome, diversão, limpeza, saúde) chegaram a zero
    const barrasZero = 
      gameState.barras.comida <= 0 &&
      gameState.barras.lazer <= 0 &&
      gameState.barras.limpeza <= 0 &&
      gameState.barras.saude <= 0;

    // Se as necessidades foram atendidas e o cachorro está nas fases 0 ou 1, ativa a evolução
    if (barrasZero && gameState.progressoCachorro <= 1) {
        // Avisa o jogo inteiro que o cachorro está pronto para ser evoluído/adotado
        gameState.aguardandoEvolucao = true;
        
        // Interrompe o minigame de cuidados e manda a tela de volta para o menu/cena principal
        this.scene.scene.start("cenaPrincipal");
    }
  }
   mudarParaCachorroJoao() {
    gameState.pets.cachorroCaramelo = false
    gameState.pets.cachorroHeroi = false
    gameState.pets.cachorroJoao = true
    gameState.trocar = true
    gameState.progressoCachorro = 2
    
    gameState.barras.comida = 0
    gameState.barras.lazer = 11
    gameState.barras.limpeza =0
    gameState.barras.saude =0

    gameState.pulga = false
    
    if (this.cachorroAtual) {
      this.mudarParaCachorroAtivo()
    }
  }

  // Faz a transição completa para jogar com o cachorro resgatado "Herói"
  mudarParaCachorroHeroi() {
    gameState.pets.cachorroCaramelo = false
    gameState.pets.cachorroHeroi = true
    gameState.pets.cachorroJoao = false
    gameState.trocar = true
    gameState.progressoCachorro = 1
    
    gameState.barras.comida = 11
    gameState.barras.lazer = 11
    gameState.barras.limpeza = 11
    gameState.barras.saude = 11

    gameState.pulga = true
    
    if (this.cachorroAtual) {
      this.mudarParaCachorroAtivo()
    }
  }

  // Faz a transição inversa, devolvendo o jogo para o cachorro padrão "Caramelo"
  mudarParaCachorroCaramelo() {
    gameState.pets.cachorroCaramelo = true
    gameState.pets.cachorroHeroi = false
    gameState.pets.cachorroJoao = false
    gameState.progressoCachorro = 0
    
    if (this.cachorroAtual) {
      this.mudarParaCachorroAtivo()
    }
  }
}