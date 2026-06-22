from uuid import UUID

from sqlalchemy import String, case, func, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.constants import POSTO_ORDEM
from app.models.calculo import Calculo
from app.models.policial import PolicialMilitar
from app.models.requerimento import Requerimento
from app.models.requerimento_evento import RequerimentoEvento
from app.schemas.requerimento import RequerimentoCreate, RequerimentoUpdate


def get_requerimento(db: Session, requerimento_id: UUID) -> Requerimento | None:
    stmt = (
        select(Requerimento)
        .options(
            joinedload(Requerimento.policial),
            selectinload(Requerimento.eventos),
        )
        .where(Requerimento.id == requerimento_id)
    )
    return db.scalar(stmt)


def _eventos_models(data: RequerimentoCreate | RequerimentoUpdate) -> list[RequerimentoEvento]:
    return [
        RequerimentoEvento(
            tipo_evento=e.tipo_evento,
            ano=e.ano,
            data_recebido=e.data_recebido,
            valor_auxilio_saude=e.valor_auxilio_saude,
        )
        for e in data.eventos
    ]


def _eventos_snapshot(eventos) -> list[tuple[str, int, object, object]]:
    return sorted(
        (
            e.tipo_evento,
            e.ano,
            e.data_recebido,
            e.valor_auxilio_saude,
        )
        for e in eventos
    )


def _calculo_deve_ser_invalidado(
    requerimento: Requerimento, data: RequerimentoUpdate
) -> bool:
    return (
        requerimento.policial_id != data.policial_id
        or requerimento.data_recebimento_opm != data.data_recebimento_opm
        or _eventos_snapshot(requerimento.eventos) != _eventos_snapshot(data.eventos)
    )


def _delete_calculo_by_requerimento_id(db: Session, requerimento_id: UUID) -> None:
    calculo = db.scalar(select(Calculo).where(Calculo.requerimento_id == requerimento_id))
    if calculo:
        db.delete(calculo)
        db.flush()


def get_requerimento_by_processo_sei(
    db: Session, num_processo_sei_requerimento: str
) -> Requerimento | None:
    stmt = select(Requerimento).where(
        Requerimento.num_processo_sei_requerimento == num_processo_sei_requerimento
    )
    return db.scalar(stmt)


def list_requerimentos(
    db: Session,
    posto_graduacao: str | None = None,
    busca: str | None = None,
    offset: int = 0,
    limit: int | None = None,
) -> tuple[list[Requerimento], int]:
    hierarchy = case(POSTO_ORDEM, value=PolicialMilitar.posto_graduacao, else_=999)
    stmt = select(Requerimento).join(Requerimento.policial)
    if posto_graduacao:
        stmt = stmt.where(PolicialMilitar.posto_graduacao == posto_graduacao)
    if busca:
        like = f"%{busca.strip()}%"
        stmt = stmt.where(
            or_(
                PolicialMilitar.nome_completo.ilike(like),
                PolicialMilitar.matricula.cast(String).ilike(like),
            )
        )
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    stmt = stmt.options(
        joinedload(Requerimento.policial), selectinload(Requerimento.eventos)
    ).order_by(
        hierarchy.asc(),
        Requerimento.data_recebimento_opm.asc(),
        Requerimento.hora_recebimento_opm.asc(),
        PolicialMilitar.nome_completo.asc(),
    )
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    return list(db.scalars(stmt).all()), total


def count_by_posto(db: Session) -> dict[str, int]:
    stmt = (
        select(PolicialMilitar.posto_graduacao, Requerimento.id)
        .join(Requerimento, Requerimento.policial_id == PolicialMilitar.id)
    )
    counts: dict[str, int] = {}
    for posto, _ in db.execute(stmt).all():
        counts[posto] = counts.get(posto, 0) + 1
    return counts


def create_requerimento(db: Session, data: RequerimentoCreate) -> Requerimento:
    payload = data.model_dump(exclude={"eventos"})
    requerimento = Requerimento(**payload)
    requerimento.eventos = _eventos_models(data)
    db.add(requerimento)
    db.commit()
    db.refresh(requerimento)
    return get_requerimento(db, requerimento.id) or requerimento


def update_requerimento(
    db: Session, requerimento: Requerimento, data: RequerimentoUpdate
) -> Requerimento:
    if _calculo_deve_ser_invalidado(requerimento, data):
        _delete_calculo_by_requerimento_id(db, requerimento.id)

    for field, value in data.model_dump(exclude={"eventos"}).items():
        setattr(requerimento, field, value)
    # Remove os eventos antigos e força o DELETE (flush) antes de inserir os novos,
    # evitando violação transitória da unique (requerimento_id, tipo_evento, ano)
    # quando os eventos recriados repetem o mesmo tipo/ano.
    requerimento.eventos.clear()
    db.flush()
    requerimento.eventos = _eventos_models(data)
    db.commit()
    db.refresh(requerimento)
    return get_requerimento(db, requerimento.id) or requerimento


def set_enviado_para_cp(
    db: Session, requerimento: Requerimento, valor: bool
) -> Requerimento:
    requerimento.enviado_para_cp = valor
    db.commit()
    db.refresh(requerimento)
    return get_requerimento(db, requerimento.id) or requerimento


def delete_requerimento(db: Session, requerimento: Requerimento) -> None:
    _delete_calculo_by_requerimento_id(db, requerimento.id)
    db.delete(requerimento)
    db.commit()
