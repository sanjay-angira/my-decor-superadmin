# My Decor Admin

Standalone Angular 22 admin panel using PrimeNG components with the Aura preset.

The application is based on the existing Angular admin project and retains its API, authentication, routing, and permissions.

## Stack

- Angular 22 + standalone components
- PrimeNG 22 + PrimeIcons
- RxJS + `jwt-decode`
- API URL is configured per environment in `src/environments`.

## Run

```bash
cd my-decor-admin
npm install
npm start
```

App: http://localhost:4200  
Login: `/login` → redirects to `/admin/dashboard`

Ensure `vr-backend` is running on port 8080.

## Validate

```bash
npm test
npm run build
```

## Structure (mirrors vr-admin)

```
src/
  environments/
  static-data/          # menu, columns, module config (from Next admin)
  app/
    core/services/      # api, jwt, login, permission, upload, dashboard
    core/interceptors/
    guards/
    custom-layout/      # PrimeNG-based admin shell
    pages/
      auth/
      dashboards/
      social/profile/
      errors/
      components/       # module-crud, header/footer, orders…
```

## Migration status

The admin UI uses PrimeNG components and PrimeIcons. Existing API integration, uploads, permissions, and CRUD behavior are retained. The product form includes the category-specific Specifications workflow, brand-specific pickup addresses, package measurements, and the complete SEO field set from the React reference. Product-form validation tests are configured with Vitest.

See [MIGRATION-ANALYSIS.md](./MIGRATION-ANALYSIS.md) for the form comparison and migration checklist.

The React and Angular reference projects are not modified.
