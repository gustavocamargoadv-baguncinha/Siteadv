import type { Area } from "./tipos";

// ------------------------------------------------------------------
// Conteúdo do jogo: casos, teses, armadilhas, submundo e progressão.
// Casos têm "tier" (1 a 3): conforme o escritório e a cidade evoluem,
// mudam não só os valores, mas o TIPO de causa — do mercadinho local
// ao banco e à multinacional; do pequeno furto ao júri e às operações.
// As teses são embaralhadas na geração (ver motor.ts).
// ------------------------------------------------------------------

export const ROTULO_AREA: Record<Area, string> = {
  trabalhista: "Trabalhista",
  civel: "Cível",
  consumidor: "Consumidor",
  familia: "Família",
  criminal: "Criminal",
  empresarial: "Empresarial",
};

export const EMOJI_AREA: Record<Area, string> = {
  trabalhista: "👷",
  civel: "⚖️",
  consumidor: "🛒",
  familia: "👨‍👩‍👧",
  criminal: "🚔",
  empresarial: "🏢",
};

export interface Arquetipo {
  area: Area;
  titulo: string;
  tier: 1 | 2 | 3;
  resumo: string;
  complexidade: number;
  valorBase: number;
  sinal: string;
  teses: { texto: string; correta: boolean }[];
}

// --- Casos "de verdade" (têm caminho de vitória com as teses certas) ---
export const ARQUETIPOS: Arquetipo[] = [
  // ================= TIER 1 — começo de carreira (causas locais) =================
  {
    area: "trabalhista", tier: 1, titulo: "Horas extras no comércio local", complexidade: 2, valorBase: 4500,
    resumo: "Balconista de mercadinho fez hora extra todo dia por 2 anos, sem registro nem pagamento. Colegas confirmam e há fotos do ponto.",
    sinal: "Prova testemunhal e indícios da jornada — pedido consistente.",
    teses: [
      { texto: "Horas extras com adicional de 50% e reflexos em férias, 13º e FGTS", correta: true },
      { texto: "Prova da jornada por testemunhas e registros informais", correta: true },
      { texto: "Intervalo intrajornada não usufruído (art. 71 CLT)", correta: true },
      { texto: "Pedir estabilidade decenal já revogada há décadas", correta: false },
      { texto: "Dano moral por mero descumprimento contratual", correta: false },
    ],
  },
  {
    area: "trabalhista", tier: 1, titulo: "Verbas rescisórias não pagas", complexidade: 1, valorBase: 3500,
    resumo: "Trabalhador dispensado sem receber saldo de salário, aviso prévio e férias. A empresa some quando cobrada.",
    sinal: "Verbas incontroversas não pagas — caminho direto.",
    teses: [
      { texto: "Saldo de salário, aviso prévio, férias + 1/3 e 13º proporcional", correta: true },
      { texto: "Multa do art. 477 da CLT pelo atraso na quitação", correta: true },
      { texto: "Liberação do FGTS + 40% e guias do seguro-desemprego", correta: true },
      { texto: "Pedir reintegração sem qualquer estabilidade", correta: false },
      { texto: "Reconhecer justa causa do próprio empregado", correta: false },
    ],
  },
  {
    area: "consumidor", tier: 1, titulo: "Produto com vício não resolvido", complexidade: 1, valorBase: 3000,
    resumo: "Celular novo apresentou defeito, foi 3 vezes à assistência em 30 dias e não foi resolvido. Cliente tem as ordens de serviço.",
    sinal: "Prazo de 30 dias esgotado sem solução, com ordens de serviço.",
    teses: [
      { texto: "Opções do art. 18 do CDC (troca, abatimento ou restituição)", correta: true },
      { texto: "Responsabilidade solidária de fabricante e loja", correta: true },
      { texto: "Dano moral pelo desgaste e privação prolongada do bem", correta: true },
      { texto: "Rescindir todo o contrato de telefonia da operadora por tabela", correta: false },
      { texto: "Pedir a prisão do gerente da loja", correta: false },
    ],
  },
  {
    area: "consumidor", tier: 1, titulo: "Voo cancelado sem assistência", complexidade: 2, valorBase: 4200,
    resumo: "Companhia cancelou o voo e deixou o cliente 14h no aeroporto sem hotel nem alimentação. Ele tem os comprovantes de gastos.",
    sinal: "Falha clara na prestação do serviço, com comprovantes.",
    teses: [
      { texto: "Responsabilidade objetiva do fornecedor (art. 14 CDC)", correta: true },
      { texto: "Dano moral pela falha e pelo descaso na assistência", correta: true },
      { texto: "Danos materiais com base nos comprovantes de gastos", correta: true },
      { texto: "Invocar a Convenção de Montreal para limitar a própria indenização", correta: false },
      { texto: "Pedir a cassação da concessão da companhia aérea", correta: false },
    ],
  },
  {
    area: "consumidor", tier: 1, titulo: "Cobrança indevida na conta", complexidade: 1, valorBase: 2800,
    resumo: "O banco debitou por meses tarifas e um 'seguro' que o cliente nunca contratou.",
    sinal: "Débitos sem contratação — devolução em dobro cabível.",
    teses: [
      { texto: "Declaração de inexistência do débito e fim da cobrança", correta: true },
      { texto: "Repetição do indébito em dobro (art. 42, § único, CDC)", correta: true },
      { texto: "Inversão do ônus da prova quanto à contratação", correta: true },
      { texto: "Quebra do sigilo bancário de todos os correntistas do banco", correta: false },
      { texto: "Prisão do gerente por estelionato na ação cível", correta: false },
    ],
  },
  {
    area: "civel", tier: 1, titulo: "Acidente de trânsito leve", complexidade: 2, valorBase: 4000,
    resumo: "Cliente teve o carro atingido por condutor que avançou a preferencial. Tem BO e orçamentos do conserto.",
    sinal: "Culpa demonstrável e danos com orçamentos.",
    teses: [
      { texto: "Responsabilidade civil por culpa (art. 186 CC) e nexo causal", correta: true },
      { texto: "Danos materiais pelo conserto conforme orçamentos", correta: true },
      { texto: "Despesas com transporte durante o período de reparo", correta: true },
      { texto: "Responsabilidade objetiva do particular sem previsão legal", correta: false },
      { texto: "Dano moral por simples avaria, sem qualquer repercussão", correta: false },
    ],
  },
  {
    area: "civel", tier: 1, titulo: "Vazamento do apartamento de cima", complexidade: 2, valorBase: 2500,
    resumo: "Infiltração vinda do apartamento superior danificou o teto e os móveis do cliente. O vizinho se recusa a arcar.",
    sinal: "Dano material com nexo no imóvel superior — laudo resolve.",
    teses: [
      { texto: "Prova pericial da origem do vazamento no imóvel de cima", correta: true },
      { texto: "Indenização dos danos materiais (reparos e móveis)", correta: true },
      { texto: "Notificação e produção antecipada de prova, se necessário", correta: true },
      { texto: "Pedir a demolição do apartamento vizinho", correta: false },
      { texto: "Ação penal por dano, que exige dolo aqui inexistente", correta: false },
    ],
  },
  {
    area: "familia", tier: 1, titulo: "Divórcio consensual", complexidade: 1, valorBase: 3500,
    resumo: "Casal sem filhos menores e com poucos bens quer se divorciar de forma amigável e rápida.",
    sinal: "Consenso entre as partes — via rápida, até extrajudicial.",
    teses: [
      { texto: "Divórcio consensual, inclusive por escritura pública em cartório", correta: true },
      { texto: "Partilha amigável dos bens conforme o acordo", correta: true },
      { texto: "Retomada do nome de solteiro, se desejado", correta: true },
      { texto: "Discutir a culpa pelo fim do casamento, hoje irrelevante", correta: false },
      { texto: "Exigir audiência de instrução em caso totalmente consensual", correta: false },
    ],
  },
  {
    area: "familia", tier: 1, titulo: "Fixação de pensão alimentícia", complexidade: 2, valorBase: 3800,
    resumo: "Mãe precisa fixar alimentos para o filho de 6 anos; o pai tem emprego formal, mas não contribui.",
    sinal: "Binômio necessidade-possibilidade favorável, pai com renda.",
    teses: [
      { texto: "Alimentos pelo binômio necessidade × possibilidade", correta: true },
      { texto: "Alimentos provisórios já no início da ação", correta: true },
      { texto: "Desconto direto em folha de pagamento do alimentante", correta: true },
      { texto: "Prisão do pai antes mesmo da fixação dos alimentos", correta: false },
      { texto: "Vincular a pensão às visitas, o que é vedado", correta: false },
    ],
  },
  {
    area: "criminal", tier: 1, titulo: "Furto de pequeno valor", complexidade: 3, valorBase: 5000,
    resumo: "Réu primário preso por furtar um item de baixo valor em mercado. Bom comportamento, confessou, mercadoria recuperada.",
    sinal: "Réu primário, res de pequeno valor e bem restituído.",
    teses: [
      { texto: "Princípio da insignificância (bagatela) diante do ínfimo valor", correta: true },
      { texto: "Furto privilegiado (art. 155, §2º CP) por primariedade e pequeno valor", correta: true },
      { texto: "Atenuante da confissão espontânea (art. 65, III, 'd', CP)", correta: true },
      { texto: "Legítima defesa como excludente em crime patrimonial", correta: false },
      { texto: "Negar a autoria apesar da confissão e das câmeras", correta: false },
    ],
  },
  {
    area: "criminal", tier: 1, titulo: "Lesão corporal leve em briga", complexidade: 2, valorBase: 4500,
    resumo: "Cliente se envolveu em briga de bar e responde por lesão leve. Houve provocação e ele tem bons antecedentes.",
    sinal: "Réu primário, provocação da vítima e lesão de menor gravidade.",
    teses: [
      { texto: "Legítima defesa diante da agressão iniciada pela vítima", correta: true },
      { texto: "Atenuantes de primariedade e bons antecedentes", correta: true },
      { texto: "Transação penal / composição civil (Lei 9.099/95)", correta: true },
      { texto: "Alegar inimputabilidade sem qualquer laudo", correta: false },
      { texto: "Negar a autoria diante de várias testemunhas", correta: false },
    ],
  },
  {
    area: "criminal", tier: 1, titulo: "Embriaguez ao volante", complexidade: 2, valorBase: 5500,
    resumo: "Cliente autuado no art. 306 do CTB. Recusou o bafômetro e não houve exame de sangue.",
    sinal: "Prova da embriaguez frágil sem teste — foco na materialidade.",
    teses: [
      { texto: "Fragilidade probatória sem exame ou teste conclusivo", correta: true },
      { texto: "Ausência de comprovação da concentração exigida em lei", correta: true },
      { texto: "Suspensão condicional do processo, se cabível", correta: true },
      { texto: "Confessar a embriaguez e pedir só a redução da multa", correta: false },
      { texto: "Alegar estado de necessidade sem nenhuma emergência", correta: false },
    ],
  },
  {
    area: "empresarial", tier: 1, titulo: "Cobrança de dívida documentada", complexidade: 2, valorBase: 6500,
    resumo: "Pequena empresa não recebeu por serviços prestados. Tem contrato assinado, notas e e-mails confirmando a dívida.",
    sinal: "Prova escrita robusta da dívida — bom para monitória.",
    teses: [
      { texto: "Ação monitória com prova escrita sem eficácia executiva", correta: true },
      { texto: "Correção monetária e juros de mora desde o vencimento", correta: true },
      { texto: "Protesto e negativação do devedor como reforço", correta: true },
      { texto: "Pedir a falência da empresa por uma única fatura em atraso", correta: false },
      { texto: "Prisão do sócio por dívida civil", correta: false },
    ],
  },

  // ================= TIER 2 — escritório consolidado (causas maiores) =================
  {
    area: "trabalhista", tier: 2, titulo: "Horas extras de bancário", complexidade: 3, valorBase: 9000,
    resumo: "Bancário trabalhou anos além da 6ª hora sem receber a 7ª e a 8ª como extras, sob metas e pressão por resultados.",
    sinal: "Jornada especial do bancário (6h) — 7ª e 8ª horas como extra.",
    teses: [
      { texto: "7ª e 8ª horas como extras (jornada de 6h, art. 224 CLT)", correta: true },
      { texto: "Reflexos das extras em férias, 13º, FGTS e repousos", correta: true },
      { texto: "Afastar o cargo de confiança do art. 224, §2º, da CLT", correta: true },
      { texto: "Pedir adicional de insalubridade sem qualquer agente nocivo", correta: false },
      { texto: "Sustentar vínculo com o cliente do banco, e não com o banco", correta: false },
    ],
  },
  {
    area: "trabalhista", tier: 2, titulo: "Reversão de justa causa", complexidade: 3, valorBase: 6000,
    resumo: "Empregado dispensado por 'desídia', mas nunca foi advertido antes e a punição veio meses depois do fato.",
    sinal: "Faltam imediatidade e gradação da pena — bom para reversão.",
    teses: [
      { texto: "Ausência de imediatidade entre a falta e a punição", correta: true },
      { texto: "Falta de gradação/proporcionalidade da pena disciplinar", correta: true },
      { texto: "Reversão para dispensa imotivada com verbas + FGTS+40%", correta: true },
      { texto: "Confessar o ato faltoso e apenas pedir redução da multa", correta: false },
      { texto: "Alegar acidente de trabalho sem nexo nem CAT", correta: false },
    ],
  },
  {
    area: "trabalhista", tier: 2, titulo: "Reconhecimento de vínculo (PJ x CLT)", complexidade: 4, valorBase: 9000,
    resumo: "Prestador 'PJ' que batia ponto, tinha chefe e metas por 3 anos. Quer reconhecer o vínculo e as verbas.",
    sinal: "Presentes pessoalidade, subordinação, habitualidade e onerosidade.",
    teses: [
      { texto: "Vínculo pela primazia da realidade (art. 9º CLT)", correta: true },
      { texto: "Pessoalidade, subordinação, habitualidade e onerosidade", correta: true },
      { texto: "Verbas rescisórias, FGTS e anotação em CTPS", correta: true },
      { texto: "Sustentar que a 'pejotização' foi lícita por haver contrato", correta: false },
      { texto: "Dano moral por assédio sem nenhum episódio narrado", correta: false },
    ],
  },
  {
    area: "consumidor", tier: 2, titulo: "Plano de saúde negou procedimento", complexidade: 3, valorBase: 8000,
    resumo: "Operadora negou cirurgia indicada por médico, alegando que não consta no rol. Cliente tem laudo e urgência.",
    sinal: "Negativa contra indicação médica — jurisprudência favorável.",
    teses: [
      { texto: "Abusividade da negativa diante da indicação médica (CDC)", correta: true },
      { texto: "Rol da ANS como referência, não vedação absoluta", correta: true },
      { texto: "Tutela de urgência para autorização imediata do procedimento", correta: true },
      { texto: "Pedir o descredenciamento da operadora pela ANS na ação", correta: false },
      { texto: "Rescindir o contrato do cliente como 'punição' à operadora", correta: false },
    ],
  },
  {
    area: "consumidor", tier: 2, titulo: "Negativação indevida", complexidade: 2, valorBase: 3800,
    resumo: "Cliente foi negativado por dívida que já havia pago. Tem o comprovante. Não possui outras negativações.",
    sinal: "Prova de pagamento em mãos e nome limpo fora essa inscrição.",
    teses: [
      { texto: "Inversão do ônus da prova (art. 6º, VIII, CDC)", correta: true },
      { texto: "Dano moral in re ipsa pela inscrição indevida", correta: true },
      { texto: "Repetição do indébito em dobro (art. 42, § único, CDC)", correta: true },
      { texto: "Insistir em dano moral ignorando a Súmula 385 do STJ", correta: false },
      { texto: "Pedir prisão civil do gerente do banco", correta: false },
    ],
  },
  {
    area: "civel", tier: 2, titulo: "Acidente com sequelas permanentes", complexidade: 3, valorBase: 8000,
    resumo: "Cliente foi abalroado por motorista que furou o sinal. Tem BO, laudo e ficou com sequela no joelho.",
    sinal: "Nexo causal e culpa bem documentados (BO + testemunha + laudo).",
    teses: [
      { texto: "Responsabilidade por culpa (art. 186 CC) e nexo causal", correta: true },
      { texto: "Danos materiais e lucros cessantes comprovados", correta: true },
      { texto: "Dano moral e estético pela sequela permanente", correta: true },
      { texto: "Responsabilidade objetiva do particular sem previsão legal", correta: false },
      { texto: "Apreensão definitiva do veículo do réu", correta: false },
    ],
  },
  {
    area: "familia", tier: 2, titulo: "Guarda e alimentos", complexidade: 3, valorBase: 5500,
    resumo: "Mãe busca regularizar a guarda e fixar pensão. O pai é presente, mas as partes não se entendem sobre a convivência.",
    sinal: "Pai presente e com renda — cenário clássico de guarda compartilhada.",
    teses: [
      { texto: "Guarda compartilhada como regra (art. 1.584, §2º CC)", correta: true },
      { texto: "Melhor interesse da criança como vetor da convivência", correta: true },
      { texto: "Alimentos pelo binômio necessidade × possibilidade", correta: true },
      { texto: "Acusar alienação parental sem laudo nem qualquer prova", correta: false },
      { texto: "Pedir a perda do poder familiar do pai por mera divergência", correta: false },
    ],
  },
  {
    area: "familia", tier: 2, titulo: "União estável e partilha", complexidade: 3, valorBase: 9000,
    resumo: "Cliente viveu 12 anos com o companheiro, construíram patrimônio, mas nada está no nome dela. Ele nega a união.",
    sinal: "Convivência pública e duradoura, com patrimônio comum.",
    teses: [
      { texto: "Reconhecimento da união estável (convivência pública e duradoura)", correta: true },
      { texto: "Partilha dos bens onerosos da constância (comunhão parcial)", correta: true },
      { texto: "Prova por testemunhas, fotos e documentos da vida em comum", correta: true },
      { texto: "Pleitear herança de companheiro ainda vivo", correta: false },
      { texto: "Exigir 50% de bens anteriores ao início da união", correta: false },
    ],
  },
  {
    area: "criminal", tier: 2, titulo: "Tráfico — desclassificação para uso", complexidade: 4, valorBase: 12000,
    resumo: "Cliente preso com pequena quantidade, primário, sem ligação com organização. Acusado de tráfico.",
    sinal: "Pequena quantidade e primariedade — uso ou tráfico privilegiado.",
    teses: [
      { texto: "Desclassificação para porte de uso próprio (art. 28) pelo contexto", correta: true },
      { texto: "Tráfico privilegiado (art. 33, §4º) por primariedade", correta: true },
      { texto: "Nulidade se houve busca domiciliar sem fundadas razões", correta: true },
      { texto: "Alegar legítima defesa no crime de tráfico", correta: false },
      { texto: "Negar a posse diante de flagrante e testemunhas", correta: false },
    ],
  },
  {
    area: "criminal", tier: 2, titulo: "Roubo — participação menor", complexidade: 4, valorBase: 11000,
    resumo: "Réu jovem que apenas dirigiu o carro, sem portar arma nem entrar no local. Primário.",
    sinal: "Conduta periférica — participação de menor importância.",
    teses: [
      { texto: "Participação de menor importância (art. 29, §1º CP)", correta: true },
      { texto: "Afastamento da majorante de arma que ele não portava", correta: true },
      { texto: "Atenuantes da menoridade relativa e primariedade", correta: true },
      { texto: "Assumir coautoria plena para 'colaborar'", correta: false },
      { texto: "Legítima defesa contra a vítima do roubo", correta: false },
    ],
  },
  {
    area: "empresarial", tier: 2, titulo: "Rescisão contratual empresarial", complexidade: 3, valorBase: 12000,
    resumo: "Empresa quer romper contrato de fornecimento por descumprimento reiterado da outra parte, com multa prevista.",
    sinal: "Inadimplemento documentado autoriza a resolução com multa.",
    teses: [
      { texto: "Resolução do contrato por inadimplemento (art. 475 CC)", correta: true },
      { texto: "Cobrança da multa contratual e perdas e danos", correta: true },
      { texto: "Notificação prévia e prova do descumprimento", correta: true },
      { texto: "Rescisão unilateral imotivada ignorando o contrato", correta: false },
      { texto: "Pedir a falência da contraparte por descumprimento", correta: false },
    ],
  },

  // ================= TIER 3 — banca de referência (grandes causas) =================
  {
    area: "trabalhista", tier: 3, titulo: "Equiparação salarial em multinacional", complexidade: 4, valorBase: 22000,
    resumo: "Gerente exercia funções idênticas às de colega mais bem pago, mesma produtividade, na mesma empresa e cidade.",
    sinal: "Identidade de funções e mesma localidade — equiparação (art. 461).",
    teses: [
      { texto: "Equiparação salarial por identidade de funções (art. 461 CLT)", correta: true },
      { texto: "Diferenças salariais retroativas e seus reflexos", correta: true },
      { texto: "Prova do paradigma e da mesma produtividade e técnica", correta: true },
      { texto: "Equiparar com paradigma de empresa diferente", correta: false },
      { texto: "Invocar quadro de carreira homologado inexistente", correta: false },
    ],
  },
  {
    area: "trabalhista", tier: 3, titulo: "Dano moral coletivo (sindicato)", complexidade: 5, valorBase: 30000,
    resumo: "Empresa impunha revistas vexatórias e metas abusivas a centenas de empregados. O sindicato quer agir.",
    sinal: "Lesão a direitos de toda a categoria — tutela coletiva.",
    teses: [
      { texto: "Legitimidade do sindicato para a tutela coletiva da categoria", correta: true },
      { texto: "Dano moral coletivo pelas práticas degradantes reiteradas", correta: true },
      { texto: "Obrigação de fazer para cessar revistas e metas abusivas", correta: true },
      { texto: "Pedir a dissolução compulsória da empresa", correta: false },
      { texto: "Individualizar cada trabalhador numa ação de dano coletivo", correta: false },
    ],
  },
  {
    area: "consumidor", tier: 3, titulo: "Ação coletiva e recall", complexidade: 5, valorBase: 28000,
    resumo: "Lote de um eletrodoméstico apresenta defeito que causa incêndios. Muitos consumidores foram afetados.",
    sinal: "Vício que atinge a coletividade — ação coletiva de consumo.",
    teses: [
      { texto: "Ação coletiva de consumo pelo defeito do produto", correta: true },
      { texto: "Determinação de recall e reparação dos consumidores", correta: true },
      { texto: "Inversão do ônus e responsabilidade objetiva do fornecedor", correta: true },
      { texto: "Exigir a prisão dos diretores como condição da ação cível", correta: false },
      { texto: "Renunciar à tutela coletiva e propor só uma ação individual", correta: false },
    ],
  },
  {
    area: "civel", tier: 3, titulo: "Erro médico com dano grave", complexidade: 5, valorBase: 35000,
    resumo: "Paciente sofreu sequela após cirurgia com falha grave e sem consentimento informado adequado.",
    sinal: "Falha e nexo com a sequela; consentimento deficiente.",
    teses: [
      { texto: "Responsabilidade do hospital (objetiva) e do médico (por culpa)", correta: true },
      { texto: "Prova pericial do erro e do nexo com a sequela", correta: true },
      { texto: "Falha no dever de informação e consentimento esclarecido", correta: true },
      { texto: "Responsabilidade objetiva pessoal do médico como regra", correta: false },
      { texto: "Dispensar a perícia médica confiando só no relato do cliente", correta: false },
    ],
  },
  {
    area: "civel", tier: 3, titulo: "Distrato de imóvel na planta", complexidade: 4, valorBase: 30000,
    resumo: "Comprador desistiu do imóvel na planta; a construtora quer reter quase tudo o que foi pago.",
    sinal: "A retenção deve respeitar os limites da Lei do Distrato.",
    teses: [
      { texto: "Restituição com retenção limitada pela Lei 13.786/2018", correta: true },
      { texto: "Nulidade de cláusulas de retenção integral abusivas", correta: true },
      { texto: "Devolução em parcela única quando aplicável a jurisprudência", correta: true },
      { texto: "Exigir 100% do valor de volta, ignorando a lei do distrato", correta: false },
      { texto: "Cobrar lucros cessantes de imóvel que o cliente não recebeu", correta: false },
    ],
  },
  {
    area: "familia", tier: 3, titulo: "Partilha de patrimônio elevado", complexidade: 4, valorBase: 40000,
    resumo: "Divórcio litigioso com empresas, imóveis e uma holding familiar. Há suspeita de ocultação de bens.",
    sinal: "Patrimônio complexo — avaliação e rastreio de bens.",
    teses: [
      { texto: "Partilha conforme o regime de bens, com avaliação do acervo", correta: true },
      { texto: "Exibição e rastreio de bens e quotas ocultadas", correta: true },
      { texto: "Perícia contábil na holding e nas empresas do casal", correta: true },
      { texto: "Penhorar de imediato todos os bens antes de qualquer prova", correta: false },
      { texto: "Ignorar o regime de bens e dividir tudo pela metade", correta: false },
    ],
  },
  {
    area: "criminal", tier: 3, titulo: "Tribunal do Júri — homicídio", complexidade: 5, valorBase: 45000,
    resumo: "Cliente responde por homicídio alegando legítima defesa após ameaça real e iminente. Vai a júri.",
    sinal: "Tese defensiva forte para o plenário (legítima defesa).",
    teses: [
      { texto: "Legítima defesa (art. 25 CP), com moderação e agressão iminente", correta: true },
      { texto: "Desclassificação para excesso culposo, subsidiariamente", correta: true },
      { texto: "Teses e quesitos bem construídos para os jurados", correta: true },
      { texto: "Confessar homicídio qualificado buscando 'boa impressão'", correta: false },
      { texto: "Alegar inimputabilidade sem laudo psiquiátrico", correta: false },
    ],
  },
  {
    area: "criminal", tier: 3, titulo: "Organização criminosa e lavagem", complexidade: 5, valorBase: 60000,
    resumo: "Empresário acusado, em grande operação, de integrar organização e lavar dinheiro. Provas por interceptação.",
    sinal: "Atacar a licitude das provas e a tipicidade da associação.",
    teses: [
      { texto: "Questionar a licitude das interceptações e provas derivadas", correta: true },
      { texto: "Atipicidade da organização por falta de estabilidade e hierarquia", correta: true },
      { texto: "Distinguir atos lícitos de gestão da suposta lavagem", correta: true },
      { texto: "Assumir a organização em troca de delação sem análise", correta: false },
      { texto: "Negar fatos documentados incontroversos, minando a defesa", correta: false },
    ],
  },
  {
    area: "criminal", tier: 3, titulo: "Colarinho branco — peculato", complexidade: 5, valorBase: 50000,
    resumo: "Servidor acusado de desviar verbas públicas. A defesa sustenta ausência de dolo e de proveito próprio.",
    sinal: "Foco no elemento subjetivo (dolo) e na destinação dos valores.",
    teses: [
      { texto: "Ausência de dolo de apropriação e de proveito próprio", correta: true },
      { texto: "Falha na individualização da conduta na cadeia administrativa", correta: true },
      { texto: "Fragilidade da prova pericial sobre o suposto desvio", correta: true },
      { texto: "Alegar insignificância em desvio de vultosa verba pública", correta: false },
      { texto: "Confessar o desvio esperando apenas a suspensão da pena", correta: false },
    ],
  },
  {
    area: "empresarial", tier: 3, titulo: "Recuperação judicial", complexidade: 4, valorBase: 55000,
    resumo: "Empresa viável, mas endividada, quer se reorganizar e evitar a falência. Tem plano e ativos relevantes.",
    sinal: "Empresa viável — recuperação para reestruturar dívidas.",
    teses: [
      { texto: "Recuperação judicial com plano de soerguimento (Lei 11.101)", correta: true },
      { texto: "Stay period suspendendo execuções por 180 dias", correta: true },
      { texto: "Negociação com credores em assembleia por classes", correta: true },
      { texto: "Pedir a autofalência de uma empresa ainda viável", correta: false },
      { texto: "Ocultar ativos dos credores no plano apresentado", correta: false },
    ],
  },
  {
    area: "empresarial", tier: 3, titulo: "Disputa societária", complexidade: 4, valorBase: 45000,
    resumo: "Sócio minoritário foi afastado da gestão e não recebe lucros há anos. Quer sair recebendo sua parte.",
    sinal: "Quebra da affectio societatis — dissolução parcial e apuração.",
    teses: [
      { texto: "Dissolução parcial com apuração de haveres do sócio", correta: true },
      { texto: "Prestação de contas e distribuição dos lucros retidos", correta: true },
      { texto: "Perícia para avaliação da participação societária", correta: true },
      { texto: "Dissolução total de empresa lucrativa e saudável", correta: false },
      { texto: "Penhorar bens dos sócios sem desconsideração deferida", correta: false },
    ],
  },
];

// --- Casos "buxa" (armadilhas): calote, causa perdida, antiético ---
export const ARQUETIPOS_BUXA: Arquetipo[] = [
  {
    area: "civel", tier: 1, titulo: "Indenização por 'traição'", complexidade: 2, valorBase: 1500,
    resumo: "Cliente exaltado quer processar o ex-cônjuge por infidelidade pedindo R$ 500 mil de dano moral. Sem qualquer ilícito além do fim do relacionamento.",
    sinal: "Não há ilícito indenizável — pretensão emocional, sem causa de pedir.",
    teses: [
      { texto: "Dano moral por quebra do dever de fidelidade conjugal", correta: false },
      { texto: "Pedir R$ 500 mil sem prova de qualquer dano concreto", correta: false },
      { texto: "Danos materiais inexistentes", correta: false },
    ],
  },
  {
    area: "civel", tier: 1, titulo: "Causa já prescrita", complexidade: 2, valorBase: 1200,
    resumo: "Cliente quer cobrar dívida de fato ocorrido há 8 anos. A pretensão prescreveu há tempos, mas ele insiste e promete 'pagar bem'.",
    sinal: "Pretensão fulminada pela prescrição — derrota quase certa.",
    teses: [
      { texto: "Ignorar a prescrição e ajuizar assim mesmo", correta: false },
      { texto: "Alegar causa interruptiva inexistente da prescrição", correta: false },
      { texto: "Sustentar imprescritibilidade sem base legal", correta: false },
    ],
  },
  {
    area: "empresarial", tier: 2, titulo: "Cliente quer fraudar credores", complexidade: 3, valorBase: 20000,
    resumo: "Empresário pede para 'blindar' o patrimônio transferindo bens para laranjas antes de uma execução iminente. Paga adiantado, em dinheiro.",
    sinal: "Proposta antiética e ilegal (fraude à execução) — risco à OAB e à ficha.",
    teses: [
      { texto: "Simular vendas de bens para terceiros de confiança", correta: false },
      { texto: "Ocultar patrimônio às vésperas da execução", correta: false },
      { texto: "Usar laranjas para esvaziar o patrimônio", correta: false },
    ],
  },
  {
    area: "trabalhista", tier: 1, titulo: "Não paga nem assina contrato", complexidade: 3, valorBase: 800,
    resumo: "Reclamação frágil, sem provas. O cliente recusa entrada, recusa contrato e diz que 'paga quando ganhar'. Já trocou de advogado 3 vezes.",
    sinal: "Recusa entrada e contrato, histórico de calote — prejuízo provável.",
    teses: [
      { texto: "Aceitar só no êxito, sem contrato escrito", correta: false },
      { texto: "Ajuizar sem provas confiando na palavra do cliente", correta: false },
      { texto: "Inflar pedidos para 'assustar' a empresa", correta: false },
    ],
  },
  {
    area: "consumidor", tier: 2, titulo: "Litigância de má-fé disfarçada", complexidade: 2, valorBase: 900,
    resumo: "Cliente 'profissional' que já move dezenas de ações idênticas por danos morais fabricados, buscando acordos rápidos. Quer mais uma.",
    sinal: "Padrão de litigância predatória — risco de má-fé e sanção.",
    teses: [
      { texto: "Fabricar dano moral genérico para forçar acordo", correta: false },
      { texto: "Omitir que o cliente já tem ações idênticas", correta: false },
      { texto: "Multiplicar ações sobre o mesmo fato", correta: false },
    ],
  },
  {
    area: "familia", tier: 1, titulo: "Herança de parente vivo", complexidade: 2, valorBase: 1000,
    resumo: "Cliente quer 'antecipar' a herança de um tio ainda vivo e saudável, brigando com a família por bens que não são dele.",
    sinal: "Não há herança de pessoa viva — pretensão juridicamente impossível.",
    teses: [
      { texto: "Ajuizar inventário de pessoa ainda viva", correta: false },
      { texto: "Pedir a parte da herança antes da morte", correta: false },
      { texto: "Bloquear os bens do tio saudável", correta: false },
    ],
  },
  {
    area: "civel", tier: 2, titulo: "Cliente mente sobre os fatos", complexidade: 3, valorBase: 1500,
    resumo: "A versão do cliente é desmentida pelos próprios documentos que ele trouxe; ainda assim, ele quer que você 'dê um jeito'.",
    sinal: "Fatos contra prova documental — derrota e risco ético.",
    teses: [
      { texto: "Sustentar versão contrariada pelos próprios documentos", correta: false },
      { texto: "Omitir provas desfavoráveis do processo", correta: false },
      { texto: "Instruir o cliente a alterar a versão dos fatos", correta: false },
    ],
  },
  {
    area: "trabalhista", tier: 2, titulo: "Ação por vingança, sem prova", complexidade: 3, valorBase: 1200,
    resumo: "Cliente saiu bem, recebeu tudo e teve rescisão homologada, mas quer processar 'por vingança', inventando assédio sem qualquer prova.",
    sinal: "Pretensão sem lastro e com risco de litigância de má-fé.",
    teses: [
      { texto: "Alegar assédio moral sem episódio nem testemunha", correta: false },
      { texto: "Pedir danos morais vultosos sem qualquer prova", correta: false },
      { texto: "Reabrir verbas já quitadas e homologadas", correta: false },
    ],
  },
];

// --- Submundo: propostas ilícitas de alto ganho (inspiradas em casos reais) ---
export interface Crime {
  titulo: string;
  descricao: string;
  ganho: number;
  chanceBase: number;
  penaDias: number;
  multa: number;
  perdaReputacao: number;
  tier: 1 | 2 | 3;
}

export const CRIMES: Crime[] = [
  // ---- tier 1 ----
  {
    tier: 1, titulo: "Caixa 2 do escritório", ganho: 9000, chanceBase: 0.7, penaDias: 4, multa: 15000, perdaReputacao: 20,
    descricao: "Deixar de declarar parte dos honorários para pagar menos imposto. Sonegação fiscal — cai bem no bolso até a fiscalização bater.",
  },
  {
    tier: 1, titulo: "Sacar benefício de segurado falecido", ganho: 8000, chanceBase: 0.66, penaDias: 5, multa: 14000, perdaReputacao: 24,
    descricao: "Continuar sacando a aposentadoria de um cliente que já morreu, ocultando o óbito do INSS. Estelionato previdenciário.",
  },
  {
    tier: 1, titulo: "Levar celular ao preso no parlatório", ganho: 9000, chanceBase: 0.58, penaDias: 6, multa: 16000, perdaReputacao: 28,
    descricao: "Um cliente pede para você entrar um celular e um chip escondidos na visita, usando a prerrogativa de advogado. Favorecimento e mais.",
  },
  // ---- tier 2 ----
  {
    tier: 2, titulo: "'Pombo-correio' de facção", ganho: 16000, chanceBase: 0.55, penaDias: 8, multa: 18000, perdaReputacao: 38,
    descricao: "Um líder preso paga alto para você levar e trazer bilhetes com 'recados' para os membros lá fora. Comunicação de ordens da facção.",
  },
  {
    tier: 2, titulo: "Comprar o silêncio de uma testemunha", ganho: 20000, chanceBase: 0.52, penaDias: 8, multa: 20000, perdaReputacao: 36,
    descricao: "Pagar por fora para uma testemunha 'esquecer' o que viu e mudar o depoimento. Coação e fraude processual.",
  },
  {
    tier: 2, titulo: "Propina a servidor por decisão", ganho: 30000, chanceBase: 0.5, penaDias: 9, multa: 25000, perdaReputacao: 42,
    descricao: "Um contato promete 'agilizar' uma decisão em troca de um valor por fora ao servidor. Corrupção ativa.",
  },
  {
    tier: 2, titulo: "Honorário em dinheiro vivo suspeito", ganho: 18000, chanceBase: 0.62, penaDias: 6, multa: 12000, perdaReputacao: 26,
    descricao: "Um 'cliente' oferece pagar tudo em espécie, muito acima do mercado, sem recibo. Cheira a lavagem de dinheiro.",
  },
  // ---- tier 3 ----
  {
    tier: 3, titulo: "Ser o 'núcleo jurídico' da facção", ganho: 42000, chanceBase: 0.45, penaDias: 12, multa: 30000, perdaReputacao: 55,
    descricao: "O grupo quer que você gerencie o caixa deles e repasse os 'salves' dos chefes presos, burlando o isolamento. Integrar organização criminosa.",
  },
  {
    tier: 3, titulo: "Assessoria fixa para organização", ganho: 40000, chanceBase: 0.45, penaDias: 12, multa: 30000, perdaReputacao: 50,
    descricao: "Um grupo oferece uma 'mensalidade' gorda para você ser o advogado de plantão deles em tudo. Ganho recorrente, ficha manchada para sempre.",
  },
  {
    tier: 3, titulo: "Gerir a divulgação do tráfico", ganho: 35000, chanceBase: 0.48, penaDias: 10, multa: 28000, perdaReputacao: 48,
    descricao: "Repassar para fora fotos e vídeos de drogas passados pelo chefe preso, para atrair compradores. Associação e tráfico.",
  },
  {
    tier: 3, titulo: "Operar um esquema de propina milionário", ganho: 55000, chanceBase: 0.42, penaDias: 12, multa: 40000, perdaReputacao: 55,
    descricao: "Intermediar pagamentos de propina entre uma empreiteira e agentes públicos, lavando tudo por honorários fictícios.",
  },
];

// --- Progressão: escritórios ---
export interface Escritorio {
  nome: string;
  descricao: string;
  aluguel: number;
  slots: number;
  qualidade: number;
  energiaBonus: number;
  maxEstagiarios: number;
  custoUpgrade: number;
}

export const ESCRITORIOS: Escritorio[] = [
  { nome: "Mesa em coworking", descricao: "Uma mesa alugada e muita fé. Todo começo é assim.", aluguel: 60, slots: 2, qualidade: 1, energiaBonus: 0, maxEstagiarios: 0, custoUpgrade: 0 },
  { nome: "Sala própria no centro", descricao: "Placa na porta, secretária compartilhada e clientela um pouco melhor.", aluguel: 240, slots: 3, qualidade: 1.25, energiaBonus: 1, maxEstagiarios: 1, custoUpgrade: 9000 },
  { nome: "Andar comercial", descricao: "Recepção, salas de reunião e casos de maior porte batendo à porta.", aluguel: 750, slots: 5, qualidade: 1.6, energiaBonus: 2, maxEstagiarios: 3, custoUpgrade: 40000 },
  { nome: "Escritório boutique", descricao: "Marca respeitada, clientes selecionados e honorários generosos.", aluguel: 1900, slots: 7, qualidade: 2.1, energiaBonus: 3, maxEstagiarios: 5, custoUpgrade: 130000 },
  { nome: "Banca de referência nacional", descricao: "Nome no topo da lista. Grandes causas, grandes honorários, grande responsabilidade.", aluguel: 5200, slots: 10, qualidade: 3, energiaBonus: 5, maxEstagiarios: 8, custoUpgrade: 420000 },
];

// --- Progressão: cidades ---
export interface Cidade {
  id: string;
  nome: string;
  descricao: string;
  qualidade: number;
  custoMudanca: number;
}

export const CIDADES: Cidade[] = [
  { id: "interior", nome: "Cidade do interior", descricao: "Custo de vida baixo, causas menores, concorrência tranquila.", qualidade: 0.85, custoMudanca: 0 },
  { id: "media", nome: "Cidade média", descricao: "Mais indústria e comércio — causas trabalhistas e cíveis de bom porte.", qualidade: 1.1, custoMudanca: 7000 },
  { id: "capital", nome: "Capital", descricao: "Volume alto de casos e honorários maiores. Concorrência feroz.", qualidade: 1.4, custoMudanca: 28000 },
  { id: "sp", nome: "São Paulo", descricao: "O maior mercado jurídico do país. Causas milionárias circulando.", qualidade: 1.8, custoMudanca: 95000 },
];

// --- Treinamentos (evolução do personagem) ---
export interface Treino {
  id: string;
  nome: string;
  descricao: string;
  atributo: "carisma" | "tecnica";
  ganho: number;
  custo: number;
  energia: number;
}

export const TREINOS: Treino[] = [
  { id: "oratoria", nome: "Curso de oratória e negociação", descricao: "Fecha mais contratos e convence o cliente a aceitar honorários maiores.", atributo: "carisma", ganho: 6, custo: 1400, energia: 1 },
  { id: "pos", nome: "Pós-graduação / especialização", descricao: "Mais técnica: aumenta a chance de ganhar casos e de ler bem uma causa.", atributo: "tecnica", ganho: 6, custo: 2800, energia: 1 },
  { id: "networking", nome: "Evento de networking", descricao: "Um empurrão no carisma e nas relações. Barato e rápido.", atributo: "carisma", ganho: 3, custo: 600, energia: 1 },
  { id: "jurisprudencia", nome: "Imersão em jurisprudência", descricao: "Fim de semana estudando os tribunais. Técnica afiada.", atributo: "tecnica", ganho: 3, custo: 900, energia: 1 },
];

// --- Nomes para gerar clientes ---
export const NOMES = [
  "Cristiane Alves", "Rogério Pinto", "Marcos Vinícius", "Fernanda Lima", "João Batista",
  "Aparecida Souza", "Ricardo Menezes", "Patrícia Gomes", "Sebastião Rocha", "Juliana Prado",
  "Wellington Dias", "Cláudia Ferreira", "Anderson Melo", "Beatriz Nunes", "Otávio Camargo",
  "Vera Lúcia", "Diego Ramos", "Sandra Regina", "Thiago Barros", "Mônica Teixeira",
  "Gilberto Antunes", "Renata Cardoso", "Paulo Sérgio", "Débora Farias", "Edson Moreira",
];
