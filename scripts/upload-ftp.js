const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();
const path = require("path");
require("dotenv").config();

const fs = require("fs");

const deployPath = path.join(__dirname, "../deploy");

// Safety Check: Ensure the deploy folder actually exists
if (!fs.existsSync(deployPath)) {
    console.error(`\n❌ Error: The folder '${deployPath}' does not exist.`);
    console.error("Please run 'npm run deploy' (which runs prepare-deploy.sh first) to generate the files.");
    process.exit(1);
}

const config = {
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    host: process.env.FTP_HOST,
    port: parseInt(process.env.FTP_PORT || (process.env.FTP_SFTP === "true" ? "22" : "21")),
    localRoot: deployPath,
    remoteRoot: process.env.FTP_PATH || "/",
    include: ["*", "**/*"],
    // Exclude sensitive files and heavy/dynamic folders
    exclude: [
        "api/config/database.php",
        "api/config/jwt.php",
        "api/database/migration_*.log",
        "api/uploads/**",
        "assets/fonts/**",
        "assets/images/**",
        ".DS_Store",
        "**/.git*"
    ],
    deleteRemote: false,
    forcePasv: true,
    sftp: process.env.FTP_SFTP === "true", // Support for SFTP if TRUE
};

console.log("🚀 Starting Deployment...");
console.log(`Protocol: ${config.sftp ? "SFTP" : "FTP"}`);
console.log(`Connecting to: ${config.host}:${config.port}`);
console.log(`Uploading from: ${config.localRoot}`);
console.log(`Remote destination: ${config.remoteRoot}`);

async function main() {
    const baseUrl = process.env.API_URL || process.env.SITE_URL;
    const token = process.env.MIGRATION_TOKEN || 'dalila_secret_2026';

    if (baseUrl) {
        console.log("\n📦 STEP 1: Creating database backup for safety...");
        const backupUrl = `${baseUrl}/database/backup_db.php?token=${token}`;
        try {
            const response = await fetch(backupUrl);
            const text = await response.text();
            if (response.ok) {
                console.log("✅ Backup created successfully on the server.");
            } else {
                console.error(`\n❌ BACKUP FAILED (Status ${response.status}):`, text);
                console.log("⚠️  Deployment stopped for safety as requested. Please check database credentials or server space.");
                process.exit(1);
            }
        } catch (error) {
            console.error("\n❌ COULD NOT TRIGGER BACKUP:", error.message);
            console.log("⚠️  Deployment stopped for safety. Ensure the backup script is on the server and API_URL is correct.");
            process.exit(1);
        }
    } else {
        console.error("\n❌ ERROR: API_URL not found in .env. Needed for backup.");
        process.exit(1);
    }

    console.log("\n📤 STEP 2: Uploading files...");
    ftpDeploy
        .deploy(config)
        .then(async (res) => {
            console.log("\n✅ Upload successful!");

            if (!baseUrl) {
                console.log("⚠️  Skipping auto-migration: API_URL or SITE_URL not found in .env");
                return;
            }

            const migrationUrl = `${baseUrl}/database/apply_migrations.php?token=${token}`;

            console.log("\n🔄 STEP 3: Triggering database migrations...");
            try {
                const response = await fetch(migrationUrl);
                const text = await response.text();

                if (response.ok) {
                    console.log("✅ Migrations applied successfully!");
                    console.log("--------------------------------------------------");
                    console.log("Migration Output Summary:");
                    console.log(text.replace(/<[^>]*>?/gm, '').trim().substring(0, 500) + "...");
                } else {
                    console.error(`❌ Migration failed (Status ${response.status}):`, text);
                }
            } catch (error) {
                console.error("❌ Failed to trigger migrations:", error.message);
            }

            console.log("--------------------------------------------------");
            console.log("Deployment & Migration Process Finished.");
        })
        .catch((err) => {
            console.error("\n❌ Deployment failed:", err.message);
            process.exit(1);
        });
}

main();

ftpDeploy.on("uploading", function (data) {
    process.stdout.write(`\rUploading file ${data.transferredFileCount} of ${data.totalFilesCount}`);
});

ftpDeploy.on("uploaded", function (data) {
    // Optional: log each file
});
