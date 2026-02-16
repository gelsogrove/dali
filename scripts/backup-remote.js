/**
 * Remote Backup Trigger for Dalila
 * 
 * Usage: npm run backup
 * This script triggers the PHP backup utility on the server.
 */

const http = require('http');
const https = require('https');
require('dotenv').config();

async function main() {
    const apiUrl = process.env.API_URL;
    const token = process.env.MIGRATION_TOKEN || 'dalila_secret_2026';

    if (!apiUrl) {
        console.error('❌ ERROR: API_URL not found in .env');
        process.exit(1);
    }

    const backupUrl = `${apiUrl}/database/backup_db.php?token=${token}`;
    console.log(`🚀 Triggering remote backup at: ${backupUrl.replace(token, '****')}`);

    const protocol = apiUrl.startsWith('https') ? https : http;

    protocol.get(backupUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('\n✅ SUCCESS: Remote backup triggered.');
                console.log('--------------------------------------------------');
                console.log(data.trim());
                console.log('--------------------------------------------------');
            } else {
                console.error(`\n❌ FAILED (Status ${res.statusCode}):`);
                console.error(data.trim());
            }
        });
    }).on('error', (err) => {
        console.error('\n❌ ERROR connecting to server:', err.message);
    });
}

main();
