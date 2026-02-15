import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OAuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      // Backend may have redirected with a token; prefer cookie-based session.
      if (window.opener && typeof window.opener.postMessage === 'function') {
        window.opener.postMessage({ type: 'oauth_success' }, window.location.origin)
        window.close()
        return
      }
      navigate('/map')
    } else {
      // Missing token - navigate to signin
      navigate('/auth/signin')
    }
  }, [navigate])

  return <div className="p-6">Signing you in…</div>
}
