import { Elysia } from "elysia";
import { cors } from '@elysiajs/cors'
import { createElysiaHandler } from '@zenstackhq/server/elysia';
import { RPCApiHandler } from '@zenstackhq/server/api';
import { schema, zenstack } from '@mustaka/db';
import { auth } from '@mustaka/auth'
import { openapi, fromTypes } from "@elysia/openapi";

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema())
export const OpenAPI = {
  getPaths: (prefix = '/auth') =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null)
      for (const path of Object.keys(paths)) {
        const key = prefix + path
        reference[key] = paths[path]
        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method]
          operation.tags = ['Better Auth']
        }
      }
      return reference
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>
} as const

const app = new Elysia()
  .use(
    openapi({
      references: fromTypes(),
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
      exclude: {
        paths: ['/model/*']
      }
    })
  )
  .use(cors({
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .get("/", () => "API — running")
  .mount('/', auth.handler)

app.group('/model', (app) => app.use(
  createElysiaHandler({
    apiHandler: new RPCApiHandler({
      schema
    }),
    basePath: '/',
    getClient: () => zenstack,
  })
))

app.listen(8000);

export type App = typeof app


console.log(
  `🦊 API is running at ${app.server?.hostname}:${app.server?.port}`
);
