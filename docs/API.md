# PetBuddy API Documentation

PetBuddy is a marketplace connecting **Pet Owners** with vetted **Pet
Sitters/Walkers** for at-home pet care or walks. This document specifies the
REST API the backend (Node.js / Express) should implement, derived from the
product backlog. The backend is currently a skeleton with no routes/models
implemented yet — **this document is the spec to build against**, not a
description of existing behavior.

> Base URL: `/api/v1` *(assumption — not yet defined in the codebase, only
> `/health` exists today. Confirm prefix with the team before implementing.)*

## Conventions

### Authentication

- Assumption: **Bearer JWT** in the `Authorization: Bearer <token>` header.
  The backlog only specifies "session/JWT issued" without picking one —
  confirm with the team.
- Endpoints marked **Auth: Owner** or **Auth: Sitter** require a logged-in
  user with that role. **Auth: Any** means any logged-in user (owner or
  sitter). **Auth: None** means public/unauthenticated access is allowed.

### Standard error shape (assumption)

```json
{
  "error": {
    "code": "STRING_ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

Common status codes used throughout:

| Status | Meaning |
|---|---|
| 400 | Validation failure (bad input shape/format) |
| 401 | Not authenticated / invalid credentials |
| 403 | Authenticated but not authorized (e.g. private resource, wrong role) |
| 404 | Resource not found |
| 409 | Conflict with current state (e.g. duplicate email, invalid status transition) |
| 413 | Uploaded file too large |

### Booking status state machine

The `Booking.status` field is the core state machine of the system:

```
Pending ──sitter accepts──> Accepted ──sitter starts service──> In Progress ──sitter marks complete──> Completed ──owner pays balance──> Fully Paid
   │                            │
   │──owner cancels             │
   ▼                            ▼
Canceled                   (no cancel once In Progress/Completed — blocked)
   │
Rejected (sitter rejects from Pending)
```

Rules called out in the backlog (enforced server-side, not just UI):

- A booking can only be **canceled** while `status = Pending`. Once
  `In Progress` or `Completed`, cancellation is blocked (409).
- A sitter cannot mark a booking **Completed** before the service's
  scheduled start time (409 if attempted early).
- A **review** can only be submitted once `status` is `Completed` or
  `Fully Paid`. Blocked for `Pending`/`Canceled` (409).
- Editing a service listing does **not** retroactively change price/terms
  on existing bookings — those keep the originally agreed values.

### Payments

- Deposit = **30%** of the itemized total; the remaining 70% is due after
  service completion.
- Payment proof is an uploaded image (PNG/JPEG). Max file size is **TBD** —
  not specified in the backlog; enforce a placeholder limit and confirm
  with the team (see [Open Questions](#open-questions--tbd)).

---

## Epic 1 — User Authentication

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | None | Create a new account |
| POST | `/auth/login` | None | Log in, receive session/token |
| POST | `/auth/logout` | Any | Invalidate current session/token |
| POST | `/auth/password-reset` | None | Request a password reset email |
| POST | `/auth/password-reset/:token` | None | Set a new password using the emailed token |

### `POST /auth/register`

Registers a new Pet Owner or Pet Sitter account.

**Request body**
```json
{
  "email": "string",
  "password": "string (min 8 chars)",
  "name": "string",
  "role": "owner | sitter"
}
```

**Success — 201**
```json
{ "id": "string", "email": "string", "name": "string", "role": "owner | sitter" }
```

**Errors**
| Status | Condition |
|---|---|
| 400 | Invalid email format, or password shorter than 8 characters |
| 409 | Email already registered |

### `POST /auth/login`

**Request body**
```json
{ "email": "string", "password": "string" }
```

**Success — 200**
```json
{ "token": "string", "user": { "id": "string", "email": "string", "name": "string", "role": "owner | sitter" } }
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Invalid email or password |

### `POST /auth/logout`

**Auth:** Any. No request body (token/session taken from `Authorization`
header). Invalidates the current session/token so the browser back button
cannot return to authenticated pages using a cached response.

**Success — 204** — no content.

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |

### `POST /auth/password-reset`

Sends a password reset link to the given email if it exists.

**Request body**
```json
{ "email": "string" }
```

**Success — 200** — generic acknowledgement (does not reveal whether the
email exists, to avoid account enumeration).
```json
{ "message": "If that email exists, a reset link has been sent." }
```

### `POST /auth/password-reset/:token`

Completes a password reset. The token is single-use and expires after a
fixed window (exact TTL not specified in backlog).

**Request body**
```json
{ "password": "string (min 8 chars)" }
```

**Success — 200**
```json
{ "message": "Password updated." }
```

**Errors**
| Status | Condition |
|---|---|
| 400 | Password fails validation |
| 409 | Token expired or already used |
| 404 | Token not found/invalid |

---

## Epic 2 — User Account Management

| Method | Path | Auth | Purpose |
|---|---|---|---|
| PATCH | `/account` | Any | Edit account details |
| POST | `/account/deactivate` | Any | Deactivate (remove) own account |

### `PATCH /account`

Edits the logged-in user's account details.

**Request body** (partial update; only required fields must be present per
form validation)
```json
{ "name": "string", "email": "string" }
```

**Success — 200**
```json
{ "id": "string", "email": "string", "name": "string", "role": "owner | sitter" }
```

**Errors**
| Status | Condition |
|---|---|
| 400 | A required field is missing or invalid |
| 401 | Not authenticated |
| 409 | Email already in use by another account |

> Note: "confirm-to-discard unsaved changes" is a client-side UX
> requirement (navigation guard) and has no corresponding API behavior.

### `POST /account/deactivate`

Deactivates and removes the account. Requires re-entering the password to
confirm, then logs the user out.

**Request body**
```json
{ "password": "string" }
```

**Success — 204** — no content. Server should also invalidate the
session/token as part of this call.

**Errors**
| Status | Condition |
|---|---|
| 401 | Password confirmation incorrect, or not authenticated |

---

## Epic 3 — Pet Management

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/pets` | Owner | List own pet profiles |
| POST | `/pets` | Owner | Create a pet profile |
| GET | `/pets/:id` | Owner | Get a single pet profile |
| PATCH | `/pets/:id` | Owner | Edit a pet profile |
| DELETE | `/pets/:id` | Owner | Delete a pet profile |

> `GET /pets` and `GET /pets/:id` are implied support endpoints (a UI needs
> to list/view pets to edit/delete them); not explicitly in the backlog but
> required to make Epic 3 usable.

### `POST /pets`

**Request body**
```json
{
  "name": "string",
  "species": "string",
  "breed": "string",
  "age": "number",
  "photo": "string (URL, uploaded separately or as multipart)",
  "notes": "string"
}
```

**Success — 201**
```json
{ "id": "string", "ownerId": "string", "name": "string", "species": "string", "breed": "string", "age": "number", "notes": "string", "photo": "string" }
```

**Errors**
| Status | Condition |
|---|---|
| 400 | Missing/invalid required fields |
| 401 | Not authenticated |

### `PATCH /pets/:id`

**Request body** — any subset of the `POST /pets` fields.

**Success — 200** — updated Pet object (same shape as above).

**Errors**
| Status | Condition |
|---|---|
| 400 | Invalid field values |
| 401 | Not authenticated |
| 403 | Pet does not belong to the requesting owner |
| 404 | Pet not found |

### `DELETE /pets/:id`

**Success — 204** — no content.

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Pet does not belong to the requesting owner |
| 404 | Pet not found |
| 409 | Pet is attached to an active or pending booking — deletion blocked |

---

## Epic 4 — Sitter Service Management

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/services` | Sitter | List own service listings |
| POST | `/services` | Sitter | Create a service listing |
| PATCH | `/services/:id` | Sitter | Edit a service listing |

> `GET /services` (own listings) is an implied support endpoint, same
> reasoning as pets above. Public search of services is covered separately
> under Epic 5 (`GET /sitters`).

### `POST /services`

**Request body**
```json
{
  "type": "string (e.g. 'walking' | 'boarding' | 'daycare')",
  "rate": "number",
  "availability": "string | object (hours/schedule — exact shape TBD)"
}
```

**Success — 201**
```json
{ "id": "string", "sitterId": "string", "type": "string", "rate": "number", "availability": "object" }
```

**Errors**
| Status | Condition |
|---|---|
| 400 | Missing/invalid required fields |
| 401 | Not authenticated |
| 403 | Requesting user is not a sitter |

### `PATCH /services/:id`

Edits a service listing. **Existing bookings against this service are not
affected** — they retain the price/terms that were agreed at booking time.

**Request body** — any subset of the `POST /services` fields.

**Success — 200** — updated Service object.

**Errors**
| Status | Condition |
|---|---|
| 400 | Invalid field values |
| 401 | Not authenticated |
| 403 | Service does not belong to the requesting sitter |
| 404 | Service not found |

---

## Epic 5 — Search and Booking

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/sitters` | None* | Search/filter sitters |
| POST | `/bookings` | Owner | Create a booking request |
| POST | `/bookings/:id/accept` | Sitter | Accept a booking request |
| POST | `/bookings/:id/reject` | Sitter | Reject a booking request |
| GET | `/bookings/:id` | Owner, Sitter | View full booking request details |

\* `GET /sitters` is public by default, but results exclude sitters/pets
marked private (see Epic 8 visibility controls) unless the requester is
authenticated and permitted.

### `GET /sitters`

**Query params**
```
area:      string   (location/area filter)
petType:   string   (species the sitter accepts)
priceMax:  number
rating:    number    (minimum average rating)
```

**Success — 200**
```json
{
  "results": [
    { "sitterId": "string", "name": "string", "services": [ /* Service[] */ ], "rating": "number", "area": "string" }
  ]
}
```

### `POST /bookings`

Creates a booking request. Initial status is always `Pending`.

**Request body**
```json
{
  "sitterId": "string",
  "serviceId": "string",
  "date": "string (ISO date)",
  "time": "string",
  "petIds": ["string"]
}
```

**Success — 201**
```json
{ "id": "string", "ownerId": "string", "sitterId": "string", "serviceId": "string", "petIds": ["string"], "date": "string", "time": "string", "status": "Pending" }
```

**Errors**
| Status | Condition |
|---|---|
| 400 | Missing/invalid fields |
| 401 | Not authenticated |
| 404 | Sitter, service, or one of the pets does not exist |

### `POST /bookings/:id/accept`

**Auth:** Sitter (must be the sitter on the booking).

**Success — 200**
```json
{ "id": "string", "status": "Accepted" }
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Requesting sitter does not own this booking |
| 404 | Booking not found |
| 409 | Booking is not currently `Pending` |

### `POST /bookings/:id/reject`

Same auth/error shape as accept, transitions to `status: "Rejected"`.

### `GET /bookings/:id`

Returns full booking details: owner contact info, pet profile(s), and
schedule. Visible to the owner and sitter on the booking only.

**Success — 200**
```json
{
  "id": "string",
  "status": "Pending | Accepted | Rejected | Canceled | In Progress | Completed | Fully Paid",
  "owner": { "id": "string", "name": "string", "email": "string" },
  "sitter": { "id": "string", "name": "string" },
  "service": { /* Service */ },
  "pets": [ /* Pet[] */ ],
  "date": "string",
  "time": "string"
}
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Requester is neither the owner nor sitter on this booking |
| 404 | `Booking not found` (also applies to any invalid booking ID lookup, per Epic 6) |

---

## Epic 6 — Payment and Booking Status

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/bookings/:id/price` | Owner | View calculated total price before confirming |
| POST | `/bookings/:id/payment-proof` | Owner | Upload bank transfer slip (deposit) |
| POST | `/bookings/:id/cancel` | Owner | Cancel a booking |
| GET | `/bookings/:id/status` | Owner, Sitter | Track booking status (timeline view) |
| POST | `/bookings/:id/pay-balance` | Owner | Pay remaining balance after completion |

### `GET /bookings/:id/price`

**Success — 200**
```json
{
  "bookingId": "string",
  "lineItems": [ { "label": "string", "amount": "number" } ],
  "total": "number",
  "depositAmount": "number",
  "remainingAmount": "number"
}
```

**Errors**
| Status | Condition |
|---|---|
| 404 | `Booking not found` |

### `POST /bookings/:id/payment-proof`

Uploads the bank transfer slip image as deposit payment proof. On success,
booking payment status becomes `Payment Verification Pending`.

**Request body** — `multipart/form-data`
```
file: image (PNG/JPEG), max size TBD
```

**Success — 201**
```json
{ "id": "string", "bookingId": "string", "proofSlipUrl": "string", "status": "Payment Verification Pending" }
```

**Errors**
| Status | Condition |
|---|---|
| 400 | File is not PNG/JPEG |
| 404 | `Booking not found` |
| 413 | File exceeds size limit (limit TBD) |

### `POST /bookings/:id/cancel`

Only allowed while `status = Pending`.

**Success — 200**
```json
{ "id": "string", "status": "Canceled" }
```

**Errors**
| Status | Condition |
|---|---|
| 404 | `Booking not found` |
| 409 | Booking is `In Progress`, `Completed`, or otherwise not cancelable |

### `GET /bookings/:id/status`

Returns a timeline of status transitions for the booking.

**Success — 200**
```json
{
  "bookingId": "string",
  "currentStatus": "string",
  "timeline": [ { "status": "string", "timestamp": "string (ISO datetime)" } ]
}
```

**Errors**
| Status | Condition |
|---|---|
| 404 | `Booking not found` (explicit message per backlog: invalid ID → "Booking not found") |

### `POST /bookings/:id/pay-balance`

Pays the remaining balance once the service is complete. Transitions
payment status to `Fully Paid`.

**Request body** — payment confirmation details (exact shape depends on the
payment method chosen; not specified in backlog beyond "pay remaining
balance").

**Success — 200**
```json
{ "id": "string", "bookingId": "string", "status": "Fully Paid" }
```

**Errors**
| Status | Condition |
|---|---|
| 404 | `Booking not found` |
| 409 | Booking is not yet `Completed` |

---

## Epic 7 — Review and Report

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/bookings/:id/review` | Owner | Submit review + rating |
| PATCH | `/bookings/:id/service-status` | Sitter | Update booking status (In Progress/Completed) |
| POST | `/bookings/:id/reports` | Sitter | Send a daily report |
| GET | `/bookings/:id/reports` | Owner, Sitter | List daily reports for a booking |

### `POST /bookings/:id/review`

Allowed only when booking `status` is `Completed` or `Fully Paid`.

**Request body**
```json
{ "rating": "number (1-5)", "comment": "string" }
```

**Success — 201**
```json
{ "id": "string", "bookingId": "string", "rating": "number", "comment": "string" }
```

**Errors**
| Status | Condition |
|---|---|
| 400 | Rating outside 1–5 range |
| 404 | `Booking not found` |
| 409 | Booking status is `Pending` or `Canceled` — review blocked |

### `PATCH /bookings/:id/service-status`

Sitter transitions the booking to `In Progress` or `Completed`.

**Request body**
```json
{ "status": "In Progress | Completed" }
```

**Success — 200**
```json
{ "id": "string", "status": "In Progress | Completed" }
```

**Errors**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Requesting sitter does not own this booking |
| 404 | `Booking not found` |
| 409 | Attempting to mark `Completed` before the service's scheduled start time |

### `POST /bookings/:id/reports`

Sitter sends a daily report during an active (`In Progress`) booking.

**Request body** — `multipart/form-data` or JSON with photo URLs
```json
{ "notes": "string", "photoUrls": ["string"] }
```

**Success — 201**
```json
{ "id": "string", "bookingId": "string", "notes": "string", "photoUrls": ["string"], "timestamp": "string (ISO datetime)" }
```

**Errors**
| Status | Condition |
|---|---|
| 403 | Requesting sitter does not own this booking |
| 404 | `Booking not found` |
| 409 | Booking is not `In Progress` |

### `GET /bookings/:id/reports`

**Success — 200**
```json
{ "reports": [ { "id": "string", "notes": "string", "photoUrls": ["string"], "timestamp": "string" } ] }
```

---

## Epic 8 — Security and Privacy

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/account/2fa/enable` | Any | Start 2FA setup (returns QR) |
| POST | `/account/2fa/verify` | Any | Verify OTP, activate 2FA, issue backup codes |
| GET | `/account/data-export` | Any | Export personal data |
| GET | `/account/consent` | Any | View consent settings |
| PATCH | `/account/consent` | Any | Update consent settings |
| GET | `/account/login-activity` | Any | View recent login activity |
| PATCH | `/account/visibility` | Any | Control profile/pet visibility (public/private) |

### `POST /account/2fa/enable`

**Success — 200**
```json
{ "qrCodeUrl": "string", "secret": "string" }
```

### `POST /account/2fa/verify`

**Request body**
```json
{ "otp": "string" }
```

**Success — 200**
```json
{ "enabled": true, "backupCodes": ["string"] }
```

**Errors**
| Status | Condition |
|---|---|
| 400 | OTP invalid or expired |

### `GET /account/data-export`

**Success — 200** — full export of the user's personal data (profile, pets,
bookings, reviews) as a downloadable JSON payload or file URL.
```json
{ "downloadUrl": "string" }
```

### `GET /account/consent` / `PATCH /account/consent`

**PATCH request body**
```json
{ "marketingEmails": "boolean", "dataSharing": "boolean" }
```

**Success — 200** — current consent object.

### `GET /account/login-activity`

**Success — 200**
```json
{
  "activity": [
    { "date": "string (ISO datetime)", "device": "string", "ip": "string" }
  ]
}
```

### `PATCH /account/visibility`

Controls whether the user's profile and pet profiles are public or private.

**Request body**
```json
{ "profileVisibility": "public | private" }
```

**Success — 200**
```json
{ "profileVisibility": "public | private" }
```

**Errors** (applies to any read endpoint targeting a private profile)
| Status | Condition |
|---|---|
| 403 | Requested profile/pet is private and requester is unauthenticated or unauthorized |

---

## Entities

### User
```json
{ "id": "string", "role": "owner | sitter", "email": "string", "name": "string", "passwordHash": "string (never returned in responses)", "twoFactorEnabled": "boolean" }
```

### Pet
```json
{ "id": "string", "ownerId": "string", "name": "string", "species": "string", "breed": "string", "age": "number", "notes": "string", "photo": "string" }
```

### Service
```json
{ "id": "string", "sitterId": "string", "type": "string", "rate": "number", "availability": "object" }
```

### Booking
```json
{
  "id": "string",
  "ownerId": "string",
  "sitterId": "string",
  "serviceId": "string",
  "petIds": ["string"],
  "date": "string",
  "time": "string",
  "status": "Pending | Accepted | Rejected | Canceled | In Progress | Completed | Fully Paid"
}
```

### Payment
```json
{ "id": "string", "bookingId": "string", "depositAmount": "number", "remainingAmount": "number", "proofSlipUrl": "string", "status": "string" }
```

### Review
```json
{ "id": "string", "bookingId": "string", "rating": "number (1-5)", "comment": "string" }
```

### DailyReport
```json
{ "id": "string", "bookingId": "string", "notes": "string", "photoUrls": ["string"], "timestamp": "string" }
```

---

## Open Questions / TBD

- **API base path prefix** — assumed `/api/v1`; not yet established in the
  codebase (only `/health` exists today).
- **Auth mechanism** — backlog says "session/JWT issued" without picking
  one; this doc assumes Bearer JWT.
- **Payment proof upload size limit** — explicitly flagged as not yet
  defined in the source backlog.
- **Password reset token TTL** — backlog says "expires/single-use" but does
  not specify the expiry window.
- **Service `availability` shape** — backlog only says "availability
  hours"; exact schema (e.g. per-weekday ranges) is undefined.
