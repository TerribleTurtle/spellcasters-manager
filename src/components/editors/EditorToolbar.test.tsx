/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { EditorToolbar } from './EditorToolbar';

const defaultProps = {
  filename: 'test_unit.json',
  isSaving: false,
  isDirty: false,
  isRestored: false,
  isNew: false,
  label: 'Unit',
  generatedFilename: 'test_unit.json',
  getValues: () => ({}),
  onSave: vi.fn(),
  onQueue: vi.fn(),
  onQuickQueue: vi.fn(),
  onReset: vi.fn(),
};

describe('EditorToolbar: Save/Queue guard', () => {
  it('disables Save and Queue when no changes (clean state)', () => {
    render(<EditorToolbar {...defaultProps} />);
    expect(screen.getByTitle('Save now')).toBeDisabled();
    expect(screen.getByTitle('Queue for next patch')).toBeDisabled();
    expect(screen.getByTitle('Quick Queue (Skip Preview)')).toBeDisabled();
  });

  it('enables Save and Queue when form is dirty', () => {
    render(<EditorToolbar {...defaultProps} isDirty={true} />);
    expect(screen.getByTitle('Save now')).not.toBeDisabled();
    expect(screen.getByTitle('Queue for next patch')).not.toBeDisabled();
    expect(screen.getByTitle('Quick Queue (Skip Preview)')).not.toBeDisabled();
  });

  it('enables Save and Queue for new entities', () => {
    render(<EditorToolbar {...defaultProps} isNew={true} />);
    expect(screen.getByTitle('Save now')).not.toBeDisabled();
    expect(screen.getByTitle('Queue for next patch')).not.toBeDisabled();
    expect(screen.getByTitle('Quick Queue (Skip Preview)')).not.toBeDisabled();
  });

  it('enables Save and Queue for restored entities', () => {
    render(<EditorToolbar {...defaultProps} isRestored={true} />);
    expect(screen.getByTitle('Save now')).not.toBeDisabled();
    expect(screen.getByTitle('Queue for next patch')).not.toBeDisabled();
    expect(screen.getByTitle('Quick Queue (Skip Preview)')).not.toBeDisabled();
  });

  it('disables all actions while saving', () => {
    render(<EditorToolbar {...defaultProps} isSaving={true} isDirty={true} />);
    expect(screen.getByTitle('Save now')).toBeDisabled();
    expect(screen.getByTitle('Queue for next patch')).toBeDisabled();
    expect(screen.getByTitle('Quick Queue (Skip Preview)')).toBeDisabled();
    expect(screen.getByTitle('Reset changes')).toBeDisabled();
  });

  it('calls onQuickQueue when clicked', () => {
    render(<EditorToolbar {...defaultProps} isDirty={true} />);
    const button = screen.getByTitle('Quick Queue (Skip Preview)');
    button.click();
    expect(defaultProps.onQuickQueue).toHaveBeenCalled();
  });
});
