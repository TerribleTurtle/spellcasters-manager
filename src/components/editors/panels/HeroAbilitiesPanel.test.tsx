/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HeroAbilitiesPanel } from './HeroAbilitiesPanel';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect } from 'vitest';

describe('HeroAbilitiesPanel Refactor Tests', () => {
    
    // Wrapper component to provide React Hook Form context
    const Wrapper = () => {
        const methods = useForm({
            defaultValues: {
                abilities: []
            }
        });
        return (
            <FormProvider {...methods}>
                <form>
                     <HeroAbilitiesPanel control={methods.control} />
                </form>
            </FormProvider>
        );
    };

    it('renders and allows expanding', () => {
        render(<Wrapper />);
        
        // Header should be visible
        const header = screen.getByText(/Hero Abilities/i);
        expect(header).toBeInTheDocument();

        // Click to expand
        fireEvent.click(header);
        
        // Add button should be visible after expand
        expect(screen.getByText('Add Ability')).toBeInTheDocument();
        expect(screen.getByText('No abilities added yet.')).toBeInTheDocument();
    });

    it('adds and removes abilities', () => {
        render(<Wrapper />);
        
        // Expand
        fireEvent.click(screen.getByText(/Hero Abilities/i));

        // Add
        fireEvent.click(screen.getByText('Add Ability'));

        // Check if inputs appear (default name is empty, placeholder 'Fireball')
        expect(screen.getByPlaceholderText('Fireball')).toBeInTheDocument();
        
        // Initial badge (Other) should appear in the ability item
        const badges = screen.getAllByText('Other');
        expect(badges.length).toBeGreaterThan(0);

        // Remove
        const deleteButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-trash-2'));
        fireEvent.click(deleteButtons[0]);

        // Should be empty again
        expect(screen.getByText('No abilities added yet.')).toBeInTheDocument();
    });

    it('updates badges when type changes', () => {
        render(<Wrapper />);
        
        // Expand & Add
        fireEvent.click(screen.getByText(/Hero Abilities/i));
        fireEvent.click(screen.getByText('Add Ability'));

        // Change type to Ultimate
        const select = screen.getByRole('combobox'); // Assuming only one select for now or use getAllByRole
        fireEvent.change(select, { target: { value: 'Ultimate' } });

        // Check for Ultimate badge
        const badges = screen.getAllByText('Ultimate').filter(el => el.tagName === 'SPAN');
        expect(badges.length).toBeGreaterThan(0);

        // Collapse
        fireEvent.click(screen.getByText(/Hero Abilities/i)); // Toggle collapse

        // Now header badges should be visible.
        const headerBadges = screen.getAllByText('Ultimate').filter(el => el.tagName === 'SPAN');
        expect(headerBadges.length).toBeGreaterThan(0);
    });
});
