# Security review — TMS Essential MVP

Scope: the Option 1 MVP codebase. Reviewed against the SRS security requirements
(HTTPS, password hashing, JWT auth, RBAC, input validation, file-upload
restrictions, rate limiting) plus the platform's core privacy promise, that a
recruiter cannot learn a candidate's identity.

Status key: **PASS** verified by an automated test · **OK** implemented, verified
by inspection · **OPEN** needs action before launch.

---

## 1. Authentication

| Control | Status | Notes |
|---|---|---|
| Password hashing | OK | bcrypt, cost 12, on registration, reset, and trainer creation. |
| Password never returned | PASS | `passwordHash` is `select: false`; asserted absent from register and `/auth/me` responses. |
| Access tokens | OK | JWT, HS256, 15-minute expiry. Held in browser memory only, never `localStorage`. |
| Refresh tokens | PASS | 48 random bytes, SHA-256 hashed at rest, 7-day expiry, rotated on every use. Replaying a consumed token is rejected. |
| Logout revokes | PASS | Refresh token revoked server-side; a later refresh with the same cookie fails. |
| Reset revokes sessions | PASS | All refresh tokens revoked on password reset; a session opened before the reset cannot be refreshed. |
| Verification/reset tokens | PASS | 32 random bytes, SHA-256 hashed at rest, single use, 1-hour expiry. Replay and expiry both rejected. |
| Account enumeration | PASS | Wrong password and unknown email return identical 401 wording. `forgot-password` and `resend-verification` always return the same 202. |
| Deactivated accounts | PASS | Blocked at login, and an already-issued token is rejected on the next request. |

## 2. Authorisation

| Control | Status | Notes |
|---|---|---|
| RBAC on all portals | PASS | Every role tested against every portal root: only the owning role passes, others get 403. |
| Privilege escalation via registration | PASS | `role: "admin"` rejected by enum; `isAdmin: true` rejected by strict schema. No admin can be created through the public API. |
| Admin-only creation of admins | OK | Admins exist only via `seed:admin`, run by an operator with database access. |
| Cross-tenant reads | PASS | Placement-request lookups are scoped by company; a valid id from another recruiter returns 404, not 403. |
| Trainer write surface | PASS | The trainer router registers one GET route. POST/PATCH/PUT/DELETE all 404. |
| Admin cannot fake a payment | PASS | Admin-settable statuses are restricted to `under_review`, `approved`, `rejected`. `payment_confirmed` and earlier states are rejected. |
| Approval requires payment | PASS | Approving an unpaid candidate returns 409. |

## 3. Candidate anonymity

The platform's central promise. Enforced at two independent layers and verified
over real HTTP, not just at the serializer.

| Control | Status | Notes |
|---|---|---|
| Field projection | PASS | The database query selects only seven whitelisted fields; identifying data is never loaded on this path. |
| Whitelist serializer | PASS | The response is rebuilt from an explicit list, so a schema change cannot silently widen exposure. |
| Response body contains no identity | PASS | Asserted that phone, name, employer, and account email appear nowhere in search or profile responses. |
| Only approved candidates visible | PASS | All six non-approved statuses tested; each returns an empty pool. |
| Reference probing | PASS | Unapproved and non-existent references return byte-identical 404s. |
| Regex injection in filters | PASS | Filter input is escaped; `location=.*` matches nothing rather than dumping the pool. |

**Deliberate exclusion:** `workExperience` is withheld from recruiters. It is
free text and candidates routinely write their own name or employer into it,
which would defeat anonymity. Skills, certifications, and education carry the
professional signal instead.

## 4. Payments

| Control | Status | Notes |
|---|---|---|
| Webhook signature | PASS | HMAC-SHA512, timing-safe comparison. Missing, forged, and post-signing tampered bodies all rejected 401. |
| Server-side verification | PASS | The webhook payload is only a trigger; amount, currency, and status are re-read from Paystack before anything is trusted. |
| Amount tampering | PASS | A ₦100 charge against a ₦5,000 invoice is rejected and the candidate stays unpaid. |
| Currency substitution | PASS | Rejected. |
| Idempotency | PASS | Retried events do not double-record or move `paidAt`. |
| Client redirect not trusted | OK | The return page polls our own API for webhook-confirmed state. |
| Secrets in responses | OK | `providerPayload` excluded from all list responses. |

## 5. Input validation and transport

| Control | Status | Notes |
|---|---|---|
| Schema validation | PASS | All bodies and query strings validated by zod at the route boundary; handlers read `request.validated`. |
| Mass assignment | PASS | Every schema is `.strict()`; unknown keys are rejected rather than ignored. |
| Security headers | OK | `helmet()` defaults: CSP, HSTS, `X-Content-Type-Options`, frame options, referrer policy. |
| CORS | OK | Single origin from `CLIENT_URL`, credentials enabled. |
| Rate limiting | OK | 30/15min on credentials, 12/15min on account recovery, 120/15min on refresh. |
| Error disclosure | OK | 5xx responses are generic; details are logged server-side only. |

---

## OPEN — must be resolved before launch

1. **Rotate the MongoDB Atlas password.** The live connection string was
   committed to `server/.env.example`, which is deliberately not git-ignored.
   Treat the credential as public and rotate it.

2. **Replace the JWT secrets.** `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are
   still the literal placeholder strings. Generate real ones:
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

3. **Set `TRUST_PROXY_HOPS`.** Rate limiting keys on the client IP. Behind a
   reverse proxy (Render, Railway, Fly), Express sees the proxy's address for
   every request unless this is set, collapsing all users into one bucket — the
   whole platform would lock out after 30 login attempts. Set it to the real hop
   count, usually `1`. Never set it higher than reality: each trusted hop is one
   more `X-Forwarded-For` entry a client can forge.

4. **Configure SMTP.** The placeholder `smtp.example.com` is non-empty, so the
   app treats email as configured and attempts real connections. Verification,
   reset, receipt, and notification emails currently all fail. Either supply real
   credentials or remove the `SMTP_*` block entirely (development then logs
   messages to the console).

5. **CSRF on the refresh endpoint.** In production the refresh cookie is
   `SameSite=None` (required when the frontend and API are on different domains),
   so a hostile page can trigger `POST /auth/refresh` with the user's cookie
   attached. It cannot read the response — CORS blocks that — but the rotation
   would invalidate the user's session and log them out. Same for `/auth/logout`.
   The impact is nuisance-level, not account compromise. Two fixes, either is
   sufficient:
   - host the API and frontend on the same registrable domain (e.g.
     `app.example.com` and `api.example.com`) and set `SameSite=Lax`; or
   - add a double-submit CSRF token to these two routes.

6. **File-upload validation is unimplemented** because document upload is not
   built yet. When adding it with Cloudinary: validate MIME type and extension
   server-side, cap file size, generate storage keys server-side (never trust the
   client filename), serve documents through an authorising endpoint or
   short-lived signed URLs, and never make the bucket publicly listable.

7. **Backups and monitoring are not configured.** See `docs/DEPLOYMENT.md`.

## Accepted for this MVP

- **No audit logs.** Deferred to Option 2 per the agreed scope. The SRS lists
  them under the full platform.
- **No account lockout.** Rate limiting only. Reasonable at this scale.
- **No 2FA.** Not in scope.
- **Recruiter approval is advisory.** `isApproved` is a record-keeping flag; it
  does not gate talent-pool access, matching the "no recruiter billing or gating"
  MVP decision. If gating is wanted, it must be enforced in
  `recruiter.routes.js`, not in the UI.

---

## Test coverage supporting this review

75 automated tests: 71 server, 4 client.

```
rbac.test.js               role boundaries, token forgery, deactivation
talent-pool.test.js        anonymity, approval gating, filter injection
auth.routes.test.js        registration, login, sessions, tokens, enumeration
payment-webhook.test.js    signature, verification, tampering, idempotency
admin-workflow.test.js     approval pipeline, cross-tenant isolation, notifications
AuthProvider.test.jsx      session bootstrap and route guards
```

Run with `npm test` from the repository root.
