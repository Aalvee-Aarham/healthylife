# Railway: single service — Vite SPA built into Laravel's public/, served by artisan.
FROM node:20-alpine AS web
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/frontend/package.json packages/frontend/package.json
RUN npm install --workspace @healthy-life/frontend
COPY packages/frontend packages/frontend
# Railway passes service variables with matching names as build args
ARG VITE_PEXELS_API_KEY
RUN npm run build --workspace @healthy-life/frontend

FROM php:8.2-cli
RUN apt-get update && apt-get install -y git unzip libpq-dev libzip-dev \
    && docker-php-ext-install pdo_pgsql pgsql bcmath zip pcntl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY packages/backend/composer.json packages/backend/composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --no-autoloader --prefer-dist
COPY packages/backend .
COPY --from=web /app/packages/frontend/dist public/
RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && composer dump-autoload --optimize && chmod +x docker-entrypoint.sh
# ponytail: artisan serve w/ 4 workers; swap to FrankenPHP/nginx+fpm if traffic grows
ENV PHP_CLI_SERVER_WORKERS=4
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["sh", "-c", "php artisan serve --host=0.0.0.0 --port=${PORT:-8000} --no-reload"]
