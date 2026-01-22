# 001 - Schema SEO e Redirect

## Descrizione
- Aggiornare il DB per supportare SEO e redirect: aggiungere `seoTitle` e `seoDescription` alla tabella `blogs`.
- Rendere obbligatorio l'alt per immagini di blog e video aggiungendo colonne dedicate (es. `featured_image_alt`, `content_image_alt`, `thumbnail_alt`).
- Creare la tabella `redirect` (`id`, `urlOld` UNIQUE, `urlNew`) e applicare vincoli per URL uniche.
- Rimuovere `is_active` e introdurre `is_home` su blog, video e testimonial; aggiornare tutte le dipendenze query/codice.
- Aggiornare `init.sql` con l'intero schema aggiornato; fornire uno script di migrazione (solo ALTER/CREATE, senza perdita dati) eseguibile su produzione esistente.

## Esempio base (SQL)
```sql
ALTER TABLE blogs
  ADD COLUMN seoTitle VARCHAR(255) NULL,
  ADD COLUMN seoDescription TEXT NULL,
  ADD COLUMN featured_image_alt VARCHAR(255) NULL,
  ADD COLUMN content_image_alt VARCHAR(255) NULL,
  ADD COLUMN is_home TINYINT(1) NOT NULL DEFAULT 0,
  DROP COLUMN is_active;

ALTER TABLE videos
  ADD COLUMN thumbnail_alt VARCHAR(255) NULL,
  ADD COLUMN is_home TINYINT(1) NOT NULL DEFAULT 0,
  DROP COLUMN is_active;

ALTER TABLE testimonials
  ADD COLUMN is_home TINYINT(1) NOT NULL DEFAULT 0,
  DROP COLUMN is_active;

CREATE TABLE IF NOT EXISTS redirect (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  urlOld VARCHAR(500) NOT NULL,
  urlNew VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_url_old (urlOld),
  INDEX idx_url_new (urlNew)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Build / Verifica
- Eseguire lo script di migrazione su un DB di prova esistente e verificare che non produca perdita dati.
- Eseguire `init.sql` su un DB vuoto per validare l'intero schema.

## Acceptance criteria
- Nuovi campi SEO e alt presenti su `blogs` e `videos` e restituiti dai descrittori di schema.
- Tabella `redirect` creata con `urlOld` UNIQUE e indici corretti.
- `is_active` rimosso e `is_home` presente su blog, video e testimonial, con default coerente.
- Script di migrazione pronto (solo ALTER/CREATE) e `init.sql` aggiornato allo schema completo.

- devi fare un file feature.sql con i campi