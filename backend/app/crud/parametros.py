from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.indice_correcao import IndiceCorrecao
from app.models.parametro_auxilio import ParametroAuxilio


def load_parametros_map(
    db: Session,
) -> dict[tuple[int, int], tuple[Decimal, Decimal, Decimal]]:
    """Mapa (ano, mês) -> (alimentação, saúde, condicional) a partir do banco."""
    return {
        (p.ano, p.mes): (
            p.auxilio_alimentacao,
            p.auxilio_saude,
            p.auxilio_saude_condicional,
        )
        for p in db.scalars(select(ParametroAuxilio)).all()
    }


def load_indices_map(db: Session) -> dict[tuple[int, int], Decimal]:
    """Mapa (ano, mês) -> percentual mensal IPCA-E a partir do banco."""
    return {
        (i.ano, i.mes): i.percentual_mensal
        for i in db.scalars(select(IndiceCorrecao)).all()
    }
