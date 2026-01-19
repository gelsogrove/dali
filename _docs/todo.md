## ✅ COMPLETATO

✅ Video gestiti come link Vimeo (non file upload)
✅ Tabella videos con: titolo, descrizione, video_url, thumbnail_url, display_order
✅ Backend endpoint GET /api/home - ritorna featured properties + featured videos
✅ Backend endpoint GET /api/home/videos - ritorna solo featured videos
✅ Video di esempio nel seed (init.sql) - 3 video Vimeo con link alle properties
✅ Reset Docker mantiene i dati (tutto in init.sql)

## 📋 TODO Frontend

- [ ] Dinamicizzare homepage fe/src/pages/Home.jsx
  - Sostituire dati statici con fetch da /api/home
  - Mostrare featured_properties in griglia
  - Mostrare featured_videos con thumbnail
  
- [ ] Creare componente VideoCard.jsx
  - Click su thumbnail → apre popup
  - Popup con iframe Vimeo player
  - Link al video: https://player.vimeo.com/video/{id}
  
- [ ] Styling popup video
  - Overlay scuro (backdrop)
  - Chiusura con click fuori o bottone X
  - Responsive per mobile

## 📚 Documentazione Creata

- ✅ FRONTEND-INTEGRATION.md - Guida completa React + API
  - Esempi fetch API home
  - Componente VideoCard con popup Vimeo
  - Componente PropertyCard
  - CSS per popup responsive
  - Struttura dati API

## 🔗 Endpoint Disponibili

```bash
# Homepage data (public)
GET /api/home
# Response: { featured_properties: [...], featured_videos: [...] }

# Solo video (public)
GET /api/home/videos
# Response: { videos: [...], total: 3 }

# Test
curl http://localhost:8080/api/home | jq .
```

