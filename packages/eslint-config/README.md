# `@cultural-sound-lab/eslint-config`

Shared ESLint configurations for the Cultural Sound Lab monorepo.

## Usage

Install in your package.json:

```json
{
  "devDependencies": {
    "@cultural-sound-lab/eslint-config": "*"
  }
}
```

Then extend in your `.eslintrc.js`:

```js
module.exports = {
  extends: ["@cultural-sound-lab/eslint-config"]
};
```

## Configurations

- **Base**: Core TypeScript and React rules
- **Next.js**: Optimized for Next.js applications  
- **Prettier**: Integration with Prettier formatting

## Rules

- TypeScript strict mode enforcement
- React hooks and accessibility rules
- Import/export organization
- Code complexity limits
- Cultural sensitivity guidelines
