/**
 * @constant {Object} ESTADOS_CACHORRO
 * @enum {string}
 * @description Funciona como um Enumerador (Enum) para a Máquina de Estados (Finite State Machine) do pet.
 */
export const ESTADOS_CACHORRO = {
    /** * @property {string} FELIZ
     * @description Estado alcançado quando as barras de necessidade (Fome, Lazer, etc.) 
     * estão próximas de zero. Dispara animações de comemoração ou repouso satisfeito.
     */
    FELIZ: "feliz",

    /** * @property {string} ENSABOADO
     * @description Estado de transição/intermediário. Usado exclusivamente durante o minigame 
     * ou interação de banho, garantindo o feedback visual da limpeza em progresso.
     */
    ENSABOADO: "ensaboado",

    /** * @property {string} SUJO
     * @description Estado de alerta de necessidade. Alcançado quando a barra de "Limpeza" 
     * atinge um limite crítico, ou como estado inicial (dependendo do banco de dados do pet).
     */
    SUJO: "sujo",

    /** * @property {string} LIMPO
     * @description Estado neutro/base referente à higiene. Alcançado após a conclusão 
     * com sucesso da interação de banho.
     */
    LIMPO: "limpo"
};