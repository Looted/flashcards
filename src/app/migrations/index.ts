import { Migration } from './migration.interface';
import { migrationV1 } from './001-integrity-check';
import { migrationV2 } from './002-clear-stats';

export const MIGRATIONS: Migration[] = [
  migrationV1,
  migrationV2
].sort((a, b) => a.version - b.version);
