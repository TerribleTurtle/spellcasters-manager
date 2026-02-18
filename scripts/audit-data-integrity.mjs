/**
 * DATA INTEGRITY AUDIT SCRIPT
 * 
 * Scans all entity JSON files in mock_data/ and checks for normalization damage:
 * - Heroes with "hero_class" instead of "class" (field renaming)
 * - Heroes with Array abilities instead of Object (structure migration)
 * - Any file that would produce phantom diffs if opened and saved
 * 
 * Usage: node scripts/audit-data-integrity.mjs [dataDir]
 * Default dataDir: mock_data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = process.argv[2] || path.join(rootDir, 'mock_data');

const CATEGORIES = ['heroes', 'units', 'consumables'];

let totalFiles = 0;
let issueCount = 0;
const issues = [];

function checkFile(filePath, category) {
    totalFiles++;
    const basename = path.basename(filePath);
    
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
        issues.push({ file: `${category}/${basename}`, severity: 'ERROR', issue: `Failed to parse JSON: ${e.message}` });
        issueCount++;
        return;
    }

    const fileIssues = [];

    if (category === 'heroes') {
        // Check for field renaming: hero_class should NOT exist if class exists
        if (data.hero_class && data.class) {
            fileIssues.push({ severity: 'WARN', issue: `Has BOTH "class" and "hero_class" — normalization may have added "hero_class"` });
        } else if (data.hero_class && !data.class) {
            fileIssues.push({ severity: 'INFO', issue: `Uses "hero_class" (new format) — no "class" field. Previously normalized?` });
        }

        // Check abilities format
        if (data.abilities) {
            if (Array.isArray(data.abilities)) {
                // Check if this looks like it was converted from Object format
                const hasTypes = data.abilities.every(a => a.type);
                if (hasTypes && data.abilities.some(a => a.type === 'Passive' || a.type === 'Primary')) {
                    fileIssues.push({ severity: 'INFO', issue: `Abilities are Array format (may have been normalized from Object)` });
                }
            } else if (typeof data.abilities === 'object') {
                // Original Object format — GOOD, this is the source data
                fileIssues.push({ severity: 'OK', issue: `Abilities are original Object format (passive/primary/defense/ultimate)` });
            }
        }
    }

    // Check for fields that shouldn't be in source data
    if (data._category) {
        fileIssues.push({ severity: 'WARN', issue: `Contains internal "_category" field — should be stripped before save` });
    }
    if (data._filename) {
        fileIssues.push({ severity: 'WARN', issue: `Contains internal "_filename" field — should be stripped before save` });
    }

    // Capture all keys for reporting
    const keys = Object.keys(data);
    
    if (fileIssues.length > 0) {
        const nonOk = fileIssues.filter(i => i.severity !== 'OK');
        if (nonOk.length > 0) {
            issueCount += nonOk.length;
        }
        issues.push({ 
            file: `${category}/${basename}`, 
            keys: keys.join(', '),
            findings: fileIssues 
        });
    }
}

console.log('╔══════════════════════════════════════════════════════╗');
console.log('║         DATA INTEGRITY AUDIT                       ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log(`Scanning: ${dataDir}\n`);

for (const category of CATEGORIES) {
    const catDir = path.join(dataDir, category);
    if (!fs.existsSync(catDir)) {
        console.log(`  ⚠ ${category}/ does not exist — skipping`);
        continue;
    }

    const files = fs.readdirSync(catDir).filter(f => f.endsWith('.json'));
    console.log(`  📂 ${category}/ — ${files.length} files`);
    
    for (const file of files) {
        checkFile(path.join(catDir, file), category);
    }
}

console.log(`\n${'─'.repeat(56)}`);
console.log(`Total files scanned: ${totalFiles}`);
console.log(`Issues found: ${issueCount}`);
console.log(`${'─'.repeat(56)}\n`);

if (issues.length > 0) {
    for (const entry of issues) {
        console.log(`📄 ${entry.file}`);
        if (entry.keys) console.log(`   Keys: ${entry.keys}`);
        for (const finding of entry.findings) {
            const icon = finding.severity === 'OK' ? '✅' : finding.severity === 'WARN' ? '⚠️' : finding.severity === 'ERROR' ? '❌' : 'ℹ️';
            console.log(`   ${icon} [${finding.severity}] ${finding.issue}`);
        }
        console.log('');
    }
}

if (issueCount === 0) {
    console.log('✅ All files are clean — no normalization damage detected.\n');
} else {
    console.log(`⚠️  ${issueCount} issue(s) found. Review above for details.\n`);
}

// Also scan backups for comparison
const backupDir = path.join(rootDir, 'root', 'backups');
if (fs.existsSync(backupDir)) {
    const backupDirs = fs.readdirSync(backupDir).filter(d => 
        fs.statSync(path.join(backupDir, d)).isDirectory()
    );
    console.log(`\n📦 Found ${backupDirs.length} backup snapshots in root/backups/`);
    console.log('   Run with backup path to audit: node scripts/audit-data-integrity.mjs root/backups/<snapshot-name>\n');
}
