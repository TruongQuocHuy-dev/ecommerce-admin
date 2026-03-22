# Electro Admin Dashboard

Admin dashboard for operating and managing the Electro E-commerce platform.
It provides centralized tools for moderation, monitoring, and system configuration.

## 1. Project Overview

This admin panel helps internal teams:

- Manage users, products, orders, and sellers
- Approve or reject pending products
- Track analytics and business performance
- Control platform settings and banners
- Review audit logs for admin actions

## 2. Key Features

- Admin authentication with protected routes
- Role-based access control across pages and actions
- User, product, category, discount, and review management
- Order management and manual order creation
- Seller management and pending product moderation
- Reports and dashboard analytics
- Settings and banner management
- Multi-language support (Vietnamese/English)

## 3. Tech Stack

- React 18
- Vite 5
- React Router v6
- TanStack React Query
- Zustand (with persist middleware)
- Axios
- Tailwind CSS
- React Hook Form
- Recharts

## 4. Folder Structure

```text
src/
  api/              # HTTP client, endpoints, and API hooks
  auth/             # Route guards and access protection
  components/       # Reusable UI and module components
  i18n/             # Internationalization resources
  pages/            # Feature pages
  store/            # Zustand state stores
  utils/            # Utilities and permission helpers
```

## 5. Requirements

- Node.js >= 18
- npm >= 9
- Running backend API accessible from your environment

## 6. Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Start development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## 7. Environment Variables

| Variable | Required | Description |
|---|---|---|
| VITE_API_URL | Yes | Base URL for the primary API client |
| VITE_API_BASE_URL | Recommended | Used to resolve image/banner URLs in settings modules |

Important:

- Any variable prefixed with `VITE_` is exposed to the browser at build time.
- Never place private keys, client secrets, or sensitive credentials in frontend environment variables.

## 8. Authentication and Authorization

- Access token is attached through an Axios request interceptor.
- Auth state is persisted with Zustand middleware.
- UI access is controlled with route guards and permission helpers.
- Backend authorization remains the final enforcement layer.

## 9. Production Deployment

- Build with `npm run build`.
- Deploy the generated `dist/` directory to your hosting platform.
- Configure reverse proxy or set the correct API base environment variables.
- Enforce HTTPS for all production traffic.
- Configure backend CORS allowlist for frontend domains.

## 10. Security Checklist

- Do not commit `.env` files that may contain sensitive data.
- Provide `.env.example` as a safe configuration template.
- Add secret scanning in CI (for example, gitleaks or trufflehog).
- Rotate tokens/secrets immediately if exposure is suspected.
- Consider HttpOnly cookies for tokens in production security hardening.

## 11. Quick Troubleshooting

- CORS errors: verify backend CORS policy and frontend origin.
- 401/403 responses: verify token validity, role mapping, and backend permissions.
- Banner/image load issues: verify `VITE_API_BASE_URL` and returned asset paths.

## 12. Suggested Improvements

- Add automated tests for route guards and API hooks.
- Standardize frontend audit logging for critical actions.
- Integrate production error tracking (for example, Sentry).

## Author

- GitHub: https://github.com/TruongQuocHuy-dev
- Email: tqhuy.dev.frontend@gmail.com
