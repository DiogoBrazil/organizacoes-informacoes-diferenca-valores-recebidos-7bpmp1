import { ArrowLeft, Download, Edit } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import BooleanBadge from "../components/BooleanBadge";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { useToast } from "../context/ToastContext";
import { api, getErrorMessage } from "../services/api";
import { exportRequerimentoIndividualPdf } from "../services/exporters";
import { currencyWithSymbol, displayText, formatDate, formatTime } from "../services/requerimentoColumns";
import type { Requerimento } from "../types";

const anosAbono = [2021, 2022, 2023, 2024, 2025] as const;
const anosSaude = [2021, 2022, 2023, 2024, 2025, 2026] as const;

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-gov-text">{title}</h3>
      {children}
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-gov-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-gov-text">{value}</dd>
    </div>
  );
}

export default function RequerimentoViewPage() {
  const { id } = useParams();
  const [requerimento, setRequerimento] = useState<Requerimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function carregar() {
      try {
        const { data } = await api.get<Requerimento>(`/requerimentos/${id}`);
        setRequerimento(data);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      } finally {
        setLoading(false);
      }
    }
    void carregar();
  }, [id, showToast]);

  if (loading) return <LoadingState />;

  if (!requerimento) {
    return <PageHeader title="Requerimento não encontrado" subtitle="Não foi possível carregar os dados." />;
  }

  const voltarPara = `/requerimentos/${encodeURIComponent(requerimento.policial.posto_graduacao)}`;

  async function handleGerarPdf() {
    if (!requerimento) return;
    setGeneratingPdf(true);
    try {
      await exportRequerimentoIndividualPdf(requerimento);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap justify-end gap-2">
        <Link
          to={voltarPara}
          className="focus-ring inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <Link
          to={`/requerimentos/${requerimento.id}/editar`}
          className="focus-ring inline-flex items-center gap-2 rounded bg-gov-primary px-4 py-2 text-sm font-semibold text-white hover:bg-gov-secondary"
        >
          <Edit className="h-4 w-4" />
          Editar
        </Link>
        <button
          type="button"
          onClick={handleGerarPdf}
          disabled={generatingPdf}
          className="focus-ring inline-flex items-center gap-2 rounded bg-gov-primary px-4 py-2 text-sm font-semibold text-white hover:bg-gov-secondary disabled:opacity-70"
        >
          <Download className="h-4 w-4" />
          {generatingPdf ? "Gerando..." : "Gerar PDF"}
        </button>
      </div>

      <div className="space-y-5">
        <DetailSection title="Identificação do Processo">
          <dl className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="Processo SEI" value={displayText(requerimento.num_processo_sei_requerimento)} />
            <DetailItem label="Data de Recebimento" value={formatDate(requerimento.data_recebimento_opm)} />
            <DetailItem label="Hora de Recebimento" value={formatTime(requerimento.hora_recebimento_opm)} />
            <DetailItem label="Nº Certidão SEI" value={displayText(requerimento.num_sei_certidao_opm)} />
          </dl>
        </DetailSection>

        <DetailSection title="Dados do Policial">
          <dl className="grid gap-3 md:grid-cols-3">
            <DetailItem label="Posto/Graduação" value={requerimento.policial.posto_graduacao} />
            <DetailItem label="Nome" value={requerimento.policial.nome_completo} />
            <DetailItem label="RE" value={requerimento.policial.matricula} />
          </dl>
        </DetailSection>

        <DetailSection title="Situação Funcional">
          <dl className="grid gap-3 md:grid-cols-3">
            <DetailItem label="Afastamentos Registrados" value={<BooleanBadge value={requerimento.tem_afastamentos} />} />
            <DetailItem label="Gozou Todas Férias últimos 5 anos" value={<BooleanBadge value={requerimento.gozou_ferias_5_anos} />} />
            <DetailItem label="Prioridade" value={<BooleanBadge value={requerimento.tem_prioridade_legal} />} />
            <DetailItem label="Enviado para CP" value={<BooleanBadge value={requerimento.enviado_para_cp} falseVariant="danger" />} />
          </dl>
        </DetailSection>

        <DetailSection title="Abono Pecuniario e 1/3 ferias por ano">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-center text-sm">
              <thead className="bg-slate-100 text-gov-muted">
                <tr>
                  <th className="border border-slate-300 px-3 py-2">Ano</th>
                  <th className="border border-slate-300 px-3 py-2">Abono Pecuniario</th>
                  <th className="border border-slate-300 px-3 py-2">1/3 ferias</th>
                </tr>
              </thead>
              <tbody>
                {anosAbono.map((ano) => (
                  <tr key={ano}>
                    <td className="border border-slate-300 px-3 py-2 font-semibold">{ano}</td>
                    <td className="border border-slate-300 px-3 py-2">
                      {displayText(requerimento[`abono_pecuniario_${ano}`])}
                    </td>
                    <td className="border border-slate-300 px-3 py-2">
                      {displayText(requerimento[`ferias_1_3_${ano}`])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailSection>

        <DetailSection title="Auxilio Saúde por ano">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {anosSaude.map((ano) => (
              <DetailItem
                key={ano}
                label={`Auxilio Saúde ${ano}`}
                value={currencyWithSymbol(requerimento[`auxilio_saude_${ano}`])}
              />
            ))}
          </dl>
        </DetailSection>
      </div>
    </>
  );
}
