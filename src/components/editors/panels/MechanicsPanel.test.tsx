/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MechanicsPanel } from './MechanicsPanel';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect } from 'vitest';

describe('MechanicsPanel Tests', () => {
    
    // Wrapper component to provide React Hook Form context
    const Wrapper = () => {
        const methods = useForm({
            defaultValues: {
                mechanics: {
                    damage_modifiers: []
                }
            }
        });
        return (
            <FormProvider {...methods}>
                <form>
                     <MechanicsPanel control={methods.control} />
                </form>
            </FormProvider>
        );
    };

    it('renders and allows expanding', () => {
        render(<Wrapper />);
        
        // Header should be visible
        const header = screen.getByText(/Mechanics/i);
        expect(header).toBeInTheDocument();

        // Click to expand
        fireEvent.click(header);
        
        // Add button should be visible after expand
        expect(screen.getByText('Add Modifier')).toBeInTheDocument();
        expect(screen.getByText('No mechanics added yet.')).toBeInTheDocument();
    });

    it('adds and removes modifiers', () => {
        render(<Wrapper />);
        
        // Expand & Add
        fireEvent.click(screen.getByText(/Mechanics/i));
        fireEvent.click(screen.getByText('Add Modifier'));

        // Check if inputs appear (Damage Modifier label)
        expect(screen.getByText('Damage Modifier')).toBeInTheDocument();
        
        // Check for Multiplier input
        expect(screen.getByLabelText(/Multiplier/i)).toBeInTheDocument();

        // Check for Target Types checkboxes (sample check)
        expect(screen.getByLabelText('Creature')).toBeInTheDocument();
        expect(screen.getByLabelText('Building')).toBeInTheDocument();

        // Remove
        const deleteButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-trash-2'));
        fireEvent.click(deleteButtons[0]);

        // Should be empty again
        expect(screen.getByText('No mechanics added yet.')).toBeInTheDocument();
    });

    it('updates multiplier', () => {
        render(<Wrapper />);
        
        // Expand & Add
        fireEvent.click(screen.getByText(/Mechanics/i));
        fireEvent.click(screen.getByText('Add Modifier'));

        const input = screen.getByLabelText(/Multiplier/i) as HTMLInputElement;
        fireEvent.change(input, { target: { value: '2.5' } });
        
        expect(input.value).toBe('2.5');
    });

    it('updates target types', () => {
        render(<Wrapper />);
        
        // Expand & Add
        fireEvent.click(screen.getByText(/Mechanics/i));
        fireEvent.click(screen.getByText('Add Modifier'));

        const creatureCheckbox = screen.getByLabelText('Creature');
        const buildingCheckbox = screen.getByLabelText('Building');

        // Check Creature
        fireEvent.click(creatureCheckbox);
        expect(creatureCheckbox).toBeChecked();

        // Check Building
        fireEvent.click(buildingCheckbox);
        expect(buildingCheckbox).toBeChecked();

        // Uncheck Creature
        fireEvent.click(creatureCheckbox);
        expect(creatureCheckbox).not.toBeChecked();
        expect(buildingCheckbox).toBeChecked();
    });
});
