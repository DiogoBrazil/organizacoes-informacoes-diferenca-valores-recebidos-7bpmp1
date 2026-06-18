set -eu

: "${DOMAIN:?defina DOMAIN no .env}"

mkdir -p /tmp/traefik-dynamic
sed "s/__DOMAIN__/${DOMAIN}/g" /etc/traefik/templates/routers.yml > /tmp/traefik-dynamic/routers.yml

exec traefik "$@"
