import { FileText } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import FormActions from "../components/FormActions";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { useLoader } from "../context/LoaderContext";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import {
  maskSeiProcess,
  normalizeCurrency,
  normalizeMonthYear,
  parseTotalCount,
} from "../services/masks";
import type { Policial, Requerimento, RequerimentoPayload } from "../types";

const anosAbono = [2021, 2022, 2023, 2024, 2025] as const;
const anosSaude = [2021, 2022, 2023, 2024, 2025, 2026] as const;
const PER_PAGE = 10;

const initialForm: RequerimentoPayload = {
  policial_id: "",
  num_processo_sei_requerimento: "",
  data_recebimento_opm: "",
  hora_recebimento_opm: "",
  num_sei_certidao_opm: "",
  tem_afastamentos: false,
  gozou_ferias_5_anos: false,
  tem_prioridade_legal: false,
  enviado_para_cp: false,
  abono_pecuniario_2021: "",
  ferias_1_3_2021: "",
  abono_pecuniario_2022: "",
  ferias_1_3_2022: "",
  abono_pecuniario_2023: "",
  ferias_1_3_2023: "",
  abono_pecuniario_2024: "",
  ferias_1_3_2024: "",
  abono_pecuniario_2025: "",
  ferias_1_3_2025: "",
  auxilio_saude_2021: "",
  auxilio_saude_2022: "",
  auxilio_saude_2023: "",
  auxilio_saude_2024: "",
  auxilio_saude_2025: "",
  auxilio_saude_2026: "",
};

function FieldSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
      <h3 className="mb-4 text-lg font-bold text-gov-text">{title}</h3>
      {children}
    </section>
  );
}

export default function RequerimentoFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { withLoader } = useLoader();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policiais, setPoliciais] = useState<Policial[]>([]);
  const [buscaPolicial, setBuscaPolicial] = useState("");
  const [mostrarBuscaPolicial, setMostrarBuscaPolicial] = useState(false);
  const [form, setForm] = useState<RequerimentoPayload>(initialForm);

  const policialSelecionado = useMemo(
    () => policiais.find((policial) => policial.id === form.policial_id),
    [policiais, form.policial_id]
  );

  const policiaisFiltrados = useMemo(() => {
    if (!mostrarBuscaPolicial) return [];
    const termo = buscaPolicial.toLowerCase().trim();
    if (!termo) return policiais.slice(0, 8);
    return policiais
      .filter(
        (policial) =>
          policial.nome_completo.toLowerCase().includes(termo) ||
          String(policial.matricula).includes(termo)
      )
      .slice(0, 8);
  }, [policiais, buscaPolicial, mostrarBuscaPolicial]);

  useEffect(() => {
    async function carregar() {
      try {
        async function carregarPoliciais() {
          const primeiraPagina = await api.get<Policial[]>("/policiais", {
            params: { page: 1, per_page: PER_PAGE },
          });
          const total = parseTotalCount(primeiraPagina.headers["x-total-count"]);
          const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));
          const todos = [...primeiraPagina.data];
          for (let page = 2; page <= totalPaginas; page += 1) {
            const { data } = await api.get<Policial[]>("/policiais", {
              params: { page, per_page: PER_PAGE },
            });
            todos.push(...data);
          }
          return todos;
        }

        const [policiaisData, requerimentoResponse] = await Promise.all([
          carregarPoliciais(),
          editando ? api.get<Requerimento>(`/requerimentos/${id}`) : Promise.resolve(null),
        ]);
        setPoliciais(policiaisData);
        if (requerimentoResponse) {
          const requerimento = requerimentoResponse.data;
          setForm({
            policial_id: requerimento.policial_id,
            num_processo_sei_requerimento: requerimento.num_processo_sei_requerimento,
            data_recebimento_opm: requerimento.data_recebimento_opm,
            hora_recebimento_opm: requerimento.hora_recebimento_opm,
            num_sei_certidao_opm: requerimento.num_sei_certidao_opm,
            tem_afastamentos: requerimento.tem_afastamentos,
            gozou_ferias_5_anos: requerimento.gozou_ferias_5_anos,
            tem_prioridade_legal: requerimento.tem_prioridade_legal,
            enviado_para_cp: requerimento.enviado_para_cp,
            abono_pecuniario_2021: requerimento.abono_pecuniario_2021 ?? "",
            ferias_1_3_2021: requerimento.ferias_1_3_2021 ?? "",
            abono_pecuniario_2022: requerimento.abono_pecuniario_2022 ?? "",
            ferias_1_3_2022: requerimento.ferias_1_3_2022 ?? "",
            abono_pecuniario_2023: requerimento.abono_pecuniario_2023 ?? "",
            ferias_1_3_2023: requerimento.ferias_1_3_2023 ?? "",
            abono_pecuniario_2024: requerimento.abono_pecuniario_2024 ?? "",
            ferias_1_3_2024: requerimento.ferias_1_3_2024 ?? "",
            abono_pecuniario_2025: requerimento.abono_pecuniario_2025 ?? "",
            ferias_1_3_2025: requerimento.ferias_1_3_2025 ?? "",
            auxilio_saude_2021: requerimento.auxilio_saude_2021 ?? "",
            auxilio_saude_2022: requerimento.auxilio_saude_2022 ?? "",
            auxilio_saude_2023: requerimento.auxilio_saude_2023 ?? "",
            auxilio_saude_2024: requerimento.auxilio_saude_2024 ?? "",
            auxilio_saude_2025: requerimento.auxilio_saude_2025 ?? "",
            auxilio_saude_2026: requerimento.auxilio_saude_2026 ?? "",
          });
          setBuscaPolicial(
            `${requerimento.policial.matricula} - ${requerimento.policial.nome_completo}`
          );
        }
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      } finally {
        setLoading(false);
      }
    }
    void carregar();
  }, [editando, id, showToast]);

  function updateField<K extends keyof RequerimentoPayload>(key: K, value: RequerimentoPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.policial_id) {
      showToast("Selecione um policial militar.", "error");
      return;
    }
    if (!/^\d{4}\.\d{6}\/\d{4}-\d{2}$/.test(form.num_processo_sei_requerimento)) {
      showToast("Informe o processo SEI no formato 0000.000000/0000-00.", "error");
      return;
    }
    setSaving(true);
    try {
      await withLoader(async () => {
        if (editando) {
          await api.put(`/requerimentos/${id}`, form);
        } else {
          await api.post("/requerimentos", form);
        }
      }, editando ? "Atualizando..." : "Salvando...");
      showToast(
        editando ? "Requerimento atualizado com sucesso." : "Requerimento criado com sucesso."
      );
      navigate(
        policialSelecionado
          ? `/requerimentos/${encodeURIComponent(policialSelecionado.posto_graduacao)}`
          : "/requerimentos"
      );
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader
        title={editando ? "Editar Requerimento" : "Adicionar Requerimento"}
        eyebrow={editando ? "Requerimento · edição" : "Requerimento · novo cadastro"}
        subtitle="Registre as informações conferidas pela OPM."
        icon={FileText}
      />
      <form onSubmit={handleSubmit} className="surface-card space-y-6 p-5 sm:p-6">
        <FieldSection title="Identificação do Processo">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="text-sm font-semibold">Nº Processo SEI</span>
              <input
                value={form.num_processo_sei_requerimento}
                onChange={(event) =>
                  updateField("num_processo_sei_requerimento", maskSeiProcess(event.target.value))
                }
                required
                placeholder="0000.000000/0000-00"
                maxLength={19}
                className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Data Recebimento OPM</span>
              <input
                type="date"
                value={form.data_recebimento_opm}
                onChange={(event) => updateField("data_recebimento_opm", event.target.value)}
                required
                className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Hora Recebimento OPM</span>
              <input
                type="time"
                step="1"
                value={form.hora_recebimento_opm}
                onChange={(event) => updateField("hora_recebimento_opm", event.target.value)}
                required
                className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Nº SEI Certidão</span>
              <input
                value={form.num_sei_certidao_opm}
                onChange={(event) => updateField("num_sei_certidao_opm", event.target.value)}
                required
                className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
        </FieldSection>

        <FieldSection title="Dados do Policial">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px_220px]">
            <label className="block">
              <span className="text-sm font-semibold">Buscar Policial</span>
              <input
                value={buscaPolicial}
                onFocus={() => setMostrarBuscaPolicial(true)}
                onChange={(event) => {
                  setBuscaPolicial(event.target.value);
                  setMostrarBuscaPolicial(true);
                }}
                placeholder="Digite matrícula ou nome"
                className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
              />
              {mostrarBuscaPolicial ? (
                <div className="mt-2 max-h-48 overflow-auto rounded border border-slate-200">
                  {policiaisFiltrados.map((policial) => (
                    <button
                      key={policial.id}
                      type="button"
                      onClick={() => {
                        updateField("policial_id", policial.id);
                        setBuscaPolicial(`${policial.matricula} - ${policial.nome_completo}`);
                        setMostrarBuscaPolicial(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                        policial.id === form.policial_id ? "bg-blue-50 font-semibold" : ""
                      }`}
                    >
                      {policial.matricula} - {policial.nome_completo}
                    </button>
                  ))}
                  {buscaPolicial.trim() && !policiaisFiltrados.length ? (
                    <div className="px-3 py-3 text-sm text-gov-muted">Nenhum policial encontrado.</div>
                  ) : null}
                </div>
              ) : null}
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Posto/Graduação</span>
              <input
                value={policialSelecionado?.posto_graduacao ?? ""}
                readOnly
                className="mt-1 w-full rounded border border-slate-200 bg-slate-100 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Matrícula</span>
              <input
                value={policialSelecionado?.matricula ?? ""}
                readOnly
                className="mt-1 w-full rounded border border-slate-200 bg-slate-100 px-3 py-2"
              />
            </label>
          </div>
        </FieldSection>

        <FieldSection title="Situação Funcional">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["tem_afastamentos", "Tem afastamentos?"],
              ["gozou_ferias_5_anos", "Gozou férias nos últimos 5 anos?"],
              ["tem_prioridade_legal", "Tem prioridade legal?"],
              ["enviado_para_cp", "Enviado para CP?"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-sm font-semibold">{label}</span>
                <select
                  value={form[key as keyof RequerimentoPayload] ? "SIM" : "NÃO"}
                  onChange={(event) =>
                    updateField(
                      key as keyof RequerimentoPayload,
                      (event.target.value === "SIM") as never
                    )
                  }
                  className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
                >
                  <option value="NÃO">NÃO</option>
                  <option value="SIM">SIM</option>
                </select>
              </label>
            ))}
          </div>
        </FieldSection>

        <FieldSection title="Abono Pecuniário e 1/3 de Férias por Ano">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {anosAbono.map((ano) => (
              <div key={ano} className="rounded border border-slate-200 p-3">
                <h4 className="font-bold">{ano}</h4>
                <label className="mt-3 block">
                  <span className="text-sm font-semibold">Abono Pecuniário</span>
                  <input
                    value={(form[`abono_pecuniario_${ano}` as keyof RequerimentoPayload] as string) ?? ""}
                    onChange={(event) =>
                      updateField(`abono_pecuniario_${ano}` as keyof RequerimentoPayload, normalizeMonthYear(event.target.value) as never)
                    }
                    placeholder="ex: out/2022"
                    maxLength={8}
                    className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  />
                </label>
                <label className="mt-3 block">
                  <span className="text-sm font-semibold">1/3 de Férias</span>
                  <input
                    value={(form[`ferias_1_3_${ano}` as keyof RequerimentoPayload] as string) ?? ""}
                    onChange={(event) =>
                      updateField(`ferias_1_3_${ano}` as keyof RequerimentoPayload, normalizeMonthYear(event.target.value) as never)
                    }
                    placeholder="ex: out/2022"
                    maxLength={8}
                    className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
                  />
                </label>
              </div>
            ))}
          </div>
        </FieldSection>

        <FieldSection title="Auxílio Saúde por Ano">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {anosSaude.map((ano) => (
              <label key={ano} className="block">
                <span className="text-sm font-semibold">{ano}</span>
                <input
                  value={(form[`auxilio_saude_${ano}` as keyof RequerimentoPayload] as string) ?? ""}
                  onChange={(event) =>
                    updateField(`auxilio_saude_${ano}` as keyof RequerimentoPayload, event.target.value.replace(/[^\d,]/g, "") as never)
                  }
                  onBlur={(event) =>
                    updateField(`auxilio_saude_${ano}` as keyof RequerimentoPayload, normalizeCurrency(event.target.value) as never)
                  }
                  placeholder="ex: 50,00"
                  inputMode="decimal"
                  className="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
                />
              </label>
            ))}
          </div>
        </FieldSection>

        <FormActions saving={saving} />
      </form>
    </>
  );
}
