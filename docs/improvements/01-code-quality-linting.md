# Issue: Add ESLint, Prettier, and Code Quality Tools

## Priority: High

## Description
The project currently lacks automated code quality tools, which leads to inconsistent code style and potential bugs. Adding proper linting and formatting tools will improve code maintainability and developer experience.

## Current Issues
- No ESLint configuration
- No Prettier configuration  
- Unused imports exist (e.g., TaskComment in TaskManager.vue)
- Inconsistent code formatting across files
- No pre-commit hooks to enforce quality

## Proposed Solution

### 1. Add ESLint Configuration
```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-vue
```

Create `.eslintrc.js`:
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'vue/multi-word-component-names': 'off'
  }
}
```

### 2. Add Prettier Configuration
```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

Create `.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 3. Update package.json Scripts
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.vue",
    "lint:fix": "eslint src --ext .ts,.vue --fix",
    "format": "prettier --write src/**/*.{ts,vue,js,json}",
    "type-check": "vue-tsc --noEmit"
  }
}
```

### 4. Add Pre-commit Hooks
```bash
npm install --save-dev husky lint-staged
npx husky install
```

Update package.json:
```json
{
  "lint-staged": {
    "*.{ts,vue}": ["eslint --fix", "prettier --write"],
    "*.{js,json,md}": ["prettier --write"]
  }
}
```

## Benefits
- Consistent code style across the project
- Early detection of potential bugs
- Better developer experience with auto-formatting
- Enforced quality standards through pre-commit hooks
- Easier code reviews

## Acceptance Criteria
- [ ] ESLint configuration added and working
- [ ] Prettier configuration added and working
- [ ] All existing lint errors fixed
- [ ] Pre-commit hooks installed and working
- [ ] package.json scripts updated
- [ ] README updated with code quality guidelines

## Estimated Effort
Medium (4-6 hours)