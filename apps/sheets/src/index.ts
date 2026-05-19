import { Elysia, t } from 'elysia'

import cors from '@elysiajs/cors'
import openapi from '@elysiajs/openapi'

import { Sheet } from './utils/Sheet'

import { registerDynamic } from './endpoints/dynamic/sheet_tab.endpoint'
import { registerAllAtOnce } from './endpoints/static/registerAllAtOnce'
import { registerOther } from './utils/registerEndpoints'
import { AppBootstrapper } from './AppBootstrapper'

export const app = new Elysia({
  normalize: true,
})
  // automatic scalar documentation
  .use(
    openapi({
      path: 'docs',
    })
  )

  .use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['*'],
      maxAge: 86400,
      preflight: true,
    })
  )

  .group('/dynamic/:year', (_dynamic) => {
    _dynamic.get(
      '/',
      () => {
        return {
          code: 200,
          message: 'Visit docs for API usage information @ /docs',
        }
      },
      {
        tags: ['Dynamic'],
        response: {
          200: t.Object({
            message: t.String(
              t.Literal('Visit docs for API usage information @ /docs')
            ),
          }),
        },
      }
    )

    registerDynamic(_dynamic)

    return _dynamic
  })

  .group('/static', (_static) => {
    _static.get(
      '/',
      () => {
        return {
          code: 200,
          message: 'Visit docs for API usage information @ /docs',
        }
      },
      {
        tags: ['Static'],
        response: {
          200: t.Object({
            message: t.String(
              t.Literal('Visit docs for API usage information @ /docs')
            ),
          }),
        },
      }
    )

    registerAllAtOnce(_static)
    // register static groups from separate modules

    return _static
  })

  .onError(({ code, set }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404
      return {
        code: 404,
        message: 'Endpoint not found',
        details: 'Please refer to /docs for the list of available endpoints.',
      }
    }
  })

registerOther(app)

AppBootstrapper.startServer()
