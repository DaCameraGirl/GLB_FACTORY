# Contributing to GLB_FACTORY

Thank you for your interest in contributing to GLB_FACTORY! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/GLB_FACTORY.git
   cd GLB_FACTORY
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/DaCameraGirl/GLB_FACTORY.git
   ```

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Add your Gemini API key to `.env.local`:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Run tests:
   ```bash
   npm test
   ```

## How to Contribute

### Types of Contributions

- **Bug fixes**: Fix issues in existing code
- **New features**: Add new functionality
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Performance**: Optimize existing code
- **Refactoring**: Improve code quality without changing functionality

### Workflow

1. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes** following our coding standards

3. **Test your changes** thoroughly

4. **Commit your changes** using conventional commits

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types; use proper type definitions
- Use interfaces for object shapes
- Use enums for fixed sets of values

### React

- Use functional components with hooks
- Keep components small and focused
- Use proper prop typing
- Avoid inline styles; use Tailwind classes

### File Organization

- Place React components in `src/components/`
- Place utilities in `src/utils/`
- Place types in `src/types/`
- Place server code in `src/server/`

### Naming Conventions

- **Components**: PascalCase (e.g., `AvatarEditor.tsx`)
- **Files**: kebab-case (e.g., `avatar-utils.ts`)
- **Functions**: camelCase (e.g., `generateAvatar`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (e.g., `AvatarConfig`)

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at end of statements
- Maximum line length: 100 characters
- Use trailing commas in multi-line objects/arrays

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
feat(avatar): add chaos mutation feature
fix(editor): resolve texture loading issue
docs(readme): update installation instructions
test(utils): add tests for avatar generation
```

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] New features include tests
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. At least one maintainer must approve
2. All CI checks must pass
3. No unresolved conversations
4. Branch must be up to date with main

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new features
- Write tests for bug fixes
- Aim for 80%+ code coverage
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Test Structure

```typescript
describe('ComponentName', () => {
  it('should do something specific', () => {
    // Arrange
    const props = { ... };
    
    // Act
    render(<ComponentName {...props} />);
    
    // Assert
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

## Reporting Bugs

### Before Reporting

1. Check existing issues
2. Try latest version
3. Verify it's reproducible

### Bug Report Template

Use the bug report template when creating an issue:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Browser, OS, Node version
- **Screenshots**: If applicable
- **Additional Context**: Any other relevant info

## Suggesting Features

### Feature Request Template

- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Alternative solutions considered
- **Additional Context**: Mockups, examples, etc.

### Feature Discussion

- Open an issue first to discuss
- Get feedback from maintainers
- Consider implementation complexity
- Ensure it aligns with project goals

## Questions?

- Open a [GitHub Discussion](https://github.com/DaCameraGirl/GLB_FACTORY/discussions)
- Check existing documentation
- Review closed issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to GLB_FACTORY! 🎨✨
