# Preview hosting only. Production is a static export uploaded to the client's
# own cPanel account (SPEC.md §1); nothing here changes that.
#
# The point of this image is that it runs the SAME Apache and PHP the client's
# host runs, so a reviewer sees the real .htaccess behaviour and a working
# enquiry form rather than a static mock with a dead button. A CDN-backed
# static host cannot do that, because the handler is PHP.

# ---------------------------------------------------------------------------
# Build: produce out/ exactly as it would be uploaded to cPanel
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Dependencies first, so a source-only change does not reinstall them.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Serve: Apache + PHP, same as the destination host
# ---------------------------------------------------------------------------
FROM php:8.2-apache

# mod_rewrite for the HTTPS redirect, deflate and expires because public/.htaccess
# uses them for compression and caching. headers for the security headers.
RUN a2enmod rewrite headers deflate expires

# .htaccess is ignored unless AllowOverride is on. Without this the custom 404,
# the caching rules and the security headers all silently do nothing, which is
# exactly the class of difference that makes a preview lie about production.
RUN printf '<Directory /var/www/html>\n\
    Options -Indexes +FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n' > /etc/apache2/conf-available/zelarion-htaccess.conf \
 && a2enconf zelarion-htaccess

COPY --from=build /app/out/ /var/www/html/

# Lead storage sits OUTSIDE the document root, mirroring the cPanel layout where
# it lives above public_html. Render's disk is ephemeral unless a persistent
# disk is attached, so treat the CSV here as a convenience and the email as the
# record of truth. See RENDER.md.
RUN mkdir -p /var/www/ascendrev-enquiries \
 && chown -R www-data:www-data /var/www/ascendrev-enquiries \
 && chmod 750 /var/www/ascendrev-enquiries

# Render assigns a port at runtime and expects the process to listen on it.
# Apache's port is baked into its config at build time, so it is rewritten on
# start rather than hardcoded.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["apache2-foreground"]
