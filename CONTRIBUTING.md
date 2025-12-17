# Contributing to Schema3D

Thank you for your interest in contributing! This guide will help you get started.

## Quick Start

1. **Fork and clone** the repository
2. **Install dependencies**: `npm install`
3. **Set up environment**: Copy `.env.example` to `.env` and configure
4. **Start development**: `npm run dev`
5. **Run tests**: `npm run test`

## How to Contribute

### Reporting Bugs

- Check existing issues first
- Include steps to reproduce
- Describe expected vs. actual behavior
- Add environment details (OS, Node version, etc.)

### Suggesting Features

- Open an issue describing the feature
- Explain the use case and benefits
- Provide examples if possible

### Submitting Changes

1. **Create a branch** from `main`
2. **Make your changes** following the code style below
3. **Add tests** for new functionality
4. **Run checks** (optional - pre-commit hook will auto-format):
   - `npm run lint` - Check code quality
   - `npm run format` - Format code (runs automatically on commit)
   - `npm run test` - Run tests
   - `npm run check` - Type check
5. **Submit a pull request** with a clear description

**Note**: Code formatting happens automatically when you commit thanks to our pre-commit hook. You can still run `npm run format` manually if needed.

## Code Style

- **TypeScript**: Use strict types, avoid `any`
- **Formatting**: Automatically formatted on commit (via pre-commit hook)
- **Naming**:
  - Components: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
- **Imports**: Use `@/` alias for client code
- **Comments**: Add JSDoc for public functions

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test edge cases and error conditions

## Commit Messages

Use clear, descriptive messages:

- `feat: add Mermaid parser support`
- `fix: correct relationship rendering`
- `docs: update README`

## Questions?

Open a discussion or check existing issues. We're happy to help!

Thank you for contributing! 🎉
