# Inteli - Instituto de Tecnologia e Liderança

<p align="center">
  <a href="https://www.inteli.edu.br/">
    <img src="public/assets/readme/inteli.png" alt="Inteli - Instituto de Tecnologia e Liderança" border="0" width=40% height=40%>
  </a>
</p>

<br>

# 🐾 Cobasi Shelter

## Bardot Studios

## 👨‍🎓 Integrantes
- <a href="https://www.linkedin.com/in/ana-célia-amaral-354a553a4">Ana Célia Augusta Santos</a>
- <a href="https://www.linkedin.com/in/anita-fratelli-258398314/">Anita Fratelli Sonobe Silveira</a>
- <a href="https://www.linkedin.com/in/davi-tricarico-248b1a3b1">Davi Viana Tricarico</a>
- <a href="https://www.linkedin.com/in/gustavo-luz-250708220">Gustavo Luz Fantasia Barbosa</a>
- <a href="https://www.linkedin.com/in/isaac-nicolas-alves-da-silva-9787592a4">Isaac Nicolas Alves Silva</a>
- <a href="https://www.linkedin.com/in/joão-pedro-poveda-43263b265">João Pedro Fuzzo Poveda</a>
- <a href="https://www.linkedin.com/in/pedro-negri-840519335/">Pedro Negri</a>
- <a href="https://www.linkedin.com/in/valter-lucas-8207a6288">Valter Lucas Garcia de Lima</a>

## 👩‍🏫 Professores

### Orientador(a)
- <a href="https://www.linkedin.com/in/fabiana-martins-de-oliveira-8993b0b2/">Fabiana Martins de Oliveira</a>

### Instrutores
- <a href="https://www.linkedin.com/in/juliastateri/">Julia Stateri</a>
- <a href="https://www.linkedin.com/in/geraldo-magela-severino-vasconcelos-22b1b220/">Geraldo Magela Severino Vasconcelos</a>
- <a href="https://www.linkedin.com/in/silva-wesley/">Wesley da Silva Santos</a>
- <a href="https://www.linkedin.com/in/vanunes/">Vanessa Tavares Nunes</a>
- <a href="https://www.linkedin.com/in/fabiocassiosouza/">Fábio Cássio de Souza</a>

---

## 📜 Descrição

**Cobasi Shelter** é um jogo de simulação casual desenvolvido em parceria com a **Cobasi**, com o objetivo de conscientizar jogadores sobre o programa de adoção responsável da empresa e educar tutores sobre os cuidados essenciais com animais domésticos.

O jogador assume o papel de voluntário do projeto **Cobasi Cuida**, recebendo animais resgatados em diferentes condições e os tratando por meio de minigames interativos até que estejam saudáveis. Cada ação bem-sucedida recompensa o jogador com **CobasiCoins**, moeda virtual utilizada para desbloquear melhorias dentro do jogo.

O projeto busca:
- **Conscientizar** sobre o programa de adoção da Cobasi, ainda pouco conhecido pelo público geral;
- **Educar tutores** sobre alimentação, higiene e saúde animal de forma lúdica;
- **Promover empatia e responsabilidade** no cuidado com animais domésticos.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| [Phaser 3](https://phaser.io/) | Engine principal do jogo |
| JavaScript | Linguagem de desenvolvimento |
| HTML5 + CSS3 | Estrutura e estilo da página |
| Piskel e Libresprite | Pixel art do jogo |
| Arcade Physics (Phaser) | Sistema de física para colisões e movimentação |

---



## 📁 Estrutura de Pastas

```
cobasi-shelter/
│
├── index.html                          # Ponto de entrada — importa Phaser via CDN e src/main.js
│
├── src/
│   ├── main.js                         # Config do Phaser, gameState global, registro de cenas
│   │
│   ├── Cenas/                          # Cenas do jogo
│   │   ├── cenaCarregamento.js
│   │   ├── cenaInicial.js
│   │   ├── cenaTutorial.js
│   │   ├── cenaConfiguracoes.js
│   │   ├── cenaPrincipal.js
│   │   ├── cenaComida.js
│   │   ├── cenaCuidado.js
│   │   ├── cenaBanho.js
│   │   ├── jogoRacao.js
│   │   ├── jogoAlimentacao.js
│   │   └── jogoLazer.js
│   │
│   └── componentes/                    # Componentes reutilizáveis entre cenas
│       ├── cenaHUD.js                  # HUD sobreposta (barras + moedas)
│       ├── ficha.js                    # Ficha do pet
│       ├── controleCachorro/
│       │   ├── cachorroAnimacao.js     # Classe Cachorro (sprite + animações)
│       │   └── cachorroGeral.js        # Dados do pet atual (porte, fase de vida)
│       └── controleRacoes/
│           ├── racoes.js               # Classe Racao (seleção e exibição)
│           └── dadosRacoes.js          # Dados das 9 rações (3 portes × 3 fases de vida)
│
├── assets/                             # Sprites, fundos, ícones e áudio
│   ├── tela-alimentação/
│   ├── Personagens/
│   └── ...
│
└── document/
    ├── GDD.md                          # Game Design Document completo
    └── other/                          # Imagens e diagramas complementares
```

---

## 🔧 Como Executar


### Opção 1 — VS Code + Live Server (recomendado)

1. Instale a extensão **Live Server** no VS Code
2. Abra a pasta do projeto
3. Clique com o botão direito em "index.html" → **Open with Live Server**
4. O jogo abrirá automaticamente em "http://127.0.0.1:5500"

### Opção 2 — GitLab Pages (sem instalação)

Obs: essa opção apresenta lentidão para ser iniciada, por esse motivo a alternativa acima é mais recomendada

Abra o link: 
https://graduacao.pages.git.inteli.edu.br/2026-1a/t25/g05


## 🧪 Testes

Casos de teste documentados cobrem as principais funcionalidades:

- Responsividade visual em diferentes resoluções de tela
- Funcionamento dos botões da tela inicial (Jogar, Tutorial, Configurações, Sair)
- Sistema de áudio (ativar e desativar)
- Sequenciamento obrigatório das ferramentas no banho (sabão → chuveiro → toalha)
- Feedback visual nas interações (bolhas ao ensaboar, gotas ao enxaguar, brilhos ao concluir)
- Lógica de pontuação, vidas e dificuldade progressiva no minigame de alimentação
- Remoção de pulgas e sistema de estrelas no minigame veterinário
- Comportamento do cursor em áreas interativas e não interativas

Testes de jogabilidade com usuários externos confirmaram boa acessibilidade e progressão natural de dificuldade, com apontamentos para melhoria na responsividade dos controles.

---

## 🗃 Histórico de Lançamentos

| Versão | Descrição | Data |
|---|---|---|
| 0.5.0 | Revisão final do MVP: refinamentos de UX, correção de bugs e otimizações de desempenho | NA
| 0.4.0 | MVP completo: CobasiCoins integrado, quiz de rações e melhorias de navegação entre cenas | 16/03/2026 - 27/03/2026
| 0.3.0 | Implementação dos três minigames (banho, alimentação e veterinário) com sistema de recompensas | 02/03/2026 - 13/03/2026
| 0.2.0 | HUD de status, cena de banho interativa e sprites dos personagens | 16/02/2026 - 27/02/2026
| 0.1.0 | Tela inicial funcional, estrutura de cenas, botões com feedback visual e configurações básicas | 02/02/2026 - 13/02/2026

---

## 📋 Licença / License

<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1">

<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/">
<a property="dct:title" rel="cc:attributionURL" href="https://github.com/Intelihub/Template_M1">COBASI SHELTER</a> by
<a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://github.com/Intelihub/Template_M1">
Inteli, Ana Célia Augusta Santos, Anita Fratelli Sonobe Silveira, Davi Viana Tricarico, Gustavo Luz Fantasia Barbosa, Isaac Nicolas Alves Silva, João Pedro Fuzzo Poveda, Pedro Negri, Valter Lucas Garcia de Lima
</a> is licensed under
<a href="http://creativecommons.org/licenses/by/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">Attribution 4.0 International</a>.
</p>
