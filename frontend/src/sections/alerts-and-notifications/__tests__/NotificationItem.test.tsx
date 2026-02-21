import { fireEvent, render, screen } from '@testing-library/react'
import { NotificationItem } from '../components/NotificationItem'
import type { Notification } from '../types'

function createAlertNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-alert-1',
    userId: 'user-1',
    type: 'alert',
    title: 'Price drop alert',
    message: 'Unleaded 91 is below your threshold',
    sentAt: new Date('2026-01-10T10:00:00Z').toISOString(),
    readAt: null,
    expiresAt: null,
    data: {
      type: 'alert',
      alertId: 'alert-1',
      fuelTypeId: '91',
      fuelTypeName: 'Unleaded 91',
      fuelTypeColor: '#22c55e',
      stationId: 'station-1',
      stationName: 'City Fuel',
      stationAddress: '100 Main St',
      stationLatitude: -33.8,
      stationLongitude: 151.2,
      price: 1.59,
      threshold: 1.7,
      currency: 'AUD',
      unit: 'L',
      distance: 2.45,
    },
    ...overrides,
  }
}

describe('NotificationItem', () => {
  it('marks unread alert as read and triggers action when row is clicked', () => {
    const onMarkAsRead = jest.fn()
    const onDelete = jest.fn()
    const onAction = jest.fn()

    const notification = createAlertNotification()

    const { container } = render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={onMarkAsRead}
        onDelete={onDelete}
        onAction={onAction}
      />
    )

    expect(screen.getByText('Price drop alert')).toBeInTheDocument()
    expect(screen.getByText('Unleaded 91')).toBeInTheDocument()
    expect(screen.getByText('2.5 km away')).toBeInTheDocument()

    fireEvent.click(container.firstChild as Element)

    expect(onMarkAsRead).toHaveBeenCalledWith('notif-alert-1')
    expect(onAction).toHaveBeenCalledWith(notification)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('triggers alert action button without bubbling to row click', () => {
    const onMarkAsRead = jest.fn()
    const onAction = jest.fn()

    render(
      <NotificationItem
        notification={createAlertNotification()}
        onMarkAsRead={onMarkAsRead}
        onDelete={jest.fn()}
        onAction={onAction}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'View on Map' }))

    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onMarkAsRead).not.toHaveBeenCalled()
  })

  it('renders broadcast details and opens directions link', () => {
    const onAction = jest.fn()
    const onMarkAsRead = jest.fn()
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

    const notification = createAlertNotification({
      id: 'notif-broadcast-1',
      type: 'broadcast',
      title: 'Station promotion',
      message: 'Promo',
      readAt: new Date('2026-01-10T10:05:00Z').toISOString(),
      data: {
        type: 'broadcast',
        broadcastId: 'broadcast-1',
        stationId: 'station-2',
        stationName: 'North Fuel',
        stationLogo: 'https://example.com/logo.png',
        stationAddress: '200 King St',
        stationLatitude: -33.9,
        stationLongitude: 151.1,
        promotionalMessage: 'Save 5c/L this weekend',
        validUntil: '2026-12-31T00:00:00Z',
        distance: 4.44,
      },
    })

    render(
      <NotificationItem
        notification={notification}
        onMarkAsRead={onMarkAsRead}
        onDelete={jest.fn()}
        onAction={onAction}
      />
    )

    expect(screen.getByText('North Fuel')).toBeInTheDocument()
    expect(screen.getByText('4.4 km away')).toBeInTheDocument()
    expect(screen.getByText('Save 5c/L this weekend')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'View Details' }))
    expect(onAction).toHaveBeenCalledWith(notification)

    fireEvent.click(screen.getByRole('button', { name: 'Directions' }))
    expect(openSpy).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=-33.9,151.1',
      '_blank'
    )

    expect(onMarkAsRead).not.toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it('renders system notification action label and handles delete click', () => {
    const onDelete = jest.fn()
    const onAction = jest.fn()

    render(
      <NotificationItem
        notification={createAlertNotification({
          id: 'notif-system-1',
          type: 'system',
          readAt: new Date('2026-01-10T10:05:00Z').toISOString(),
          message: 'Your account settings were updated',
          data: {
            type: 'system',
            category: 'account',
            actionLabel: 'Review settings',
            actionUrl: '/settings',
          },
        })}
        onMarkAsRead={jest.fn()}
        onDelete={onDelete}
        onAction={onAction}
      />
    )

    expect(screen.getByText('Your account settings were updated')).toBeInTheDocument()
    expect(screen.getByText('Review settings →')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete notification' }))

    expect(onDelete).toHaveBeenCalledWith('notif-system-1')
    expect(onAction).not.toHaveBeenCalled()
  })
})
