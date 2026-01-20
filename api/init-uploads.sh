#!/bin/bash
# Script per inizializzare i permessi uploads in Docker
# Eseguito automaticamente all'avvio del container

UPLOAD_DIR="/var/www/html/uploads"

# Crea le cartelle se non esistono
mkdir -p "$UPLOAD_DIR/properties" \
         "$UPLOAD_DIR/videos" \
         "$UPLOAD_DIR/galleries" \
         "$UPLOAD_DIR/blogs" \
         "$UPLOAD_DIR/temp"

# Imposta permessi corretti
chown -R www-data:www-data "$UPLOAD_DIR"
chmod -R 755 "$UPLOAD_DIR"

echo "✓ Permessi uploads configurati correttamente"
