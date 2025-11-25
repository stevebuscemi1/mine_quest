# Contributing Guidelines

Thank you for considering contributing to **Mine Quest**! We welcome contributions of all kinds – bug reports, feature ideas, documentation improvements, and code changes.

## How to Contribute

1. **Fork the repository** on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/stevebuscemi1/mine_quest.git
   cd mine_quest
   ```
3. **Create a branch** for your work:
   ```bash
   git checkout -b feature/awesome-feature
   ```
4. **Make your changes**. Follow the coding style guidelines (see `README.md`).
5. **Run the tests** (if any) and ensure the app still works:
   ```bash
   npm install
   npm run dev
   ```
6. **Commit** your changes with a clear message.
7. **Push** to your fork and open a Pull Request.

## Pull Request Checklist
- [ ] Code follows the project's style guidelines.
- [ ] New functionality is covered by tests where applicable.
- [ ] Documentation (README, comments) is updated.
- [ ] No linting errors (`npm run lint`).
- [ ] All existing tests pass (`npm test`).

## Code Style
- Use **ES6 modules** and **strict mode**.
- Prefer `const`/`let` over `var`.
- Use **single quotes** for strings.
- Run `npm run format` before committing.

## Reporting Issues
- Search existing issues first.
- Provide a clear title and description.
- Include steps to reproduce, expected behavior, and screenshots if helpful.

We appreciate your help making Mine Quest better!
