import React from 'react';
import '@testing-library/jest-dom';

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterModal, { FilterState } from '../components/FilterModal';

const mockFilters: FilterState = {
  fuelTypes: ['e10', 'diesel'],
  maxPrice: 4.50,
  onlyVerified: true,
};

describe('FilterModal', () => {
  it('does not render when not open', () => {
    const { container } = render(
      <FilterModal
        isOpen={false}
        filters={mockFilters}
        onFiltersChange={() => {}}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with current filter values', () => {
    render(
      <FilterModal
        isOpen={true}
        filters={mockFilters}
        onFiltersChange={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Max Price: $4.50')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4.5')).toBeInTheDocument();
    expect(screen.getByLabelText('Show verified prices only')).toBeChecked();
  });

  it('shows fuel type checkboxes with correct checked state', () => {
    render(
      <FilterModal
        isOpen={true}
        filters={mockFilters}
        onFiltersChange={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByLabelText('E10')).toBeChecked();
    expect(screen.getByLabelText('Diesel')).toBeChecked();
    expect(screen.getByLabelText('Unleaded 91')).not.toBeChecked();
  });

  it('toggles fuel type checkboxes', async () => {
    render(
      <FilterModal
        isOpen={true}
        filters={mockFilters}
        onFiltersChange={() => {}}
        onClose={() => {}}
      />
    );

    const unleadedCheckbox = screen.getByLabelText('Unleaded 91');
    expect(unleadedCheckbox).not.toBeChecked();
    const user = userEvent.setup();
    await user.click(unleadedCheckbox);
    expect(unleadedCheckbox).toBeChecked();

    await user.click(unleadedCheckbox);
    expect(unleadedCheckbox).not.toBeChecked();
  });

  it('updates max price when slider changes', async () => {
    render(
      <FilterModal
        isOpen={true}
        filters={mockFilters}
        onFiltersChange={() => {}}
        onClose={() => {}}
      />
    );

    const slider = screen.getByDisplayValue('4.5');
    fireEvent.change(slider, { target: { value: '5' } });

    expect(screen.getByText('Max Price: $5.00')).toBeInTheDocument();
  });

  it('toggles verified only checkbox', async () => {
    render(
      <FilterModal
        isOpen={true}
        filters={mockFilters}
        onFiltersChange={() => {}}
        onClose={() => {}}
      />
    );

    const verifiedCheckbox = screen.getByLabelText('Show verified prices only');
    expect(verifiedCheckbox).toBeChecked();
    const user = userEvent.setup();
    await user.click(verifiedCheckbox);
    expect(verifiedCheckbox).not.toBeChecked();
  });

  it('calls onClose when cancel button clicked', async () => {
    const mockClose = jest.fn();
    render(
      <FilterModal
        isOpen={true}
        filters={mockFilters}
        onFiltersChange={() => {}}
        onClose={mockClose}
      />
    );

    const user = userEvent.setup();
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls onFiltersChange and onClose when apply button clicked', async () => {
    const mockFiltersChange = jest.fn();
    const mockClose = jest.fn();
    render(
      <FilterModal
        isOpen={true}
        filters={mockFilters}
        onFiltersChange={mockFiltersChange}
        onClose={mockClose}
      />
    );

    const user = userEvent.setup();
    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    expect(mockFiltersChange).toHaveBeenCalledWith(mockFilters);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop clicked', async () => {
    const mockClose = jest.fn();
    render(
      <FilterModal
        isOpen={true}
        filters={mockFilters}
        onFiltersChange={() => {}}
        onClose={mockClose}
      />
    );

    const user = userEvent.setup();
    const backdrop = screen.getByTestId('backdrop');
    await user.click(backdrop);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button clicked', async () => {
    const mockClose = jest.fn();
    render(
      <FilterModal
        isOpen={true}
        filters={mockFilters}
        onFiltersChange={() => {}}
        onClose={mockClose}
      />
    );

    const user = userEvent.setup();
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('applies filter changes when apply clicked', async () => {
    const mockFiltersChange = jest.fn();
    render(
      <FilterModal
        isOpen={true}
        filters={mockFilters}
        onFiltersChange={mockFiltersChange}
        onClose={() => {}}
      />
    );

    // Change some filters
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Unleaded 91'));
    const slider = screen.getByDisplayValue('4.5');
    fireEvent.change(slider, { target: { value: '6' } });
    await user.click(screen.getByLabelText('Show verified prices only'));

    const applyButton = screen.getByRole('button', { name: /apply/i });
    await user.click(applyButton);

    expect(mockFiltersChange).toHaveBeenCalledWith({
      fuelTypes: ['e10', 'diesel', 'unleaded-91'],
      maxPrice: 6.0,
      onlyVerified: false,
    });
  });
});