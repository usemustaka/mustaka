import { schema as _schema } from './zenstack/schema';
import { Pool } from 'pg';
import { ZenStackClient } from '@zenstackhq/orm';
import { PostgresDialect } from '@zenstackhq/orm/dialects/postgres';
import { PolicyPlugin } from '@zenstackhq/plugin-policy';

export const schema = _schema;

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
});

export const zenstack = new ZenStackClient(schema, { dialect });

export const db = zenstack.$use(new PolicyPlugin());

export type { ZenStackClient } from '@zenstackhq/orm';
