
import { buildSlimChange } from '../server/utils/slimChange';
import deepDiff from 'deep-diff';

// Legacy format (Object-based)
const oldData = {
    name: 'Astral Monk',
    health: 300,
    abilities: {
        passive: [
            { name: 'Arcane Alignment', description: 'All Astral spells recharge faster.' },
            { name: 'Last Light', description: 'All damage dealt is increased against targets below half health.' },
            { name: 'Cosmic Air', description: 'All flying creatures summoned by the Astral Monk are invisible.' }
        ],
        primary: { 
            name: 'Astral Fists', 
            description: 'Pierces through enemies with colossal astral fists.',
            damage: 32,
            mechanics: { pierce: true }
        },
        defense: { 
            name: 'Veil Shift', 
            description: 'Turns invisible and move faster.',
            cooldown: 8 
        },
        ultimate: { 
            name: 'Dimension of Varani', 
            description: 'Conjures a time bubble.' 
        }
    }
};

// New format (Array-based) - only change is Primary Damage 32 -> 35
const newData = {
    name: 'Astral Monk',
    health: 300,
    abilities: [
        { name: 'Arcane Alignment', description: 'All Astral spells recharge faster.', type: 'Passive', mana_cost: 0, cooldown: 0 },
        { name: 'Last Light', description: 'All damage dealt is increased against targets below half health.', type: 'Passive', mana_cost: 0, cooldown: 0 },
        { name: 'Cosmic Air', description: 'All flying creatures summoned by the Astral Monk are invisible.', type: 'Passive', mana_cost: 0, cooldown: 0 },
        { 
            name: 'Astral Fists', 
            description: 'Pierces through enemies with colossal astral fists.',
            damage: 35, // CHANGED from 32
            mechanics: { pierce: true },
            type: 'Primary', mana_cost: 0, cooldown: 0
        },
        { 
            name: 'Veil Shift', 
            description: 'Turns invisible and move faster.',
            cooldown: 8, 
            type: 'Defense', mana_cost: 0
        },
        { 
            name: 'Dimension of Varani', 
            description: 'Conjures a time bubble.',
            type: 'Ultimate', mana_cost: 0, cooldown: 0
        }
    ]
};

// 1. BEFORE FIX: deep-diff compares Object vs Array directly
// It sees "abilities" as a complete replacement (Edit)
const diffBefore = deepDiff.diff(oldData, newData);
const bloatedSize = JSON.stringify(diffBefore).length;

// 2. AFTER FIX: buildSlimChange normalizes first
const slimChange = buildSlimChange('test.json', 'Test', 'entity', 'heroes', oldData, newData);
const slimSize = JSON.stringify(slimChange.diffs).length;

console.log(`Bloated Diff Size: ${bloatedSize} characters`);
console.log(`Slim Diff Size:    ${slimSize} characters`);
console.log(`Savings:           ${bloatedSize - slimSize} characters per save (${Math.round((bloatedSize - slimSize) / bloatedSize * 100)}% reduction)`);
