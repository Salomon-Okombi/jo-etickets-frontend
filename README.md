# React + TypeScript + Vite
# RUN SERVER : npm run dev
This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

1️⃣ Installer Node.js (et npm)

Va sur le site officiel : https://nodejs.org/fr/

Télécharge la version LTS (recommandée pour la stabilité, ex: 20.x.x)

Lance l’installateur :

Coche “Add to PATH” pendant l’installation !

Tu peux laisser les autres options par défaut.

Termine l’installation.

2️⃣ Vérifier que Node.js et npm sont bien installés

Après l’installation, ferme PowerShell et rouvre-le pour que les nouvelles variables PATH soient prises en compte.

Tape :

node -v
npm -v

Tu devrais voir quelque chose comme :

v20.3.1
9.8.1

✅ Si oui, Node et npm sont prêts.

3️⃣ Installer les dépendances du frontend

Dans ton dossier frontend :

cd C:\Users\bsokombi\Documents\JO-etickets\frontend
npm install

Ça va créer le dossier node_modules et installer toutes les librairies nécessaires.

4️⃣ Lancer le serveur de développement

Toujours dans le dossier frontend :

npm start

ou si ton package.json utilise dev :

npm run dev

Le terminal devrait afficher l’URL locale (souvent http://localhost:3000), que tu peux ouvrir dans ton navigateur pour voir ton frontend.
