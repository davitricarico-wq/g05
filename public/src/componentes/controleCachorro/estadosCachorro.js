// Exporta um objeto constante para centralizar e padronizar todos os estados possíveis do cachorro no jogo
export const ESTADOS_CACHORRO = {
    // Estado usado quando o pet está com as necessidades atendidas e de bom humor
    FELIZ: "feliz",
    // Estado temporário usado durante a etapa do banho (com espuma/sabão)
    ENSABOADO: "ensaboado",
    // Estado usado quando o pet precisa ser limpo pelo jogador
    SUJO: "sujo",
    // Estado padrão após o banho ou quando o pet ainda não se sujou
    LIMPO: "limpo"
}