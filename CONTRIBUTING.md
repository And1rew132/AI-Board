# Contributing to AI Board

Thank you for your interest in contributing to AI Board! This document provides guidelines for contributing to the project.

## Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/AI-Board.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test your changes: `npm run build`
7. Commit your changes: `git commit -m "feat: add your feature"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Open a pull request

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### With Docker
```bash
# Start development environment
docker-compose up --build
```

## Code Style

- Use TypeScript for type safety
- Follow Vue 3 Composition API patterns
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep components focused and reusable

## Commit Messages

Use conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example: `feat: add agent collaboration system`

## Pull Request Process

1. Ensure your PR has a clear title and description
2. Link any related issues
3. Include screenshots for UI changes
4. Make sure all builds pass
5. Request review from maintainers

## Improvement Issues

Check out our [improvement issues](docs/improvements/README.md) for structured enhancement opportunities:

### High Priority
- Code quality tools (ESLint, Prettier)
- Testing infrastructure
- Security enhancements

### Medium Priority
- UI/UX improvements
- Real-time monitoring
- Documentation

### Low Priority
- Performance analytics
- Advanced features

## Areas for Contribution

### For Beginners
- Documentation improvements
- UI component enhancements
- Bug fixes and small features

### For Experienced Developers
- Agent autonomy features
- Integration development
- Performance optimizations
- Testing infrastructure

### For Designers
- UI/UX improvements
- Accessibility enhancements
- Design system development

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AI Board! 🚀