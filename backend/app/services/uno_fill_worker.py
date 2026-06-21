"""Worker standalone (executado com /usr/bin/python3, que possui o módulo ``uno``).

Conecta no LibreOffice headless (socket UNO), abre o template como cópia, preenche
apenas as células de entrada com os dados do JSON, recalcula e salva o .ods.

Uso: ``/usr/bin/python3 uno_fill_worker.py <template.ods> <dados.json> <saida.ods>``

Não depende de nenhum módulo do app (só stdlib + uno), pois roda em outro
interpretador. O mapa de células segue a inspeção da planilha oficial CP9:
- Lançamentos: B2=Nome, B3=Posto, B4=Matrícula, B5=OPM, E3=data protocolo;
  linhas a partir de 8 (índice 7): B=data, C=evento, D=tipo aux. saúde.
- Afastamentos: linhas a partir de 11 (índice 10): A=modalidade, D=início, E=fim.
Todo o resto (Resumo, totais, colunas ocultas) é fórmula e se recalcula sozinho.
"""

import json
import os
import sys
import time
from urllib.parse import quote

import uno
from com.sun.star.beans import PropertyValue

UNO_HOST = os.getenv("LIBREOFFICE_UNO_HOST", "127.0.0.1")
UNO_PORT = os.getenv("LIBREOFFICE_UNO_PORT", "2002")

# Flags de limpeza (VALUE|STRING|DATETIME|FORMULA), preservando estilos/formatos.
CLEAR_FLAGS = 1 | 2 | 16 | 4


def prop(name, value):
    pv = PropertyValue()
    pv.Name = name
    pv.Value = value
    return pv


def file_url(path):
    return "file://" + quote(os.path.abspath(path))


def connect(retries=40, delay=0.5):
    local_ctx = uno.getComponentContext()
    resolver = local_ctx.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver", local_ctx
    )
    url = f"uno:socket,host={UNO_HOST},port={UNO_PORT};urp;StarOffice.ComponentContext"
    last = None
    for _ in range(retries):
        try:
            return resolver.resolve(url)
        except Exception as err:  # noqa: BLE001
            last = err
            time.sleep(delay)
    raise RuntimeError("Sem conexão com o LibreOffice headless: %s" % last)


def preencher_lancamentos(sheet, ident, lancamentos):
    sheet.getCellRangeByName("B2:B5").clearContents(CLEAR_FLAGS)
    sheet.getCellRangeByName("E3").clearContents(CLEAR_FLAGS)
    sheet.getCellByPosition(1, 1).setString(ident["nome"])
    sheet.getCellByPosition(1, 2).setString(ident["posto"])
    sheet.getCellByPosition(1, 3).setString(ident["matricula"])
    sheet.getCellByPosition(1, 4).setString(ident["opm"])
    sheet.getCellByPosition(4, 2).setValue(ident["data_protocolo_serial"])

    sheet.getCellRangeByName("B8:D200").clearContents(CLEAR_FLAGS)
    for i, ev in enumerate(lancamentos):
        row = 7 + i
        sheet.getCellByPosition(1, row).setValue(ev["data_serial"])
        sheet.getCellByPosition(2, row).setString(ev["tipo_evento"])
        sheet.getCellByPosition(3, row).setString(ev["tipo_auxilio"])


def preencher_afastamentos(sheet, afastamentos):
    sheet.getCellRangeByName("A11:A209").clearContents(CLEAR_FLAGS)
    sheet.getCellRangeByName("D11:E209").clearContents(CLEAR_FLAGS)
    for row in range(10, 209):
        sheet.getCellByPosition(0, row).setString("Selecione")

    if not afastamentos:
        sheet.getCellByPosition(0, 10).setString("Nenhum")
        return

    for i, af in enumerate(afastamentos):
        row = 10 + i
        sheet.getCellByPosition(0, row).setString(af["modalidade"])
        sheet.getCellByPosition(3, row).setValue(af["inicio_serial"])
        sheet.getCellByPosition(4, row).setValue(af["fim_serial"])


def main():
    template, dados_path, saida = sys.argv[1], sys.argv[2], sys.argv[3]
    with open(dados_path, encoding="utf-8") as fh:
        dados = json.load(fh)

    ctx = connect()
    desktop = ctx.ServiceManager.createInstanceWithContext(
        "com.sun.star.frame.Desktop", ctx
    )
    # AsTemplate=True abre uma cópia sem título: o template nunca é alterado.
    doc = desktop.loadComponentFromURL(
        file_url(template), "_blank", 0, (prop("Hidden", True), prop("AsTemplate", True))
    )
    try:
        preencher_lancamentos(
            doc.Sheets.getByName("Lançamentos"),
            dados["identificacao"],
            dados["lancamentos"],
        )
        preencher_afastamentos(
            doc.Sheets.getByName("Afastamentos"), dados["afastamentos"]
        )
        doc.calculateAll()
        doc.storeToURL(file_url(saida), (prop("FilterName", "calc8"),))
    finally:
        doc.close(False)


if __name__ == "__main__":
    main()
