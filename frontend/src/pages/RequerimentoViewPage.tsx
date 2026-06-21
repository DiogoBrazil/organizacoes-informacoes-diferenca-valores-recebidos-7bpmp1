import { ArrowLeft, Calculator, Download, Edit } from "lucide-react";
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
        <Link to={voltarPara} className="btn btn-outline">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <Link to={`/requerimentos/${requerimento.id}/editar`} className="btn btn-primary">
          <Edit className="h-4 w-4" />
          Editar
        </Link>
        <Link to={`/requerimentos/${requerimento.id}/calculo`} className="btn btn-primary">
          <Calculator className="h-4 w-4" />
          Cálculo da diferença
        </Link>
        <button
          type="button"
          onClick={handleGerarPdf}
          disabled={generatingPdf}
          className="btn btn-danger"
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
            <DetailItem label="OPM" value={displayText(requerimento.policial.opm)} />
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

        <DetailSection title="Eventos (Abono, 1/3 de Férias e 13º)">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-center text-sm">
              <thead className="bg-slate-100 text-gov-muted">
                <tr>
                  <th className="border border-slate-300 px-3 py-2">Ano ref.</th>
                  <th className="border border-slate-300 px-3 py-2">Evento</th>
                  <th className="border border-slate-300 px-3 py-2">Data de recebimento</th>
                  <th className="border border-slate-300 px-3 py-2">Auxílio Saúde</th>
                </tr>
              </thead>
              <tbody>
                {[...requerimento.eventos]
                  .sort((a, b) => a.ano - b.ano || a.tipo_evento.localeCompare(b.tipo_evento))
                  .map((evento) => (
                    <tr key={`${evento.tipo_evento}-${evento.ano}`}>
                      <td className="border border-slate-300 px-3 py-2 font-semibold">{evento.ano}</td>
                      <td className="border border-slate-300 px-3 py-2">{evento.tipo_evento}</td>
                      <td className="border border-slate-300 px-3 py-2">
                        {formatDate(evento.data_recebido)}
                      </td>
                      <td className="border border-slate-300 px-3 py-2">
                        {evento.valor_auxilio_saude !== null && evento.valor_auxilio_saude !== ""
                          ? currencyWithSymbol(
                              Number(evento.valor_auxilio_saude).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            )
                          : "-"}
                      </td>
                    </tr>
                  ))}
                {!requerimento.eventos.length ? (
                  <tr>
                    <td colSpan={4} className="border border-slate-300 px-3 py-6 text-gov-muted">
                      Nenhum evento cadastrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </DetailSection>
      </div>
    </>
  );
}
