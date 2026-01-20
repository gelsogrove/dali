FROM php:7.4-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libwebp-dev \
    zip \
    unzip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) \
    mysqli \
    pdo \
    pdo_mysql \
    gd \
    zip

# Enable Apache modules
RUN a2enmod rewrite headers

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html/

# Copy and set permissions for init script
COPY init-uploads.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/init-uploads.sh

# Create uploads directory with correct permissions
RUN mkdir -p /var/www/html/uploads/properties \
    /var/www/html/uploads/videos \
    /var/www/html/uploads/galleries \
    /var/www/html/uploads/blogs \
    /var/www/html/uploads/temp \
    && chown -R www-data:www-data /var/www/html/uploads \
    && chmod -R 755 /var/www/html/uploads

# Expose port
EXPOSE 80

# Start Apache with init script
CMD ["/bin/bash", "-c", "/usr/local/bin/init-uploads.sh && apache2-foreground"]

# Configure Apache
COPY apache-config.conf /etc/apache2/sites-available/000-default.conf

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
