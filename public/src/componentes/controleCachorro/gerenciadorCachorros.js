import { Cachorro } from "./cachorro.js"
import { gameState } from "../../main.js"
import { cachorrosBase } from "./cachorrosBase.js"

export class GerenciadorCachorros {
  constructor(scene) {
    this.scene = scene
    this.cachorros = []
    this.cachorroAtual = null
  }

  criarCachorro(x, y, dados) {
    const petAtivo = gameState.pets.cachorroHeroi ? "cachorroHeroi" : "cachorroCaramelo"
    const cachorro = new Cachorro(this.scene, x, y, petAtivo, dados)
    this.cachorros.push(cachorro)
    this.cachorroAtual = cachorro
    return cachorro
  }

  mudarEstadoPorId(id, estado) {
    const cachorro = this.cachorros.find(c => c.dados.id === id)
    if (cachorro) {
      cachorro.mudarEstado(estado)
    }
  }

  verificarCompletude() {
    const barrasZero = 
      gameState.barras.comida <= 0 &&
      gameState.barras.lazer <= 0 &&
      gameState.barras.limpeza <= 0 &&
      gameState.barras.saude <= 0;

    if (barrasZero && gameState.progressoCachorro === 0) {
        gameState.aguardandoEvolucao = true;
        // Interrompe o minigame e volta para a central
        this.scene.scene.start("cenaPrincipal");
    }
}

  mudarParaCachorroHeroi() {
    gameState.pets.cachorroCaramelo = false
    gameState.pets.cachorroHeroi = true
    gameState.trocar = true
    
    // Reseta as barras para 11
    gameState.barras.comida = 11
    gameState.barras.lazer = 11
    gameState.barras.limpeza = 11
    gameState.barras.saude = 11

    gameState.pulga = true
    
    if (this.cachorroAtual) {
      // Atualiza os dados para o Herói
      this.cachorroAtual.dados = { ...cachorrosBase[1] }
      this.cachorroAtual.mudarSprite("cachorroHeroi")
      this.cachorroAtual.dados.estado = "sujo"
      this.cachorroAtual.atualizarAnimacao()
    }
  }

  mudarParaCachorroCaramelo() {
    gameState.pets.cachorroCaramelo = true
    gameState.pets.cachorroHeroi = false
    
    if (this.cachorroAtual) {
      // Atualiza os dados para o Caramelo
      this.cachorroAtual.dados = { ...cachorrosBase[0] }
      this.cachorroAtual.mudarSprite("cachorroCaramelo")
      this.cachorroAtual.dados.estado = "sujo"
      this.cachorroAtual.atualizarAnimacao()
    }
  }
}