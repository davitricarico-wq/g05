/**
 * @constant {Array<Object>} cachorrosBase
 * @description Funciona como o "Banco de Dados" inicial (Seed/Mock) do jogo. 
 * Contém as informações base, lore (história) e status iniciais de cada pet disponível.
 * * * Arquitetura: Centralizar esses dados em um único arquivo facilita o balanceamento 
 * do jogo e a adição de novos pets no futuro, sem precisar alterar a lógica das cenas 
 * ou dos componentes visuais. Ao iniciar o jogo ou adotar um pet, o sistema deve 
 * fazer uma cópia profunda (Deep Copy) destes objetos para o `gameState` global, 
 * garantindo que este molde original nunca seja alterado.
 */
export const cachorrosBase = [
  {
    // Identificador único (Primary Key) usado para buscar o pet na lógica do jogo
    id: 2,
    nome: "Adriel",
    peso: "13 KG",
    idade: "1 Ano e 2 meses",
    porte: "Médio",
    
    // O estado inicial que se conecta com a Máquina de Estados (ESTADOS_CACHORRO).
    // O jogo lerá isso ao iniciar para definir se o minigame de banho é necessário logo de cara.
    estado: "sujo", 
    
    // Lore/Background do pet (Usado em telas de perfil ou adoção para gerar empatia)
    historia: "Encontrado na chuva forte"
  },
  {
    id: 1,
    nome: "Herói",
    peso: "8 KG",
    idade: "8 anos",
    porte: "Pequeno",
    estado: "sujo", 
    historia: "Ele foi achado sem um olho na rua"
  },
  {
    id: 3,
    nome: "João",
    peso: "17 KG",
    idade: "12 anos",
    porte: "Médio",
    
    // Diferente dos outros, este pet já começa com a necessidade de limpeza satisfeita
    estado: "limpo",
    historia: "Abandonado devido o problema financeiro do antigo dono"
  }
];