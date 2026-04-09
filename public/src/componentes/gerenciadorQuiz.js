/**
 * @class GerenciadorQuiz
 * @description Classe controladora (Controller) para o minigame de perguntas e respostas.
 * * Arquitetura: Esta classe isola completamente a lógica de negócios (pontuação, validação) 
 * da interface de usuário (Phaser). Ela não "sabe" como o jogo é desenhado na tela, 
 * apenas fornece os dados para quem pedir.
 */
export class GerenciadorQuiz {
    /**
     * @constructor
     * @description Inicializa o banco de dados local do quiz e os controladores de estado (pontuação e progresso).
     */
    constructor() {
        // Banco de perguntas estruturado em objetos.
        // * Boa prática: Se o jogo crescer muito, no futuro você pode mover esse array 
        // para um arquivo JSON externo e apenas carregá-lo aqui.
        this.perguntas = [
            {
                texto: "Por que as rações Super Premium são consideradas a melhor opção nutricional para os cães?",
                opcoes: [
                    "A. Elas utilizam exclusivamente grãos e cereais como principal fonte de proteína.",
                    "B. Elas possuem maior digestibilidade e proteínas de origem animal de alta qualidade, exigindo porções menores.",
                    "C. Elas são iguais às rações Standard, mas possuem embalagens mais atrativas e caras.",
                    "D. Elas são feitas com muitos corantes artificiais para atrair o paladar do animal."
                ],
                indiceCorreto: 1 // Letra B (Índice 1 no array de opções)
            },
            {
                texto: "Um dos benefícios visíveis ao se alimentar um cão com ração Super Premium é em relação às fezes. O que costuma acontecer?",
                opcoes: [
                    "A. O volume e o odor das fezes diminuem, pois o cão absorve melhor os nutrientes da dieta.",
                    "B. O cão passa a defecar muito mais vezes ao dia para limpar o intestino.",
                    "C. As fezes ficam coloridas devido aos ingredientes naturais e extratos de plantas.",
                    "D. Não há nenhuma mudança perceptível nas fezes em comparação com as rações do tipo Standard."
                ],
                indiceCorreto: 0 // Letra A
            },
            {
                texto: "Qual é a principal característica que diferencia uma ração formulada para filhotes de uma ração para cães adultos?",
                opcoes: [
                    "A. Possui maior concentração de proteínas, cálcio e calorias para sustentar o crescimento rápido e saudável.",
                    "B. É feita apenas com vegetais cozidos para não irritar o estômago sensível do animal recém-nascido.",
                    "C. Contém menos calorias para evitar que o filhote engorde logo nos primeiros meses de vida.",
                    "D. É exatamente igual à de adultos, apenas o tamanho do grão é reduzido para caber na boca."
                ],
                indiceCorreto: 0 // Letra A
            },
            {
                texto: "Por que é extremamente importante escolher uma ração específica para o porte (tamanho) do seu cachorro?",
                opcoes: [
                    "A. Cães pequenos precisam consumir exatamente as mesmas calorias que os grandes, mas em grãos coloridos.",
                    "B. Não há importância clínica; qualquer cachorro pode comer qualquer tamanho de grão sem nenhum risco.",
                    "C. Cães grandes não gostam do sabor das rações fabricadas para cães pequenos.",
                    "D. O tamanho do grão é adaptado à mandíbula do cão, facilitando a mastigação correta e evitando engasgos."
                ],
                indiceCorreto: 3 // Letra D
            },
            {
                texto: "Quando um cachorro atinge a fase idosa (Sênior), o que a ração dele deve oferecer de diferente em relação à fase adulta?",
                opcoes: [
                    "A. Menos calorias para evitar obesidade e suplementos como condroitina e glicosamina para proteger as articulações.",
                    "B. O grão deve ser o mais duro e maciço possível para forçar a mastigação e raspar o tártaro acumulado.",
                    "C. Apenas cálcio puro, já que os dentes caem e eles não podem mais comer proteínas animais.",
                    "D. O dobro de calorias, pois os cães idosos gastam muita energia correndo e precisam repor massa."
                ],
                indiceCorreto: 0 // Letra A
            },
            {
                texto: "Ao ler o rótulo de uma ração Super Premium, qual tipo de ingrediente você deve esperar encontrar logo no primeiro item da lista de composição?",
                opcoes: [
                    "A. Corantes coloridos e conservantes artificiais como BHA e BHT.",
                    "B. Fontes de proteína animal, como carne mecanicamente separada de frango, cordeiro ou farinha de vísceras.",
                    "C. Milho integral ou farelo de soja como os principais componentes da dieta.",
                    "D. Grandes quantidades de cloreto de sódio (sal comum) para aumentar a palatabilidade e aceitação do pet."
                ],
                indiceCorreto: 1 // Letra B
            },
            {
                texto: "Qual é a principal diferença técnica nos conservantes entre uma ração Premium e uma Super Premium?",
                opcoes: [
                    "A. A ração Premium é conservada a vácuo, enquanto a Super Premium usa gases nobres na embalagem.",
                    "B. Não há diferença nos ingredientes de conservação, apenas no tamanho do pacote vendido nas lojas.",
                    "C. A Super Premium costuma utilizar conservantes naturais (como Vitamina E e Alecrim), enquanto a Premium geralmente usa antioxidantes sintéticos (BHA/BHT).",
                    "D. A Super Premium é vendida congelada para não precisar de conservantes, diferentemente da Premium seca."
                ],
                indiceCorreto: 2 // Letra C
            }
        ];
        
        // Ponteiro de navegação (qual pergunta está sendo exibida no momento)
        this.indiceAtual = 0;
        
        // Variável de estado para armazenar a pontuação do jogador
        this.pontuacao = 0;
    }

    /**
     * @method obterPerguntaAtual
     * @description Consulta o banco de dados e retorna o objeto da pergunta em que o jogador está.
     * @returns {Object} Objeto contendo texto, opções e índice correto.
     */
    obterPerguntaAtual() {
        return this.perguntas[this.indiceAtual];
    }

    /**
     * @method responder
     * @description Processa a tentativa do jogador, valida contra o gabarito e gerencia a pontuação.
     * @param {number} indiceEscolhido - O índice (0 a 3) do botão que o jogador clicou.
     * @returns {boolean} Retorna `true` se acertou ou `false` se errou. Útil para a cena tocar um som de acerto/erro.
     */
    responder(indiceEscolhido) {
        const pergunta = this.obterPerguntaAtual();
        
        // Validação estrita de igualdade
        const acertou = (indiceEscolhido === pergunta.indiceCorreto);
        
        // Se a resposta for verdadeira, incrementa a pontuação
        if (acertou) {
            this.pontuacao++;
        }
        
        return acertou;
    }

    /**
     * @method avancarPergunta
     * @description Move o ponteiro do quiz para a próxima pergunta.
     * * Detalhe de Design: Separar o "responder" do "avançar" permite que a interface gráfica 
     * faça uma pausa (ex: mostre a cor verde no botão certo por 2 segundos) antes de mudar de tela.
     * @returns {boolean} Retorna `true` se houver uma próxima pergunta, ou `false` se o quiz chegou ao fim.
     */
    avancarPergunta() {
        this.indiceAtual++;
        
        // Verifica se o ponteiro ultrapassou o tamanho total do array
        return this.indiceAtual < this.perguntas.length; 
    }

    /**
     * @method obterPontuacao
     * @description Formata e devolve os dados finais de desempenho do jogador.
     * @returns {Object} Um objeto contendo a quantidade de acertos e o total de questões.
     */
    obterPontuacao() {
        return {
            acertos: this.pontuacao,
            total: this.perguntas.length
        };
    }

    /**
     * @method reiniciar
     * @description Zera os estados de controle, permitindo que o minigame seja jogado novamente 
     * sem precisar recarregar a página ou instanciar a classe outra vez.
     */
    reiniciar() {
        this.indiceAtual = 0;
        this.pontuacao = 0;
    }
}