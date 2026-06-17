from uuid import UUID

from sqlalchemy import String, case, func, or_, select
from sqlalchemy.orm import Session

from app.core.constants import POSTO_ORDEM
from app.models.policial import PolicialMilitar
from app.schemas.policial import PolicialCreate, PolicialUpdate


def _hierarchy_case():
    return case(POSTO_ORDEM, value=PolicialMilitar.posto_graduacao, else_=999)


def get_policial(db: Session, policial_id: UUID) -> PolicialMilitar | None:
    return db.get(PolicialMilitar, policial_id)


def get_policial_by_matricula(db: Session, matricula: int) -> PolicialMilitar | None:
    return db.scalar(select(PolicialMilitar).where(PolicialMilitar.matricula == matricula))


def list_policiais(
    db: Session,
    posto_graduacao: str | None = None,
    busca: str | None = None,
    offset: int = 0,
    limit: int | None = None,
) -> tuple[list[PolicialMilitar], int]:
    stmt = select(PolicialMilitar)
    if posto_graduacao:
        stmt = stmt.where(PolicialMilitar.posto_graduacao == posto_graduacao)
    if busca:
        like = f"%{busca.strip()}%"
        stmt = stmt.where(
            or_(
                PolicialMilitar.nome_completo.ilike(like),
                PolicialMilitar.matricula.cast(String).ilike(like),  # type: ignore[name-defined]
            )
        )
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    stmt = stmt.order_by(_hierarchy_case().asc(), PolicialMilitar.nome_completo.asc())
    if limit is not None:
        stmt = stmt.offset(offset).limit(limit)
    return list(db.scalars(stmt).all()), total


def create_policial(db: Session, data: PolicialCreate) -> PolicialMilitar:
    policial = PolicialMilitar(
        posto_graduacao=data.posto_graduacao,
        matricula=data.matricula,
        nome_completo=data.nome_completo.strip(),
    )
    db.add(policial)
    db.commit()
    db.refresh(policial)
    return policial


def update_policial(db: Session, policial: PolicialMilitar, data: PolicialUpdate) -> PolicialMilitar:
    policial.posto_graduacao = data.posto_graduacao
    policial.matricula = data.matricula
    policial.nome_completo = data.nome_completo.strip()
    db.commit()
    db.refresh(policial)
    return policial


def delete_policial(db: Session, policial: PolicialMilitar) -> None:
    db.delete(policial)
    db.commit()
