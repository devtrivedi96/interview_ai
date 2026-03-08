# Kiro Configuration

This directory contains Kiro AI assistant configuration and steering files to help guide development on the Interview AI project.

## What is Kiro?

Kiro is an AI-powered development assistant that helps with coding, debugging, and understanding your codebase. The files in this directory provide context and guidelines to help Kiro better assist you.

## Steering Files

Steering files are markdown documents that provide context, guidelines, and best practices to Kiro. They help ensure consistent, high-quality code across the project.

### Available Steering Files

1. **project-context.md** (Always included)
   - Project overview and architecture
   - Tech stack details
   - Key features and workflows
   - Common development tasks

2. **firebase-guide.md** (Included when working with Firebase files)
   - Firebase configuration and setup
   - Authentication flow
   - Firestore operations
   - Security best practices

3. **api-development.md** (Included when working with API routes)
   - API endpoint creation
   - Request/response handling
   - Authentication patterns
   - Database operations

4. **coding-standards.md** (Always included)
   - Code style guidelines
   - Error handling patterns
   - Testing guidelines
   - Security best practices

## How Steering Files Work

### Inclusion Types

- **Always**: Included in every Kiro interaction
- **File Match**: Included when working with files matching a pattern
- **Manual**: Included only when explicitly referenced with `#`

### Front Matter

Each steering file has front matter that controls when it's included:

```markdown
---
inclusion: always
---
```

or

```markdown
---
inclusion: fileMatch
fileMatchPattern: "**/firebase*.{py,js}"
---
```

## Adding New Steering Files

To add a new steering file:

1. Create a new `.md` file in `.kiro/steering/`
2. Add front matter to control inclusion
3. Write clear, actionable guidelines
4. Include code examples where helpful

Example:

```markdown
---
inclusion: fileMatch
fileMatchPattern: "**/*.test.{js,py}"
---

# Testing Guidelines

Your testing guidelines here...
```

## Best Practices

1. **Keep files focused**: Each file should cover a specific topic
2. **Use examples**: Show, don't just tell
3. **Stay current**: Update files as the project evolves
4. **Be concise**: Kiro reads these files, so clarity matters
5. **Include context**: Explain the "why" behind guidelines

## File References

Steering files can reference other project files using the special syntax:

```markdown
See the implementation in #[[file:server/src/auth/routes.py]]
```

This allows Kiro to automatically include relevant files when needed.

## Customization

You can customize Kiro's behavior by:

1. Editing existing steering files
2. Adding new steering files for specific domains
3. Adjusting file match patterns
4. Creating project-specific guidelines

## Getting Help

If you need help with Kiro or steering files:

1. Ask Kiro directly: "How do I use steering files?"
2. Check the Kiro documentation
3. Review existing steering files for examples

## Maintenance

Regularly review and update steering files to:

- Reflect current project architecture
- Include new patterns and practices
- Remove outdated information
- Add lessons learned from development

---

Last updated: 2024
