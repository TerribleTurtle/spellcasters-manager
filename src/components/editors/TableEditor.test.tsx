/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TableEditor } from './TableEditor';
import { useForm, FormProvider } from 'react-hook-form';
import { describe, it, expect } from 'vitest';
import { EditorField } from './TableEditor';

describe('TableEditor Smoke Tests', () => {
    const mockFields: EditorField[] = [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'cost', label: 'Cost', type: 'number' },
        { name: 'type', label: 'Type', type: 'select', options: ['A', 'B'] }
    ];

    it('renders all fields with correct labels', () => {
        const Wrapper = () => {
             const methods = useForm({ defaultValues: { name: 'Test', cost: 10, type: 'A' } });
             return (
                 <FormProvider {...methods}>
                     <TableEditor 
                        fields={mockFields} 
                        control={methods.control} 
                        initialData={{ name: 'Test', cost: 10, type: 'A' }} 
                     />
                 </FormProvider>
             );
        };

        render(<Wrapper />);

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Cost')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        
        // Inputs
        expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });

    it('renders select options', () => {
        const Wrapper = () => {
            const methods = useForm({ defaultValues: { type: 'A' } });
            return (
                <FormProvider {...methods}>
                    <TableEditor 
                       fields={mockFields} 
                       control={methods.control} 
                       initialData={{ type: 'A' }} 
                    />
                </FormProvider>
            );
       };

       render(<Wrapper />);
       
       // Select trigger shows current value
       expect(screen.getByText('A')).toBeInTheDocument();
    });
});
