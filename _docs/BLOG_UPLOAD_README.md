# Blog Image Upload Feature

## Features Implementate

### Upload Immagini
- ✅ Upload tramite drag & drop o file selector
- ✅ Validazione tipo file (solo immagini)
- ✅ Validazione dimensione (max 10MB)
- ✅ Preview dell'immagine caricata
- ✅ Generazione automatica di 3 versioni:
  - Original (1920px)
  - Medium (800px)
  - Thumbnail (400px)

### Gestione Immagini
- ✅ Remove/Delete immagine con conferma
- ✅ Replace immagine (upload nuova)
- ✅ Salvataggio URL nel database

### API Endpoints

#### Upload Blog Image
```
POST /api/upload/blog-image
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body: 
  image: [file]

Response:
{
  "success": true,
  "data": {
    "filename": "blog_abc123.jpg",
    "url": "/uploads/blogs/blog_abc123.jpg",
    "urls": {
      "original": "/uploads/blogs/blog_abc123.jpg",
      "medium": "/uploads/blogs/blog_abc123_medium.jpg",
      "thumbnail": "/uploads/blogs/blog_abc123_thumbnail.jpg"
    },
    "size": 245678
  }
}
```

#### Delete File
```
DELETE /api/upload/file?url=/uploads/blogs/blog_abc123.jpg
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "message": "File deleted successfully"
  }
}
```

## Come Usare

1. **Creare un Nuovo Blog**:
   - Vai su `/blogs/new`
   - Compila i campi
   - Clicca sulla zona "Featured Image"
   - Seleziona un'immagine dal tuo computer
   - L'immagine verrà automaticamente caricata

2. **Modificare l'Immagine**:
   - Clicca sul pulsante "Remove" per rimuovere l'immagine attuale
   - Carica una nuova immagine

3. **Salvare**:
   - Clicca "Create Blog" o "Update Blog"
   - L'URL dell'immagine verrà salvato nel database

## Directory Structure

```
BE/uploads/
  └── blogs/
      ├── blog_abc123_1234567890.jpg (original)
      ├── blog_abc123_1234567890_medium.jpg
      └── blog_abc123_1234567890_thumbnail.jpg
```

## Permessi

- Le directory uploads/blogs vengono create automaticamente
- Permessi: 0755
- Owner: www-data (Apache)
