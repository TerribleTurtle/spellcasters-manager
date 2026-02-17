
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM Fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOCK_DATA_DIR = path.resolve(__dirname, '../../mock_data');
const ASSETS_DIR = path.resolve(MOCK_DATA_DIR, 'assets/units');
const UNITS_DIR = path.resolve(MOCK_DATA_DIR, 'units');

async function updateIcons() {
    console.log('Scanning for unit images...');
    
    if (!fs.existsSync(ASSETS_DIR)) {
        console.error(`Assets directory not found: ${ASSETS_DIR}`);
        return;
    }

    const imageFiles = fs.readdirSync(ASSETS_DIR).filter(file => 
        file.endsWith('.png') || file.endsWith('.webp') || file.endsWith('.jpg')
    );

    console.log(`Found ${imageFiles.length} images.`);

    let updatedCount = 0;

    for (const imageFile of imageFiles) {
        const unitId = path.parse(imageFile).name; // e.g., "wyvern" from "wyvern.png"
        const jsonPath = path.resolve(UNITS_DIR, `${unitId}.json`);

        if (fs.existsSync(jsonPath)) {
            try {
                const content = fs.readFileSync(jsonPath, 'utf-8');
                const data = JSON.parse(content);

                // Check if icon is missing or different
                const newIconPath = `units/${imageFile}`;
                
                if (!data.icon || data.icon !== newIconPath) {
                    console.log(`Updating ${unitId}: icon -> ${newIconPath}`);
                    data.icon = newIconPath;
                    
                    // Add magic_school override if missing and known (optional, but good for testing)
                    // (Skipping magic_school automation to avoid guessing, focus on icons)

                    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
                    updatedCount++;
                }
            } catch (e) {
                console.error(`Error updating ${unitId}.json:`, e);
            }
        }
    }

    console.log(`\nUpdate Complete. Modified ${updatedCount} unit files.`);
}

updateIcons();
