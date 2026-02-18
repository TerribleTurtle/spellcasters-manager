/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TagsPanel } from './TagsPanel';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect } from 'vitest';

describe('TagsPanel Tests', () => {
    
    const Wrapper = () => {
        const methods = useForm({
            defaultValues: {
                tags: ['existing_tag']
            }
        });
        return (
            <FormProvider {...methods}>
                <form>
                     <TagsPanel control={methods.control} />
                </form>
            </FormProvider>
        );
    };

    it('renders and shows existing tags', () => {
        render(<Wrapper />);
        expect(screen.getByText('existing_tag')).toBeInTheDocument();
        expect(screen.getByText('(1)')).toBeInTheDocument();
    });

    it('adds a new tag', () => {
        render(<Wrapper />);
        const input = screen.getByPlaceholderText(/Add tag/i);
        const button = screen.getByText(/Add/i);

        fireEvent.change(input, { target: { value: 'homing' } });
        fireEvent.click(button);

        expect(screen.getByText('homing')).toBeInTheDocument();
        expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('prevents adding duplicate tags', () => {
        render(<Wrapper />);
        const input = screen.getByPlaceholderText(/Add tag/i);
        const button = screen.getByText(/Add/i);

        fireEvent.change(input, { target: { value: 'existing_tag' } });
        fireEvent.click(button);

        // Should still be 1 because duplicate was ignored
        expect(screen.getByText('(1)')).toBeInTheDocument();
    });

    it('adds tag on Enter key', () => {
        render(<Wrapper />);
        const input = screen.getByPlaceholderText(/Add tag/i);

        fireEvent.change(input, { target: { value: 'fire' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

        expect(screen.getByText('fire')).toBeInTheDocument();
    });
});
