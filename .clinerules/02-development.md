# Coding workflow

## Operating system
The code is being developed on Windows 11 using git-bash and git for windows. Please use appropriate commands.

## Git workflow
DO NOT commit and push files. All changes should be made manually by the user.

## Running unit tests
Run the unit tests by running `npm run test -- --no-watch --no-progress` command. After code changes, make sure no failures are present. Refer to @https://angular.dev/guide/testing for guidelines on how to test with vitest.
If you wish to run a single suite, use the `--include` flag, e.g. `npm run test -- --no-watch --no-progress --include=src/app/app.spec.ts`, or use a glob pattern.
Important: do not run npx vitests - you need to use Angular CLI's command for tests to work reliably.

Note: If tests result in segfaults, rerun them as the issue may be transient.

## Coverage
Make sure the coverage is 100% after adding any new code. Run the coverage using `npm run test -- --coverage --no-watch --no-progress` command.

## Running E2E tests
Run the E2E tests by running `npm run e2e:safe` command. This command runs tests against local Firebase emulators (`auth`, `firestore`) to avoid affecting production data. After code changes, make sure no failures are present.
