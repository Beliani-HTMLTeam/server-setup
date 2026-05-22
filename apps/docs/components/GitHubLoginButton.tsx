'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { authClient } from '../app/lib/auth-client'
import { Icon } from './Icon'
import styles from '../app/page.module.scss'

export function GitHubLoginButton() {
  const searchParams = useSearchParams()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const redirectTarget = searchParams.get('redirect') || '/docs'

  const callbackURL = (target: string | URL) =>
    new URL(target, window.location.origin).toString()

  const handleLogin = async () => {
    setIsSigningIn(true)
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: callbackURL(redirectTarget),
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isSigningIn}
      className={[styles.loginButton, isSigningIn && styles.bye].join(' ')}
    >
      <Icon name="github" />
      <span>Continue with GitHub</span>
    </button>
  )
}
