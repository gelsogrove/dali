# CSS Architecture Refactoring

## 📁 Nuova Struttura

Il CSS è stato refactorizzato per migliorare manutenibilità e organizzazione:

```
fe/src/
├── styles/
│   ├── variables.css       # ✨ NUOVO - Variabili CSS globali (colori, fonts, spacing)
│   ├── index.css           # Importa tutti i CSS globali
│   ├── app.css             # CSS legacy (da pulire gradualmente)
│   ├── fonts.css           # Font definitions
│   └── theme.css           # Theme styles
│
├── components/
│   ├── TitleHeader/
│   │   ├── TitleHeader.jsx
│   │   └── TitleHeader.css  # ✨ NUOVO - Stili del componente
│   ├── TitlePage/
│   │   ├── TitlePage.jsx
│   │   └── TitlePage.css    # ✨ NUOVO - Stili del componente
│   └── ...
│
└── pages/
    ├── HomePage.jsx + HomePage.css           # ✨ NUOVO
    ├── ContactPage.jsx + ContactPage.css     # ✨ NUOVO
    ├── SearchPage.jsx + SearchPage.css       # Aggiornato con variabili
    ├── BlogsPage.jsx + BlogsPage.css         # ✨ NUOVO
    ├── VideosPage.jsx + VideosPage.css       # ✨ NUOVO
    └── PropertiesPage.jsx + PropertiesPage.css # ✨ NUOVO
```

## 🎨 Variabili CSS Globali

Tutte le variabili sono definite in `fe/src/styles/variables.css`:

### Typography
```css
--font-family-default: 'Glacial Indifference', sans-serif;
--font-family-title: 'quincy-cf', 'Playfair Display', serif;

--font-size-body: 19px;
--font-size-kicker: 26px;
--font-size-title: 72px;
--font-size-title-mobile: 52px;
```

### Colors
```css
--color-primary: #c19280;
--color-primary-dark: #b18068;
--color-primary-light: #ebd7cf;
--color-text-primary: #333333;
--color-text-muted: #999999;
```

### Spacing
```css
--section-padding: 80px 5%;
--title-margin-bottom: 40px;
--card-gap: 30px;
```

## ✅ Benefici

### 1. **Isolamento**
- Ogni pagina ha i suoi stili separati
- Modifiche a una pagina non influenzano le altre

### 2. **Consistenza**
- Variabili CSS garantiscono uniformità
- Font sizes, colori e spacing standardizzati

### 3. **Manutenibilità**
- Facile trovare e modificare stili
- Struttura chiara e prevedibile

### 4. **Responsive**
- Media queries organizzate per componente
- Mobile-first approach

## 📝 Come Usare le Variabili

### Prima (hardcoded):
```css
.my-title {
  font-size: 72px;
  color: #c19280;
  padding: 80px 5%;
}
```

### Dopo (con variabili):
```css
.my-title {
  font-size: var(--font-size-title);
  color: var(--color-primary);
  padding: var(--section-padding);
}
```

## 🔄 Migrazione da app.css

Gli stili sono stati estratti da `app.css` nei file specifici:

| Componente/Pagina | CSS File | Status |
|-------------------|----------|--------|
| TitleHeader | `components/TitleHeader.css` | ✅ Completo |
| TitlePage | `components/TitlePage.css` | ✅ Completo |
| HomePage | `pages/HomePage.css` | ✅ Completo |
| ContactPage | `pages/ContactPage.css` | ✅ Completo |
| SearchPage | `pages/SearchPage.css` | ✅ Uniformato |
| BlogsPage | `pages/BlogsPage.css` | ✅ Completo |
| VideosPage | `pages/VideosPage.css` | ✅ Completo |
| PropertiesPage | `pages/PropertiesPage.css` | ✅ Completo |

## 🎯 Standardizzazione Applicata

### ✅ TitleHeader/TitlePage
- Tutti i titoli sono centrati con `width: fit-content` e `margin: auto !important`
- Font size: 72px desktop, 62px tablet, 52px mobile
- Kicker: 26px desktop, 20px mobile
- Barra verticale: 120px desktop, 100px tablet, 80px mobile

### ✅ Spacing
- Tutte le sezioni: `padding: 80px 5%`
- ContactPage hero: `padding: 60px 5%`
- Contact main: `padding: 0 5% 60px` (no top padding)

### ✅ Typography
- Body text: 19px ovunque
- Blog/Videos cards: 19px
- Contact page: 19px

### ✅ Colors
- Primary: #c19280
- Primary dark: #b18068
- Accent bar: #ebd7cf
- Text muted: #999999

## 🚀 Prossimi Passi

1. ✅ Variabili CSS create e documentate
2. ✅ Componenti TitleHeader e TitlePage estratti
3. ✅ Tutte le pagine hanno CSS dedicati
4. 🔄 **TODO:** Pulire gradualmente `app.css` rimuovendo stili duplicati
5. 🔄 **TODO:** Estrarre altri componenti (HeroSlider, FeaturedProperties, ecc.)

## 📌 Note Importanti

- **app.css** contiene ancora molti stili legacy
- NON eliminarlo ancora - contiene stili di componenti non ancora estratti
- Pulirlo gradualmente man mano che i componenti vengono migrati

## 🐛 Troubleshooting

### I titoli non sono centrati?
Verifica che il componente usi la classe corretta:
- `TitleHeader`: centralizzato con `.fp-title` o `.blog-title-center`
- `SearchPage`: centralizzato con override specifici

### I colori non sono uniformi?
Usa sempre le variabili CSS invece di valori hardcoded:
```css
color: var(--color-primary);  /* ✅ */
color: #c19280;                /* ❌ */
```

### Il responsive non funziona?
Verifica che le media queries siano nel file CSS della pagina/componente specifico.

---

**Data Refactoring:** Gennaio 2026  
**Autore:** GitHub Copilot + Gelso  
**Status:** ✅ Completo e Funzionante
