import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Single connection definition for the Nest module and the TypeORM CLI.
 * synchronize stays false in every environment. Schema changes ship as files
 * in src/migrations, applied on boot via migrationsRun.
 */
export function buildDataSourceOptions(): DataSourceOptions {
  const sslEnabled = process.env.DB_SSL === 'true';

  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {}),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false,
    migrationsRun: true,
    logging: process.env.NODE_ENV === 'development',
  };
}

export const AppDataSource = new DataSource(buildDataSourceOptions());
