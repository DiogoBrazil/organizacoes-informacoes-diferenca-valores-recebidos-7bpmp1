"""Geração da planilha oficial (modelo CP9) em .ods.

Estratégia: preencher um *template* (cópia descriptografada da planilha original
da CP, em ``app/templates/modelo_cp9.ods``) apenas nas células de entrada e deixar
a própria planilha recalcular tudo (a aba Resumo, os totais e as colunas ocultas
são 100% fórmulas). O preenchimento e o recálculo são feitos pelo próprio
LibreOffice em modo headless (UNO), garantindo fidelidade total ao modelo e que o
arquivo abra na CP já com os valores corretos — e que recalcule sozinho se editado.

O módulo ``uno`` (pacote ``python3-uno`` do Debian) é compilado para o Python do
sistema (apt), que não é o mesmo interpretador do app (python:3.12-slim). Por isso
o trabalho UNO roda num *worker* standalone (``uno_fill_worker.py``) executado com
``/usr/bin/python3``; a comunicação é por JSON. O worker conecta num LibreOffice
headless iniciado pelo ``entrypoint.sh`` (socket UNO). As requisições são
serializadas por um lock (uso interno, baixo volume).
"""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
import threading
from datetime import date
from decimal import Decimal
from pathlib import Path

from app.services.calculo_service import tipo_auxilio_from_valor

_SERVICES_DIR = Path(__file__).resolve().parent
TEMPLATE_PATH = _SERVICES_DIR.parent / "templates" / "modelo_cp9.ods"
WORKER_PATH = _SERVICES_DIR / "uno_fill_worker.py"

# Interpretador que possui o módulo ``uno`` (python3-uno do sistema).
UNO_PYTHON = os.getenv("UNO_PYTHON", "/usr/bin/python3")

# Epoch das datas seriais do Calc/Excel (30/12/1899).
_EPOCH = date(1899, 12, 30)

# Serializa o acesso ao LibreOffice (um documento por vez).
_lock = threading.Lock()


def _serial(d: date) -> int:
    """Converte uma data em número de série do Calc (mesma base do Excel)."""
    return (d - _EPOCH).days


def _payload(requerimento, calculo) -> dict:
    pol = requerimento.policial

    eventos = [e for e in requerimento.eventos if e.valor_auxilio_saude is not None]
    eventos.sort(key=lambda e: (e.data_recebido, e.tipo_evento))
    lancamentos = [
        {
            "data_serial": _serial(ev.data_recebido),
            "tipo_evento": ev.tipo_evento,
            "tipo_auxilio": tipo_auxilio_from_valor(Decimal(ev.valor_auxilio_saude)),
        }
        for ev in eventos
    ]

    afastamentos = [
        {
            "modalidade": af.modalidade,
            "inicio_serial": _serial(af.data_inicio),
            "fim_serial": _serial(af.data_fim),
        }
        for af in (getattr(calculo, "afastamentos", []) or [])
    ]

    return {
        "identificacao": {
            "nome": pol.nome_completo,
            "posto": pol.posto_graduacao,
            "matricula": str(pol.matricula),
            "opm": pol.opm,
            "data_protocolo_serial": _serial(requerimento.data_recebimento_opm),
        },
        "lancamentos": lancamentos,
        "afastamentos": afastamentos,
    }


def gerar_ods(requerimento, calculo) -> bytes:
    """Preenche o template com os dados do requerimento/cálculo e devolve o .ods."""
    dados = _payload(requerimento, calculo)

    with _lock:
        with tempfile.TemporaryDirectory() as tmpdir:
            entrada = Path(tmpdir) / "dados.json"
            saida = Path(tmpdir) / "saida.ods"
            entrada.write_text(json.dumps(dados), encoding="utf-8")

            resultado = subprocess.run(
                [
                    UNO_PYTHON,
                    str(WORKER_PATH),
                    str(TEMPLATE_PATH),
                    str(entrada),
                    str(saida),
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )
            if resultado.returncode != 0 or not saida.exists():
                raise RuntimeError(
                    "Falha ao gerar a planilha (LibreOffice/UNO): "
                    f"{resultado.stderr.strip() or resultado.stdout.strip()}"
                )
            return saida.read_bytes()
