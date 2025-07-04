# CI/CD Documentation

This directory contains GitHub Actions workflows for the Shamva project.

## Workflows

### CI Workflow (`ci.yml`)

The master CI workflow runs on every push to `master` and on pull requests targeting `master`. It performs the following checks:

#### Jobs

1. **Format Check** - Validates code formatting using Prettier
2. **Lint** - Runs ESLint across all apps and packages
3. **Type Check** - Performs TypeScript type checking
4. **Build** - Builds all applications and packages

#### Features

- **Bun Runtime**: Uses Bun 1.2.0 for fast package management and task execution
- **Turborepo Integration**: Leverages Turborepo for efficient task orchestration and caching
- **Dependency Caching**: Caches Bun dependencies to speed up subsequent runs
- **Turborepo Caching**: Caches Turborepo build outputs for faster incremental builds
- **Build Artifacts**: Uploads build artifacts for debugging and deployment preparation
- **Concurrency Control**: Cancels in-progress workflows when new commits are pushed

#### Triggered By

- Push to `master` branch
- Pull requests targeting `master` branch

#### Scripts Used

The workflow runs the following npm scripts defined in the root `package.json`:

- `format:check` - Checks code formatting
- `lint` - Runs linter
- `check-types` - Performs type checking
- `build` - Builds all apps and packages

## Setup Requirements

### Repository Secrets

No secrets are required for the current CI workflow since it only performs checks and doesn't deploy.

### Branch Protection

To enforce CI checks, configure branch protection rules in your repository settings:

1. Go to **Settings > Branches**
2. Add a rule for `master` branch
3. Enable "Require status checks to pass before merging"
4. Select the "CI" check as required

## Local Development

To run the same checks locally:

```bash
# Install dependencies
bun install

# Check formatting
bun run format:check

# Fix formatting
bun run format

# Run linter
bun run lint

# Type check
bun run check-types

# Build
bun run build
```

## Troubleshooting

### Common Issues

1. **Formatting Failures**: Run `bun run format` to auto-fix formatting issues
2. **Lint Failures**: Review ESLint output and fix issues manually
3. **Type Errors**: Check TypeScript errors in the output and fix them
4. **Build Failures**: Ensure all dependencies are installed and code compiles

### Cache Issues

If you encounter cache-related issues:

1. The workflow will automatically handle cache invalidation
2. Turborepo cache is scoped to the specific commit SHA
3. Dependency cache is based on lock files

## Future Enhancements

- Add test workflow when tests are implemented
- Add deployment workflows for staging and production
- Add security scanning (Dependabot, CodeQL)
- Add performance monitoring and reporting
