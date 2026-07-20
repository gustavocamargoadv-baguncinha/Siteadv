// Audiências importadas do painel do advogado do e-SAJ (TJSP), capturadas em
// 20/07/2026. Datas/horas no fuso de Brasília (-03:00). Quando o processo já
// existe no sistema (importado dos contratos ZapSign), o vínculo é feito pelo
// campo processo_id; as demais entram com todos os dados da audiência.

export interface AudienciaImport {
  id: string;
  inicio: string; // ISO com fuso -03:00
  tipo_audiencia: string; // Instrução, Debates e Julgamento…
  sala?: string;
  defendido: string; // parte ré (Justiça Pública x ...)
  crime?: string;
  numero_cnj: string;
  redesignada?: boolean;
  processo_id?: string; // vínculo com processo já cadastrado (contratos ZapSign)
}

export const AUDIENCIAS_ESAJ: AudienciaImport[] = [
  { id: "esaj-a-01", inicio: "2026-07-29T16:30:00-03:00", tipo_audiencia: "Instrução, Debates e Julgamento", sala: "Sala de Audiência Criminal", defendido: "Danilo Ito Fernandes de Almeida", crime: "Estupro", numero_cnj: "1500941-34.2026.8.26.0269", processo_id: "impzp-p-04" },
  { id: "esaj-a-02", inicio: "2026-08-06T15:30:00-03:00", tipo_audiencia: "Instrução, Debates e Julgamento", sala: "Sala de Audiência Criminal", defendido: "José Marcos dos Santos", crime: "Furto", numero_cnj: "1500849-61.2023.8.26.0269" },
  { id: "esaj-a-03", inicio: "2026-08-17T15:00:00-03:00", tipo_audiencia: "Instrução, Debates e Julgamento (Júri)", sala: "Plenário / Sala de Audiências", defendido: "Autor Desconhecido (réu Bruno Batista Rodrigues)", crime: "Homicídio Qualificado", numero_cnj: "1505517-12.2024.8.26.0602", processo_id: "impzp-p-10" },
  { id: "esaj-a-04", inicio: "2026-08-18T14:00:00-03:00", tipo_audiencia: "Instrução e Julgamento", sala: "Sala de Audiência", defendido: "Kauã Prestes de Almeida", crime: "Tráfico de Drogas e Condutas Afins", numero_cnj: "1500106-54.2026.8.26.0622", processo_id: "impzp-p-09" },
  { id: "esaj-a-05", inicio: "2026-08-25T16:15:00-03:00", tipo_audiencia: "Instrução, Debates e Julgamento", sala: "Sala de audiências - 2ª Vara Criminal", defendido: "Antonio Marcos de Jesus Pereira", crime: "Tráfico de Drogas (Lei Antitóxicos)", numero_cnj: "1500626-70.2026.8.26.0571", processo_id: "impzp-p-01" },
  { id: "esaj-a-06", inicio: "2026-09-02T15:30:00-03:00", tipo_audiencia: "Instrução e Julgamento", sala: "Sala de Audiências", defendido: "Érik Maikon Barbosa Pereira", crime: "Ameaça", numero_cnj: "1500090-26.2026.8.26.0582" },
  { id: "esaj-a-07", inicio: "2026-09-15T16:00:00-03:00", tipo_audiencia: "Preso - Instrução, Debates e Julgamento", sala: "Sala de Audiência - 1", defendido: "Rafael Marques da Silva", crime: "Tráfico de Drogas e Condutas Afins", numero_cnj: "1501825-47.2023.8.26.0470", redesignada: true },
  { id: "esaj-a-08", inicio: "2026-09-17T15:00:00-03:00", tipo_audiencia: "Instrução, Interrogatório, Debates e Julgamento", sala: "Sala de Audiência - Sala Única", defendido: "Maik Júlio Ramos de Paula", crime: "Crimes do Sistema Nacional de Armas", numero_cnj: "0002569-33.2025.8.26.0378" },
  { id: "esaj-a-09", inicio: "2026-09-22T14:00:00-03:00", tipo_audiencia: "Instrução e Julgamento", sala: "Sala de Audiências", defendido: "Iucimar da Silva Salles", crime: "Receptação", numero_cnj: "1501343-87.2023.8.26.0571" },
  { id: "esaj-a-10", inicio: "2026-10-20T14:00:00-03:00", tipo_audiencia: "Instrução, Interrogatório, Debates e Julgamento", sala: "Sala de Audiência - Sala Única", defendido: "Reginaldo José de Oliveira", crime: "Fato Atípico", numero_cnj: "1500199-33.2024.8.26.0025" },
  { id: "esaj-a-11", inicio: "2026-11-18T16:00:00-03:00", tipo_audiencia: "Instrução e Julgamento", sala: "Sala de Audiência - 1", defendido: "Paulo Osmar de Paiva", crime: "Adulteração de Sinal Identificador de Veículo Automotor", numero_cnj: "1500724-38.2024.8.26.0470" },
];
