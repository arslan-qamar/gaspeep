import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSettingsScreen } from '../AccountSettingsScreen';
import { StationOwner } from '../types';

const mockStationOwner: StationOwner = {
  id: 'owner_001',
  userId: 'user_001',
  businessName: 'Shell Gas Station',
  contactName: 'John Doe',
  email: 'john@example.com',
  phone: '+1-800-123-4567',
  verificationStatus: 'verified',
  verifiedAt: '2024-01-15T10:00:00Z',
  plan: 'premium',
  broadcastsThisWeek: 3,
  broadcastLimit: 10,
  accountCreatedAt: '2023-06-01T00:00:00Z',
};

describe('AccountSettingsScreen', () => {
  const mockOnBack = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('View Mode', () => {
    it('displays the page header', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
    });

    it('displays business information', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('Shell Gas Station')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1-800-123-4567')).toBeInTheDocument();
    });

    it('displays current plan badge', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('displays broadcast usage', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('3 of 10')).toBeInTheDocument();
    });

    it('displays verification status as verified', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText(/✓ Verified/)).toBeInTheDocument();
    });

    it('displays account creation date', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('June 1, 2023')).toBeInTheDocument();
    });

    it('displays back button', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      const backButton = screen.getByText(/← Back to Dashboard/);
      expect(backButton).toBeInTheDocument();
    });

    it('calls onBack when back button is clicked', async () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      const backButton = screen.getByText(/← Back to Dashboard/);
      await userEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('displays Edit button', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('enters edit mode when Edit button is clicked', async () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      // Edit mode should show Save Changes button and input fields
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Shell Gas Station')).toBeInTheDocument();
    });

    it('pre-fills form inputs with current owner data', async () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      expect(screen.getByDisplayValue('Shell Gas Station')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1-800-123-4567')).toBeInTheDocument();
    });

    it('shows Save Changes and Cancel buttons in edit mode', async () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('can update form fields', async () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      const businessNameInput = screen.getByDisplayValue('Shell Gas Station') as HTMLInputElement;
      await userEvent.clear(businessNameInput);
      await userEvent.type(businessNameInput, 'BP Gas Station');

      expect(businessNameInput.value).toBe('BP Gas Station');
    });

    it('calls onSave with updated form data', async () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      const businessNameInput = screen.getByDisplayValue('Shell Gas Station') as HTMLInputElement;
      await userEvent.clear(businessNameInput);
      await userEvent.type(businessNameInput, 'BP Gas Station');

      const saveButton = screen.getByText('Save Changes');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            businessName: 'BP Gas Station',
          })
        );
      });
    });

    it('exits edit mode after successful save', async () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      const saveButton = screen.getByText('Save Changes');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });

    it('resets form data when Cancel is clicked', async () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      const businessNameInput = screen.getByDisplayValue('Shell Gas Station') as HTMLInputElement;
      await userEvent.clear(businessNameInput);
      await userEvent.type(businessNameInput, 'BP Gas Station');

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      // Should be back in view mode showing original value
      expect(screen.getByText('Shell Gas Station')).toBeInTheDocument();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('disables buttons when isSaving is true', async () => {
      const { rerender } = render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
          isSaving={false}
        />
      );
      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      rerender(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
          isSaving={true}
        />
      );

      const saveButton = screen.getByText('Saving...') as HTMLButtonElement;
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Plan Display', () => {
    it('shows Premium plan badge for premium plan', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('shows broadcast usage progress', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('3 of 10')).toBeInTheDocument();
    });

    it('shows upgrade button for basic plan', () => {
      const basicOwner: StationOwner = {
        ...mockStationOwner,
        plan: 'basic',
      };
      render(
        <AccountSettingsScreen
          owner={basicOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    });
  });

  describe('Verification Status', () => {
    it('displays verified status for verified owner', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText(/✓ Verified/)).toBeInTheDocument();
    });

    it('displays pending status for pending owner', () => {
      const pendingOwner: StationOwner = {
        ...mockStationOwner,
        verificationStatus: 'pending',
        verifiedAt: null,
      };
      render(
        <AccountSettingsScreen
          owner={pendingOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText(/⏳ Pending/)).toBeInTheDocument();
    });

    it('displays verification explanation for verified status', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(
        screen.getByText('Your business is verified. You can broadcast offers to Premium users.')
      ).toBeInTheDocument();
    });

    it('displays verified date for verified owner', () => {
      render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
    });

    it('does not display verified date for pending owner', () => {
      const pendingOwner: StationOwner = {
        ...mockStationOwner,
        verificationStatus: 'pending',
        verifiedAt: null,
      };
      render(
        <AccountSettingsScreen
          owner={pendingOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      expect(screen.queryByText('January 15, 2024')).not.toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('renders with dark mode classes', () => {
      const { container } = render(
        <AccountSettingsScreen
          owner={mockStationOwner}
          onBack={mockOnBack}
          onSave={mockOnSave}
        />
      );
      const cardsWithDarkMode = container.querySelectorAll('.dark\\:bg-slate-800');
      expect(cardsWithDarkMode.length).toBeGreaterThan(0);
    });
  });
});
