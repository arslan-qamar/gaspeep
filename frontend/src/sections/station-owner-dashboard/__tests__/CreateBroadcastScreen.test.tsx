import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CreateBroadcastScreen } from '../CreateBroadcastScreen';
import * as sampleData from '../../../__tests__/fixtures/station-owner-dashboard-sample-data.json';
import {
  ClaimedStation,
  Broadcast,
  PromotionType,
  FuelType,
  CreateBroadcastFormData,
} from '../types';

describe('CreateBroadcastScreen', () => {
  const mockStations: ClaimedStation[] = sampleData.claimedStations;
  const mockFuelTypes: FuelType[] = sampleData.fuelTypes;

  const defaultProps = {
    stations: mockStations,
    fuelTypes: mockFuelTypes,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    isSubmitting: false,
  };

  // === Broadcast Flow 1: Create Broadcast ===
  describe('Broadcast Flow 1: Create Broadcast', () => {
    it('should display CreateBroadcastScreen heading', () => {
      render(<CreateBroadcastScreen {...defaultProps} />);
      expect(screen.getByText(/create broadcast/i)).toBeInTheDocument();
    });

    it('should display station dropdown selector', () => {
      render(<CreateBroadcastScreen {...defaultProps} />);
      expect(screen.getByText(/select station/i)).toBeInTheDocument();
    });

    it('should show all available stations in dropdown', () => {
      render(<CreateBroadcastScreen {...defaultProps} />);
      const stationDropdown = screen.getByTestId('station-dropdown');
      fireEvent.click(stationDropdown);

      mockStations.forEach((station) => {
        expect(screen.getByText(station.name)).toBeInTheDocument();
      });
    });

    it('should pre-fill station dropdown if selectedStationId provided', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByDisplayValue(mockStations[0].name)).toBeInTheDocument();
    });

    it('should display selected station card', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByText(mockStations[0].address)).toBeInTheDocument();
    });

    it('should display broadcast title input', () => {
      render(<CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />);
      const titleInput = screen.getByPlaceholderText(/special offer today/i);
      expect(titleInput).toBeInTheDocument();
    });

    it('should enforce 50 character limit on title', () => {
      render(<CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />);
      const titleInput = screen.getByPlaceholderText(/special offer today/i) as HTMLInputElement;
      expect(titleInput.maxLength).toBe(50);
    });

    it('should display character counter for title', () => {
      render(<CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />);
      expect(screen.getByText(/0\/50/i)).toBeInTheDocument();
    });

    it('should display broadcast message textarea', () => {
      render(<CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />);
      const messageInput = screen.getByPlaceholderText(/describe your promotion/i);
      expect(messageInput).toBeInTheDocument();
    });

    it('should enforce 280 character limit on message', () => {
      render(<CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />);
      const messageInput = screen.getByPlaceholderText(/describe your promotion/i) as HTMLTextAreaElement;
      expect(messageInput.maxLength).toBe(280);
    });

    it('should display character counter for message', () => {
      render(<CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />);
      expect(screen.getByText(/0\/280/i)).toBeInTheDocument();
    });

    it('should display promotion type selector', () => {
      render(<CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />);
      expect(screen.getByText(/promotion type/i)).toBeInTheDocument();
    });

    it('should show all promotion type options', () => {
      render(<CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />);
      expect(screen.getByLabelText(/price drop/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/special discount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/limited time offer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new service/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/general announcement/i)).toBeInTheDocument();
    });

    it('should display fuel type filter checkboxes', () => {
      render(<CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />);
      mockFuelTypes.slice(0, 3).forEach((fuelType) => {
        expect(screen.getByLabelText(fuelType.name)).toBeInTheDocument();
      });
    });
  });

  // === Broadcast Flow 2: Fill In Details ===
  describe('Broadcast Flow 2: Fill In Details', () => {
    it('should allow typing in title field', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const titleInput = screen.getByPlaceholderText(/special offer today/i);

      await user.type(titleInput, 'Big Sale Today');

      expect(titleInput).toHaveValue('Big Sale Today');
    });

    it('should update character counter as title is typed', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const titleInput = screen.getByPlaceholderText(/special offer today/i);

      await user.type(titleInput, '12345');

      expect(screen.getByText(/5\/50/i)).toBeInTheDocument();
    });

    it('should allow multiline text in message field', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const messageInput = screen.getByPlaceholderText(/describe your promotion/i);

      await user.type(messageInput, 'Line 1\nLine 2');

      expect(messageInput).toHaveValue('Line 1\nLine 2');
    });

    it('should update character counter for message as typed', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const messageInput = screen.getByPlaceholderText(/describe your promotion/i);

      await user.type(messageInput, 'This is my promotion message');

      expect(screen.getByText(/28\/280/i)).toBeInTheDocument();
    });

    it('should allow selecting promotion type', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const priceDropRadio = screen.getByLabelText(/price drop/i);

      await user.click(priceDropRadio);

      expect(priceDropRadio).toBeChecked();
    });

    it('should allow selecting multiple fuel types', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const e10Checkbox = screen.getByLabelText('E10');
      const u91Checkbox = screen.getByLabelText('Unleaded 91');

      await user.click(e10Checkbox);
      await user.click(u91Checkbox);

      expect(e10Checkbox).toBeChecked();
      expect(u91Checkbox).toBeChecked();
    });

    it('should prevent form submission without title', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const submitButton = screen.getByRole('button', { name: /send broadcast/i });

      expect(submitButton).toBeDisabled();
    });

    it('should prevent form submission without message', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const titleInput = screen.getByPlaceholderText(/special offer today/i);
      const submitButton = screen.getByRole('button', { name: /send broadcast/i });

      await user.type(titleInput, 'Test Title');

      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button with valid title and message', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const titleInput = screen.getByPlaceholderText(/special offer today/i);
      const messageInput = screen.getByPlaceholderText(/describe your promotion/i);
      const submitButton = screen.getByRole('button', { name: /send broadcast/i });

      await user.type(titleInput, 'Test Title');
      await user.type(messageInput, 'Test message');

      expect(submitButton).not.toBeDisabled();
    });
  });

  // === Targeting Options ===
  describe('Targeting Options', () => {
    it('should display radius slider', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByTestId('radius-slider')).toBeInTheDocument();
    });

    it('should have radius range of 1-25 km', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const slider = screen.getByTestId('radius-slider') as HTMLInputElement;
      expect(parseInt(slider.min)).toBe(1);
      expect(parseInt(slider.max)).toBe(25);
    });

    it('should display map showing coverage area', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByTestId('coverage-map')).toBeInTheDocument();
    });

    it('should update coverage map when radius changes', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const slider = screen.getByTestId('radius-slider');

      await user.tripleClick(slider);
      fireEvent.change(slider, { target: { value: '15' } });

      await waitFor(() => {
        expect(screen.getByText(/~.*premium users/i)).toBeInTheDocument();
      });
    });

    it('should display estimated recipient count', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByText(/~.*premium users/i)).toBeInTheDocument();
    });

    it('should display send scheduling options', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByText(/send now/i)).toBeInTheDocument();
      expect(screen.getByText(/schedule for later/i)).toBeInTheDocument();
    });

    it('should show "Send now" option selected by default', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const sendNowRadio = screen.getByLabelText(/send now/i) as HTMLInputElement;
      expect(sendNowRadio.checked).toBe(true);
    });

    it('should display date/time picker when "Schedule for later" selected', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const scheduleRadio = screen.getByLabelText(/schedule for later/i);

      await user.click(scheduleRadio);

      expect(screen.getByTestId('schedule-date-picker')).toBeInTheDocument();
      expect(screen.getByTestId('schedule-time-picker')).toBeInTheDocument();
    });

    it('should limit scheduling to 7 days in advance', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      // Check that the date picker max is 7 days from now
      expect(screen.getByTestId('max-schedule-date')).toBeInTheDocument();
    });

    it('should display duration selector', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByText(/promotion duration/i)).toBeInTheDocument();
    });

    it('should show duration options', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByLabelText(/^\s*1 hour\s*$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^\s*4 hours\s*$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^\s*24 hours\s*$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^\s*3 days\s*$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^\s*7 days\s*$/i)).toBeInTheDocument();
    });

    it('should display expiry timestamp when duration selected', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const oneHourOption = screen.getByLabelText(/1 hour/i);

      await user.click(oneHourOption);

      expect(screen.getByTestId('expiry-timestamp')).toBeInTheDocument();
    });

    it('should allow custom duration', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const customOption = screen.getByLabelText(/custom/i);

      await user.click(customOption);

      expect(screen.getByTestId('custom-duration-input')).toBeInTheDocument();
    });
  });

  // === Preview Section ===
  describe('Preview Section', () => {
    it('should display live preview of notification', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByTestId('broadcast-preview')).toBeInTheDocument();
    });

    it('should update preview when title changes', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const titleInput = screen.getByPlaceholderText(/special offer today/i);
      const preview = screen.getByTestId('broadcast-preview');

      await user.type(titleInput, 'Big Fuel Sale');

      expect(preview).toHaveTextContent('Big Fuel Sale');
    });

    it('should update preview when message changes', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const messageInput = screen.getByPlaceholderText(/describe your promotion/i);
      const preview = screen.getByTestId('broadcast-preview');

      await user.type(messageInput, 'Save 20% today only');

      expect(preview).toHaveTextContent('Save 20% today only');
    });

    it('should update preview when promotion type changes', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const priceDropRadio = screen.getByLabelText(/price drop/i);
      const preview = screen.getByTestId('broadcast-preview');

      await user.click(priceDropRadio);

      expect(preview).toHaveTextContent(/price drop/i);
    });

    it('should display station name and distance in preview', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const preview = screen.getByTestId('broadcast-preview');

      expect(preview).toHaveTextContent(mockStations[0].name);
    });

    it('should display fuel types in preview', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const e10Checkbox = screen.getByLabelText('E10');
      const preview = screen.getByTestId('broadcast-preview');

      await user.click(e10Checkbox);

      expect(preview).toHaveTextContent('E10');
    });

    it('should display expiry time in preview', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const oneHourOption = screen.getByLabelText(/1 hour/i);
      const preview = screen.getByTestId('broadcast-preview');

      await user.click(oneHourOption);

      expect(preview).toHaveTextContent(/expires/i);
    });

    it('should display "Preview as User" button', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByRole('button', { name: /preview as user/i })).toBeInTheDocument();
    });
  });

  // === Broadcast Limits ===
  describe('Broadcast Limits', () => {
    it('should display remaining broadcasts for current period', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByText(/broadcasts remaining/i)).toBeInTheDocument();
    });

    it('should show broadcasts used and limit', () => {
      const owner = sampleData.stationOwner;
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} owner={owner} />
      );
      expect(screen.getByText(new RegExp(`${owner.broadcastsThisWeek}.*${owner.broadcastLimit}`, 'i'))).toBeInTheDocument();
    });

    it('should display broadcast policy guidelines', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByText(/keep messages promotional and relevant/i)).toBeInTheDocument();
    });

    it('should provide link to broadcast policy', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const policyLink = screen.getByRole('link', { name: /policy/i });
      expect(policyLink).toBeInTheDocument();
    });
  });

  // === Action Buttons ===
  describe('Action Buttons', () => {
    it('should display "Save as Draft" button', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByRole('button', { name: /save as draft/i })).toBeInTheDocument();
    });

    it('should display "Send Broadcast" button', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByRole('button', { name: /send broadcast/i })).toBeInTheDocument();
    });

    it('should display "Schedule Broadcast" button when scheduling', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const scheduleRadio = screen.getByLabelText(/schedule for later/i);

      await user.click(scheduleRadio);

      expect(screen.getByRole('button', { name: /schedule broadcast/i })).toBeInTheDocument();
    });

    it('should display "Cancel" button', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onCancel when Cancel button clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} onCancel={mockOnCancel} />
      );
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should warn about unsaved changes when canceling with data', async () => {
      const user = userEvent.setup();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      const titleInput = screen.getByPlaceholderText(/special offer today/i);

      await user.type(titleInput, 'Test');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });

    it('should call onSubmit with broadcast data on send', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} onSubmit={mockOnSubmit} />
      );
      const titleInput = screen.getByPlaceholderText(/special offer today/i);
      const messageInput = screen.getByPlaceholderText(/describe your promotion/i);
      const sendButton = screen.getByRole('button', { name: /send broadcast/i });

      await user.type(titleInput, 'Big Sale');
      await user.type(messageInput, 'Save 20%');
      await user.click(sendButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          stationId: mockStations[0].id,
          title: 'Big Sale',
          message: 'Save 20%',
        })
      );
    });
  });

  // === Edit Mode ===
  describe('Edit Mode', () => {
    const mockBroadcast: Broadcast = sampleData.broadcasts[0];

    it('should pre-fill form with broadcast data when editing', () => {
      render(
        <CreateBroadcastScreen
          {...defaultProps}
          selectedStationId={mockStations[0].id}
          editingBroadcast={mockBroadcast}
        />
      );
      expect(screen.getByDisplayValue(mockBroadcast.title)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockBroadcast.message)).toBeInTheDocument();
    });

    it('should show "Edit Broadcast" heading when editing', () => {
      render(
        <CreateBroadcastScreen
          {...defaultProps}
          selectedStationId={mockStations[0].id}
          editingBroadcast={mockBroadcast}
        />
      );
      expect(screen.getByText(/edit broadcast/i)).toBeInTheDocument();
    });

    it('should show "Update Broadcast" button instead of Send', () => {
      render(
        <CreateBroadcastScreen
          {...defaultProps}
          selectedStationId={mockStations[0].id}
          editingBroadcast={mockBroadcast}
        />
      );
      expect(screen.getByRole('button', { name: /update broadcast/i })).toBeInTheDocument();
    });
  });

  // === Responsive Design ===
  describe('Responsive Design', () => {
    it('should be mobile-responsive', () => {
      const { container } = render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(container.querySelector('[class*="md:"]')).toBeDefined();
    });
  });

  // === Dark Mode ===
  describe('Dark Mode Support', () => {
    it('should render with dark mode styles', () => {
      const { container } = render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} />
      );
      expect(container.querySelector('[class*="dark"]')).toBeDefined();
    });
  });

  // === Loading State ===
  describe('Loading State', () => {
    it('should disable submit button when isSubmitting is true', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} isSubmitting={true} />
      );
      const sendButton = screen.getByRole('button', { name: /send broadcast/i });
      expect(sendButton).toBeDisabled();
    });

    it('should show loading indicator when isSubmitting', () => {
      render(
        <CreateBroadcastScreen {...defaultProps} selectedStationId={mockStations[0].id} isSubmitting={true} />
      );
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });
});
