-- =====================================================
-- DEPLOYMENT SQL - Dalila Real Estate
-- Esegui questo file sul database di produzione
-- =====================================================

-- Verifica versione database
SELECT VERSION();

-- Crea tutte le tabelle (se non esistono già)
-- COPIA TUTTO IL CONTENUTO DA: api/database/init.sql

-- NOTA: Se le tabelle esistono già, salta alla sezione PERMESSI

-- =====================================================
-- VERIFICA PERMESSI UTENTE DATABASE
-- =====================================================

-- Mostra i permessi dell'utente
SHOW GRANTS FOR 'tuo_user_db'@'localhost';

-- Se necessario, garantisci tutti i permessi:
-- GRANT ALL PRIVILEGES ON tuo_database.* TO 'tuo_user_db'@'localhost';
-- FLUSH PRIVILEGES;

-- =====================================================
-- VERIFICA TABELLE CREATE
-- =====================================================

SHOW TABLES;

-- Dovresti vedere:
-- - admin_users
-- - properties
-- - photogallery
-- - videos
-- - property_amenities
-- - sessions
-- - activity_log
-- - blogs

-- =====================================================
-- VERIFICA DATI INIZIALI
-- =====================================================

-- Controlla se esiste almeno un admin
SELECT id, email, first_name, last_name, created_at FROM admin_users;

-- Se NON esiste nessun admin, creane uno:
-- Password: Admin123! (hasciata con PASSWORD_DEFAULT)
-- DEVI cambiarla al primo login!

INSERT INTO admin_users (email, password_hash, first_name, last_name, role) 
VALUES (
  'admin@tuodominio.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Admin',
  'User',
  'admin'
);

-- =====================================================
-- PULIZIA (Opzionale - solo per test)
-- =====================================================

-- Se vuoi ricominciare da zero, decomenta:
-- DROP TABLE IF EXISTS activity_log;
-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS property_amenities;
-- DROP TABLE IF EXISTS photogallery;
-- DROP TABLE IF EXISTS videos;
-- DROP TABLE IF EXISTS blogs;
-- DROP TABLE IF EXISTS properties;
-- DROP TABLE IF EXISTS admin_users;

-- =====================================================
-- VERIFICA FINALE
-- =====================================================

SELECT 
  (SELECT COUNT(*) FROM admin_users) as total_admins,
  (SELECT COUNT(*) FROM properties) as total_properties,
  (SELECT COUNT(*) FROM blogs) as total_blogs,
  (SELECT COUNT(*) FROM photogallery) as total_photos;
