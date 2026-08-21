import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],

      // Désactivée globalement plutôt que ligne par ligne : cette règle
      // expérimentale (React 19.2) a un bug reconnu et documenté qui la
      // fait se déclencher de façon incohérente sur un pattern pourtant
      // standard et correct — un setState appelé APRÈS un await, dans une
      // fonction async, à l'intérieur d'un useEffect (fetch de données au
      // montage). Constaté en pratique sur ce projet : la même ligne de
      // code passait de "erreur" à "avertissement inutile" et inversement
      // d'un lint à l'autre, sans qu'aucun changement de code ne l'explique.
      // Voir github.com/facebook/react/issues/34905 et #34743.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
