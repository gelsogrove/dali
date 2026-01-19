# PERMESSI UPLOADS - IMPORTANTE!

Questa cartella DEVE avere permessi corretti per permettere upload di file.

## Struttura:
```
uploads/
├── properties/   # Immagini proprietà (original, large, medium, thumbnail)
├── videos/       # Video proprietà + thumbnails
├── galleries/    # Gallerie foto proprietà
└── blogs/        # Immagini featured blog (original, medium, thumbnail)
```

## Permessi Locali (macOS/Linux):
```bash
chmod -R 755 uploads/
```

## Permessi Server (via SSH):
```bash
cd public_html
chmod -R 755 uploads/
chown -R www-data:www-data uploads/  # O il tuo user se shared hosting
```

## Permessi Server (via cPanel File Manager):
1. Vai in File Manager
2. Click destro su "uploads"
3. Permissions → 755 (rwxr-xr-x)
4. Spunta "Apply to subdirectories"
5. Click "Save"

## Verifica Permessi:
- uploads/          → 755 (drwxr-xr-x)
- properties/       → 755 (drwxr-xr-x)
- videos/           → 755 (drwxr-xr-x)
- galleries/        → 755 (drwxr-xr-x)
- blogs/            → 755 (drwxr-xr-x)

## Test Upload:
Dopo aver impostato i permessi, testa caricando un'immagine dal pannello admin.

NOTA: Il file .gitkeep serve solo per mantenere le cartelle vuote in Git.
I file caricati NON vengono versionati (vedi .gitignore).
