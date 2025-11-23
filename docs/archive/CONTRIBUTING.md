# Contributing to Delirium Paste

Thank you for your interest in contributing to Delirium Paste! This document provides guidelines and instructions for contributing to the project.

## 🤝 How to Become a Contributor

### Fork the Repository

**All contributors should fork the repository** to contribute changes. This is the standard open-source workflow that allows you to:

- Work on your own copy of the code
- Make changes without affecting the main repository
- Submit changes via Pull Requests for review

### Step-by-Step: Fork → Contribute → Pull Request

1. **Fork the repository**
   - Click the "Fork" button at the top right of the [repository page](https://github.com/marcusb333/delerium-paste)
   - This creates your own copy at `https://github.com/YOUR_USERNAME/delerium-paste`

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/delerium-paste.git
   cd delerium-paste
   ```

3. **Add the upstream repository** (to keep your fork updated)
   ```bash
   git remote add upstream https://github.com/marcusb333/delerium-paste.git
   ```

4. **Create a branch** for your changes
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Make your changes** (see [Development Workflow](#-development-workflow) below)

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template (see [Pull Request Process](#-pull-request-process))

### Keeping Your Fork Updated

To sync your fork with the latest changes from the main repository:

```bash
# Fetch latest changes from upstream
git fetch upstream

# Switch to main branch
git checkout main

# Merge upstream changes
git merge upstream/main

# Push updates to your fork
git push origin main
```

### Why Fork Instead of Direct Contribution?

- **No write access required** - You don't need to be a repository maintainer
- **Safe experimentation** - Your fork is your own space to experiment
- **Review process** - All changes go through Pull Request review
- **Standard practice** - This is how most open-source projects work

## 🎯 Getting Started

### Prerequisites

- **Node.js** 18+ and npm (for frontend development)
- **Java** 21+ and Gradle (for backend development)
- **Docker** and Docker Compose (for full-stack development)
- **Git** for version control

### Initial Setup

1. **Fork and clone the repository** (see [How to Become a Contributor](#-how-to-become-a-contributor) above)
   ```bash
   # Clone YOUR fork (not the original repository)
   git clone https://github.com/YOUR_USERNAME/delerium-paste.git
   cd delerium-paste
   
   # Add upstream remote to keep your fork updated
   git remote add upstream https://github.com/marcusb333/delerium-paste.git
   ```

2. **Set up the development environment**
   ```bash
   # Install frontend dependencies
   cd client
   npm install
   
   # Install Playwright browsers (for E2E tests)
   npx playwright install --with-deps
   
   # Return to root
   cd ..
   ```

3. **Start the development environment**
   ```bash
   # Start all services with hot-reload
   make dev
   
   # Or start services individually
   make start
   ```

4. **Verify everything works**
   ```bash
   # Run all tests
   make test
   
   # Or run CI checks locally
   ./scripts/ci-verify-all.sh
   ```

## 🏗️ Development Workflow

### Branch Naming

Use descriptive branch names that indicate the type of change:

- `feature/` - New features (e.g., `feature/add-dark-mode`)
- `fix/` - Bug fixes (e.g., `fix/memory-leak-in-crypto`)
- `docs/` - Documentation updates (e.g., `docs/update-api-docs`)
- `refactor/` - Code refactoring (e.g., `refactor/extract-crypto-module`)
- `test/` - Test improvements (e.g., `test/add-e2e-coverage`)

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Quick checks (fast feedback)
   ./scripts/ci-verify-quick.sh
   
   # Full CI checks (before committing)
   ./scripts/ci-verify-all.sh
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   See [Commit Messages](#commit-messages) for guidelines.

5. **Push and create a Pull Request**
   ```bash
   # Push to YOUR fork (origin), not the upstream repository
   git push origin feature/your-feature-name
   ```
   
   Then go to GitHub and open a Pull Request from your fork to the main repository.

## 📝 Code Style

### TypeScript (Frontend)

- Use **strict mode** TypeScript
- Prefer explicit types over inference for public APIs
- Use `const` for immutable values, `let` for mutable ones
- Follow existing naming conventions:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and types
  - `UPPER_SNAKE_CASE` for constants

### Kotlin (Backend)

- Follow Kotlin coding conventions
- Use data classes for DTOs
- Prefer immutability where possible
- Add KDoc comments for public APIs

### General Guidelines

- **Keep functions small** - Single responsibility principle
- **Write self-documenting code** - Clear variable and function names
- **Add comments** - Explain *why*, not *what*
- **Follow DRY** - Don't Repeat Yourself
- **Security first** - Never log sensitive data, always validate input

## 🧪 Testing Requirements

### Critical Rule: Never Decrease Coverage by >5%

When adding new code, test coverage must not drop by more than 5% without comprehensive justification.

### Coverage Standards

- **Global minimum**: 85% code coverage (CI requirement)
- **Critical functions**: 100% coverage required
  - Encryption/decryption (all algorithms)
  - Password handling (PBKDF2, key derivation)
  - Authentication and authorization
  - Input validation
  - Security utilities
- **New code**: Must be tested before merging

### Test Types

1. **Unit Tests** - Test individual functions in isolation
   ```bash
   npm run test:unit
   ```

2. **Integration Tests** - Test API interactions and workflows
   ```bash
   npm run test:integration
   ```

3. **E2E Tests** - Test complete user journeys in real browsers
   ```bash
   npm run test:e2e
   ```

### Writing Good Tests

- **Test behavior, not implementation** - Tests should survive refactoring
- **Use descriptive names** - `it('should encrypt data with password')` not `it('works')`
- **Follow Arrange-Act-Assert pattern**
- **Test edge cases** - Empty inputs, boundaries, unicode
- **Test error paths** - Invalid inputs, exceptions
- **Keep tests independent** - No shared state between tests

See [TEST_COVERAGE_RULES.md](TEST_COVERAGE_RULES.md) for detailed testing guidelines.

## 🔒 Security Guidelines

### Zero-Knowledge Principles

- **Never send encryption keys to the server**
- **All encryption happens client-side** before data leaves the browser
- **Server never sees unencrypted content**
- **No sensitive data in logs or error messages**

### Security Checklist

- [ ] Input validation on all user inputs
- [ ] No sensitive data in logs
- [ ] Error messages don't leak system information
- [ ] Use `getSafeErrorMessage()` for user-facing errors
- [ ] Rate limiting considered for new endpoints
- [ ] Proof-of-work considered for resource-intensive operations
- [ ] No hardcoded secrets or credentials

## 📦 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm run test:all`)
- [ ] Coverage is ≥85% or dropped ≤5% with justification
- [ ] Documentation updated if needed
- [ ] No console.logs or debug code left behind
- [ ] Commits are clean and well-described

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Test improvement

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Coverage Impact
- Coverage: X% → Y% (change: ±Z%)
- Justification (if coverage dropped >5%): ...

## Security Considerations
- [ ] No sensitive data exposed
- [ ] Input validation added
- [ ] Error messages are safe
```

### PR Review Process

1. **Automated checks** - CI runs all tests and checks
2. **Code review** - At least one maintainer reviews
3. **Feedback** - Address any requested changes
4. **Merge** - Once approved, your PR will be merged!

### PR Size Guidelines

- **Ideal**: 100-300 lines of code
- **Maximum**: ~500 lines (consider splitting larger PRs)
- **Reason**: Smaller PRs are easier to review and less error-prone

## 🏛️ Architecture Guidelines

### Project Structure

```
delerium-paste/
├── client/          # TypeScript frontend
│   ├── src/         # Source code
│   └── tests/       # Test files
├── server/          # Kotlin backend
│   └── src/main/kotlin/
├── docs/            # Documentation
└── scripts/         # Utility scripts
```

### Architecture Principles

- **Clean Architecture** - Separation of concerns
- **Zero-Knowledge** - Server never sees unencrypted data
- **Client-Side Encryption** - All encryption in browser
- **Type Safety** - Strict TypeScript everywhere
- **Testability** - Code designed for easy testing

See [docs/architecture/C4-DIAGRAMS.md](docs/architecture/C4-DIAGRAMS.md) for detailed architecture documentation.

## 📚 Documentation

### When to Update Documentation

- Adding new features → Update README or relevant docs
- Changing APIs → Update API documentation
- Changing setup process → Update setup guides
- Adding new scripts → Document usage

### Documentation Style

- Use clear, concise language
- Include code examples where helpful
- Keep documentation up-to-date with code
- Use markdown formatting consistently

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues to avoid duplicates
2. Verify the bug still exists on the latest `main` branch
3. Try to reproduce the bug consistently

### Bug Report Template

```markdown
## Description
Clear description of the bug.

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.17.0]

## Additional Context
Any other relevant information.
```

## 💡 Suggesting Features

### Before Suggesting

1. Check existing issues and discussions
2. Consider if it aligns with project goals
3. Think about implementation complexity

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature.

## Use Case
Why is this feature needed? What problem does it solve?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other approaches you've thought about.

## Additional Context
Any other relevant information.
```

## 🛠️ Development Tools

### Recommended IDE Setup

- **VS Code** with extensions:
  - TypeScript
  - ESLint
  - Prettier (optional)
  - Kotlin (for backend)

### Useful Commands

```bash
# Development
make dev              # Start with hot-reload
make start            # Start services
make stop             # Stop services
make logs             # View logs

# Testing
make test             # Run all tests
npm run test:unit     # Frontend unit tests
npm run test:e2e      # E2E tests
npm run test:coverage # Coverage report

# CI Verification
./scripts/ci-verify-all.sh      # Full CI checks
./scripts/ci-verify-quick.sh    # Quick checks
./scripts/ci-verify-frontend.sh # Frontend only
./scripts/ci-verify-backend.sh # Backend only

# Code Quality
npm run lint          # ESLint
npm run typecheck     # TypeScript check
```

## 📖 Commit Messages

### Format

```
<type>: <subject>

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

### Examples

```
feat: add dark mode toggle

Implements a user preference for dark/light theme that persists
across sessions using localStorage.

Closes #42
```

```
fix: prevent memory leak in crypto operations

Clear sensitive data from memory after encryption operations
complete to prevent potential memory leaks.

Fixes #123
```

### Verified Commits

We encourage contributors to sign their commits with GPG for verified commits on GitHub. See [docs/development/COMMIT_SIGNING.md](docs/development/COMMIT_SIGNING.md) for setup instructions.

## 🤝 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or inflammatory comments
- Personal attacks
- Any other unprofessional conduct

## 📞 Getting Help

- **Documentation**: Check [docs/](docs/) directory
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately (see [SECURITY.md](SECURITY.md) if exists)

## 🙏 Thank You!

Your contributions make this project better for everyone. Whether you're fixing bugs, adding features, improving documentation, or helping others, your efforts are appreciated!

---

**Questions?** Feel free to open an issue or start a discussion on GitHub.

**Happy coding! 🚀**
