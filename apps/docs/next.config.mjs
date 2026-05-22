import nextra from 'nextra'

const withNextra = nextra({
  contentDirBasePath: '/docs',
  defaultShowCopyCode: true,
})

export default withNextra({
  async rewrites() {
    return [
      {
        source: '/api/sheets/:path*',
        destination: 'http://localhost:3001/:path*', // Proxy to Elysia app
      },
      {
        source: '/api/sheets',
        destination: 'http://localhost:3001/', // Proxy root
      },
    ]
  },
})
