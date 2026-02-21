import { authService } from '../authService'
import { apiClient } from '../../lib/api'

jest.mock('../../lib/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

describe('authService', () => {
  beforeEach(() => {
    ;(apiClient.post as jest.Mock).mockReset()
    ;(apiClient.get as jest.Mock).mockReset()
  })

  it('signup posts expected payload and returns auth response', async () => {
    const response = {
      token: 'token-1',
      user: {
        id: 'u1',
        email: 'a@example.com',
        displayName: 'Alice',
        tier: 'free' as const,
        createdAt: '2026-01-01T00:00:00Z',
      },
    }
    ;(apiClient.post as jest.Mock).mockResolvedValue({ data: response })

    const result = await authService.signup('a@example.com', 'secret', 'Alice')

    expect(apiClient.post).toHaveBeenCalledWith('/auth/signup', {
      email: 'a@example.com',
      password: 'secret',
      displayName: 'Alice',
    })
    expect(result).toEqual(response)
  })

  it('signin posts expected payload and returns auth response', async () => {
    const response = {
      token: 'token-2',
      user: {
        id: 'u2',
        email: 'b@example.com',
        displayName: 'Bob',
        tier: 'premium' as const,
        isStationOwner: true,
        createdAt: '2026-01-02T00:00:00Z',
      },
    }
    ;(apiClient.post as jest.Mock).mockResolvedValue({ data: response })

    const result = await authService.signin('b@example.com', 'pw123')

    expect(apiClient.post).toHaveBeenCalledWith('/auth/signin', {
      email: 'b@example.com',
      password: 'pw123',
    })
    expect(result).toEqual(response)
  })

  it('getCurrentUser fetches current profile', async () => {
    const user = {
      id: 'u3',
      email: 'c@example.com',
      displayName: 'Carol',
      tier: 'free' as const,
      createdAt: '2026-01-03T00:00:00Z',
    }
    ;(apiClient.get as jest.Mock).mockResolvedValue({ data: user })

    const result = await authService.getCurrentUser()

    expect(apiClient.get).toHaveBeenCalledWith('/auth/me')
    expect(result).toEqual(user)
  })

  it('logout triggers logout endpoint call', () => {
    ;(apiClient.post as jest.Mock).mockResolvedValue({ data: {} })

    authService.logout()

    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout')
  })
})
