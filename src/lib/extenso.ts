// Valor monetário por extenso em pt-BR, para contratos.
// Ex.: 5000 → "cinco mil reais"; 3550.5 → "três mil quinhentos e cinquenta reais e cinquenta centavos"

const ATE_19 = [
  "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez",
  "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove",
];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let restoTxt = "";
  if (resto < 20) restoTxt = ATE_19[resto];
  else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    restoTxt = DEZENAS[d] + (u ? " e " + ATE_19[u] : "");
  }
  if (!c) return restoTxt;
  return CENTENAS[c] + (restoTxt ? " e " + restoTxt : "");
}

function inteiroExtenso(n: number): string {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const partes: string[] = [];
  if (milhoes) partes.push(milhoes === 1 ? "um milhão" : `${ate999(milhoes)} milhões`);
  if (milhares) partes.push(milhares === 1 ? "mil" : `${ate999(milhares)} mil`);
  if (resto) partes.push(ate999(resto));

  // conector "e" antes do último bloco quando ele é < 100 ou centena exata
  if (partes.length === 1) return partes[0];
  const ultimo = resto || (milhares && !resto ? 0 : 0);
  const usaE = resto > 0 && (resto < 100 || resto % 100 === 0);
  void ultimo;
  const inicio = partes.slice(0, -1).join(" ");
  return usaE ? `${inicio} e ${partes[partes.length - 1]}` : `${inicio} ${partes[partes.length - 1]}`;
}

export function valorPorExtenso(valor: number): string {
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  let txt = "";
  if (inteiro > 0) {
    const reais = inteiro === 1 ? "real" : "reais";
    const de = inteiro % 1_000_000 === 0 ? " de" : "";
    txt = `${inteiroExtenso(inteiro)}${de} ${reais}`;
  }
  if (centavos > 0) {
    const c = `${inteiroExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`;
    txt = txt ? `${txt} e ${c}` : c;
  }
  return txt || "zero reais";
}
