# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## UI/PDF refinement - 18 Sep 2026
- Restored prominent Shivraj Masala's & Rice Mill branding with the circular logo and slogan.
- Enlarged the sidebar brand area, global top-bar search and command search panel.
- Added responsive layout safeguards for toolbars, tables, forms, page actions and modals to reduce overlap/clipping.
- Reworked Invoice, Expense and Business Report PDFs with clearer business-facing labels and a cleaner hierarchy.
- PDF money values use `Rs.` instead of the unsupported built-in jsPDF rupee glyph, preventing corrupted `¹` characters.
- PDF header/footer now carry consistent business branding and page numbers.

After extracting on Windows, run `npm install` and then `npm run desktop`.
