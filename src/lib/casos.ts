// Regras de mudança de fase do caso, num lugar só.
//
// A tela do processo e o "Fechar o dia" mudam a fase pelos mesmos botões — se
// cada uma repetisse a regra, uma hora iam divergir (e o caso encerrado por um
// caminho continuaria "ativo" pelo outro). Aqui fica a decisão; as telas só
// aplicam o resultado.

import { faseInfo } from "./fases";
import type { Processo, SituacaoCaso } from "./types";

export interface EfeitoFase {
  patch: Partial<Processo>;
  /** Linha de andamento que registra a mudança no histórico do caso. */
  descricao: string;
}

/** O que muda no processo ao definir uma fase. Devolve null quando não há nada
 *  a fazer (fase já é essa), para a tela não gravar andamento à toa. */
export function efeitoDaFase(proc: Processo, v: SituacaoCaso): EfeitoFase | null {
  if (proc.situacao === v) return null;
  const info = faseInfo(v);
  const patch: Partial<Processo> = { situacao: v };
  // Fase encerrada arquiva o caso (sai dos "Ativos"); voltar a uma fase ativa
  // reativa o caso automaticamente.
  if (info?.encerrado) patch.status = "encerrado";
  else if (proc.status === "encerrado") patch.status = "ativo";
  return { patch, descricao: `Fase do caso atualizada para "${info?.rotulo}".` };
}
