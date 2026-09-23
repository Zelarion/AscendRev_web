#!/bin/sh
# Render assigns the listening port at runtime through $PORT. Apache bakes its
# port into config at build time, so it is rewritten here before start.
# Defaults to 80 so the image also runs locally with a plain `docker run -p`.
set -e

PORT="${PORT:-80}"

sed -ri "s/^Listen 80$/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# ServerName silences the startup warning and keeps the log readable.
echo "ServerName localhost" > /etc/apache2/conf-available/servername.conf
a2enconf servername >/dev/null 2>&1 || true

exec "$@"
