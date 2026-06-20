import { ArrowLeft, Calculator, Download, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { useLoader } from "../context/LoaderContext";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import {
  formatBRL,
  formatFator,
  getCalculo,
  salvarCalculo,
  simularCalculo,
} from "../services/calculoApi";
import { exportCalculoExcel, exportCalculoPdf } from "../services/exporters";
import { formatDate, formatTime } from "../services/requerimentoColumns";
import {
  MODALIDADES_AFASTAMENTO,
  TIPOS_AUX_SAUDE,
  TIPOS_EVENTO,
  type Calculo,
  type CalculoAfastamentoInput,
  type CalculoIn,
  type CalculoLancamentoInput,
  type Requerimento,
} from "../types";

const inputClass =
  "focus-ring w-full rounded border border-slate-300 px-2 py-1.5 text-sm";

function novoLancamento(): CalculoLancamentoInput {
  return { data_recebido: "", tipo_evento: "ABONO", tipo_auxilio_saude: "SAUDE" };
}

function novoAfastamento(): CalculoAfastamentoInput {
  return { modalidade: "LTIP", data_inicio: "", data_fim: "" };
}

function lancamentoCompleto(l: CalculoLancamentoInput) {
  return Boolean(l.data_recebido && l.tipo_evento && l.tipo_auxilio_saude);
}

function afastamentoCompleto(a: CalculoAfastamentoInput) {
  return Boolean(
    a.modalidade && a.data_inicio && a.data_fim && a.data_fim >= a.data_inicio
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card mb-5 p-5">
      <h3 className="mb-4 text-lg font-bold text-gov-text">{title}</h3>
      {children}
    </section>
  );
}

export default function CalculoFormPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const { withLoader } = useLoader();

  const [requerimento, setRequerimento] = useState<Requerimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [persistido, setPersistido] = useState(false);

  const [lancamentos, setLancamentos] = useState<CalculoLancamentoInput[]>([
    novoLancamento(),
  ]);
  const [afastamentos, setAfastamentos] = useState<CalculoAfastamentoInput[]>([]);
  const [calculo, setCalculo] = useState<Calculo | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carga inicial: requerimento + eventual cálculo salvo.
  useEffect(() => {
    if (!id) return;
    const reqId = id;
    async function carregar() {
      try {
        const { data: req } = await api.get<Requerimento>(`/requerimentos/${reqId}`);
        setRequerimento(req);
        try {
          const existente = await getCalculo(reqId);
          setPersistido(true);
          setCalculo(existente);
          if (existente.lancamentos.length) {
            setLancamentos(
              existente.lancamentos.map((l) => ({
                data_recebido: l.data_recebido,
                tipo_evento: l.tipo_evento,
                tipo_auxilio_saude: l.tipo_auxilio_saude,
              }))
            );
          }
          setAfastamentos(
            existente.afastamentos.map((a) => ({
              modalidade: a.modalidade as CalculoAfastamentoInput["modalidade"],
              data_inicio: a.data_inicio,
              data_fim: a.data_fim,
            }))
          );
        } catch {
          // sem cálculo salvo ainda — segue com formulário vazio
        }
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      } finally {
        setLoading(false);
      }
    }
    void carregar();
  }, [id, showToast]);

  const payload = useMemo<CalculoIn>(
    () => ({
      lancamentos: lancamentos.filter(lancamentoCompleto),
      afastamentos: afastamentos.filter(afastamentoCompleto),
    }),
    [lancamentos, afastamentos]
  );

  // Prévia em tempo real: simula no backend (fonte da verdade), com debounce.
  useEffect(() => {
    if (!id) return;
    if (!payload.lancamentos.length) {
      setCalculo(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const resultado = await simularCalculo(id, payload);
        setCalculo(resultado);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [id, payload, showToast]);

  const atualizarLancamento = useCallback(
    (index: number, campo: keyof CalculoLancamentoInput, valor: string) => {
      setLancamentos((prev) =>
        prev.map((l, i) => (i === index ? { ...l, [campo]: valor } : l))
      );
    },
    []
  );

  const atualizarAfastamento = useCallback(
    (index: number, campo: keyof CalculoAfastamentoInput, valor: string) => {
      setAfastamentos((prev) =>
        prev.map((a, i) => (i === index ? { ...a, [campo]: valor } : a))
      );
    },
    []
  );

  async function handleSalvar() {
    if (!id) return;
    if (!payload.lancamentos.length) {
      showToast("Inclua ao menos um lançamento válido antes de salvar.", "error");
      return;
    }
    setSaving(true);
    try {
      const resultado = await withLoader(
        () => salvarCalculo(id, payload),
        "Salvando cálculo..."
      );
      setCalculo(resultado);
      setPersistido(true);
      showToast("Cálculo salvo com sucesso.");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport(tipo: "pdf" | "xlsx") {
    if (!requerimento || !calculo) return;
    try {
      if (tipo === "pdf") await exportCalculoPdf(requerimento, calculo);
      else exportCalculoExcel(requerimento, calculo);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  if (loading) return <LoadingState />;
  if (!requerimento) {
    return <PageHeader title="Requerimento não encontrado" />;
  }

  const voltarPara = `/requerimentos/${id}/visualizar`;
  const policial = requerimento.policial;

  return (
    <>
      <PageHeader
        title="Cálculo da diferença"
        eyebrow="Abono · 1/3 férias · 13º"
        subtitle="Lance os eventos e afastamentos; o cálculo é feito pelo servidor em tempo real."
        icon={Calculator}
        actions={
          <Link to={voltarPara} className="btn btn-outline">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        }
      />

      <Section title="Dados do policial e requerimento">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Nome", policial.nome_completo],
            ["Posto/Graduação", policial.posto_graduacao],
            ["Matrícula", String(policial.matricula)],
            ["OPM", policial.opm],
            ["Processo SEI", requerimento.num_processo_sei_requerimento],
            [
              "Recebimento OPM",
              `${formatDate(requerimento.data_recebimento_opm)} ${formatTime(
                requerimento.hora_recebimento_opm
              )}`,
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-slate-200 bg-slate-50 p-3">
              <dt className="text-xs font-bold uppercase tracking-wide text-gov-muted">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gov-text">{value}</dd>
            </div>
          ))}
        </dl>
        {calculo ? (
          <p className="mt-3 text-xs text-gov-muted">
            Data-base da correção: {formatDate(calculo.data_base_correcao)} · Limite de
            prescrição (5 anos): {formatDate(calculo.data_limite_prescricao)} · Planilha{" "}
            {calculo.versao_planilha}
          </p>
        ) : null}
      </Section>

      <Section title="Lançamentos">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-slate-100 text-gov-muted">
              <tr>
                <th className="border border-slate-300 px-2 py-2">#</th>
                <th className="border border-slate-300 px-2 py-2">Data recebida</th>
                <th className="border border-slate-300 px-2 py-2">Tipo de evento</th>
                <th className="border border-slate-300 px-2 py-2">Tipo aux. saúde</th>
                <th className="border border-slate-300 px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l, index) => (
                <tr key={index} className={index % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    <input
                      type="date"
                      min="2021-01-01"
                      max="2026-12-31"
                      value={l.data_recebido}
                      onChange={(e) =>
                        atualizarLancamento(index, "data_recebido", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    <select
                      value={l.tipo_evento}
                      onChange={(e) =>
                        atualizarLancamento(index, "tipo_evento", e.target.value)
                      }
                      className={inputClass}
                    >
                      {TIPOS_EVENTO.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    <select
                      value={l.tipo_auxilio_saude}
                      onChange={(e) =>
                        atualizarLancamento(index, "tipo_auxilio_saude", e.target.value)
                      }
                      className={inputClass}
                    >
                      {TIPOS_AUX_SAUDE.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setLancamentos((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="focus-ring rounded p-1.5 text-gov-danger hover:bg-red-50"
                      title="Remover lançamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => setLancamentos((prev) => [...prev, novoLancamento()])}
          className="btn btn-outline mt-3"
        >
          <Plus className="h-4 w-4" />
          Adicionar lançamento
        </button>
      </Section>

      <Section title="Afastamentos">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-slate-100 text-gov-muted">
              <tr>
                <th className="border border-slate-300 px-2 py-2">Modalidade</th>
                <th className="border border-slate-300 px-2 py-2">Data início</th>
                <th className="border border-slate-300 px-2 py-2">Data fim</th>
                <th className="border border-slate-300 px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {afastamentos.map((a, index) => (
                <tr key={index} className={index % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="border border-slate-300 px-2 py-1">
                    <select
                      value={a.modalidade}
                      onChange={(e) =>
                        atualizarAfastamento(index, "modalidade", e.target.value)
                      }
                      className={inputClass}
                    >
                      {MODALIDADES_AFASTAMENTO.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    <input
                      type="date"
                      value={a.data_inicio}
                      onChange={(e) =>
                        atualizarAfastamento(index, "data_inicio", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-slate-300 px-2 py-1">
                    <input
                      type="date"
                      value={a.data_fim}
                      onChange={(e) =>
                        atualizarAfastamento(index, "data_fim", e.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setAfastamentos((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="focus-ring rounded p-1.5 text-gov-danger hover:bg-red-50"
                      title="Remover afastamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!afastamentos.length ? (
                <tr>
                  <td
                    colSpan={4}
                    className="border border-slate-300 px-2 py-4 text-center text-gov-muted"
                  >
                    Nenhum afastamento registrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => setAfastamentos((prev) => [...prev, novoAfastamento()])}
          className="btn btn-outline mt-3"
        >
          <Plus className="h-4 w-4" />
          Adicionar afastamento
        </button>
      </Section>

      {calculo ? (
        <Section title="Resumo calculado">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="bg-slate-100 text-gov-muted">
                <tr>
                  <th className="border border-slate-300 px-2 py-2">Evento</th>
                  <th className="border border-slate-300 px-2 py-2">Ano</th>
                  <th className="border border-slate-300 px-2 py-2">Data evento</th>
                  <th className="border border-slate-300 px-2 py-2">Base</th>
                  <th className="border border-slate-300 px-2 py-2">IPCA-E</th>
                  <th className="border border-slate-300 px-2 py-2">Dif. ajustada</th>
                  <th className="border border-slate-300 px-2 py-2">Dif. corrigida</th>
                </tr>
              </thead>
              <tbody>
                {calculo.resumo.map((r, index) => (
                  <tr key={index} className={index % 2 ? "bg-slate-50" : "bg-white"}>
                    <td className="border border-slate-300 px-2 py-1 font-semibold">
                      {r.tipo_evento}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-center">{r.ano}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      {r.data_evento ? formatDate(r.data_evento) : "-"}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-right">
                      {formatBRL(r.base_complementar)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-right">
                      {formatFator(r.fator_correcao)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-right">
                      {r.prescrito ? "Prescrito" : formatBRL(r.diferenca_ajustada)}
                    </td>
                    <td className="border border-slate-300 px-2 py-1 text-right">
                      {r.prescrito ? "---" : formatBRL(r.diferenca_corrigida)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total Abono", calculo.total_abono_corrigido],
              ["Total 1/3 Férias", calculo.total_terco_ferias_corrigido],
              ["Total 13º", calculo.total_decimo_terceiro_corrigido],
              ["Total geral a receber", calculo.total_geral_a_receber],
            ].map(([label, value], i) => (
              <div
                key={label as string}
                className={`rounded border p-3 ${
                  i === 3
                    ? "border-gov-primary/30 bg-gov-primary/5"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="text-xs font-bold uppercase tracking-wide text-gov-muted">
                  {label}
                </p>
                <p className="mt-1 text-base font-bold text-gov-text">
                  {formatBRL(value as number)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-5">
        {persistido ? (
          <span className="mr-auto text-sm text-gov-muted">
            Cálculo salvo (snapshot congelado). Use “Salvar” para recalcular e
            sobrescrever.
          </span>
        ) : null}
        <button
          type="button"
          disabled={!calculo}
          onClick={() => handleExport("pdf")}
          className="btn btn-outline"
        >
          <Download className="h-4 w-4" />
          PDF
        </button>
        <button
          type="button"
          disabled={!calculo}
          onClick={() => handleExport("xlsx")}
          className="btn btn-outline"
        >
          <Download className="h-4 w-4" />
          XLSX
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSalvar}
          className="btn btn-primary"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar cálculo"}
        </button>
      </div>
    </>
  );
}
