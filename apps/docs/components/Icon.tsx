'use client'

import BunIcon from '@iconify-react/material-icon-theme/bun'
import NextraIcon from '@iconify-react/simple-icons/nextra'
import WxtIcon from '@iconify-react/material-icon-theme/wxt'
import ElysiaDarkIcon from '@iconify-react/skill-icons/elysia-dark'
import JavascriptIcon from '@iconify-react/skill-icons/javascript'
import TypescriptIcon from '@iconify-react/skill-icons/typescript'
import GithubIcon from '@iconify-react/mdi/github';
import LogoutIcon from '@iconify-react/mdi/logout';

// we have to make a custom icon wrapper as iconify uses <script> which is not supported in nextra mdx

export function Icon({ name }: { name: string }) {
  switch (name) {
    case 'bun':
      return <BunIcon suppressHydrationWarning />
    case 'nextra':
      return <NextraIcon suppressHydrationWarning />
    case 'wxt':
      return <WxtIcon suppressHydrationWarning />
    case 'elysiajs':
      return <ElysiaDarkIcon suppressHydrationWarning />
    case 'javascript':
      return <JavascriptIcon suppressHydrationWarning />
    case 'typescript':
      return <TypescriptIcon suppressHydrationWarning />
    case 'github':
      return <GithubIcon suppressHydrationWarning />
    case 'logout':
      return <LogoutIcon suppressHydrationWarning />
    default:
      return null
  }
}
