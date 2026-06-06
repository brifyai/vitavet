FROM php:8.2-apache

# Habilitar módulos Apache
RUN a2enmod rewrite headers

# Headers de seguridad + PHP hardening
RUN echo '<IfModule mod_headers.c>\n\
  Header set X-Content-Type-Options "nosniff"\n\
  Header set X-Frame-Options "SAMEORIGIN"\n\
  Header set X-XSS-Protection "1; mode=block"\n\
  Header set Referrer-Policy "strict-origin-when-cross-origin"\n\
  Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"\n\
</IfModule>' > /etc/apache2/conf-available/security-headers.conf \
  && a2enconf security-headers

# PHP.ini producción
RUN echo "display_errors = Off\n\
log_errors = On\n\
error_reporting = E_ALL & ~E_DEPRECATED\n\
upload_max_filesize = 2M\n\
post_max_size = 4M\n\
max_execution_time = 30\n\
expose_php = Off" >> /usr/local/etc/php/conf.d/vitavet.ini

# Copiar archivos al directorio web
COPY . /var/www/html/

# Permisos seguros
RUN chown -R www-data:www-data /var/www/html \
    && find /var/www/html -type f -exec chmod 644 {} \; \
    && find /var/www/html -type d -exec chmod 755 {} \;

EXPOSE 80
