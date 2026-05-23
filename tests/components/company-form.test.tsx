import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompanyForm } from '@/components/company/company-form';

describe('CompanyForm', () => {
  it('renders company form correctly', () => {
    render(<CompanyForm />);

    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<CompanyForm />);

    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<CompanyForm onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText(/company name/i);
    const typeSelect = screen.getByLabelText(/company type/i);
    const submitButton = screen.getByRole('button', { name: /create/i });

    fireEvent.change(nameInput, { target: { value: 'Test Company' } });
    fireEvent.change(typeSelect, { target: { value: 'marketing' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Company',
          type: 'marketing',
        })
      );
    });
  });
});
