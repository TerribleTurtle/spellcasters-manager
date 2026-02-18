import deepDiff from 'deep-diff';
import { Change, ChangeType } from '../../src/domain/schemas/index.js';
import { stripInternalFields } from '../../src/domain/utils.js';
import { normalizeForDiff } from '../../src/domain/diff-utils.js';

/**
 * Builds a slim Change object with field-level diffs instead of full snapshots.
 * Uses deep-diff to compute only the changed fields.
 *
 * Before diffing, both sides are normalized via normalizeForDiff so that
 * legacy data formats (e.g. Object-based hero abilities) are converted to
 * their modern equivalents (Array-based). This prevents structural changes
 * from bloating the diff with the entire field contents.
 *
 * This is shared between dataService (standard save) and patchService (commit).
 */
export function buildSlimChange(
    filename: string,
    name: string,
    field: string,
    category: string,
    oldData: unknown,
    newData: unknown
): Change {
    let changeType: ChangeType;
    if (!oldData) {
        changeType = 'add';
    } else if (!newData) {
        changeType = 'delete';
    } else {
        changeType = 'edit';
    }

    // Normalize both sides so legacy formats (e.g. Object abilities → Array)
    // are comparable before diffing. Then strip internal fields for clean output.
    const normalizedOld = oldData ? normalizeForDiff(oldData) : undefined;
    const normalizedNew = newData ? normalizeForDiff(newData) : undefined;
    const cleanOld = normalizedOld ? stripInternalFields(normalizedOld) : undefined;
    const cleanNew = normalizedNew ? stripInternalFields(normalizedNew) : undefined;
    const diffs = (cleanOld && cleanNew) ? (deepDiff.diff(cleanOld, cleanNew) || []) : [];

    return {
        target_id: filename,
        name,
        field,
        change_type: changeType,
        diffs,
        category
    };
}
