FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# LibreOffice headless + bridge UNO (python3-uno) para gerar a planilha oficial
# (.ods) a partir do template. O worker UNO roda com o /usr/bin/python3 do sistema.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libreoffice-calc \
        libreoffice-core \
        python3-uno \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000
CMD ["/app/entrypoint.sh"]
