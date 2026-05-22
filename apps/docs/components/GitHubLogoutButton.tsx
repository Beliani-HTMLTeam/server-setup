'use client'

import { useState } from 'react'
import { authClient } from '../app/lib/auth-client'
import { Icon } from './Icon'
import styles from '../app/page.module.scss'

export function GitHubLogoutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleLogout = async () => {
    setIsSigningOut(true)
    try {
      await authClient.signOut()
      window.location.href = '/'
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isSigningOut}
      className={styles.loginButton}
    >
      <Icon name="logout" />
      <span>Sign out</span>
    </button>
  )
}