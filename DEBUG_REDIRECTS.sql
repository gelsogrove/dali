-- DEBUG REDIRECTS: Verifica stato redirects e diagnosi problemi

-- 1. Mostra tutti i redirects nella tabella
SELECT 
    id,
    url_old,
    url_new,
    redirect_type,
    is_active,
    hit_count,
    created_at
FROM redirects
ORDER BY id DESC;

-- 2. Controlla qual è il redirect che hai creato per /properties -> /videos
SELECT 
    id,
    url_old,
    url_new,
    is_active,
    CASE 
        WHEN is_active = 0 THEN '❌ NON ATTIVO! Devi settare is_active = 1'
        WHEN is_active = 1 THEN '✅ Attivo'
    END as status_check
FROM redirects
WHERE url_old LIKE '%properties%' OR url_new LIKE '%videos%';

-- 3. Se is_active è 0, attivalo:
-- UPDATE redirects SET is_active = 1 WHERE url_old = '/properties';

-- 4. Verifica che l'URL sia corretto (deve essere normalizzato: lowercase, no trailing slash)
-- SBAGLIATO: '/Properties' o '/properties/' 
-- CORRETTO: '/properties'

-- Se hai inserito l'URL sbagliato, correggilo:
-- UPDATE redirects SET url_old = '/properties', url_new = '/videos' WHERE id = [TUO_ID];
