import { describe, it, expect } from 'vitest';
import { stripInternalFields } from '../../src/domain/utils';

describe('stripInternalFields', () => {
    it('returns primitives as is', () => {
        expect(stripInternalFields(1)).toBe(1);
        expect(stripInternalFields('string')).toBe('string');
        expect(stripInternalFields(null)).toBe(null);
        expect(stripInternalFields(undefined)).toBe(undefined);
    });

    it('removes keys starting with underscore', () => {
        const input = {
            id: 1,
            _private: 'secret',
            nested: {
                _hidden: 'deep',
                public: 'visible'
            }
        };
        const expected = {
            id: 1,
            nested: {
                public: 'visible'
            }
        };
        expect(stripInternalFields(input)).toEqual(expected);
    });

    it('handles arrays', () => {
        const input = [
            { id: 1, _temp: true },
            { id: 2, _meta: {} }
        ];
        const expected = [
            { id: 1 },
            { id: 2 }
        ];
        expect(stripInternalFields(input)).toEqual(expected);
    });

    it('returns new object reference (immutability)', () => {
        const input = { a: 1 };
        const output = stripInternalFields(input);
        expect(output).not.toBe(input);
        expect(output).toEqual(input);
    });
});
