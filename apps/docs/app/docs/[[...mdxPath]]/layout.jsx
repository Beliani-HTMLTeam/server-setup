import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import LayoutCSR from './_layout'
import { Navbar } from 'nextra-theme-docs'

const settings = {
  navbar: <Navbar
    logo={<><img height="24" width="100" src="/logo.svg" alt="Logo" /> HTML Team Docs</>}
  />,
}

export default async function LayoutSSR({ children }) {
  return (
    <LayoutCSR
      banner={settings?.banner}
      navbar={settings?.navbar}
      footer={settings?.footer}
      docsRepositoryBase="https://github.com/Beliani-HTMLTeam"
      pagemap={await getPageMap()}
    >
      {children}
    </LayoutCSR>
  )
}