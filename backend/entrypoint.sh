#!/bin/sh
set -e

# LibreOffice headless (socket UNO) para a exportação da planilha oficial (.ods).
# Sobe em background com perfil próprio; o worker UNO conecta nesse socket.
LO_PORT="${LIBREOFFICE_UNO_PORT:-2002}"
soffice \
    --headless --invisible --norestore --nologo --nofirststartwizard \
    --accept="socket,host=127.0.0.1,port=${LO_PORT};urp;StarOffice.ComponentContext" \
    -env:UserInstallation=file:///tmp/lo_profile &

alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000
