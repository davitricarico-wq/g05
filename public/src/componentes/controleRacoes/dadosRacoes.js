/**
 * @typedef {Object} RacaoItem
 * @property {string} nome - Nome de exibição na interface/loja.
 * @property {number} id - Identificador do item. (NOTA DE ARQUITETURA: Como os IDs 1, 2 e 3 
 * se repetem entre as categorias, ao fazer a lógica do Inventário/Loja, lembre-se de 
 * buscar o item pelo `nome`, `sprite` ou criar um ID único real para cada um).
 * @property {string} tipo - Categoria de qualidade (Standard, Premium, Super Premium).
 * @property {string} porte - Tamanho do cão recomendado (Pequeno, Médio, Grande).
 * @property {string} idade - Faixa etária recomendada.
 * @property {string[]} caracteristicas - Tags curtas para exibir na UI da loja.
 * @property {Object} nutrientes - Tabela nutricional, pode ser usada para calcular o 
 * preenchimento extra da barra de saúde/fome no jogo.
 * @property {string} descricao - Texto descritivo para o jogador ler na loja.
 * @property {string[]} exemplos - Marcas reais correspondentes ao tier da ração.
 * @property {string[]} ingredientes - Composição básica da ração.
 * @property {number} valor - Preço da ração na moeda do jogo.
 * @property {string} sprite - Chave da imagem carregada no Phaser.
 */


/** @type {RacaoItem} */
export const racaoStandardPequeno = {
  nome: "Ração Standard para porte pequeno",
  id: 1,
  tipo: "Standard",
  porte: "Pequeno",
  idade: "Até 1 ano",
  caracteristicas: ["Nutrição Essencial", "Baixo Custo"],
  nutrientes: { trigo: "42%", carne: "33%", osso: "10%", gordura: "15%" },
  descricao: "Uma opção acessível e equilibrada para a alimentação diária de cães de pequeno porte. Oferece os nutrientes essenciais para manter energia e saúde geral, com boa combinação de proteínas, carboidratos e vitaminas. Ideal para quem busca uma alimentação confiável e de baixo custo para o dia a dia.",
  exemplos: ["N&D White", "GranPlus Menu", "Fórmula Natural Life"],
  ingredientes: ["Proteínas de origem animal", "Cereais selecionados", "Vitaminas e minerais essenciais", "Fibras naturais"],
  valor: 15,
  sprite: "racaoStandardPequeno"
};

/** @type {RacaoItem} */
export const racaoStandardMedio = {
  nome: "Ração Standard para porte médio",
  id: 2,
  tipo: "Standard",
  porte: "Médio",
  idade: "De 1 a 2 anos",
  caracteristicas: ["Nutrição Essencial", "Baixo Custo"],
  nutrientes: { trigo: "40%", carne: "35%", osso: "10%", gordura: "15%" },
  descricao: "Uma opção acessível e equilibrada para cães de porte médio, oferecendo nutrição essencial para o dia a dia. Combinando proteínas, vitaminas e minerais, ajuda a manter a vitalidade e saúde geral. Indicada para quem procura uma alimentação funcional com ótimo custo inicial.",
  exemplos: ["GranPlus Choice", "Origens Class"],
  ingredientes: ["Proteínas de origem animal", "Cereais selecionados", "Vitaminas e minerais", "Fibras naturais"],
  valor: 25,
  sprite: "racaoStandardMedio"
};

/** @type {RacaoItem} */
export const racaoStandardGrande = {
  nome: "Ração Standard para porte grande",
  id: 3,
  tipo: "Standard",
  porte: "Grande",
  idade: "Acima de 2 anos",
  caracteristicas: ["Nutrição Essencial", "Baixo Custo"],
  nutrientes: { trigo: "38%", carne: "37%", osso: "10%", gordura: "15%" },
  descricao: "Indicada para cães de grande porte, esta ração oferece nutrição básica e equilibrada para manutenção da saúde. Com proteínas, vitaminas e minerais essenciais, garante energia para as atividades diárias. Uma escolha econômica e confiável para alimentação regular.",
  exemplos: ["N&D Senior", "Premier Formula"],
  ingredientes: ["Proteínas de origem animal", "Cereais selecionados", "Vitaminas e minerais", "Fibras naturais"],
  valor: 20,
  sprite: "racaoStandardGrande"
};

/** @type {RacaoItem} */
export const racaoPremiumPequeno = {
  nome: "Ração Premium para porte pequeno",
  id: 1,
  tipo: "Premium",
  porte: "Pequeno",
  idade: "Até 1 ano",
  caracteristicas: ["Melhor Digestão", "Equilíbrio Nutricional"],
  nutrientes: { trigo: "30%", carne: "45%", osso: "10%", gordura: "15%" },
  descricao: "Com ingredientes selecionados e melhor digestibilidade, esta ração oferece um equilíbrio entre qualidade nutricional e custo. A maior presença de proteínas auxilia na energia diária e na manutenção da saúde. Fibras e prebióticos contribuem para digestão mais eficiente, proporcionando nutrição mais completa.",
  exemplos: ["GranPlus Gourmet", "Fórmula Natural Life"],
  ingredientes: ["Proteínas selecionadas", "Arroz e cereais de fácil digestão", "Vitaminas e minerais", "Fibras e prebióticos"],
  valor: 20,
  sprite: "racaoPremiumPequeno"
};

/** @type {RacaoItem} */
export const racaoPremiumMedio = {
  nome: "Ração Premium para porte médio",
  id: 2,
  tipo: "Premium",
  porte: "Médio",
  idade: "De 1 a 2 anos",
  caracteristicas: ["Melhor Digestão", "Equilíbrio Nutricional"],
  nutrientes: { trigo: "28%", carne: "47%", osso: "10%", gordura: "15%" },
  descricao: "Desenvolvida para oferecer nutrição equilibrada, esta ração combina ingredientes de maior qualidade com boa digestibilidade. A maior concentração de proteínas ajuda na manutenção muscular, enquanto vitaminas e minerais reforçam a saúde geral. Uma opção balanceada entre qualidade e preço.",
  exemplos: ["Origens Class", "GranPlus Choice"],
  ingredientes: ["Proteínas nobres", "Vitaminas e minerais", "Ômega 3 e 6", "Fibras naturais"],
  valor: 20,
  sprite: "racaoPremiumMedio"
};

/** @type {RacaoItem} */
export const racaoPremiumGrande = {
  nome: "Ração Premium para porte grande",
  id: 3,
  tipo: "Premium",
  porte: "Grande",
  idade: "Acima de 2 anos",
  caracteristicas: ["Melhor Digestão", "Equilíbrio Nutricional"],
  nutrientes: { trigo: "26%", carne: "49%", osso: "10%", gordura: "15%" },
  descricao: "Indicada para cães de grande porte, esta ração premium oferece melhor digestibilidade e nutrição mais eficiente. Com proteínas de qualidade e nutrientes balanceados, auxilia na manutenção da massa muscular e energia diária. Uma escolha com ótimo equilíbrio entre qualidade e custo.",
  exemplos: ["GranPlus Senior", "Fórmula Natural Life"],
  ingredientes: ["Proteínas selecionadas", "Vitaminas e minerais", "Ômega 3 e 6", "Fibras naturais"],
  valor: 20,
  sprite: "racaoPremiumGrande"
};

/** @type {RacaoItem} */
export const racaoSuperPremiumPequeno = {
  nome: "Ração Super Premium para porte pequeno",
  id: 1,
  tipo: "Super Premium",
  porte: "Pequeno",
  idade: "Até 1 ano",
  caracteristicas: ["Alta Digestibilidade", "Custo-Benefício"],
  nutrientes: { trigo: "20%", carne: "55%", osso: "8%", gordura: "17%" },
  descricao: "Formulada com ingredientes de alta qualidade e maior digestibilidade, esta ração proporciona melhor aproveitamento dos nutrientes. A elevada concentração de proteínas contribui para energia e saúde geral. Apesar do investimento maior, o melhor rendimento nutricional oferece excelente custo-benefício a longo prazo.",
  exemplos: ["Premier Nutrição Clínica", "Golden Senior"],
  ingredientes: ["Proteínas de alta qualidade", "Vitaminas e minerais", "Ômega 3 e 6", "Prebióticos"],
  valor: 20,
  sprite: "racaoSuperPremiumPequeno"
};

/** @type {RacaoItem} */
export const racaoSuperPremiumMedio = {
  nome: "Ração Super Premium para porte médio",
  id: 2,
  tipo: "Super Premium",
  porte: "Médio",
  idade: "De 1 a 2 anos",
  caracteristicas: ["Alta Digestibilidade", "Custo-Benefício"],
  nutrientes: { trigo: "18%", carne: "57%", osso: "8%", gordura: "17%" },
  descricao: "Desenvolvida com ingredientes selecionados, esta ração oferece nutrição avançada e melhor absorção dos nutrientes. A alta concentração de proteínas favorece vitalidade e manutenção muscular. O melhor rendimento alimentar proporciona excelente custo-benefício ao longo do tempo.",
  exemplos: ["Premier Formula", "Pedigree"],
  ingredientes: ["Proteínas de alta qualidade", "Vitaminas e minerais", "Antioxidantes naturais", "Prebióticos"],
  valor: 20,
  sprite: "racaoSuperPremiumMedio"
};

/** @type {RacaoItem} */
export const racaoSuperPremiumGrande = {
  nome: "Ração Super Premium para porte grande",
  id: 3,
  tipo: "Super Premium",
  porte: "Grande",
  idade: "Acima de 2 anos",
  caracteristicas: ["Alta Digestibilidade", "Custo-Benefício"],
  nutrientes: { trigo: "22%", carne: "53%", osso: "9%", gordura: "16%" },
  descricao: "Com formulação mais avançada, esta ração oferece nutrição superior para cães de grande porte. A alta digestibilidade melhora o aproveitamento dos nutrientes, enquanto proteínas de qualidade auxiliam na manutenção da saúde geral. Mesmo com custo maior, o rendimento nutricional garante excelente custo-benefício.",
  exemplos: ["Fórmula Natural", "Premier Formula"],
  ingredientes: ["Proteínas selecionadas", "Vitaminas e minerais", "Ômega 3 e 6", "Fibras e prebióticos"],
  valor: 20,
  sprite: "racaoSuperPremiumGrande"
};