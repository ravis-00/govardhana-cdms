# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

```
cdms-frontend
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ public
│  ├─ vite.svg
│  └─ _redirects
├─ README.md
├─ src
│  ├─ api
│  │  ├─ cattle.js
│  │  └─ masterApi.js
│  ├─ App.css
│  ├─ App.jsx
│  ├─ assets
│  │  └─ react.svg
│  ├─ config
│  │  └─ appConfig.js
│  ├─ context
│  │  └─ AuthContext.jsx
│  ├─ index.css
│  ├─ layout
│  │  └─ MainLayout.jsx
│  ├─ main.jsx
│  ├─ pages
│  │  ├─ ActiveCattle.jsx
│  │  ├─ BioWaste.jsx
│  │  ├─ CattleProfile.jsx
│  │  ├─ CattleRegistration.jsx
│  │  ├─ CertificatesReports.jsx
│  │  ├─ Dashboard.jsx
│  │  ├─ DattuYojana.jsx
│  │  ├─ DeathRecords.jsx
│  │  ├─ Deregister.jsx
│  │  ├─ Feeding.jsx
│  │  ├─ Login.jsx
│  │  ├─ MasterCattle.jsx
│  │  ├─ MilkYield.jsx
│  │  ├─ NewBorn.jsx
│  │  ├─ NewTag.jsx
│  │  ├─ PedigreeViewer.jsx
│  │  ├─ Treatment.jsx
│  │  ├─ UserManagement.jsx
│  │  └─ Vaccine.jsx
│  └─ utils
│     └─ dateUtils.js
└─ vite.config.js

```