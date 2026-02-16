const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();
const path = require("path");
require("dotenv").config();

const config = {
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    host: process.env.FTP_HOST,
    port: parseInt(process.env.FTP_PORT || (process.env.FTP_SFTP === "true" ? "22" : "21")),
    localRoot: path.join(__dirname, "../deploy"),
    remoteRoot: process.env.FTP_PATH || "/",
    include: ["api/**/*", "test-dalila.txt"],
    exclude: ["**/.DS_Store"],
    deleteRemote: false,
    forcePasv: true,
    sftp: process.env.FTP_SFTP === "true",
};

async function runTest() {
    const baseUrl = process.env.API_URL || process.env.SITE_URL;
    const token = process.env.MIGRATION_TOKEN || 'dalila_secret_2026';

    if (baseUrl) {
        console.log("🧪 STEP 1: Creazione backup di sicurezza (OBBLIGATORIO)...");
        const backupUrl = `${baseUrl}/database/backup_db.php?token=${token}`;
        try {
            const response = await fetch(backupUrl);
            const text = await response.text();
            if (response.ok) {
                console.log("✅ Backup creato con successo sul server.");
            } else {
                console.error(`\n❌ BACKUP FALLITO (Status ${response.status}):`);
                console.log(text.substring(0, 500) + "...");
                console.log("⚠️  Test interrotto per sicurezza. Il database deve essere salvabile prima di caricare file.");
                process.exit(1);
            }
        } catch (error) {
            console.error("\n❌ IMPOSSIBILE AVVIARE IL BACKUP:", error.message);
            console.log("⚠️  Test interrotto. Verifica che API_URL sia corretto e che backup_db.php sia sul server.");
            process.exit(1);
        }
    } else {
        console.error("\n❌ ERRORE: API_URL non trovato nel .env. Necessario per il backup.");
        process.exit(1);
    }

    console.log("\n🧪 STEP 2: Caricamento file di prova...");
    ftpDeploy
        .deploy(config)
        .then((res) => {
            console.log("\n✅ TEST RIUSCITO!");
            console.log("Il file test-dalila.txt e gli script core sono stati caricati.");
        })
        .catch((err) => {
            console.error("\n❌ CARICAMENTO FALLITO:", err.message);
            process.exit(1);
        });
}

runTest();
