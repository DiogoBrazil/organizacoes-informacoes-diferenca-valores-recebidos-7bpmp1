from uuid import UUID

from sqlalchemy import String, case, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.constants import POSTO_ORDEM
from app.models.policial import PolicialMilitar
from app.models.requerimento import Requerimento
from app.schemas.requerimento import RequerimentoCreate, RequerimentoUpdate


def get_requerimento(db: Session, requerimento_id: UUID) -> Requerimento | None:
    stmt = (
        select(Requerimento)
        .options(joinedload(Requerimento.policial))
        .where(Requerimento.id == requerimento_id)
    )
    return db.scalar(stmt)


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
    stmt = stmt.options(joinedload(Requerimento.policial)).order_by(
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
    requerimento = Requerimento(**data.model_dump())
    db.add(requerimento)
    db.commit()
    db.refresh(requerimento)
    return get_requerimento(db, requerimento.id) or requerimento


def update_requerimento(
    db: Session, requerimento: Requerimento, data: RequerimentoUpdate
) -> Requerimento:
    for field, value in data.model_dump().items():
        setattr(requerimento, field, value)
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
    db.delete(requerimento)
    db.commit()
