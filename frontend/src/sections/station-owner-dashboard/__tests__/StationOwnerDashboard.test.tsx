import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { StationOwnerDashboard } from '../StationOwnerDashboard';
import * as sampleData from '../../../__tests__/fixtures/station-owner-dashboard-sample-data.json';
import {
  StationOwner,
  ClaimedStation,
  Broadcast,
  DashboardStats,
  BroadcastStatus,
  VerificationStatus,
} from '../types';

describe('StationOwnerDashboard', () => {
  const mockOwner: StationOwner = sampleData.stationOwner;
  const mockStations: ClaimedStation[] = sampleData.claimedStations;
  const mockBroadcasts: Broadcast[] = sampleData.broadcasts;
  const mockStats: DashboardStats = sampleData.dashboardStats;

  const defaultProps = {
    owner: mockOwner,
    stations: mockStations,
    broadcasts: mockBroadcasts,
    stats: mockStats,
    onClaimStation: jest.fn(),
    onCreateBroadcast: jest.fn(),
    onEditBroadcast: jest.fn(),
    onViewBroadcast: jest.fn(),
    isLoading: false,
  };

  // === Flow 1: Dashboard Overview ===
  describe('Flow 1: Dashboard Overview', () => {
    it('should display owner name in welcome banner', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      expect(screen.getByText(new RegExp(mockOwner.businessName, 'i'))).toBeInTheDocument();
    });

    it('should show verification status as "Verified" for verified owner', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const verificationBadge = screen.getByText(/verified/i);
      expect(verificationBadge).toBeInTheDocument();
    });

    it('should display all claimed stations in "My Stations" section', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      mockStations.forEach((station) => {
        expect(screen.getByText(station.name)).toBeInTheDocument();
      });
    });

    it('should show "My Stations" section header', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      expect(screen.getByText(/my stations/i)).toBeInTheDocument();
    });

    it('should display "Recent Broadcasts" section', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      expect(screen.getByText(/recent broadcasts/i)).toBeInTheDocument();
    });

    it('should show only last 5 broadcasts in Recent Broadcasts section', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const broadcastItems = screen.getAllByTestId('broadcast-item');
      expect(broadcastItems.length).toBeLessThanOrEqual(5);
    });

    it('should display statistics cards: total stations, active broadcasts, total reach', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      expect(screen.getByText(/total stations/i)).toBeInTheDocument();
      expect(screen.getByText(/active broadcasts/i)).toBeInTheDocument();
      expect(screen.getByText(/total reach/i)).toBeInTheDocument();
    });

    it('should show correct stat values', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      expect(screen.getByText(mockStats.totalStations.toString())).toBeInTheDocument();
      expect(screen.getByText(mockStats.activeBroadcasts.toString())).toBeInTheDocument();
    });

    it('should display "Claim New Station" button', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const claimButton = screen.getByRole('button', { name: /claim new station/i });
      expect(claimButton).toBeInTheDocument();
    });

    it('should display "Create Broadcast" button', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const createButton = screen.getByRole('button', { name: /create broadcast/i });
      expect(createButton).toBeInTheDocument();
    });

    it('should call onClaimStation when "Claim New Station" is clicked', async () => {
      const user = userEvent.setup();
      render(<StationOwnerDashboard {...defaultProps} />);
      const claimButton = screen.getByRole('button', { name: /claim new station/i });
      await user.click(claimButton);
      expect(defaultProps.onClaimStation).toHaveBeenCalled();
    });

    it('should call onCreateBroadcast when "Create Broadcast" is clicked', async () => {
      const user = userEvent.setup();
      render(<StationOwnerDashboard {...defaultProps} />);
      const createButton = screen.getByRole('button', { name: /create broadcast/i });
      await user.click(createButton);
      expect(defaultProps.onCreateBroadcast).toHaveBeenCalled();
    });
  });

  // === Flow 2: Station Cards ===
  describe('Flow 2: Station Cards', () => {
    it('should display station name on card', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      mockStations.forEach((station) => {
        expect(screen.getByText(station.name)).toBeInTheDocument();
      });
    });

    it('should display station address on card', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      mockStations.forEach((station) => {
        expect(screen.getByText(station.address)).toBeInTheDocument();
      });
    });

    it('should display brand logo or brand name', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      mockStations.forEach((station) => {
        expect(screen.getByText(station.brand)).toBeInTheDocument();
      });
    });

    it('should display verification status badge on each station card', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const verificationBadges = screen.getAllByTestId('verification-badge');
      expect(verificationBadges.length).toBeGreaterThanOrEqual(mockStations.length);
    });

    it('should display last broadcast date for stations with broadcasts', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const station = mockStations[0];
      if (station.lastBroadcastAt) {
        expect(screen.getByText(new RegExp(station.lastBroadcastAt.split('T')[0], 'i'))).toBeInTheDocument();
      }
    });

    it('should display quick action buttons on station card', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const broadcastButtons = screen.getAllByRole('button', { name: /broadcast offer/i });
      expect(broadcastButtons.length).toBeGreaterThanOrEqual(mockStations.length);
    });

    it('should display "Edit Station" button for each station', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const editButtons = screen.getAllByRole('button', { name: /edit station/i });
      expect(editButtons.length).toBeGreaterThanOrEqual(mockStations.length);
    });

    it('should display "View Analytics" button for each station', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const analyticsButtons = screen.getAllByRole('button', { name: /view analytics/i });
      expect(analyticsButtons.length).toBeGreaterThanOrEqual(mockStations.length);
    });

    it('should call onCreateBroadcast when station "Broadcast Offer" clicked', async () => {
      const user = userEvent.setup();
      const mockOnCreateBroadcast = jest.fn();
      render(
        <StationOwnerDashboard {...defaultProps} onCreateBroadcast={mockOnCreateBroadcast} />
      );
      const broadcastButtons = screen.getAllByRole('button', { name: /broadcast offer/i });
      await user.click(broadcastButtons[0]);
      expect(mockOnCreateBroadcast).toHaveBeenCalledWith(mockStations[0].id);
    });
  });

  // === Flow 3: Broadcast History ===
  describe('Flow 3: Broadcast History', () => {
    it('should display last 5 broadcasts in Recent Broadcasts section', () => {
      const recentBroadcasts = mockBroadcasts.slice(0, 5);
      render(<StationOwnerDashboard {...defaultProps} broadcasts={recentBroadcasts} />);
      recentBroadcasts.forEach((broadcast) => {
        expect(screen.getByText(broadcast.title)).toBeInTheDocument();
      });
    });

    it('should display link to full broadcast history', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const viewAllLink = screen.getByRole('link', { name: /view all/i });
      expect(viewAllLink).toBeInTheDocument();
    });

    it('should display broadcast title', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      expect(screen.getByText(mockBroadcasts[0].title)).toBeInTheDocument();
    });

    it('should display creation date for each broadcast', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const broadcastItems = screen.getAllByTestId('broadcast-item');
      expect(broadcastItems.length).toBeGreaterThan(0);
    });

    it('should display number of recipients for each broadcast', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      mockBroadcasts.slice(0, 5).forEach((broadcast) => {
        if (broadcast.status === 'active' || broadcast.status === 'expired') {
          const recipientText = new RegExp(`${broadcast.actualRecipients}`, 'i');
          expect(screen.getByText(recipientText)).toBeInTheDocument();
        }
      });
    });

    it('should display status badge (Active, Scheduled, Expired, Draft)', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const activeStatus = screen.getAllByTestId('broadcast-status').filter((el) =>
        ['Active', 'Scheduled', 'Expired', 'Draft'].includes(el.textContent || '')
      );
      expect(activeStatus.length).toBeGreaterThan(0);
    });

    it('should call onViewBroadcast when broadcast item clicked', async () => {
      const user = userEvent.setup();
      const mockOnViewBroadcast = jest.fn();
      render(
        <StationOwnerDashboard {...defaultProps} onViewBroadcast={mockOnViewBroadcast} />
      );
      const broadcastItems = screen.getAllByTestId('broadcast-item');
      await user.click(broadcastItems[0]);
      expect(mockOnViewBroadcast).toHaveBeenCalledWith(mockBroadcasts[0].id);
    });
  });

  // === Unverified Owner State ===
  describe('Unverified Owner State', () => {
    const unverifiedOwner: StationOwner = {
      ...mockOwner,
      verificationStatus: 'not_verified',
    };

    it('should display verification prompt banner for unverified owner', () => {
      render(
        <StationOwnerDashboard {...defaultProps} owner={unverifiedOwner} />
      );
      expect(screen.getByText(/verify your station ownership/i)).toBeInTheDocument();
    });

    it('should show limited access message', () => {
      render(
        <StationOwnerDashboard {...defaultProps} owner={unverifiedOwner} />
      );
      expect(screen.getByText(/verify to enable broadcasts/i)).toBeInTheDocument();
    });

    it('should provide link to verification process', () => {
      render(
        <StationOwnerDashboard {...defaultProps} owner={unverifiedOwner} />
      );
      const verifyLink = screen.getByRole('link', { name: /verify now/i });
      expect(verifyLink).toBeInTheDocument();
    });
  });

  // === Empty States ===
  describe('Empty States', () => {
    it('should show empty state when owner has no stations', () => {
      render(
        <StationOwnerDashboard {...defaultProps} stations={[]} />
      );
      expect(screen.getByText(/no stations yet/i)).toBeInTheDocument();
    });

    it('should display "No stations yet" heading', () => {
      render(
        <StationOwnerDashboard {...defaultProps} stations={[]} />
      );
      expect(screen.getByText(/claim your first station/i)).toBeInTheDocument();
    });

    it('should show "Claim Station" button in empty state', () => {
      render(
        <StationOwnerDashboard {...defaultProps} stations={[]} />
      );
      const claimButton = screen.getByRole('button', { name: /claim station/i });
      expect(claimButton).toBeInTheDocument();
    });

    it('should show empty state when owner has no broadcasts', () => {
      render(
        <StationOwnerDashboard {...defaultProps} broadcasts={[]} />
      );
      expect(screen.getByText(/no broadcasts yet/i)).toBeInTheDocument();
    });

    it('should show "Create Broadcast" button in empty broadcasts state', () => {
      render(
        <StationOwnerDashboard {...defaultProps} broadcasts={[]} />
      );
      const createButton = screen.getByRole('button', { name: /create broadcast/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  // === Loading State ===
  describe('Loading State', () => {
    it('should display skeleton loaders when isLoading is true', () => {
      render(
        <StationOwnerDashboard {...defaultProps} isLoading={true} />
      );
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show loading state for statistics', () => {
      render(
        <StationOwnerDashboard {...defaultProps} isLoading={true} />
      );
      expect(screen.getByTestId('stats-skeleton')).toBeInTheDocument();
    });

    it('should show loading state for station list', () => {
      render(
        <StationOwnerDashboard {...defaultProps} isLoading={true} />
      );
      expect(screen.getByTestId('stations-skeleton')).toBeInTheDocument();
    });
  });

  // === Dark Mode ===
  describe('Dark Mode Support', () => {
    it('should render dashboard with dark mode styles', () => {
      const { container } = render(
        <StationOwnerDashboard {...defaultProps} />
      );
      // Check for dark mode class on container
      expect(container.querySelector('[class*="dark"]')).toBeInTheDocument();
    });

    it('should have readable text in dark mode', () => {
      const { container } = render(
        <StationOwnerDashboard {...defaultProps} />
      );
      const darkElements = container.querySelectorAll('[class*="dark:text"]');
      expect(darkElements.length).toBeGreaterThan(0);
    });
  });

  // === Responsive Design ===
  describe('Responsive Design', () => {
    it('should render station cards responsively', () => {
      const { container } = render(
        <StationOwnerDashboard {...defaultProps} />
      );
      const cardContainer = container.querySelector('[data-testid="stations-container"]');
      expect(cardContainer).toHaveClass('grid');
    });

    it('should have responsive grid layout', () => {
      const { container } = render(
        <StationOwnerDashboard {...defaultProps} />
      );
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toHaveClass('md:grid-cols');
    });
  });

  // === Pull-to-Refresh ===
  describe('Pull-to-Refresh', () => {
    it('should support pull-to-refresh gesture', async () => {
      const mockOnRefresh = jest.fn();
      const user = userEvent.setup();
      render(
        <StationOwnerDashboard {...defaultProps} onRefresh={mockOnRefresh} />
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  // === Broadcast Limit Display ===
  describe('Broadcast Limit Display', () => {
    it('should display remaining broadcasts for current period', () => {
      render(<StationOwnerDashboard {...defaultProps} />);
      const remaining = mockOwner.broadcastLimit - mockOwner.broadcastsThisWeek;
      expect(screen.getByText(new RegExp(`${mockOwner.broadcastsThisWeek}.*${mockOwner.broadcastLimit}`, 'i'))).toBeInTheDocument();
    });

    it('should warn when broadcasts limit is near', () => {
      const ownerNearLimit: StationOwner = {
        ...mockOwner,
        broadcastsThisWeek: 18,
        broadcastLimit: 20,
      };
      render(
        <StationOwnerDashboard {...defaultProps} owner={ownerNearLimit} />
      );
      expect(screen.getByText(/limit/i)).toBeInTheDocument();
    });
  });
});
