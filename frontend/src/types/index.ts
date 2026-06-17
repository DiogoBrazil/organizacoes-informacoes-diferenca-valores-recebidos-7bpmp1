export const POSTOS_GRADUACOES = [
  "SD PM",
  "CB PM",
  "3º SGT PM",
  "2º SGT PM",
  "1º SGT PM",
  "ST PM",
  "CAD PM",
  "2º TEN PM",
  "1º TEN PM",
  "CAP PM",
  "MAJ PM",
  "TC PM",
  "CEL PM",
] as const;

export type PostoGraduacao = (typeof POSTOS_GRADUACOES)[number];

export interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  criado_em: string;
}

export interface UsuarioForm {
  nome_completo: string;
  email: string;
  senha?: string;
}

export interface Policial {
  id: string;
  posto_graduacao: PostoGraduacao;
  matricula: number;
  nome_completo: string;
}

export interface Requerimento {
  id: string;
  policial_id: string;
  num_processo_sei_requerimento: string;
  data_recebimento_opm: string;
  hora_recebimento_opm: string;
  num_sei_certidao_opm: string;
  tem_afastamentos: boolean;
  gozou_ferias_5_anos: boolean;
  tem_prioridade_legal: boolean;
  abono_pecuniario_2021?: string | null;
  ferias_1_3_2021?: string | null;
  abono_pecuniario_2022?: string | null;
  ferias_1_3_2022?: string | null;
  abono_pecuniario_2023?: string | null;
  ferias_1_3_2023?: string | null;
  abono_pecuniario_2024?: string | null;
  ferias_1_3_2024?: string | null;
  abono_pecuniario_2025?: string | null;
  ferias_1_3_2025?: string | null;
  auxilio_saude_2021?: string | null;
  auxilio_saude_2022?: string | null;
  auxilio_saude_2023?: string | null;
  auxilio_saude_2024?: string | null;
  auxilio_saude_2025?: string | null;
  auxilio_saude_2026?: string | null;
  criado_em: string;
  atualizado_em: string;
  policial: Policial;
}

export type RequerimentoPayload = Omit<
  Requerimento,
  "id" | "criado_em" | "atualizado_em" | "policial"
>;

export interface ApiError {
  detail?: string;
}
