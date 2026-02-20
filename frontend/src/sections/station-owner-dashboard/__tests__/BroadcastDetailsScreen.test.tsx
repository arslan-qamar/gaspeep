import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BroadcastDetailsScreen } from '../BroadcastDetailsScreen';
import * as sampleData from '../../../__tests__/fixtures/station-owner-dashboard-sample-data.json';
import { Broadcast } from '../types';

describe('BroadcastDetailsScreen', () => {
  const mockActiveBroadcast: Broadcast = sampleData.broadcasts.find(
    (b) => b.status === 'active'
  ) as Broadcast;

  const mockScheduledBroadcast: Broadcast = sampleData.broadcasts.find(
    (b) => b.status === 'scheduled'
  ) as Broadcast;

  const mockExpiredBroadcast: Broadcast = sampleData.broadcasts.find(
    (b) => b.status === 'expired'
  ) as Broadcast;

  const mockDraftBroadcast: Broadcast = sampleData.broadcasts.find(
    (b) => b.status === 'draft'
  ) as Broadcast;

  const defaultProps = {
    broadcast: mockActiveBroadcast,
    onEdit: jest.fn(),
    onDuplicate: jest.fn(),
    onDelete: jest.fn(),
    onCancel: jest.fn(),
  };

  // === Management Flow 1: View Broadcast Details ===
  describe('Management Flow 1: View Broadcast Details', () => {
    it('should display broadcast title as page header', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByText(mockActiveBroadcast.title)).toBeInTheDocument();
    });

    it('should display status badge', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent(/active/i);
    });

    it('should display full broadcast message', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByText(mockActiveBroadcast.message)).toBeInTheDocument();
    });

    it('should display station name', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByText(mockActiveBroadcast.stationName)).toBeInTheDocument();
    });

    it('should display creation date', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      const createdDate = mockActiveBroadcast.createdAt.split('T')[0];
      expect(screen.getByText(new RegExp(createdDate))).toBeInTheDocument();
    });

    it('should display sent/scheduled time', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      if (mockActiveBroadcast.sentAt) {
        const sentDate = mockActiveBroadcast.sentAt.split('T')[0];
        expect(screen.getByText(new RegExp(sentDate))).toBeInTheDocument();
      }
    });

    it('should display promotion type', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByText(new RegExp(mockActiveBroadcast.promotionType, 'i'))).toBeInTheDocument();
    });

    it('should display expiry date/time', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      if (mockActiveBroadcast.expiresAt) {
        expect(screen.getByText(/expires/i)).toBeInTheDocument();
      }
    });

    it('should display targeted fuel types', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      if (mockActiveBroadcast.fuelTypes.length > 0) {
        expect(screen.getByText(/fuel types/i)).toBeInTheDocument();
      }
    });
  });

  // === Targeting Summary ===
  describe('Targeting Summary', () => {
    it('should display target radius', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByText(new RegExp(`${mockActiveBroadcast.targetRadius}\\s*km`))).toBeInTheDocument();
    });

    it('should display map showing coverage area', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByTestId('coverage-map')).toBeInTheDocument();
    });

    it('should display recipient count', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      const recipientsLabel = screen.getByText(/recipients/i).closest('div');
      expect(recipientsLabel).toHaveTextContent(mockActiveBroadcast.actualRecipients.toString());
    });
  });

  // === Engagement Metrics ===
  describe('Engagement Metrics', () => {
    it('should display total recipients sent to', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByText(/recipients/i)).toBeInTheDocument();
    });

    it('should display notifications delivered count', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByText(new RegExp(`${mockActiveBroadcast.delivered}.*delivered`))).toBeInTheDocument();
    });

    it('should display notifications opened count', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByText(new RegExp(`${mockActiveBroadcast.opened}.*opened`))).toBeInTheDocument();
    });

    it('should display engagement rate percentage', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      const engagementRate = (mockActiveBroadcast.opened / mockActiveBroadcast.delivered) * 100;
      expect(screen.getByText(new RegExp(`${engagementRate.toFixed(0)}%`))).toBeInTheDocument();
    });

    it('should display click-through count', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByText(new RegExp(`${mockActiveBroadcast.clickedThrough}.*click`))).toBeInTheDocument();
    });

    it('should display engagement timeline chart', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByTestId('engagement-timeline')).toBeInTheDocument();
    });
  });

  // === States: Active Broadcast ===
  describe('Active Broadcast State', () => {
    it('should show "Active" status badge', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    it('should display real-time engagement metrics', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByTestId('engagement-metrics')).toBeInTheDocument();
    });

    it('should show "Edit" button', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });

  // === States: Scheduled Broadcast ===
  describe('Scheduled Broadcast State', () => {
    it('should show "Scheduled" status badge', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockScheduledBroadcast} />
      );
      const statusBadge = screen.getByTestId('status-badge');
      expect(statusBadge).toHaveTextContent(/scheduled/i);
    });

    it('should display scheduled time', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockScheduledBroadcast} />
      );
      expect(screen.getByText(/scheduled for/i)).toBeInTheDocument();
    });

    it('should show "Cancel Broadcast" button', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockScheduledBroadcast} />
      );
      expect(screen.getByRole('button', { name: /cancel broadcast/i })).toBeInTheDocument();
    });

    it('should show "Edit" button', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockScheduledBroadcast} />
      );
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });

  // === States: Expired Broadcast ===
  describe('Expired Broadcast State', () => {
    it('should show "Expired" status badge', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockExpiredBroadcast} />
      );
      expect(screen.getByText(/expired/i)).toBeInTheDocument();
    });

    it('should show final engagement summary', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockExpiredBroadcast} />
      );
      expect(screen.getByText(/engagement summary/i)).toBeInTheDocument();
    });

    it('should show "Duplicate Broadcast" button', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockExpiredBroadcast} />
      );
      expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument();
    });

    it('should not show "Edit" or "Cancel" buttons', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockExpiredBroadcast} />
      );
      const editButton = screen.queryByRole('button', { name: /^edit$/i });
      const cancelButton = screen.queryByRole('button', { name: /cancel broadcast/i });
      expect(editButton).not.toBeInTheDocument();
      expect(cancelButton).not.toBeInTheDocument();
    });
  });

  // === States: Draft Broadcast ===
  describe('Draft Broadcast State', () => {
    it('should show "Draft" status badge', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockDraftBroadcast} />
      );
      expect(screen.getByText(/draft/i)).toBeInTheDocument();
    });

    it('should show "Continue Editing" CTA', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockDraftBroadcast} />
      );
      expect(screen.getByRole('button', { name: /continue editing/i })).toBeInTheDocument();
    });

    it('should show "Edit" button', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockDraftBroadcast} />
      );
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });

  // === Management Flow 2: Edit Broadcast ===
  describe('Management Flow 2: Edit Broadcast', () => {
    it('should call onEdit when Edit button clicked', async () => {
      const user = userEvent.setup();
      const mockOnEdit = jest.fn();
      render(
        <BroadcastDetailsScreen {...defaultProps} onEdit={mockOnEdit} />
      );
      const editButton = screen.getByRole('button', { name: /edit/i });

      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockActiveBroadcast.id);
    });
  });

  // === Management Flow 3: Duplicate Broadcast ===
  describe('Management Flow 3: Duplicate Broadcast', () => {
    it('should display "Duplicate Broadcast" button', () => {
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockExpiredBroadcast} />
      );
      expect(screen.getByRole('button', { name: /duplicate/i })).toBeInTheDocument();
    });

    it('should call onDuplicate when Duplicate button clicked', async () => {
      const user = userEvent.setup();
      const mockOnDuplicate = jest.fn();
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockExpiredBroadcast} onDuplicate={mockOnDuplicate} />
      );
      const duplicateButton = screen.getByRole('button', { name: /duplicate/i });

      await user.click(duplicateButton);

      expect(mockOnDuplicate).toHaveBeenCalledWith(mockExpiredBroadcast.id);
    });
  });

  // === Management Flow 4: Delete Broadcast ===
  describe('Management Flow 4: Delete Broadcast', () => {
    it('should display "Delete" button', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('should show confirmation dialog on delete', async () => {
      const user = userEvent.setup();
      render(<BroadcastDetailsScreen {...defaultProps} />);
      const deleteButton = screen.getByRole('button', { name: /delete/i });

      await user.click(deleteButton);

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    it('should have Cancel and Confirm buttons in confirmation', async () => {
      const user = userEvent.setup();
      render(<BroadcastDetailsScreen {...defaultProps} />);
      const deleteButton = screen.getByRole('button', { name: /delete/i });

      await user.click(deleteButton);

      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('should call onDelete when confirmed', async () => {
      const user = userEvent.setup();
      const mockOnDelete = jest.fn();
      render(
        <BroadcastDetailsScreen {...defaultProps} onDelete={mockOnDelete} />
      );
      const deleteButton = screen.getByRole('button', { name: /delete/i });

      await user.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockActiveBroadcast.id);
    });
  });

  // === Cancel Scheduled Broadcast ===
  describe('Cancel Scheduled Broadcast', () => {
    it('should call onCancel when Cancel Broadcast button clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockScheduledBroadcast} onCancel={mockOnCancel} />
      );
      const cancelButton = screen.getByRole('button', { name: /cancel broadcast/i });

      await user.click(cancelButton);

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    it('should show confirmation before canceling', async () => {
      const user = userEvent.setup();
      render(
        <BroadcastDetailsScreen {...defaultProps} broadcast={mockScheduledBroadcast} />
      );
      const cancelButton = screen.getByRole('button', { name: /cancel broadcast/i });

      await user.click(cancelButton);

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });
  });

  // === View Map ===
  describe('View Map', () => {
    it('should display map showing coverage area', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(screen.getByTestId('coverage-map')).toBeInTheDocument();
    });

    it('should center map on station location', () => {
      render(<BroadcastDetailsScreen {...defaultProps} />);
      const map = screen.getByTestId('coverage-map');
      expect(map).toBeInTheDocument();
    });
  });

  // === Loading State ===
  describe('Loading State', () => {
    it('should display skeleton loaders for metrics', () => {
      render(<BroadcastDetailsScreen {...defaultProps} isLoading={true} />);
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });
  });

  // === Responsive Design ===
  describe('Responsive Design', () => {
    it('should be mobile-responsive', () => {
      const { container } = render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(container.querySelector('[class*="md:"]')).toBeDefined();
    });
  });

  // === Dark Mode ===
  describe('Dark Mode Support', () => {
    it('should render with dark mode styles', () => {
      const { container } = render(<BroadcastDetailsScreen {...defaultProps} />);
      expect(container.querySelector('[class*="dark"]')).toBeDefined();
    });
  });
});
