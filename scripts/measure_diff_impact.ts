
import { fileService } from '../server/services/fileService';
import path from 'path';

async function measureDiffImpact() {
    const patchesFile = path.resolve('mock_data/patches.json');
    if (!await fileService.exists(patchesFile)) {
        console.log("No patches.json found.");
        return;
    }

    const patches = await fileService.readJson<Record<string, unknown>[]>(patchesFile);
    
    // Calculate total size with 'diff' string
    const fullSize = JSON.stringify(patches).length;

    // Calculate size without 'diff' string
    const slimPatches = patches.map(p => {
        const rest = { ...p };
        delete rest.diff;
        return rest;
    });
    const slimSize = JSON.stringify(slimPatches).length;

    console.log(`Total Patches: ${patches.length}`);
    console.log(`Current Size: ${fullSize} characters`);
    console.log(`Size w/o 'diff': ${slimSize} characters`);
    console.log(`Potential Savings: ${fullSize - slimSize} characters (${Math.round((fullSize - slimSize) / fullSize * 100)}%)`);
}

measureDiffImpact();
