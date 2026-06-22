from datetime import date, time
from decimal import Decimal
from uuid import uuid4

from app.crud import requerimento as crud
from app.models.calculo import Calculo
from app.models.requerimento import Requerimento
from app.models.requerimento_evento import RequerimentoEvento
from app.schemas.requerimento import RequerimentoUpdate


class FakeSession:
    def __init__(self, calculo: Calculo | None = None):
        self.calculo = calculo
        self.deleted = []
        self.flush_count = 0
        self.commit_count = 0
        self.refresh_count = 0
        self.scalar_count = 0

    def scalar(self, _stmt):
        self.scalar_count += 1
        if self.scalar_count == 1:
            return self.calculo
        return None

    def delete(self, item):
        self.deleted.append(item)

    def flush(self):
        self.flush_count += 1

    def commit(self):
        self.commit_count += 1

    def refresh(self, _item):
        self.refresh_count += 1


def _evento(
    tipo_evento: str = "ABONO",
    ano: int = 2024,
    data_recebido: date = date(2024, 6, 30),
    valor_auxilio_saude: Decimal = Decimal("50.00"),
) -> RequerimentoEvento:
    return RequerimentoEvento(
        tipo_evento=tipo_evento,
        ano=ano,
        data_recebido=data_recebido,
        valor_auxilio_saude=valor_auxilio_saude,
    )


def _requerimento() -> Requerimento:
    return Requerimento(
        id=uuid4(),
        policial_id=uuid4(),
        num_processo_sei_requerimento="0000.000000/2026-00",
        data_recebimento_opm=date(2026, 6, 21),
        hora_recebimento_opm=time(8, 30),
        num_sei_certidao_opm="123",
        tem_afastamentos=False,
        gozou_ferias_5_anos=False,
        tem_prioridade_legal=False,
        enviado_para_cp=False,
        eventos=[_evento()],
    )


def _update(requerimento: Requerimento, **overrides) -> RequerimentoUpdate:
    data = {
        "policial_id": requerimento.policial_id,
        "num_processo_sei_requerimento": requerimento.num_processo_sei_requerimento,
        "data_recebimento_opm": requerimento.data_recebimento_opm,
        "hora_recebimento_opm": requerimento.hora_recebimento_opm,
        "num_sei_certidao_opm": requerimento.num_sei_certidao_opm,
        "tem_afastamentos": requerimento.tem_afastamentos,
        "gozou_ferias_5_anos": requerimento.gozou_ferias_5_anos,
        "tem_prioridade_legal": requerimento.tem_prioridade_legal,
        "enviado_para_cp": requerimento.enviado_para_cp,
        "eventos": [
            {
                "tipo_evento": e.tipo_evento,
                "ano": e.ano,
                "data_recebido": e.data_recebido,
                "valor_auxilio_saude": e.valor_auxilio_saude,
            }
            for e in requerimento.eventos
        ],
    }
    data.update(overrides)
    return RequerimentoUpdate(**data)


def test_update_requerimento_invalida_calculo_quando_eventos_mudam():
    requerimento = _requerimento()
    calculo = Calculo(id=uuid4(), requerimento_id=requerimento.id)
    db = FakeSession(calculo)

    crud.update_requerimento(
        db,
        requerimento,
        _update(
            requerimento,
            eventos=[
                {
                    "tipo_evento": "ABONO",
                    "ano": 2024,
                    "data_recebido": date(2024, 7, 30),
                    "valor_auxilio_saude": Decimal("150.00"),
                }
            ],
        ),
    )

    assert calculo in db.deleted
    assert db.flush_count >= 2
    assert db.commit_count == 1


def test_update_requerimento_preserva_calculo_quando_dados_do_calculo_nao_mudam():
    requerimento = _requerimento()
    db = FakeSession()

    crud.update_requerimento(
        db,
        requerimento,
        _update(requerimento, num_sei_certidao_opm="456", tem_prioridade_legal=True),
    )

    assert db.deleted == []
    assert db.flush_count == 1
    assert db.commit_count == 1


def test_delete_requerimento_remove_calculo_antes_do_requerimento():
    requerimento = _requerimento()
    calculo = Calculo(id=uuid4(), requerimento_id=requerimento.id)
    db = FakeSession(calculo)

    crud.delete_requerimento(db, requerimento)

    assert db.deleted == [calculo, requerimento]
    assert db.flush_count == 1
    assert db.commit_count == 1
