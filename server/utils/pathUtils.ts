export const ensureJsonExt = (filename: string): string => {
    return filename.endsWith('.json') ? filename : `${filename}.json`;
};
