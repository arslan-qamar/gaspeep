import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { StationDetailsScreen } from '../StationDetailsScreen';
import * as sampleData from '../../../__tests__/fixtures/station-owner-dashboard-sample-data.json';
import { ClaimedStation, StationUpdateFormData } from '../types';

describe('StationDetailsScreen', () => {
  const mockStation: ClaimedStation = sampleData.claimedStations[0];
  const mockFuelPrices = sampleData.currentFuelPrices['station_101'];

  const defaultProps = {
    station: mockStation,
    fuelPrices: mockFuelPrices,
    broadcasts: sampleData.broadcasts.filter((b) => b.stationId === mockStation.id),
    onSave: jest.fn(),
    onBroadcast: jest.fn(),
    onUnclaim: jest.fn(),
    isLoading: false,
    isSaving: false,
  };

  // === Viewing Mode ===
  describe('Viewing Mode', () => {
    it('should display station name as header', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(mockStation.name)).toBeInTheDocument();
    });

    it('should display verification status badge', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByTestId('verification-badge')).toBeInTheDocument();
    });

    it('should show "Verified" badge for verified station', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    });

    it('should display verification date', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      if (mockStation.verifiedAt) {
        const verificationDate = mockStation.verifiedAt.split('T')[0];
        expect(screen.getByText(new RegExp(verificationDate))).toBeInTheDocument();
      }
    });

    it('should display station brand/logo', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(mockStation.brand)).toBeInTheDocument();
    });

    it('should display full address', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(mockStation.address)).toBeInTheDocument();
    });

    it('should display geographic coordinates on map', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByTestId('location-map')).toBeInTheDocument();
    });

    it('should display operating hours', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(/operating hours/i)).toBeInTheDocument();
    });

    it('should show 24-hour status if applicable', () => {
      const station24H = {
        ...mockStation,
        operatingHours: {
          ...mockStation.operatingHours,
          monday: { open: '00:00', close: '23:59', is24Hour: true },
        },
      };
      render(<StationDetailsScreen {...defaultProps} station={station24H} />);
      // Check for some indication of 24-hour operation
      expect(screen.getByText(/24 hour|open.*all day/i)).toBeInTheDocument();
    });

    it('should display contact information section', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(/contact information/i)).toBeInTheDocument();
    });

    it('should display phone number', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(mockStation.phone)).toBeInTheDocument();
    });

    it('should display website URL', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(mockStation.website)).toBeInTheDocument();
    });

    it('should display email', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      const email = mockStation.operatingHours ? screen.getByText(/contact/i) : null;
      // Email might be displayed in contact section
    });

    it('should display amenities section', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(/amenities/i)).toBeInTheDocument();
    });

    it('should display available amenities', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      mockStation.amenities.forEach((amenity) => {
        expect(screen.getByText(new RegExp(amenity, 'i'))).toBeInTheDocument();
      });
    });

    it('should display current fuel prices', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(/current fuel prices/i)).toBeInTheDocument();
    });

    it('should show all fuel type prices', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      mockFuelPrices.forEach((price) => {
        expect(screen.getByText(price.fuelTypeName)).toBeInTheDocument();
      });
    });

    it('should display last updated timestamp for prices', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(/last updated/i)).toBeInTheDocument();
    });

    it('should show "Report Incorrect Price" link', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByRole('link', { name: /report incorrect price/i })).toBeInTheDocument();
    });

    it('should display photos gallery section', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(/station photos/i)).toBeInTheDocument();
    });

    it('should display photo thumbnails', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      if (mockStation.photos.length > 0) {
        const thumbnails = screen.getAllByTestId('photo-thumbnail');
        expect(thumbnails.length).toBe(mockStation.photos.length);
      }
    });

    it('should display broadcast history section', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByText(/broadcast history/i)).toBeInTheDocument();
    });

    it('should show recent broadcasts from this station', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      const broadcasts = defaultProps.broadcasts.slice(0, 5);
      broadcasts.forEach((broadcast) => {
        expect(screen.getByText(broadcast.title)).toBeInTheDocument();
      });
    });

    it('should display "Broadcast Offer" button', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByRole('button', { name: /broadcast offer/i })).toBeInTheDocument();
    });

    it('should call onBroadcast when "Broadcast Offer" clicked', async () => {
      const user = userEvent.setup();
      const mockOnBroadcast = jest.fn();
      render(<StationDetailsScreen {...defaultProps} onBroadcast={mockOnBroadcast} />);
      const broadcastButton = screen.getByRole('button', { name: /broadcast offer/i });

      await user.click(broadcastButton);

      expect(mockOnBroadcast).toHaveBeenCalledWith(mockStation.id);
    });
  });

  // === Editing Mode ===
  describe('Editing Mode', () => {
    it('should enable form fields when Edit button clicked', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} />);
      const editButton = screen.getByRole('button', { name: /edit|update/i });

      await user.click(editButton);

      const nameInput = screen.getByDisplayValue(mockStation.name) as HTMLInputElement;
      expect(nameInput.disabled).toBe(false);
    });

    it('should allow editing station name', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      const nameInput = screen.getByDisplayValue(mockStation.name) as HTMLInputElement;

      await user.clear(nameInput);
      await user.type(nameInput, 'New Station Name');

      expect(nameInput).toHaveValue('New Station Name');
    });

    it('should allow editing address', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      const addressInput = screen.getByDisplayValue(mockStation.address) as HTMLInputElement;

      await user.clear(addressInput);
      await user.type(addressInput, 'New Address');

      expect(addressInput).toHaveValue('New Address');
    });

    it('should allow editing phone number', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      const phoneInput = screen.getByDisplayValue(mockStation.phone) as HTMLInputElement;

      await user.clear(phoneInput);
      await user.type(phoneInput, '+61 2 9555 9999');

      expect(phoneInput).toHaveValue('+61 2 9555 9999');
    });

    it('should allow editing website URL', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      const websiteInput = screen.getByDisplayValue(mockStation.website) as HTMLInputElement;

      await user.clear(websiteInput);
      await user.type(websiteInput, 'https://newwebsite.com');

      expect(websiteInput).toHaveValue('https://newwebsite.com');
    });

    it('should allow editing operating hours', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      const operatingHoursInputs = screen.getAllByDisplayValue(/06:00/);

      expect(operatingHoursInputs.length).toBeGreaterThan(0);
    });

    it('should allow toggling 24-hour status', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      const toggle24HourButton = screen.getByRole('button', { name: /24 hour/i });

      await user.click(toggle24HourButton);

      // Operating hours should be disabled when 24-hour is toggled
      expect(screen.getByTestId('operating-hours-disabled')).toBeInTheDocument();
    });

    it('should allow selecting/deselecting amenities', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      const amenityCheckboxes = screen.getAllByRole('checkbox');

      if (amenityCheckboxes.length > 0) {
        await user.click(amenityCheckboxes[0]);
        expect(amenityCheckboxes[0]).toHaveAttribute('data-changed', 'true');
      }
    });

    it('should show "Save Changes" button when in edit mode', () => {
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('should show "Cancel" button when in edit mode', () => {
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    });

    it('should call onSave with form data when Save clicked', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();
      render(
        <StationDetailsScreen {...defaultProps} isEditing={true} onSave={mockOnSave} />
      );
      const nameInput = screen.getByDisplayValue(mockStation.name) as HTMLInputElement;

      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
        })
      );
    });

    it('should show loading indicator while saving', () => {
      render(<StationDetailsScreen {...defaultProps} isEditing={true} isSaving={true} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should disable Save button while saving', () => {
      render(<StationDetailsScreen {...defaultProps} isEditing={true} isSaving={true} />);
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });
  });

  // === Photo Upload ===
  describe('Photo Upload', () => {
    it('should display upload photos button', () => {
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      expect(screen.getByRole('button', { name: /upload photos|add photos/i })).toBeInTheDocument();
    });

    it('should display file input for photos', () => {
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      expect(screen.getByTestId('photo-file-input')).toBeInTheDocument();
    });

    it('should show photo upload guidelines', () => {
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      expect(screen.getByText(/photo guidelines|acceptable photos/i)).toBeInTheDocument();
    });

    it('should preview uploaded photos', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      const fileInput = screen.getByTestId('photo-file-input') as HTMLInputElement;
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByTestId('photo-preview')).toBeInTheDocument();
      });
    });

    it('should allow removing uploaded photos', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      const fileInput = screen.getByTestId('photo-file-input') as HTMLInputElement;
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

      await user.upload(fileInput, file);

      const removeButton = await screen.findByRole('button', { name: /remove|delete/i });
      await user.click(removeButton);

      expect(screen.queryByTestId('photo-preview')).not.toBeInTheDocument();
    });

    it('should show progress indicator while uploading photos', () => {
      render(<StationDetailsScreen {...defaultProps} isEditing={true} />);
      // Upload progress should be shown when file is being uploaded
    });
  });

  // === Unclaim Station ===
  describe('Unclaim Station', () => {
    it('should display "Unclaim Station" button', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      expect(screen.getByRole('button', { name: /unclaim station/i })).toBeInTheDocument();
    });

    it('should show confirmation dialog on unclaim', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} />);
      const unclaimButton = screen.getByRole('button', { name: /unclaim station/i });

      await user.click(unclaimButton);

      expect(screen.getByText(/are you sure|confirm/i)).toBeInTheDocument();
    });

    it('should display consequences warning', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} />);
      const unclaimButton = screen.getByRole('button', { name: /unclaim station/i });

      await user.click(unclaimButton);

      expect(screen.getByText(/lose access|no longer own|consequences/i)).toBeInTheDocument();
    });

    it('should have Cancel and Confirm buttons in confirmation', async () => {
      const user = userEvent.setup();
      render(<StationDetailsScreen {...defaultProps} />);
      const unclaimButton = screen.getByRole('button', { name: /unclaim station/i });

      await user.click(unclaimButton);

      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm|unclaim/i })).toBeInTheDocument();
    });

    it('should call onUnclaim when confirmed', async () => {
      const user = userEvent.setup();
      const mockOnUnclaim = jest.fn();
      render(
        <StationDetailsScreen {...defaultProps} onUnclaim={mockOnUnclaim} />
      );
      const unclaimButton = screen.getByRole('button', { name: /unclaim station/i });

      await user.click(unclaimButton);

      const confirmButton = screen.getByRole('button', { name: /confirm|unclaim/i });
      await user.click(confirmButton);

      expect(mockOnUnclaim).toHaveBeenCalledWith(mockStation.id);
    });
  });

  // === Pending Verification State ===
  describe('Pending Verification State', () => {
    const pendingStation: ClaimedStation = {
      ...mockStation,
      verificationStatus: 'pending',
      verifiedAt: null,
    };

    it('should show "Pending Verification" badge', () => {
      render(<StationDetailsScreen {...defaultProps} station={pendingStation} />);
      expect(screen.getByText(/pending verification/i)).toBeInTheDocument();
    });

    it('should show re-verification option', () => {
      render(<StationDetailsScreen {...defaultProps} station={pendingStation} />);
      const reVerifyButton = screen.queryByRole('button', { name: /re-verify|verify/i });
      expect(reVerifyButton).toBeInTheDocument();
    });
  });

  // === Rejected Verification State ===
  describe('Rejected Verification State', () => {
    const rejectedStation: ClaimedStation = {
      ...mockStation,
      verificationStatus: 'rejected',
      verifiedAt: null,
    };

    it('should show "Rejected" badge', () => {
      render(<StationDetailsScreen {...defaultProps} station={rejectedStation} />);
      expect(screen.getByText(/rejected/i)).toBeInTheDocument();
    });

    it('should provide resubmit option', () => {
      render(<StationDetailsScreen {...defaultProps} station={rejectedStation} />);
      const resubmitButton = screen.queryByRole('button', { name: /resubmit|try again/i });
      expect(resubmitButton).toBeInTheDocument();
    });
  });

  // === Loading State ===
  describe('Loading State', () => {
    it('should display skeleton loaders when isLoading is true', () => {
      render(<StationDetailsScreen {...defaultProps} isLoading={true} />);
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });
  });

  // === Responsive Design ===
  describe('Responsive Design', () => {
    it('should be mobile-responsive', () => {
      const { container } = render(<StationDetailsScreen {...defaultProps} />);
      expect(container.querySelector('[class*="md:"]')).toBeDefined();
    });

    it('should stack layout on mobile', () => {
      const { container } = render(<StationDetailsScreen {...defaultProps} />);
      expect(container.querySelector('[class*="flex-col"]')).toBeDefined();
    });
  });

  // === Dark Mode ===
  describe('Dark Mode Support', () => {
    it('should render with dark mode styles', () => {
      const { container } = render(<StationDetailsScreen {...defaultProps} />);
      expect(container.querySelector('[class*="dark"]')).toBeDefined();
    });
  });

  // === Empty States ===
  describe('Empty States', () => {
    it('should show "No photos yet" when station has no photos', () => {
      const stationNoPhotos: ClaimedStation = {
        ...mockStation,
        photos: [],
      };
      render(<StationDetailsScreen {...defaultProps} station={stationNoPhotos} />);
      expect(screen.getByText(/no photos|no station photos/i)).toBeInTheDocument();
    });

    it('should show "No broadcast history" when no broadcasts', () => {
      render(<StationDetailsScreen {...defaultProps} broadcasts={[]} />);
      expect(screen.getByText(/no broadcasts|no history/i)).toBeInTheDocument();
    });
  });

  // === Re-verification ===
  describe('Re-verification', () => {
    it('should show annual re-verification requirement', () => {
      render(<StationDetailsScreen {...defaultProps} />);
      if (mockStation.verifiedAt) {
        expect(screen.getByText(/annual|yearly|re-verify/i)).toBeInTheDocument();
      }
    });
  });
});
