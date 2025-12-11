import { Migration } from './migration.interface';
import { migrationV1 } from './001-integrity-check';
import { migrationV2 } from './002-clear-stats';
import { migrationV3 } from './003-update-categories-clear-stats';

export const MIGRATIONS: Migration[] = [
  migrationV1,
  migrationV2,
  migrationV3
].sort((a, b) => a.version - b.version);
