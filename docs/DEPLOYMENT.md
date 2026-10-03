# Deployment and operations

Target architecture, matching the SRS recommendation:

| Piece | Suggested host |
|---|---|
| Frontend (`client/`) | Vercel or Netlify — static build |
| Backend (`server/`) | Render, Railway, or DigitalOcean |
| Database | MongoDB Atlas |
| File storage | Cloudinary |
| Email | Brevo, SendGrid, or Mailgun (SMTP) |

Alternatively, the whole app can deploy as a single Netlify site with the API
as a Netlify Function — see [section 6](#6-alternative-single-site-deploy-on-netlify-functions).

---

## 1. Backend environment

Copy `server/.env.example` and fill it in. **Never commit the filled copy** —
`server/.env` is git-ignored, `server/.env.example` deliberately is not.

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `production` |
| `PORT` | no | Defaults to 5000; most hosts inject their own |
| `CLIENT_URL` | yes | Exact frontend origin. Drives CORS and every link in outgoing email |
| `MONGODB_URI` | yes | Atlas SRV string |
| `TRUST_PROXY_HOPS` | **yes behind a proxy** | Usually `1`. See below |
| `JWT_ACCESS_SECRET` | yes | ≥32 chars, unique |
| `JWT_REFRESH_SECRET` | yes | ≥32 chars, different from the access secret |
| `PAYSTACK_SECRET_KEY` | yes | Live key. Also verifies webhook signatures |
| `PAYSTACK_CALLBACK_URL` | yes | `https://<frontend>/talent/payment/callback` |
| `TRAINING_FEE_NGN` | yes | Fee in naira. Payments fail without it |
| `SMTP_HOST` / `PORT` / `USER` / `PASSWORD` / `FROM` | yes | All five, or none |

The server refuses to start in production if any of `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `PAYSTACK_SECRET_KEY`, `TRAINING_FEE_NGN`, `SMTP_HOST`,
`SMTP_USER`, `SMTP_PASSWORD`, or `SMTP_FROM` is missing. That is deliberate:
starting half-configured would silently break payments or email.

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### `TRUST_PROXY_HOPS` — do not skip this

Rate limiting keys on the client IP. Behind a reverse proxy, Express reports the
proxy's address for every request, so all users share one bucket and the platform
locks out after 30 login attempts in total.

Set it to the number of proxies actually in front of the app — `1` on Render,
Railway, and Fly. Setting it higher than the real hop count lets a client forge
`X-Forwarded-For` entries and evade rate limiting entirely.

### SMTP is all-or-nothing

The app treats email as configured when `SMTP_HOST`, `SMTP_USER`,
`SMTP_PASSWORD`, and `SMTP_FROM` are all non-empty. Placeholder values count as
configured and cause real connection attempts. In development, leave the whole
block unset and messages are logged to the console instead — useful for reading
verification links locally.

---

## 2. Frontend environment

| Variable | Notes |
|---|---|
| `VITE_API_URL` | Full API base, e.g. `https://api.example.com/api/v1` |

Leave it unset in development: Vite proxies `/api` to `localhost:5000`, which
keeps the browser same-origin so the refresh cookie needs no CORS handling.

Build with `npm run build` (output: `client/dist`). Configure the host to rewrite
all unknown paths to `index.html` — it is a single-page app, and without this a
refresh on `/talent/profile` returns 404.

---

## 3. First deploy

1. **Provision Atlas.** Create the cluster and database user. Restrict network
   access to your backend host's egress IPs where possible rather than `0.0.0.0/0`.
2. **Deploy the backend.** Build command `npm ci`, start command
   `npm start --workspace=server`. Set all environment variables first.
3. **Seed the administrator.** With `ADMIN_EMAIL` and `ADMIN_PASSWORD` set
   (minimum 12 characters), run once:
   ```bash
   npm run seed:admin
   ```
   It is idempotent and will not overwrite an existing account. Clear
   `ADMIN_PASSWORD` from the environment afterwards.
4. **Deploy the frontend** with `VITE_API_URL` pointing at the backend.
5. **Register the Paystack webhook** at
   `https://<api-host>/api/v1/payments/paystack/webhook`. It must be reachable
   publicly and unauthenticated — it authenticates itself by signature.

---

## 4. Production smoke test

Run through this after every deploy. It exercises every integration point.

- [ ] `GET /api/v1/health` returns `{"status":"ok"}`
- [ ] The marketing site loads over HTTPS; a hard refresh on a deep link works
- [ ] Register a talent; **the verification email arrives**
- [ ] Verification link works and the portal banner clears
- [ ] Complete the profile; status moves `draft` → `submitted`
- [ ] Start a payment; Paystack checkout opens with the correct amount
- [ ] Complete a test payment; the return page confirms **without a manual refresh**
- [ ] The receipt email arrives; status is `payment_confirmed`
- [ ] In Paystack's dashboard, the webhook delivery shows **200**
- [ ] As admin, approve the candidate; the approval email arrives
- [ ] Register a recruiter; the candidate appears in the talent pool
- [ ] Open the anonymous profile — confirm no name, email, or phone is shown
- [ ] Submit a placement request; the admin notification email arrives
- [ ] As admin, change the request status; the recruiter notification arrives
- [ ] Sign in as a trainer; the read-only dashboard loads

The webhook step is the one most likely to fail silently. If the payment
completes but the candidate stays `payment_pending`, the webhook is not being
delivered — check the URL, and check that the host is not requiring auth on it.

---

## 5. Ongoing operations

**Backups.** Enable Atlas continuous backups (available on M10 and above; on the
free tier take periodic `mongodump` snapshots instead). Test a restore before
launch — an untested backup is not a backup.

**Monitoring.** At minimum: uptime checks against `/api/v1/health`, and an error
reporter (Sentry or similar) wired into the Express error handler, which already
logs every 5xx centrally.

**Log hygiene.** The error handler logs full stack traces for 5xx. Ensure the
host's log retention is set deliberately — these logs can contain email addresses.

**Secret rotation.** Rotating `JWT_REFRESH_SECRET` invalidates every active
session and signs all users out. Rotating `JWT_ACCESS_SECRET` signs users out for
up to 15 minutes. Plan rotations for a quiet window.

**Recurring costs** (from the pricing proposal, client's responsibility): domain,
cloud hosting, database hosting, file storage, email service, and Paystack
transaction fees.

---

## 6. Alternative: single-site deploy on Netlify Functions

Instead of hosting `client/` and `server/` on two separate services (section 3),
the whole app can deploy as one Netlify site: the frontend as a static build,
and the Express API wrapped as a Netlify Function at `server/netlify/functions/api.js`
(via `serverless-http`). `netlify.toml` at the repo root already wires this up —
build command, publish directory, the function's bundling, and the redirects
that route `/api/*` to the function and everything else to `index.html`.

Local development is unaffected: `npm run dev` still runs `server/src/server.js`
directly. The function is only used once deployed to Netlify.

**Setup**

1. Create a Netlify site from this repo. Build settings come from `netlify.toml`
   automatically — nothing to configure in the UI beyond environment variables.
2. Set the same backend variables as section 1 (`MONGODB_URI`, `JWT_ACCESS_SECRET`,
   `JWT_REFRESH_SECRET`, `PAYSTACK_SECRET_KEY`, `TRAINING_FEE_NGN`, the Resend and
   Cloudinary variables, etc.) on the Netlify site, via the dashboard or
   `netlify env:set`.
3. Set `CLIENT_URL` and `PAYSTACK_CALLBACK_URL` to the site's own Netlify URL
   (or custom domain) — frontend and API are the same origin here.
4. Leave `VITE_API_URL` **unset**. The client's default (`/api/v1`) is already
   same-origin through the `/api/*` redirect, exactly like the Vite dev proxy —
   so the refresh cookie needs no cross-origin/SameSite handling, unlike the
   two-host setup in section 3.
5. Register the Paystack webhook at
   `https://<your-site>/api/v1/payments/paystack/webhook` — same path as before,
   now served by the function.
6. Seed the administrator by running `npm run seed:admin` from a machine with
   the same `MONGODB_URI`, exactly as in section 3.

**Known limitation: rate limiting is best-effort here.** `express-rate-limit`
keeps its counters in memory. A Netlify Function's memory does not persist
reliably across invocations — a cold start resets it, and concurrent warm
instances (if any) don't share state. The limiter still runs and still deters
casual abuse, but it is not the hard per-IP ceiling it is on a long-lived
server. If that matters for production, back it with a shared store (e.g.
`rate-limit-redis` against a hosted Redis) — not implemented here.

---

## 7. Known gaps at handover

- Document upload is not built — Cloudinary is chosen but not integrated.
- Eight public marketing pages are routed placeholders pending branding and copy.
- Items 1–7 in `docs/SECURITY-REVIEW.md` under "must be resolved before launch".
