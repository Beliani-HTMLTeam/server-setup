'use client'

import type { ComponentType } from 'react'

import BunIcon from '@iconify-react/material-icon-theme/bun'
import NextraIcon from '@iconify-react/simple-icons/nextra'
import WxtIcon from '@iconify-react/material-icon-theme/wxt'
import ElysiaDarkIcon from '@iconify-react/skill-icons/elysia-dark'
import JavascriptIcon from '@iconify-react/skill-icons/javascript'
import TypescriptIcon from '@iconify-react/skill-icons/typescript'
import GithubIcon from '@iconify-react/mdi/github'
import LogoutIcon from '@iconify-react/mdi/logout'
import FigmaIcon from '@iconify-react/material-icon-theme/figma'
import GoogledocsIcon from '@iconify-react/simple-icons/googledocs'

type IconComponent = ComponentType<any>

const icons = {
  bun: BunIcon,
  nextra: NextraIcon,
  wxt: WxtIcon,
  elysiajs: ElysiaDarkIcon,
  javascript: JavascriptIcon,
  typescript: TypescriptIcon,
  github: GithubIcon,
  logout: LogoutIcon,
  figma: FigmaIcon,
  gdocs: GoogledocsIcon,
} satisfies Record<string, IconComponent>

export type IconName = keyof typeof icons

interface IconProps {
  name: IconName
  inline?: boolean
  size?: string
  className?: string
}

export function Icon({ name, size = '20', className }: IconProps) {
  const Component = icons[name]

  if (!Component) return null

  return (
    <Component
      suppressHydrationWarning
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline' }}
    />
  )
}
