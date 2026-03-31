/*
  Classificação Etária de Cães por Porte

  Porte Pequeno (até 10 kg):
    - Filhote: 0 a 6 meses
    - Jovem: 6 meses a 2 anos
    - Adulto: 2 a 7 anos
    - Sênior: 7 a 10 anos
    - Geriátrico: acima de 10 anos

  Porte Médio (10 a 25 kg):
    - Filhote: 0 a 6 meses
    - Jovem: 6 meses a 2 anos
    - Adulto: 2 a 6 anos
    - Sênior: 6 a 9 anos
    - Geriátrico: acima de 9 anos

  Porte Grande (25 a 40 kg):
    - Filhote: 0 a 6 meses
    - Jovem: 6 meses a 2 anos
    - Adulto: 2 a 5 anos
    - Sênior: 5 a 8 anos
    - Geriátrico: acima de 8 anos

*/


// Exportações das descrições das rações

export const racaoStandardPequeno = {
  nome: "Ração Standard para porte pequeno",
  id: 1,
  tipo: "Standart",
  porte: "Pequeno",
  caracteristicas: ["Crescimento Rápido", "Proteção Articular"],
  nutrientes: { trigo: "26%", carne: "48%", osso: "8%", gordura: "18%" },
  descricao: "Pensada para acompanhar o rápido crescimento dos cães grandes, esta ração oferece croquetas maiores e fáceis de mastigar. Com alta concentração de proteínas de origem animal e opções sem cereais, ajuda na formação da massa muscular e protege articulações com condroitina e glucosamina. Além disso, antioxidantes naturais reforçam a imunidade e mantêm a pelagem saudável e brilhante.",
  exemplos: ["N&D White Filhotes Raças Médias e Grandes (7 kg)", "GranPlus Menu Filhotes Carne e Arroz (20 kg)", "Fórmula Natural Life Filhotes Grande Porte (15 kg)"],
  ingredientes: ["Proteínas de alta qualidade (frango, carne, peixe, ovelha)", "Óleos ricos em ômega 3 e 6", "Vitaminas e minerais essenciais", "Fibras naturais e prebióticos", "Conservantes naturais, sem corantes artificiais"],
  valor: 15,
  sprite: "racaoStandardPequeno"
}

export const racaoStandardMedio = {
  nome: "Ração Standard para porte médio",
  id: 2,
  tipo: "Standard",
  porte: "Médio",
  caracteristicas: ["Massa Muscular", "Alta Digestão"],
  nutrientes: { trigo: "35%", carne: "43%", osso: "7%", gordura: "15%" },
  descricao: "Formulada para manter a vitalidade de cães adultos de grande porte, esta ração garante suporte à massa muscular e às articulações, além de oferecer digestibilidade elevada. O equilíbrio de fibras e prebióticos favorece a saúde intestinal, enquanto os nutrientes e antioxidantes naturais reforçam a imunidade e deixam a pelagem mais bonita.",
  exemplos: ["GranPlus Choice Adultos Frango e Carne (20 kg)", "Origens Class Adultos Carne e Frango (20 kg)"],
  ingredientes: ["Proteínas de alta qualidade (frango, carne)", "Complexo vitamínico e mineral completo", "Ômega 3 e 6 para articulações e pelagem", "Antioxidantes naturais", "Fibras e prebióticos para equilíbrio intestinal"],
  valor: 25,
  sprite: "racaoStandardMedio"
}

export const racaoStandardGrande = {
  nome: "Ração Standard para porte grande",
  id: 3,
  tipo: "Standard",
  porte: "Grande",
  caracteristicas: ["Saúde Óssea", "Peso Ideal"],
  nutrientes: { trigo: "43%", carne: "43%", osso: "5%", gordura: "11%" },
  descricao: "Indicada para cães idosos de grande porte, esta ração traz croquetas maiores e nutrientes ajustados para manter a saúde em todas as fases da vida. Com condroitina e glucosamina, protege articulações e ossos, enquanto o controle calórico ajuda a evitar ganho de peso. Antioxidantes naturais reforçam o sistema imunológico e fibras garantem boa digestão.",
  exemplos: ["N&D Senior Raças Grandes Grain-Free", "Premier Formula Senior Raças Grandes"],
  ingredientes: ["Proteínas de origem animal de alta qualidade", "Óleos ricos em ácidos graxos essenciais", "Vitaminas e minerais completos", "Fibras naturais e prebióticos", "Conservantes naturais, sem corantes artificiais"],
  valor: 20,
  sprite: "racaoStandardGrande"
}

export const racaoPremiumPequeno = {
  nome: "Ração Premium para porte pequeno",
  id: 1,
  tipo: "Premium",
  porte: "Pequeno",
  caracteristicas: ["Desenvolvimento", "Energia Diária"],
  nutrientes: { trigo: "26%", carne: "48%", osso: "8%", gordura: "18%" },
  descricao: "Desenvolvida para cães de médio porte em fase de crescimento, esta ração traz croquetas de tamanho intermediário e nutrientes que favorecem articulações e desenvolvimento neurológico. Rica em ômega 3, fibras e prebióticos, promove saúde intestinal e fezes firmes, além de garantir energia e vitalidade para o dia a dia.",
  exemplos: ["GranPlus Gourmet Filhotes Médio Porte (Ovelha e Arroz, 3 kg)", "Fórmula Natural Life Filhotes Médio Porte (15 kg)"],
  ingredientes: ["Proteínas nobres (ovelha, frango)", "Arroz como fonte de carboidrato de fácil digestão", "Complexo vitamínico e mineral", "Fibras e prebióticos para flora intestinal", "Conservantes naturais"],
  valor: 20,
  sprite: "racaoPremiumPequeno"
}

export const racaoPremiumMedio = {
  nome: "Ração Premium para porte médio",
  id: 2,
  tipo: "Premium",
  porte: "Médio",
  caracteristicas: ["Pele Saudável", "Redução de Odor"],
  nutrientes: { trigo: "35%", carne: "43%", osso: "7%", gordura: "15%" },
  descricao: "Ideal para cães adultos de médio porte, esta ração ajuda a manter a massa muscular e a saúde dos ossos e dentes. Com fibras naturais e prebióticos, favorece a digestão e reduz o odor das fezes. Além disso, antioxidantes e ômega 3 e 6 contribuem para uma pelagem brilhante e pele saudável.",
  exemplos: ["Origens Class Adultos Carne e Frango (20 kg)", "GranPlus Choice Adultos Frango e Carne (20 kg)"],
  ingredientes: ["Proteínas nobres (carne e frango)", "Ômega 3 e 6, biotina e zinco quelato", "Antioxidantes naturais (vitamina C, E, selênio)", "Fibras naturais para digestão", "Sem corantes ou aromatizantes artificiais"],
  valor: 20,
  sprite: "racaoPremiumMedio"
}

export const racaoPremiumGrande = {
  nome: "Ração Premium para porte grande",
  id: 3,
  tipo: "Premium",
  porte: "Grande",
  caracteristicas: ["Saúde Óssea", "Peso Ideal"],
  caracteristicas: ["Preservação", "Longevidade"],
  nutrientes: { trigo: "43%", carne: "43%", osso: "5%", gordura: "11%" },
  descricao: "Com nutrientes ajustados para cães idosos de médio porte, esta ração ajuda a preservar a massa muscular e protege articulações com condroitina e glucosamina. O controle calórico evita obesidade, enquanto antioxidantes retardam o envelhecimento celular. Fibras e prebióticos garantem equilíbrio intestinal e melhor aproveitamento dos nutrientes.",
  exemplos: ["GranPlus Senior Carne e Arroz", "Fórmula Natural Life Senior Medio Porte"],
  ingredientes: ["Proteínas nobres (frango, carne, peixe)", "Complexo vitamínico e mineral", "Ômega 3 e 6 para articulações e pelagem", "Fibras e prebióticos para equilíbrio intestinal"],
  valor: 20,
  sprite: "racaoPremiumGrande"
}

export const racaoSuperPremiumPequeno = {
  nome: "Ração Super Premium para porte pequeno",
  id: 1,
  tipo: "Super Premium",
  porte: "Pequeno",
  caracteristicas: ["Fácil Mastigação", "Saúde Imune"],
  nutrientes: { trigo: "43%", carne: "43%", osso: "5%", gordura: "11%" },
  descricao: "Especialmente formulada para cães idosos de pequeno porte, esta ração traz croquetas pequenas e fáceis de mastigar. Com calorias reduzidas, ajuda a controlar o peso, enquanto antioxidantes reforçam a imunidade. Ômega 3 e 6 mantêm pele e pelagem saudáveis, e fibras naturais favorecem a digestão.",
  exemplos: ["Premier Nutrição Clínica Senior Raças Pequenas", "Golden Senior Raças Pequenas Frango e Arroz"],
  ingredientes: ["Proteínas de alta digestibilidade (frango, carne)", "Fibras naturais e prebióticos", "Vitaminas e minerais balanceados", "Sem corantes ou aromatizantes artificiais"],
  valor: 20,
  sprite: "racaoSuperPremiumPequeno"
}

export const racaoSuperPremiumMedio = {
  nome: "Ração Super Premium para porte médio",
  id: 2,
  tipo: "Super Premium",
  porte: "Médio",
  caracteristicas: ["Alta Palatibilidade", "Defesa Natural"],
  nutrientes: { trigo: "35%", carne: "43%", osso: "7%", gordura: "15%" },
  descricao: "Indicada para cães adultos de pequeno porte, esta ração traz croquetas menores e altamente palatáveis, ideais para cães exigentes. Com vitamina E e antioxidantes naturais, fortalece a imunidade, enquanto fibras e prebióticos garantem equilíbrio intestinal. A pelagem fica mais bonita e saudável.",
  exemplos: ["Ração Úmida Pedigree Sachê Adultos Raças Pequenas (Cordeiro e Frango)", "Premier Formula Adultos Raças Pequenas (Frango, 20 kg)"],
  ingredientes: ["Proteínas de origem animal (frango, cordeiro)", "Fibras especiais e prebióticos", "Complexo vitamínico e mineral", "Antioxidantes naturais", "Sem conservantes ou aromatizantes artificiais"],
  valor: 20,
  sprite: "racaoSuperPremiumMedio"
}

export const racaoSuperPremiumGrande = {
  nome: "Ração Super Premium para porte grande",
  id: 3,
  tipo: "Super Premium",
  porte: "Grande",
  caracteristicas: ["Saúde Cerebral", "Odor Reduzido"],
  nutrientes: { trigo: "26%", carne: "48%", osso: "8%", gordura: "18%" },
  descricao: "Perfeita para cães pequenos em fase de crescimento, esta ração traz croquetas adaptadas ao tamanho da boca e sabor irresistível para estimular o apetite. Com DHA e ômega 3, favorece o desenvolvimento cerebral e mantém pele e pelagem saudáveis. Também reduz o odor das fezes e fortalece as defesas naturais.",
  exemplos: ["Fórmula Natural Fresh Meat Filhotes Mini e Pequeno (Frango, 1 kg)", "Fórmula Natural Life Super Premium Filhotes Minis e Pequenos (1 kg)", "Golden Formula Filhotes Raças Pequenas (Carne e Arroz, 10,1 kg)", "Premier Formula Filhotes Raças Pequenas (Frango, 20 kg)"],
  ingredientes: ["Proteínas de origem animal (frango/carne)", "Óleos ricos em ácidos graxos essenciais (ômega 3 e 6)", "Fibras naturais para digestão", "Vitaminas e minerais balanceados", "Sem corantes ou aromatizantes artificiais"],
  valor: 20,
  sprite: "racaoSuperPremiumGrande"
}