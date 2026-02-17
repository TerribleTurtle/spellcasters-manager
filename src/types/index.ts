export * from '../domain/schemas/index.js';

export type AppView = 'forge' | 'scribe';

export interface EntityListHash {
    id: string; // filename
    category: string; // for icon
}
export interface BaseEntity {
    id?: string;
    name?: string;
    _filename?: string;
    _category?: string;
    category?: string;
    icon?: string;
    description?: string;
    [key: string]: unknown;
}
