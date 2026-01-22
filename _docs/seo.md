# Guida SEO (Admin)

Questa guida sintetizza le regole editoriali e le logiche tecniche da seguire per SEO e redirect.

## Regole editoriali
1. Le URL devono essere brevi, leggibili e descrittive dell’argomento della pagina.
2. Il title deve spiegare chiaramente di cosa parla la pagina, essere unico e rientrare idealmente nei 55–60 caratteri.
3. La meta description deve riassumere il contenuto della pagina e invogliare l’utente al click dai risultati di ricerca.
4. Title e meta description devono essere coerenti tra loro e con il contenuto della pagina.
5. Title e meta description non devono essere duplicati su più pagine.
6. Il contenuto deve essere utile, originale e scritto per rispondere a una domanda o a un bisogno reale dell’utente.
7. Il contenuto deve essere strutturato in modo chiaro, facile da leggere e comprensibile.
8. Le immagini devono essere pertinenti al contenuto e aiutare la comprensione dell’argomento trattato.
9. Ogni immagine deve avere un testo alternativo (alt) descrittivo dell’immagine e coerente con il contenuto, senza forzare keyword inutili.
10. I nomi dei file delle immagini devono essere chiari e descrittivi, evitando nomi generici.
11. Ogni pagina deve avere un solo titolo principale (H1) coerente con il title e con il contenuto.
12. È buona pratica inserire link interni verso altri contenuti pertinenti, usando testi di collegamento descrittivi.
13. I contenuti dovrebbero essere aggiornati e migliorati nel tempo, invece di creare nuove pagine con argomenti simili.

## Logiche tecniche (sviluppo)
- Ogni pagina deve impostare canonical self-referencing.
- I redirect si gestiscono via tabella `redirect` (301) a livello applicativo PHP, non via .htaccess.
- Vietato creare catene o loop di redirect; `urlOld` deve essere univoco e diverso da `urlNew`.
- Se esiste una regola di redirect valida, la pagina non deve essere renderizzata.
- La home mostra solo contenuti con `isHome = true` (blog, video, testimonial).
- Solo 301 per pagine rimosse o URL cambiate; se non esiste contenuto sostitutivo, usare 410.
- Redirect evitano 404 e preservano SEO, ma le URL devono restare stabili.
- Consigliato il caching delle regole di redirect per performance e crawl budget.

## Logiche di cancellazione
- Se un contenuto (blog/video) ha meno di 24 ore: cancellazione reale.
- Se ha più di 24 ore: non si elimina dal DB, sparisce dalle liste, si crea una riga in `redirect` con `urlOld` compilato e `urlNew` vuoto; l’utente compila `urlNew`.
- Durante la cancellazione va comunicato che la riga redirect è stata creata e che la scelta protegge l’indicizzazione.

## Gestione home
- `isActive` rimosso; usare `isHome` su blog, video, testimonial.
- Le liste admin mostrano il toggle `isHome`; la home del sito mostra solo elementi con `isHome = true`, ordinamento invariato.

## Redirect anti-loop (validazione)
- `urlOld` non può coincidere con `urlNew`.
- `urlOld` deve essere unica.
- `urlNew` non può esistere come `urlOld` in un’altra riga.
- Bloccare catene A → B → C → A anche considerando URL normalizzate (lowercase, slash coerente, query irrilevanti rimosse).
