// Modelos de documentos do escritório (procuração, declaração de
// hipossuficiência e contrato de honorários), com o papel timbrado
// "Gustavo Camargo — Advocacia". A geração abre uma janela pronta para
// imprimir ou salvar em PDF — no celular ou no computador.

import { valorPorExtenso } from "./extenso";
import { brl, dataBR } from "./format";
import { LOGO_DATA_URI } from "./logo";

// Logo oficial do escritório, embutida para o documento ser autossuficiente.
const LOGO_IMG = `<img src="${LOGO_DATA_URI}" alt="Gustavo Camargo Advocacia" />`;

export const ESCRITORIO = {
  advogado: "GUSTAVO ROBERTO DE CAMARGO",
  advogadoQualificacao:
    "brasileiro, casado, advogado, inscrito na ordem dos advogados do Brasil sob o nº 431.515, portador da cédula de identidade nº 43.986.114-7 – SSP/SP, inscrito no CPF sob o nº 413.468.888-41, com endereço profissional na Rua Monsenhor Soares 647, Centro - Itapetininga/SP – CEP 18.200-009",
  oab: "OAB/SP",
  oabNumero: "431.515",
  enderecoCurto: "Rua Monsenhor Soares 647, Centro - Itapetininga/SP",
  cidade: "Itapetininga",
  comarcaForo: "Itapetininga-SP",
  rodape1: "Rua Monsenhor Soares 647, Centro - Itapetininga/SP – CEP 18.200-009",
  rodape2: "Contato: (15) 99605-5581 – (15) 3272-3072 E-mail: gustavocamargo@adv.oabsp.org.br",
  dadosBancarios:
    "depósito na conta corrente nº 17.779-7, Agência: 6522-6, Banco do Brasil, ou mediante PIX na mesma conta (chave pix – CPF: 413.468.888-41) de titularidade do Gustavo Roberto de Camargo",
};

export interface PessoaDoc {
  nome: string;
  nacionalidade?: string;
  estado_civil?: string;
  profissao?: string;
  rg?: string;
  cpf?: string;
  endereco?: string;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function dataPorExtensoHoje(): string {
  const d = new Date();
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function esc(s: string | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function pagina(titulo: string, corpo: string, opcoes?: { serifa?: boolean }): string {
  const fonte = opcoes?.serifa
    ? "'Book Antiqua', 'Palatino Linotype', Georgia, serif"
    : "Arial, Helvetica, sans-serif";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
<style>
  @page { size: A4; margin: 22mm 20mm 26mm 20mm; }
  * { box-sizing: border-box; }
  body {
    font-family: ${fonte};
    font-size: 12.5pt; line-height: 1.75; color: #111;
    max-width: 175mm; margin: 0 auto; padding: 16px;
  }
  header.timbre { text-align: center; margin-bottom: 4px; }
  header.timbre img { width: 300px; max-width: 70%; height: auto; }
  hr.linha { border: none; border-top: 1.6px solid #b0904f; margin: 4px 0 28px; }
  h1 { text-align: center; font-size: 15pt; letter-spacing: .5px; margin: 26px 0 30px; }
  p { text-align: justify; margin: 0 0 14px; }
  .recuo { text-indent: 3em; }
  .data { text-align: center; margin: 44px 0 60px; }
  .assinatura { text-align: center; margin-top: 24px; }
  .assinatura .linha-ass { display: inline-block; border-top: 1px solid #111; min-width: 320px; padding-top: 4px; }
  .bloco-ass { margin-top: 56px; }
  footer.rodape {
    margin-top: 60px; text-align: center; font-size: 9.5pt; color: #333; line-height: 1.5;
  }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    footer.rodape { position: fixed; bottom: 0; left: 0; right: 0; }
  }
  .no-print {
    position: fixed; top: 12px; right: 12px; z-index: 10;
    background: #b45309; color: #fff; border: none; border-radius: 8px;
    padding: 10px 16px; font-size: 14px; font-weight: 700; cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,.25);
  }
</style>
</head>
<body>
<button class="no-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
<header class="timbre">${LOGO_IMG}</header>
<hr class="linha">
${corpo}
<footer class="rodape">
  ${esc(ESCRITORIO.rodape1)}<br>
  ${esc(ESCRITORIO.rodape2)}
</footer>
</body>
</html>`;
}

function qualificacao(p: PessoaDoc, opts?: { comProfissao?: boolean }): string {
  const partes: string[] = [];
  if (p.nacionalidade) partes.push(esc(p.nacionalidade));
  if (opts?.comProfissao && p.profissao) partes.push(esc(p.profissao));
  if (p.estado_civil) partes.push(esc(p.estado_civil));
  if (p.rg) partes.push(`portador(a) da cédula de identidade RG nº ${esc(p.rg)}`);
  if (p.cpf) partes.push(`inscrito(a) no CPF/MF sob o nº ${esc(p.cpf)}`);
  if (p.endereco) partes.push(`residente e domiciliado(a) na ${esc(p.endereco)}`);
  return partes.join(", ");
}

// ---------------------------------------------------------------------------
// Procuração "ad judicia et extra"
// ---------------------------------------------------------------------------
export function procuracaoHTML(p: PessoaDoc, opcoes?: { corregedoria?: boolean }): string {
  const poderesExtra = opcoes?.corregedoria ? ", atuar em processo da corregedoria de presídios" : "";
  const corpo = `
<h1>PROCURAÇÃO “AD JUDICIA ET EXTRA”</h1>
<p><b>${esc(p.nome.toUpperCase())},</b> ${qualificacao(p)}, pelo presente instrumento de procuração,
nomeia e constitui seu procurador e advogado <b>Dr. ${esc(ESCRITORIO.advogado)}</b> com inscrição na
<b>${esc(ESCRITORIO.oab)}</b> sob o nº <b>${esc(ESCRITORIO.oabNumero)}</b>, com escritório na
${esc(ESCRITORIO.enderecoCurto)}, a quem confere amplos poderes para foro em geral, com a cláusula
“<i>ad judicia et extra</i>”, podendo agir junto às repartições públicas Federais, Estaduais e
Municipais, em qualquer Juízo, Instância ou Tribunal, ou inquérito, podendo propor contra quem de
direito as ações competentes e defendê-lo nas contrárias, seguindo umas e outras, até final decisão,
usando recursos legais e acompanhando-os, conferindo-lhe, ainda, poderes especiais para confessar,
desistir, transigir, firmar compromissos ou acordos${poderesExtra}, agindo em conjunto ou
separadamente, podendo ainda substabelecer esta em outrem, com ou sem reserva de iguais poderes,
dando por tudo bom, firme e valioso, podendo para tanto, usar os poderes impressos que ficam assim,
expressamente ratificados.</p>
<p class="data">${esc(ESCRITORIO.cidade)}, ${dataPorExtensoHoje()}.</p>
<div class="assinatura"><span class="linha-ass">${esc(p.nome)}</span></div>
`;
  return pagina(`Procuração — ${p.nome}`, corpo);
}

// ---------------------------------------------------------------------------
// Declaração de hipossuficiência (Lei 1.060/50)
// ---------------------------------------------------------------------------
export function hipossuficienciaHTML(p: PessoaDoc): string {
  const corpo = `
<h1 style="text-decoration: underline;">DECLARAÇÃO</h1>
<p style="margin-top:40px"><b>Eu: ${esc(p.nome.toUpperCase())},</b> ${qualificacao(p, { comProfissao: true })}.</p>
<hr style="border:none;border-top:1px solid #333;margin:30px 0">
<p class="recuo">Declaro para os devidos fins de direito, e sob as penas da lei, de acordo com a
Lei 1060/50, que por ora, não possuo condições de vir a Juízo e arcar com custas processuais sem
prejuízo de meu sustento e de minha família.</p>
<p class="data">${esc(ESCRITORIO.cidade)}, ${dataPorExtensoHoje()}.</p>
<div class="assinatura"><span class="linha-ass">${esc(p.nome)}</span></div>
`;
  return pagina(`Declaração de hipossuficiência — ${p.nome}`, corpo);
}

// ---------------------------------------------------------------------------
// Contrato de prestação de serviços advocatícios
// ---------------------------------------------------------------------------
export interface DadosContrato {
  contratante: PessoaDoc;
  objeto: string; // texto completo da finalidade (cláusula 1ª, após "OBJETO a ")
  valorTotal: number;
  parcelas: number;
  primeiroVencimento: string; // ISO date
  diaVencimento?: number; // dia fixo do mês combinado (1-31); usado quando a 1ª já foi paga
  primeiraPaga?: boolean; // primeira parcela já quitada antes da assinatura
}

export function contratoHTML(d: DadosContrato): string {
  const valorParcela = Math.round((d.valorTotal / d.parcelas) * 100) / 100;
  const venc = dataBR(d.primeiroVencimento);
  // Dia do vencimento combinado: usa o informado ou deduz da data do 1º vencimento.
  const dia = d.diaVencimento ?? new Date(`${d.primeiroVencimento}T12:00:00`).getDate();

  let pagamento: string;
  if (d.parcelas === 1) {
    pagamento = d.primeiraPaga
      ? `a importância de <b>${brl(d.valorTotal)} (${valorPorExtenso(d.valorTotal)})</b>, já quitada na presente data.`
      : `a importância de <b>${brl(d.valorTotal)} (${valorPorExtenso(d.valorTotal)})</b>, com vencimento em ${venc}.`;
  } else if (d.primeiraPaga) {
    pagamento = `a importância equivalente a <b>${brl(d.valorTotal)} (${valorPorExtenso(d.valorTotal)})</b>, a serem
pagos em ${d.parcelas} (${valorPorExtenso(d.parcelas).replace(/ reais?$/i, "")}) parcelas iguais de ${brl(valorParcela)}
(${valorPorExtenso(valorParcela)}), com vencimento para todo dia ${dia}, sendo a primeira parcela já quitada na presente data.`;
  } else {
    pagamento = `a importância equivalente a <b>${brl(d.valorTotal)} (${valorPorExtenso(d.valorTotal)})</b> em
${d.parcelas} parcelas iguais de ${brl(valorParcela)} (${valorPorExtenso(valorParcela)}), com a primeira
parcela para o dia ${venc} e as demais para o mesmo dia dos meses subsequentes.`;
  }

  const corpo = `
<h1 style="text-align:left;font-size:13.5pt">CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS</h1>

<p><b>CONTRATANTE: ${esc(d.contratante.nome.toUpperCase())},</b> ${qualificacao(d.contratante)}.</p>

<p><b>CONTRATADO: DR. ${esc(ESCRITORIO.advogado)},</b> ${esc(ESCRITORIO.advogadoQualificacao)}.</p>

<p>As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Serviços
Jurídicos e Honorários Advocatícios, que se regerá pelas cláusulas seguintes e pelas condições
descritas no presente.</p>

<p style="margin-top:24px"><b>1.&nbsp;&nbsp;DO OBJETO DO CONTRATO</b></p>
<p><b>Cláusula 1ª.</b> O presente instrumento tem como <b>OBJETO</b> a ${d.objeto}</p>

<p style="margin-top:24px"><b>2.&nbsp;&nbsp;DA REMUNERAÇÃO E DO PAGAMENTO</b></p>
<p><b>Cláusula 2ª.</b> Em remuneração aos serviços profissionais ora pactuados (honorários), a parte
CONTRATANTE pagará a parte CONTRATADA ${pagamento}</p>
<p><b>Parágrafo único.</b> O adimplemento dos valores ajustados na cláusula anterior será feito
mediante pagamento direto a parte <b>CONTRATADA</b> em seu escritório, ou por <b>${esc(ESCRITORIO.dadosBancarios)}</b>.</p>
<p><b>Cláusula 3ª.</b> Se a parte <b>CONTRATANTE</b> optar por destituir a parte <b>CONTRATADA</b>,
ficará sujeito a retenção dos valores pagos, bem como a cobrança integral do valor restante do contrato.</p>
<p><b>Cláusula 4ª.</b> As partes estabelecem que havendo atraso no pagamento dos honorários, serão
cobrados juros de mora na proporção sejam integrais ou parcelados, fica acordada a aplicação de multa
contratual de 20% (vinte por cento), juros de mora de 1% ao mês e <i>atualização monetária</i> pelo índice INPC.</p>
<p><b>Cláusula 5ª.</b> O valor total dos honorários poderá ser considerado automaticamente vencido e
imediatamente exigível, sendo passível de execução, sem prévia notificação ou interpelação judicial,
acrescido de multa contratual de 20% (vinte por cento), juros de mora de 1% ao mês a atualização
monetária pelo índice INPC <b>nos seguintes casos:</b></p>
<p>– Quando <b>não forem pagos</b> os honorários nas datas estabelecidas, sejam integrais, sejam parcelados;</p>
<p>– Se for cassado o mandato do Contratado.</p>

<p style="margin-top:24px"><b>3.&nbsp;&nbsp;DAS ATIVIDADES</b></p>
<p><b>Cláusula 6ª.</b> As atividades inclusas na prestação de serviço objeto deste instrumento são
todas aquelas inerentes à profissão, quais sejam:</p>
<p><b>a)</b> Praticar quaisquer atos e medidas necessárias e inerentes à causa, em todas as
repartições públicas dos Estados ou dos Municípios, bem como órgãos a estes ligados direta ou
indiretamente, seja por delegação, concessão ou outros meios, bem como de estabelecimentos particulares.</p>
<p><b>b)</b> Praticar todos os atos inerentes ao exercício da advocacia e aqueles constantes no
Estatuto da Ordem dos Advogados do Brasil, bem como os especificados no Instrumento Procuratório.</p>
<p><b>c) Todos os atos necessários para o andamento do objeto (cláusula 1) até o transito em julgado.</b></p>
<p><b>Cláusula 7ª.</b> O termo inicial do presente contrato é o de sua assinatura, e seu termo final
é a conclusão do objeto no processo em questão.</p>
<p><b>Cláusula 8ª.</b> O CONTRATADO será diretamente responsabilizado, consoante previsão inscrita no
art. 32 da Lei nº 8.906, de 4 de julho de 1994 (Estatuto da Advocacia), pelos atos que, no exercício
das atividades pactuadas, vier a praticar com dolo ou culpa, gerando, comprovadamente, danos ao CLIENTE.</p>

<p style="margin-top:24px"><b>4.&nbsp;&nbsp;DO FORO</b></p>
<p><b>Cláusula 9ª.</b> Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem
o foro da comarca de ${esc(ESCRITORIO.comarcaForo)}.</p>
<p>Por estarem assim justos e contratados, firmam o presente instrumento, em duas vias de igual teor.</p>

<p class="data">${esc(ESCRITORIO.cidade)}, ${dataPorExtensoHoje()}.</p>

<div class="bloco-ass"><b>Contratante:</b> ${esc(d.contratante.nome.toUpperCase())}<br><br>
<span style="display:inline-block;border-top:1px solid #111;min-width:340px;margin-top:34px"></span></div>

<div class="bloco-ass"><b>Contratado:</b> ADVOGADO – ${esc(ESCRITORIO.oab)} ${esc(ESCRITORIO.oabNumero)}<br><br>
<span style="display:inline-block;border-top:1px solid #111;min-width:340px;margin-top:34px"></span></div>

<div class="bloco-ass"><b>Testemunhas:</b><br><br>
1. <span style="display:inline-block;border-top:1px solid #111;min-width:300px;margin-top:30px"></span><br><br>
2. <span style="display:inline-block;border-top:1px solid #111;min-width:300px;margin-top:10px"></span></div>
`;
  return pagina(`Contrato de honorários — ${d.contratante.nome}`, corpo, { serifa: true });
}

// ---------------------------------------------------------------------------
export function abrirDocumento(html: string) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("O navegador bloqueou a janela do documento. Permita pop-ups para este site e tente de novo.");
    return;
  }
  w.document.write(html);
  w.document.close();
}
