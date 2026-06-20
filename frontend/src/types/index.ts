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
  opm: string;
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
  enviado_para_cp: boolean;
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

// ---- Módulo de cálculo de diferenças ---------------------------------------
export const TIPOS_EVENTO = ["ABONO", "1/3-FÉRIAS", "13º"] as const;
export type TipoEvento = (typeof TIPOS_EVENTO)[number];

export const TIPOS_AUX_SAUDE = ["SAUDE", "CONDICIONAL"] as const;
export type TipoAuxSaude = (typeof TIPOS_AUX_SAUDE)[number];

// Modalidades oferecidas para seleção (constam da aba Listas da planilha).
export const MODALIDADES_AFASTAMENTO = [
  "LTIP",
  "LTSD",
  "LAC",
  "DESERTOR",
  "PRESO TRANS. JULG.",
  "EXCLUÍDO",
] as const;
export type ModalidadeAfastamento = (typeof MODALIDADES_AFASTAMENTO)[number];

export interface CalculoLancamentoInput {
  data_recebido: string;
  tipo_evento: TipoEvento;
  tipo_auxilio_saude: TipoAuxSaude;
}

export interface CalculoAfastamentoInput {
  modalidade: ModalidadeAfastamento;
  data_inicio: string;
  data_fim: string;
}

export interface CalculoIn {
  lancamentos: CalculoLancamentoInput[];
  afastamentos: CalculoAfastamentoInput[];
}

export interface CalculoLancamento extends CalculoLancamentoInput {
  ordem: number;
  ano: number;
  mes: number;
  valor_auxilio_alimentacao: number;
  valor_auxilio_saude_aplicavel: number;
  base_complementar: number;
  avos_13: number;
  diferenca_terco_ferias: number;
  diferenca_abono: number;
  diferenca_13: number;
  diferenca_original: number;
  competencia_correcao: string;
  fator_correcao: number;
  valor_corrigido_original: number;
  percentual_aplicavel: number;
  diferenca_ajustada: number;
  valor_corrigido_ajustado: number;
  tem_afastamento_reflexo: boolean;
  prescrito: boolean;
  motivo_ajuste: string;
}

export interface CalculoAfastamento {
  modalidade: string;
  data_inicio: string;
  data_fim: string;
  avos_por_ano: Record<string, number>;
  observacao: string;
}

export interface ResumoLinha {
  tipo_evento: TipoEvento;
  ano: number;
  data_evento: string | null;
  tipo_auxilio_saude: string;
  valor_auxilio_saude: number;
  valor_auxilio_alimentacao: number;
  base_complementar: number;
  avos_13: number;
  fator_correcao: number;
  diferenca_ajustada: number;
  diferenca_corrigida: number;
  prescrito: boolean;
}

export interface Calculo {
  id: string | null;
  requerimento_id: string;
  data_base_correcao: string;
  data_limite_prescricao: string;
  versao_planilha: string;
  total_abono_corrigido: number;
  total_terco_ferias_corrigido: number;
  total_decimo_terceiro_corrigido: number;
  total_geral_a_receber: number;
  avos_13_por_ano: Record<string, number>;
  lancamentos: CalculoLancamento[];
  afastamentos: CalculoAfastamento[];
  resumo: ResumoLinha[];
  persistido: boolean;
  criado_em: string | null;
  atualizado_em: string | null;
}
