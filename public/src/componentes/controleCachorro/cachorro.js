// Importa o estado global do jogo para acessar variáveis importantes
import { gameState } from "../../main.js";

// Importa a lista de estados possíveis que o cachorro pode ter (sujo, limpo, etc.)
import { ESTADOS_CACHORRO } from "./estadosCachorro.js";

// Define e exporta a classe Cachorro para criar os pets no jogo
export class Cachorro {
  
  // O construtor é executado sempre que um novo cachorro é criado na tela
  constructor(scene, x, y, pet, dados) {
    // Salva a referência da cena atual onde o cachorro vai aparecer
    this.scene = scene
    
    // Guarda o identificador do sprite (a imagem) do pet
    this.pet = pet
    
    // Cria uma cópia independente dos dados do cachorro (status, níveis, etc.)
    this.dados = { ...dados }
    
    // Guarda as posições iniciais X e Y na tela
    this.x = x
    this.y = y

    // Adiciona efetivamente a imagem do cachorro na tela do jogo
    this.sprite = scene.add.sprite(x, y, pet)

    // Prepara todas as animações de movimento do cachorro
    this.criarAnimacoes()
    
    // Roda a animação inicial dependendo de como o cachorro está no momento
    this.atualizarAnimacao()
  }

  // Configura os quadros (frames) de animação para cada situação do cachorro
  criarAnimacoes() {
    // Atalho para acessar o gerenciador de animações da cena do Phaser
    const anims = this.scene.anims

    // Mapeia quais quadros da folha de sprites (spritesheet) pertencem a cada estado
    const configAnimacoes = {
        [ESTADOS_CACHORRO.FELIZ]: { start: 6, end: 7 },
        [ESTADOS_CACHORRO.SUJO]: { start: 2, end: 3 },
        [ESTADOS_CACHORRO.LIMPO]: { start: 0, end: 1 },
        [ESTADOS_CACHORRO.ENSABOADO]: { start: 4, end: 5 }
    }

    // Percorre todos os estados configurados acima para registrá-los no jogo
    Object.entries(configAnimacoes).forEach(([estado, frames]) => {
      
      // Cria um nome único para a animação juntando o nome do cachorro e o estado dele
      const key = `cachorro_${this.pet}_${estado}`

      // Se essa animação já foi criada antes, ignora para não gastar memória à toa
      if (anims.exists(key)) return

      // Cria a animação definindo os quadros, a velocidade (frameRate) e o loop infinito (repeat: -1)
      anims.create({
        key: key,
        frames: anims.generateFrameNumbers(this.pet, frames),
        frameRate: 4,
        repeat: -1
      })
    })
  }

  // Troca a animação que está rodando na tela para bater com o estado atual do pet
  atualizarAnimacao() {
    // Verifica qual é o estado atual do cachorro nos dados
    const estado = this.dados.estado
    
    // Toca a animação correspondente no sprite visual
    this.sprite.play(`cachorro_${this.pet}_${estado}`)
  }

  // Altera a condição do cachorro (ex: de sujo para limpo) e já atualiza o visual
  mudarEstado(novoEstado) {
    // Salva o novo estado nos dados do cachorro
    this.dados.estado = novoEstado
    
    // Chama a função que atualiza a animação na tela
    this.atualizarAnimacao()
  }

  // Troca completamente a imagem base do cachorro (usado quando ele cresce ou evolui)
  mudarSprite(novoSprite) {
    // Atualiza a variável que guarda o nome do sprite
    this.pet = novoSprite
    
    // Troca a textura visual do objeto no jogo pela nova imagem
    this.sprite.setTexture(novoSprite)
    
    // Recria as animações para garantir que os quadros da nova imagem funcionem
    this.criarAnimacoes()
    
    // Volta a tocar a animação correta, agora com a aparência nova
    this.atualizarAnimacao()
  }
}