/**  Fases da vida de um cachorro

# -------------------------------
# FILHOTE
# -------------------------------
# - Pequeno porte: 0 a 10 meses
# - Médio porte: 0 a 12 meses
# - Grande porte: 0 a 15 meses

# -------------------------------
# ADULTO
# -------------------------------
# - Pequeno porte: 10 meses até 8 anos
# - Médio porte: 1 até 7 anos
# - Grande porte: 1,5 até 6 anos

# -------------------------------
# SÊNIOR / IDOSO
# -------------------------------
# - Pequeno porte: acima de 8 anos
# - Médio porte: acima de 7 anos
# - Grande porte: acima de 6 anos

**/
// Exporta uma lista (array) base contendo os dados iniciais dos cachorros disponíveis no jogo
export const cachorrosBase = [
  {
    id: 5,
    nome: "Adriel",
    peso: "13 KG",
    idade: "1 ano",
    porte: "medio",
    estado: "sujo",//estado que é modificado apos o banho
    historia: "Encontrado na chuva forte"
  },
  {
    id: 7,
    nome: "Herói",
    peso: "8 KG",
    idade: "8 ano",
    porte: "pequeno",
    estado: "sujo",//estado que é modificado apos o banho
    historia: "Ele foi achado sem um olho na rua"
  }
]