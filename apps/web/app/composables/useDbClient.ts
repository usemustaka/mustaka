import { useClientQueries } from 'zenstack-pinia-colada'
import { schema, factory } from '@mustaka/db/schema'

export const useDbClient = () => {
  const runtimeConfig = useRuntimeConfig()
  return {
    client: useClientQueries(schema, {
      endpoint: `${runtimeConfig.public.apiUrl}/model`,
      fetch: (url, opts) => fetch(url, {
        ...opts,
        credentials: 'include'
      })
    }),
    zod: factory,
    models: schema.models,
    enums: schema.enums
  }
}
