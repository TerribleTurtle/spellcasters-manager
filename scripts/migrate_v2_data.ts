
import fs from 'fs';
import path from 'path';

const SOURCE_DIR = 'C:/Projects/spellcasters-community-api/api/v2';
const TARGET_DIR = 'C:/Projects/spellcasters-manager/mock_data';

const MAPPINGS = [
    { source: 'units.json', target: 'units', idField: 'entity_id' },
    { source: 'heroes.json', target: 'heroes', idField: 'entity_id' },
    { source: 'consumables.json', target: 'consumables', idField: 'entity_id' },
    { source: 'titans.json', target: 'titans', idField: 'entity_id' },
    { source: 'spells.json', target: 'spells', idField: 'entity_id' }, // Spells also use entity_id
];

const migrate = () => {
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`Source directory not found: ${SOURCE_DIR}`);
        process.exit(1);
    }

    MAPPINGS.forEach(mapping => {
        const sourcePath = path.join(SOURCE_DIR, mapping.source);
        const targetDir = path.join(TARGET_DIR, mapping.target);

        if (!fs.existsSync(sourcePath)) {
            console.warn(`Skipping missing source file: ${sourcePath}`);
            return;
        }

        if (!fs.existsSync(targetDir)) {
            console.log(`Creating target directory: ${targetDir}`);
            fs.mkdirSync(targetDir, { recursive: true });
        }

        console.log(`Migrating ${mapping.source} -> ${mapping.target}...`);
        
        try {
            const content = fs.readFileSync(sourcePath, 'utf-8');
            const data = JSON.parse(content);

            if (!Array.isArray(data)) {
                console.error(`Error: ${mapping.source} is not an array.`);
                return;
            }

            // Clear existing files? Maybe safer to overwrite.
            // fs.rmSync(targetDir, { recursive: true, force: true });
            // fs.mkdirSync(targetDir);

            let count = 0;
            data.forEach(item => {
                const id = item[mapping.idField];
                if (!id) {
                    console.warn(`Skipping item without ID in ${mapping.source}:`, item);
                    return;
                }
                const filename = `${id}.json`;
                const filePath = path.join(targetDir, filename);
                
                // Add $schema if missing (optional, but good for local dev)
                 if (!item.$schema) {
                    item.$schema = `../../schemas/v2/${mapping.target}.schema.json`; // Approximate path
                 }

                fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
                count++;
            });

            console.log(`  -> Migrated ${count} items.`);

        } catch (e) {
            console.error(`Failed to migrate ${mapping.source}:`, e);
        }
    });
};

migrate();
