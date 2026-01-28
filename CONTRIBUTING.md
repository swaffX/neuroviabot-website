# Contributing to NeuroViaBot

First off, thank you for considering contributing to NeuroViaBot! It's people like you that make NeuroViaBot such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots if possible**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior** and **explain which behavior you expected to see instead**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the TypeScript styleguide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Getting Started

1. **Fork the repository**

2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/neuroviabot-discord.git
   cd neuroviabot-discord
   ```

3. **Install dependencies**
   ```bash
   # Frontend
   cd neuroviabot-frontend
   npm install
   
   # Backend
   cd ../neuroviabot-backend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   # Frontend
   cd neuroviabot-frontend
   cp .env.example .env.local
   
   # Backend
   cd ../neuroviabot-backend
   cp .env.example .env
   ```

5. **Run development servers**
   ```bash
   # Frontend (port 3001)
   cd neuroviabot-frontend
   npm run dev
   
   # Backend (port 3000)
   cd neuroviabot-backend
   npm run dev
   ```

## Coding Guidelines

### TypeScript Style Guide

* Use TypeScript for all new code
* Enable strict mode
* Use meaningful variable names
* Add JSDoc comments for public APIs
* Use interfaces over type aliases when possible
* Prefer `const` over `let`, never use `var`

### Example:

```typescript
/**
 * Validates user input for the form
 * @param input - The user input to validate
 * @returns Validation result with errors if any
 */
export function validateInput(input: string): ValidationResult {
  const errors: string[] = []
  
  if (!input.trim()) {
    errors.push('Input cannot be empty')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}
```

### React/Next.js Guidelines

* Use functional components with hooks
* Keep components small and focused
* Use custom hooks for reusable logic
* Implement proper error boundaries
* Use `'use client'` directive only when necessary
* Optimize images with next/image
* Use dynamic imports for code splitting

### Example Component:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface MyComponentProps {
  initialValue: string
  onSubmit: (value: string) => void
}

export function MyComponent({ initialValue, onSubmit }: MyComponentProps) {
  const [value, setValue] = useState(initialValue)
  
  return (
    <div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="..."
      />
      <Button onClick={() => onSubmit(value)}>
        Submit
      </Button>
    </div>
  )
}
```

### CSS/Styling Guidelines

* Use Tailwind CSS utility classes
* Create custom components for repeated patterns
* Follow the established color palette
* Ensure responsive design (mobile-first)
* Test in multiple browsers
* Maintain accessibility (WCAG 2.1 AA)

### Testing

* Write tests for new features
* Update tests when modifying existing features
* Ensure all tests pass before submitting PR
* Aim for high code coverage

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### Commit Message Format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
* `feat`: New feature
* `fix`: Bug fix
* `docs`: Documentation changes
* `style`: Code style changes (formatting, etc.)
* `refactor`: Code refactoring
* `test`: Adding or updating tests
* `chore`: Maintenance tasks

**Example:**
```
feat(ui): add loading skeleton components

- Implement Skeleton component with variants
- Add preset skeleton components (Card, Text, etc.)
- Update loading states to use skeletons

Closes #123
```

## Project Structure

```
neuroviabot-discord/
├── neuroviabot-frontend/    # Next.js frontend
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   └── public/              # Static assets
└── neuroviabot-backend/     # Node.js backend
    ├── src/                 # Source code
    ├── tests/               # Test files
    └── config/              # Configuration
```

## Pull Request Process

1. **Update documentation** - Ensure README.md is updated with any new features
2. **Update the CHANGELOG** - Add your changes under "Unreleased"
3. **Run linting and tests** - Ensure all checks pass
4. **Request review** - Tag at least one maintainer
5. **Address feedback** - Make requested changes promptly
6. **Squash commits** - Clean up commit history before merge

## Code Review Process

* All submissions require review
* Reviewers may request changes
* Changes must be approved before merging
* CI/CD checks must pass
* Maintain a professional and respectful tone

## Additional Notes

### Issue Labels

* `bug` - Something isn't working
* `enhancement` - New feature or request
* `documentation` - Improvements to documentation
* `good first issue` - Good for newcomers
* `help wanted` - Extra attention needed
* `priority: high` - High priority issue

### Development Tips

* Use TypeScript strict mode
* Follow existing code patterns
* Write self-documenting code
* Add comments for complex logic
* Keep functions small and focused
* Test edge cases

## Questions?

Feel free to:
* Open an issue for questions
* Join our Discord server
* Email the maintainers

Thank you for contributing! 🎉
