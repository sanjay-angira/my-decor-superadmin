# My Decor Admin migration analysis

## Scope and sources

- `vr-admin` is the React/Next.js workflow reference. Its `adminFormRegistry` maps 17 admin modules to dedicated forms.
- `e-commerce-superadmin` is the Angular architecture and backend integration reference.
- `my-decor-admin` is the separate Angular + PrimeNG target. The two references and the Next.js storefront remain unchanged.

The React form registry covers products, categories, brands, attributes, offers, coupons, banners, CMS pages, blogs, blog categories/tags, reviews/product reviews, product FAQs, users/customers, and contact leads. The Angular registry already has dedicated forms for those modules and additional modules including attribute options, admins, sellers, and user roles. Unregistered modules continue through the existing generic CRUD route.

## Product form comparison

| Area                | React reference                                                                                                                                                                              | Angular target before migration                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow            | Four steps: Product Information, Product Variations, Product SEO Settings, Product Settings                                                                                                  | Five steps: Product Information, Specifications, Product Variations, Product SEO Settings, Product Settings                                                                            |
| Product information | Name/slug, brand, brand-specific pickup address, hierarchical category, short/full description, tags, attributes and customer display mode, offers, frequently-bought-together products      | Most fields and hierarchical categories are present; brand-specific pickup address is missing. Category-specific specification groups are an Angular capability and must be preserved. |
| Variants            | Dynamic variants with name, slug, required SKU, price, stock, package dimensions/weight, description, offers, images, and selected attribute values                                          | Most variant behavior exists, but SKU is optional and package dimensions/weight are missing.                                                                                           |
| SEO                 | Meta title/description/keywords, focus keyword, canonical URL, robots, Open Graph, Twitter card, structured-data JSON, SEO slug, breadcrumb title, keyword-density value, and image uploads  | Only meta title/description/keywords, canonical URL, and OG image are exposed. Other fields and structured-data validation are missing.                                                |
| Validation          | Per-step validation; required variant name/slug/SKU/price/stock/dimensions; required selected variant attribute values; structured data must be a JSON object                                | Step validation and dynamic attribute checks exist; SKU/dimensions and full SEO validation are incomplete.                                                                             |
| Persistence         | `buildProductPayload` normalizes numeric IDs and image metadata, always sends child arrays, maps variant attributes according to customer display mode, and persists the complete SEO object | CRUD service and payload shape are already wired; preserve category `attributeValues` while aligning missing fields and clearable child arrays with the React behavior.                |
| Options/uploads     | Fetches brands, warehouses by brand, categories/children, offers, tags, products, and attributes; supports tag creation/deletion and existing upload endpoints                               | Existing options and upload services cover most behavior; warehouses and tag dialog use the current Angular/Material implementation.                                                   |

## Product form migration checklist

- [x] Inventory dedicated React and Angular form registries and identify generic CRUD fallback.
- [x] Compare ProductForm fields, steps, dynamic attributes, validation, option loading, uploads, and payload mapping.
- [x] Replace Material controls in the product form with PrimeNG controls.
- [x] Preserve the Angular category-specific Specifications step and its dynamic attribute values.
- [x] Add brand-specific pickup address and complete React variant fields/validation.
- [x] Add the complete SEO field set and validate structured-data JSON objects.
- [x] Align create/edit record mapping and API payload behavior without changing API routes.
- [x] Run focused tests and a production build; update migration status.
- [x] Replace remaining Angular Material UI with PrimeNG, including shared layouts, dialogs, tables, and forms.
- [x] Remove the Angular Material dependency and stale Material-specific styling.

## Guardrails

- Do not modify the existing `vr-admin`, `e-commerce-superadmin`, or Next.js storefront projects.
- Preserve Angular routes, auth guards, upload paths, services, category specifications, and backend payload contracts.
- Keep the PrimeNG UI migration within `my-decor-admin`; do not change the referenced projects.
