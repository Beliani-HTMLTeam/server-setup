import nextra from 'nextra'

const withNextra = nextra({
  contentDirBasePath: '/docs',
  defaultShowCopyCode: true,
})

const sheetsAppUrl = process.env.SHEETS_APP_URL.replace(/\/$/, '')

export default withNextra({
  async rewrites() {
    return [
      {
        source: '/api/sheets/:path*',
        destination: `${sheetsAppUrl}/:path*`, // Proxy to the sheets app
      },
      {
        source: '/api/sheets',
        destination: `${sheetsAppUrl}/`, // Proxy root
      },
    ]
  },
})
