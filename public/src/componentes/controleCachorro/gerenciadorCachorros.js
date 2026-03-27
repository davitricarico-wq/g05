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
    // Confere no estado global se o pet ativo deve ser o Herói; se não for, usa o Caramelo
    const petAtivo = gameState.pets.cachorroHeroi ? "cachorroHeroi" : "cachorroCaramelo"
    
    // Instancia o objeto do cachorro usando a classe importada, passando as coordenadas e dados
    const cachorro = new Cachorro(this.scene, x, y, petAtivo, dados)
    
    // Adiciona este novo cachorro à nossa lista de gerenciamento
    this.cachorros.push(cachorro)
    
    // Define que este pet recém-criado é o foco atual do jogo
    this.cachorroAtual = cachorro
    
    // Retorna o objeto criado caso alguma outra parte do código precise usá-lo imediatamente
    return cachorro
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

    // Se as necessidades foram atendidas e o cachorro ainda está no nível inicial de progresso
    if (barrasZero && gameState.progressoCachorro === 0) {
        // Avisa o jogo inteiro que o cachorro está pronto para ser evoluído/adotado
        gameState.aguardandoEvolucao = true;
        
        // Interrompe o minigame de cuidados e manda a tela de volta para o menu/cena principal
        this.scene.scene.start("cenaPrincipal");
    }
  }

  // Faz a transição completa para jogar com o cachorro resgatado "Herói"
  mudarParaCachorroHeroi() {
    // Desativa o Caramelo e ativa o Herói nas variáveis globais
    gameState.pets.cachorroCaramelo = false
    gameState.pets.cachorroHeroi = true
    gameState.trocar = true
    
    // Enche todas as barras de necessidades de volta para o limite (11) para um novo desafio
    gameState.barras.comida = 11
    gameState.barras.lazer = 11
    gameState.barras.limpeza = 11
    gameState.barras.saude = 11

    // Adiciona uma dificuldade extra: este cachorro vem com pulgas
    gameState.pulga = true
    
    // Atualiza o cachorro visualmente na tela, se ele já existir
    if (this.cachorroAtual) {
      // Pega os dados do Herói lá do arquivo base (ele é o índice 1 da lista)
      this.cachorroAtual.dados = { ...cachorrosBase[1] }
      
      // Muda a imagem do cachorro antigo para a imagem do Herói
      this.cachorroAtual.mudarSprite("cachorroHeroi")
      
      // Força o cachorro novo a começar sujo
      this.cachorroAtual.dados.estado = "sujo"
      
      // Toca a animação correspondente ao estado "sujo" do novo sprite
      this.cachorroAtual.atualizarAnimacao()
    }
  }

  // Faz a transição inversa, devolvendo o jogo para o cachorro padrão "Caramelo"
  mudarParaCachorroCaramelo() {
    // Ativa o Caramelo e desativa o Herói nas variáveis globais
    gameState.pets.cachorroCaramelo = true
    gameState.pets.cachorroHeroi = false
    
    // Atualiza o cachorro visualmente na tela, se ele já existir
    if (this.cachorroAtual) {
      // Pega os dados do Caramelo do arquivo base (ele é o índice 0 da lista)
      this.cachorroAtual.dados = { ...cachorrosBase[0] }
      
      // Muda a imagem do cachorro para o sprite do Caramelo
      this.cachorroAtual.mudarSprite("cachorroCaramelo")
      
      // Força o cachorro a voltar ao estado "sujo"
      this.cachorroAtual.dados.estado = "sujo"
      
      // Toca a animação correta para o novo visual
      this.cachorroAtual.atualizarAnimacao()
    }
  }
}