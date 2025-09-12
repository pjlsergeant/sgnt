# CLAUDE.md

## Critical Conventions

### Imports
- No `.js` extensions needed (using `moduleResolution: bundler`)
- Use `~/` for src imports: `import { foo } from '~/lib/module'`
- `~` maps to the `src/` directory

### Project Structure
```
src/
├── bin/      # Executable scripts with #!/usr/bin/env -S npx tsx
├── lib/      # Library code
└── *.spec.ts # Tests next to source files
```

### Before Completing Any Task
```bash
npm run check  # Runs build, test, lint, and format
```

### Adding New Code
- Named exports only (no default exports)
- Explicit types on all function parameters and returns
- Tests go next to source as `*.spec.ts`

### Task Runner
- Use `just` for common tasks (see justfile)
- `just` automatically loads .env files
- Check justfile before creating new npm scripts

### Common Commands
- `just test` - Run tests
- `npm run dev` - Watch mode for tests
- `./src/bin/script.ts` - Run executables directly