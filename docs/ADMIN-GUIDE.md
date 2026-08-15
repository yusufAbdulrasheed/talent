# Administrator guide

For the person running the Talent Recruitment & Training Management System
day to day. No technical knowledge assumed.

---

## Signing in

Go to the site and choose **Sign in**. Administrator accounts are not created
through the public registration form — yours is set up during installation. If
you forget your password, use **Forgot your password?** and follow the emailed
link. It expires after an hour.

---

## How a candidate moves through the system

Understanding this order makes everything else clear.

```
Registers → Verifies email → Completes profile → Pays training fee
   → YOU REVIEW → Approved → Visible to recruiters
```

Everything up to the payment happens without you. **Your decision is what puts a
candidate in front of recruiters** — nobody is visible to a recruiter until you
approve them.

You cannot approve a candidate who has not paid. The system blocks it, and it
will tell you so. Payments are confirmed automatically by Paystack; there is no
way to mark someone as paid by hand, which is deliberate.

---

## Reviewing and approving candidates

**Candidates** in the sidebar lists everyone. Filter by status or search by
reference, location, or skill.

The ones needing you are **Payment confirmed** — they have paid and are waiting.
The Overview page shows this as *Awaiting review*.

Open a candidate to see their full details: name, contact, education, work
history, and documents. This is the only screen in the system where a candidate's
identity is visible.

Three actions:

- **Approve** — publishes them to the recruiter talent pool and emails them.
- **Mark under review** — signals you have started but not finished. No email.
- **Reject** — emails them the outcome. **A note is required**, and the candidate
  sees it, so write something they can act on: "Your uploaded ID was unreadable,
  please re-upload a clearer photograph" rather than "rejected".

Approval is reversible. Rejecting an approved candidate removes them from the
talent pool immediately.

---

## What recruiters can and cannot see

Approved candidates appear to recruiters **anonymously**. Recruiters see:

> reference number · location · skills · certifications · education ·
> availability · experience level

They never see the name, email, phone number, address, photograph, documents, or
written work history. This is enforced by the system, not by convention — there
is no setting that can accidentally reveal it.

Identity is shared only when you arrange a placement, by hand, after reviewing
the request.

---

## Recruiters

**Recruiters** lists every registered company. The **Approve** button is a
record-keeping flag for your own tracking — it does *not* control talent-pool
access. In this version any registered recruiter can search and submit requests.

---

## Placement requests

When a recruiter requests a candidate, you get an email and an in-app
notification. **Placement requests** lists them all.

Open one to see the role, the company, and which candidate was requested. Move it
through the stages as you work:

| Status | Meaning |
|---|---|
| Submitted | Just arrived |
| Under review | You are assessing it |
| In progress | You are arranging the placement |
| Fulfilled | The candidate was placed |
| Closed | Ended without a placement |

**Every status change emails the recruiter automatically**, including any note
you add. Use the note to keep them informed — it saves you the follow-up.

---

## Trainers

Trainers cannot register themselves. Add one under **Trainers** with their name
and email; they are emailed a link to set their own password. You never see or
set their password. The link expires after an hour — if they miss it, they can
use **Forgot password**.

**Deactivate** blocks sign-in without deleting the account or its history. Use it
rather than deletion when someone leaves.

Trainers have a read-only dashboard. They see their assigned programmes and
batches, how many candidates are in each, and any announcement you leave. They
cannot record attendance, upload materials, or grade anyone — those are not part
of this version.

---

## Programmes and batches

Under **Programs and batches**:

1. Create a **programme** — the course itself, e.g. "Frontend Development".
2. Create an **assignment** — links a trainer to a programme for a named batch,
   e.g. "Cohort 3 — March". Add an announcement here and that trainer sees it on
   their dashboard.

Deactivating a programme hides it from new assignments without disturbing
existing ones.

---

## Payments

**Payments** lists every training-fee transaction with its reference, amount,
status, and date. Search by reference when a candidate queries a payment.

If a candidate says they paid but their status has not moved, check here first:

- Payment shows **Paid** but the candidate is not "Payment confirmed" — contact
  your developer, the confirmation did not complete.
- Payment shows **Awaiting payment** — they did not finish checkout. Ask them to
  try again from their Payments page.
- No payment listed at all — they never started. Check their email is verified
  and their profile is complete, since both are required first.

---

## Website content

**Website content** manages testimonials, gallery items, events, and FAQs for the
public site. New items are **drafts** and invisible to the public until you press
**Publish**. Unpublish hides an item again without deleting it.

---

## Overview

The landing page shows current counts: candidates registered, paid, awaiting your
review, and approved; placement requests open and closed; recruiters, trainers,
and active programmes; and total payments received. *Awaiting review* is the
number that needs your attention.

---

## Common questions

**A candidate did not get their verification email.** Ask them to check spam,
then use **Resend verification** on the sign-in page. If no email in the system
is arriving at all, the mail service needs attention.

**A candidate wants to change their details after approval.** They can edit their
own profile at any time. Edits do not reset approval; if the change is material,
review them again.

**Can I delete a candidate?** Not in this version. Reject them instead, which
removes them from the talent pool and preserves the record.

**A recruiter is asking for a candidate's contact details.** That is the point of
the placement request. Review the request, then share details directly with the
recruiter yourself once you are satisfied.
