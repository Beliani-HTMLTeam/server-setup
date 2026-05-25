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
        destination: `${process.env.BETTER_AUTH_URL}/:path*`, // Proxy to Elysia app
      },
      {
        source: '/api/sheets',
        destination: `${process.env.BETTER_AUTH_URL}/`, // Proxy root
      },
    ]
  },
})
