# 🔌 INTEGRAZIONE API - Frontend React

## ✅ Pagine connesse all'API

### 📝 Blog System
- **BlogsPage** (`/category/blog`)
  - ✅ Legge da: `GET /api/blogs`
  - ✅ Mostra solo blog attivi (`is_active=true`)
  - ✅ Formatta date con `toLocaleDateString()`
  - ✅ Loading state e error handling

- **BlogDetailPage** (`/blog/:slug`)
  - ✅ Legge da: `GET /api/blogs/slug/:slug`
  - ✅ Usa subtitle se disponibile
  - ✅ Fallback su dati statici se API non disponibile
  - ✅ Update page title dinamicamente

### 🏠 Property System
- **PropertiesPage** (`/properties`)
  - ✅ Legge da: `GET /api/properties`
  - ✅ Passa dati a FeaturedProperties component
  - ✅ Loading state mentre carica
  - ✅ Paginazione (12 per pagina)

- **ListingDetailPage** (`/listings/:slug`)
  - ✅ Legge da: `GET /api/properties/slug/:slug`
  - ✅ Carica proprietà singola per slug
  - ✅ Usa featured_image dal database
  - ✅ Formatta prezzo con `toLocaleString()`
  - ✅ Fallback su dati statici se necessario
  - ✅ Loading state

### 🏡 HomePage
- ⚠️ **FeaturedProperties**: Usa dati statici `featuredProperties` (OK per ora)
- 📌 Opzionale: Puoi collegare anche HomePage all'API se vuoi proprietà dinamiche

---

## 📡 Configurazione API

### File: `fe/src/config/api.js`
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }
};

export const endpoints = {
  blogs: '/blogs',
  blogBySlug: (slug) => `/blogs/slug/${slug}`,
  properties: '/properties',
  propertyBySlug: (slug) => `/properties/slug/${slug}`,
};
```

### Variabile Ambiente
```bash
# fe/.env (locale)
VITE_API_URL=http://localhost:8080/api

# Produzione (build)
VITE_API_URL=https://buywithdali.com/api
```

---

## 🔄 Come funziona

### 1. Fetch dati dall'API
```javascript
const response = await api.get('/blogs');
if (response.success) {
  const blogs = response.data.blogs;
  setBlogs(blogs);
}
```

### 2. Gestione stati
- **Loading**: Mostra "Loading..." mentre carica
- **Error**: Gestisce errori di rete/API
- **Empty**: Mostra "No data available"
- **Success**: Renderizza i dati

### 3. Formato risposta API
```json
{
  "success": true,
  "data": {
    "blogs": [...],
    "pagination": {
      "total": 10,
      "page": 1,
      "per_page": 12
    }
  }
}
```

---

## 🚀 Deployment

### Build con API di produzione
```bash
# Crea .env per produzione
echo "VITE_API_URL=https://buywithdali.com/api" > fe/.env.production

# Build
cd FE && npm run build

# Output in fe/dist/
```

### Verifica API
Prima del deployment, testa che l'API risponda:
```bash
curl https://buywithdali.com/api/health
curl https://buywithdali.com/api/blogs
curl https://buywithdali.com/api/properties
```

---

## 🔧 Pagine ancora con dati statici

Le seguenti pagine usano ancora `../data/` invece dell'API:

- ❌ **AboutPage** - aboutData.js, homeData.js
- ❌ **TestimonialsPage** - homeData.js
- ❌ **ContactPage** - homeData.js
- ❌ **CommunitiesPage** - homeData.js
- ❌ **CommunityPage** - homeData.js
- ❌ **HomePage components**:
  - HeroSlider - homeData.js
  - FeaturedCities - homeData.js
  - Testimonials - homeData.js
  - FeaturedVideos - homeData.js

**Nota**: Queste pagine vanno bene con dati statici per ora. 
Puoi collegare all'API in futuro se necessario.

---

## 🐛 Troubleshooting

### API non risponde
```javascript
// Controlla console browser per errori CORS
// Verifica che backend sia avviato:
docker ps | grep dalila-backend

// Test manuale:
curl http://localhost:8080/api/health
```

### Dati non si caricano
1. Verifica che `is_active=true` nel database
2. Controlla che lo slug sia corretto
3. Guarda Network tab in DevTools
4. Verifica CORS headers

### Build fallisce
```bash
# Pulisci node_modules
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Rebuild
npm run build
```

---

## ✅ Test Checklist

Prima del deployment:
- [ ] API `/blogs` ritorna dati
- [ ] API `/properties` ritorna dati
- [ ] BlogsPage mostra lista blog
- [ ] BlogDetailPage carica singolo blog
- [ ] PropertiesPage mostra lista properties
- [ ] ListingDetailPage carica singola property
- [ ] Loading states funzionano
- [ ] Error handling funziona
- [ ] Build completa senza errori
- [ ] CORS configurato correttamente
