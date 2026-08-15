# TMS Essential MVP - Implementation Plan

## Project baseline

- Scope: Option 1 - Essential MVP only.
- Frontend: React (Vite), JavaScript, React Router, TanStack Query, SCSS Modules.
- Backend: Node.js, Express, JavaScript ES modules (`import` / `export`).
- Database: MongoDB with Mongoose.
- Authentication: JWT access tokens, refresh tokens, bcrypt, and role-based access control.
- Payments: Paystack for candidate training-fee payments only.
- Roles: Talent, Recruiter, Trainer, Admin.
- Deployment target: frontend, backend, MongoDB, cloud file storage, and production environment configuration.

## MVP scope

### Included

- Public marketing website: Home, About, Services, Training Programs, Gallery, Events, Testimonials, FAQ, Contact, Login, and Register.
- Authentication, email verification, password reset, and role-based route protection.
- Talent registration, profile management, document upload, candidate reference number, Paystack training payment, and status visibility.
- Recruiter company registration, anonymous approved-candidate search, filters, profile viewing, and placement requests.
- Read-only Trainer dashboard: profile/account status, assigned programs or batches, candidate counts, and announcements.
- Admin management of candidates, recruiter records, trainers, assignments, candidate approval, placement requests, payments, and basic public-site content.
- Email notifications for account, payment, approval, and placement-request events.
- Responsive production deployment.

### Explicitly deferred

- Complete LMS, videos, course materials, assignments, quizzes, assessments, grading, attendance, certificates, and progress tracking.
- Recruiter subscriptions and recruiter billing.
- Advanced analytics/reporting, audit logs, SMS, non-payment API integrations, mobile app, advanced dashboards, and multi-organization support.

## Status key

- `[ ]` Not started
- `[-]` In progress
- `[x]` Complete
- `[!]` Blocked / needs a decision

## Milestone 0 - Product and technical foundation

- [ ] Confirm branding, page copy, assets, training fee, training programs, and contact details.
- [ ] Confirm the email provider and cloud file-storage provider.
- [ ] Confirm supported candidate document types, file-size limits, and retention policy.
- [ ] Define the candidate status lifecycle: Draft -> Submitted -> Payment Pending -> Payment Confirmed -> Under Review -> Approved / Rejected.
- [ ] Define the placement-request status lifecycle: Submitted -> Under Review -> In Progress -> Fulfilled / Closed.
- [ ] Create wireframes and final UI/UX approval.
- [x] Create the monorepo structure: `client/`, `server/`, shared documentation, environment examples, and ignore rules.
- [-] Configure linting, formatting, environment validation, error handling, and local development scripts.
- [ ] Provision MongoDB, Paystack sandbox keys, email credentials, file storage, and deployment environments.

**Exit condition:** approved UI direction, required accounts/credentials available, and both applications run locally.

## Milestone 1 - Backend foundation and security

- [x] Configure Express using JavaScript ES modules and a modular folder structure.
- [x] Connect MongoDB and implement Mongoose models.
- [x] Create core data models: User, Candidate, RecruiterCompany, TrainerAssignment, Program/Batch, Payment, PlacementRequest, Notification, and PublicContent.
- [x] Implement validation, standardized API responses, centralized error handling, request logging, and API versioning.
- [x] Implement bcrypt password hashing, JWT access/refresh token flow, secure refresh-token handling, and logout.
- [x] Implement RBAC middleware for Talent, Recruiter, Trainer, and Admin routes.
- [-] Add rate limiting, CORS policy, security headers, file-upload validation, and authorization checks.
- [-] Seed an initial Admin account and reference data. Admin seeding is done (`npm run seed:admin --workspace=server`); training-program reference data is still pending the client's programme list.

**Exit condition:** protected API foundation is tested and role boundaries are enforced.

## Milestone 2 - Authentication and public website

- [x] Scaffold React/Vite in JavaScript.
- [x] Configure React Router, TanStack Query provider, reusable API client, query keys, mutation/error handling, and authenticated-session handling.
- [x] Establish SCSS Module conventions, global design tokens, responsive layout primitives, and accessible shared components.
- [-] Build public pages: Home, About, Services, Training Programs, Gallery, Events, Testimonials, FAQ, and Contact. Routes and layout exist; Home is drafted, the rest are placeholders pending branding and copy.
- [x] Build registration, login, email verification, forgot-password, reset-password, and logout screens.
- [x] Implement corresponding authentication APIs and transactional email templates.
- [x] Create role-based frontend route guards and post-login routing.

**Exit condition:** a visitor can browse the site, register, verify an account, sign in, reset a password, and reach only their authorized portal.

## Milestone 3 - Talent onboarding and Paystack payments

- [x] Build the Talent Portal overview and profile-completion flow.
- [x] Capture personal and professional information; generate a unique candidate reference number.
- [!] Implement secure document upload, storage, retrieval authorization, and document-status display. Blocked: needs the cloud file-storage decision (Cloudinary or S3).
- [x] Build Talent status and payment-history views.
- [x] Implement server-side Paystack payment initialization for the training fee.
- [x] Build the Paystack checkout handoff and return-state UI.
- [x] Implement an authenticated Paystack webhook endpoint, signature verification, idempotency, and server-side transaction verification.
- [x] Store payment transactions and issue an email receipt.
- [x] Automatically update candidate status after verified successful payment; never trust only the client redirect.

**Exit condition:** a Talent can complete onboarding, pay through Paystack, receive confirmation, and have a verified payment recorded.

## Milestone 4 - Recruiter portal and placement requests

- [x] Build recruiter/company registration and profile management.
- [x] Build Recruiter dashboard with basic request summaries.
- [x] Implement anonymous talent-pool API that exposes only approved candidates and permitted fields.
- [x] Build candidate search and filtering by location, skills, training program, availability, experience, certification, and keyword where data exists.
- [x] Build anonymous candidate-profile page.
- [x] Build placement-request form and request-history/status views.
- [x] Notify Admin by email/in-app notification when a placement request is submitted.
- [-] Verify that hidden candidate data (name, email, phone, address, photos, documents) cannot be exposed through the UI or API. Enforced by a database projection plus a whitelist serializer, and unit-verified; still needs an integration test against real data in Milestone 6.

**Exit condition:** a Recruiter can register without billing, find approved anonymous candidates, and submit/track placement requests.

## Milestone 5 - Admin and basic Trainer portal

- [ ] Build Admin dashboard with operational counts for candidates, recruiters, paid candidates, approved talents, and placement requests.
- [ ] Build candidate review, document review, status-change, approval/rejection, and talent-pool publishing controls.
- [ ] Build recruiter, trainer, program/batch, and assignment management.
- [ ] Build payment record lookup and payment-status review.
- [ ] Build placement-request review and status management.
- [ ] Build basic public-content management needed for the marketing website.
- [ ] Build the read-only Trainer dashboard: profile, assigned programs/batches, candidate counts, and announcements.
- [ ] Ensure trainers cannot change attendance, assessments, materials, grades, or certificates in this MVP.
- [ ] Send email notifications for account events, payment confirmation, candidate approval/rejection, and placement-request status changes.

**Exit condition:** Admin can operate all MVP workflows, and Trainers have accurate read-only assignment visibility.

## Milestone 6 - Quality assurance, deployment, and handover

- [ ] Add unit tests for validation, authentication, RBAC, candidate approval, anonymous-profile protection, and Paystack webhook handling.
- [ ] Add API integration tests for all critical user journeys.
- [ ] Test responsive behavior, modern browser compatibility, accessibility basics, error states, loading states, and empty states.
- [ ] Run security review: authorization, protected uploads, payment verification, secrets, rate limits, and input validation.
- [ ] Configure production environments, domain, HTTPS, email, file storage, MongoDB backups, monitoring, and error reporting.
- [ ] Deploy frontend and backend, run production smoke tests, and verify Paystack webhook delivery.
- [ ] Prepare administrator guide, deployment notes, environment documentation, and user handover/training.

**Exit condition:** production deployment has passed acceptance testing and handover is complete.

## Definition of done for every feature

- [ ] UI is responsive and uses SCSS Modules.
- [ ] Server state is fetched/mutated through TanStack Query, with loading, empty, success, and failure states.
- [ ] API endpoint validates input, authenticates the user where required, and enforces role/data ownership.
- [ ] Sensitive data is never returned unless the caller is authorized.
- [ ] Relevant tests pass and the main workflow is manually verified.
- [ ] Documentation and this checklist are updated.

## Current progress

- [x] Requirements reviewed and Option 1 scope agreed.
- [x] Public-website scope agreed.
- [x] Candidate approval model agreed: Admin approval controls talent-pool visibility.
- [x] Recruiter billing deferred.
- [x] Paystack selected for candidate training-fee payments.
- [x] Trainer scope agreed: read-only dashboard only.
- [x] Frontend/backend conventions agreed: JavaScript, backend ES modules, SCSS Modules, TanStack Query.
- [x] Development workspace and initial application scaffolding created.
- [x] React/Vite, SCSS Modules, React Router, TanStack Query, and Express ES-module entry points configured.
- [x] Frontend production build and backend health endpoint verified locally.
- [x] Backend authentication, email-verification, password-reset, talent-profile, and Paystack-payment API foundations implemented.
- [x] Frontend foundation implemented: API client with 401 refresh-and-retry, in-memory access token, auth context with session bootstrap, role-based route guards, public and portal layouts, SCSS design tokens, and shared accessible components.
- [x] Full MVP route table registered, with unbuilt pages rendering a labelled placeholder tied to its milestone.
- [x] Admin seed script added; recruiter sign-up now creates the company record; candidate references are sequential (`TAL-2026-00021`).
- [x] Request validation moved to middleware with field-level error details, and all responses use a shared success envelope.
- [x] Transactional email templates (HTML and plain text) for verification, password reset, and payment receipt.
- [x] Milestone 1 and Milestone 2 are complete except for file-upload validation and the public marketing pages.
- [x] Talent Portal built: overview with onboarding checklist, profile-completion form, payment history, and the Paystack handoff and return-state page.
- [x] Milestone 3 is complete except document upload, which is blocked on the storage-provider decision.
- [x] Cloudinary chosen as the file-storage provider; document upload can be built once credentials are available.
- [x] Recruiter Portal built: company profile, dashboard summary, talent-pool search with filters and pagination, anonymous candidate profile, placement-request form, and request history/detail.
- [x] Anonymous talent pool enforced at two layers: a Mongo field projection and an explicit whitelist serializer. `workExperience` is deliberately withheld because free text often names the candidate or their employer.
- [x] Milestone 4 is complete.

## Open decisions blocking further work

- [ ] Branding, page copy, and image assets - blocks the remaining public pages.
- [ ] Training fee amount - `TRAINING_FEE_NGN` is unset, so Paystack cannot go live.
- [ ] Training program list and contact details.
- [ ] Email provider and cloud file-storage provider - blocks document upload.
- [ ] Accepted document types, size limits, retention policy.
- [ ] Paystack sandbox credentials and a provisioned MongoDB instance.
