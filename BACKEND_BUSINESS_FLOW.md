# Elemni Backend Business Flow

This document explains the backend behavior that the frontend must follow. It is intended for coding agents and frontend developers working in this repository.

## 1. Product model

Elemni is a multi-teacher education marketplace:

1. An admin creates teacher accounts and assigns the subjects and grades they may teach.
2. A teacher creates and publishes courses.
3. Visitors browse teachers and published courses.
4. A signed-in student purchases a course through PayTabs.
5. A successful payment creates 30 days of course access.
6. Enrolled students receive protected video URLs and document/exam references.

The primary hierarchy is:

```text
Teacher
└── Course
    ├── Chapter (optional)
    │   └── Lesson
    │       └── Item
    └── Lesson (when chapters are disabled)
        └── Item
```

An item may reference a Bunny Stream video, a document, an external exam, or a combination of these.

## 2. User roles

The backend defines four roles:

| Role | Current responsibility |
| --- | --- |
| `ADMIN` | Manages teachers and the grade/stream/subject catalog. |
| `TEACHER` | Manages their own profile, courses, chapters, lessons, items and uploads. |
| `STUDENT` | Registers, signs in, pays for courses and accesses active enrollments. |
| `ASSISTANT` | Exists in the data model, with video/financial permission flags, but is not currently accepted by course-management endpoints. |

Important frontend rule: do not expose teacher management actions to assistants until matching backend routes exist.

## 3. Authentication lifecycle

Base auth prefix: `/api/v1/auth`

- `POST /register` creates a `STUDENT` user and student profile.
- `POST /login` returns an access token and refresh token, plus the user's name and email.
- `POST /refresh` rotates the refresh token: the old token is revoked and a new token pair is returned.
- `POST /logout` revokes the supplied refresh token.
- `GET /me` returns the current authenticated user.
- `POST /forgot-password` starts password recovery.
- `POST /reset-password` sets a new password using the reset token.

Send authenticated requests with:

```http
Authorization: Bearer <access_token>
```

Frontend expectations:

- A `401` means the access token is missing, invalid or expired. Attempt refresh once, then sign the user out if refresh fails.
- A `403` means the account is disabled or the user lacks the required role.
- Store and replace both tokens when refresh succeeds because refresh tokens are single-use.
- Teacher accounts are normally created by an admin with no initial password. The admin then sends a set-password email.

## 4. Catalog relationships

The catalog contains:

- **Grade:** school year/level.
- **Stream:** study track, such as Science, Math, Literary or General.
- **Subject:** a teachable subject.

Subjects are linked to valid grades and streams. Teachers are separately assigned allowed subjects and grades.

When a teacher creates a course, the backend requires all of the following:

1. The selected subject is assigned to the teacher.
2. The selected grade is assigned to the teacher.
3. The selected subject is offered for that grade.
4. The selected subject belongs to the selected stream.

The frontend should filter/select compatible combinations, but the backend remains the source of truth and may return `400` for an invalid combination.

Public catalog endpoints:

- `GET /api/v1/subjects`
- `GET /api/v1/grades`
- `GET /api/v1/streams`

Admin CRUD endpoints use `/api/v1/admin/{subjects|grades|streams}`.

## 5. Teacher discovery

Public teacher routes do not require authentication:

- `GET /api/v1/teachers`
  - Optional filters: `grade_id`, `stream_id`, `search`, `skip`, `limit`.
- `GET /api/v1/teachers/{slug}`
- `GET /api/v1/teachers/{slug}/courses`
  - Returns only published courses.
  - Optional filters include `subject_id` and `grade_id`.
- `GET /api/v1/teachers/{slug}/courses/{course_id}`
  - Returns the published course outline.

An optional valid access token should be sent on public course requests when the visitor is signed in. The response uses it to calculate `is_subscribed` and decide whether protected content references may be included.

Teacher slugs are public identifiers and should be used in public URLs instead of internal teacher profile IDs.

## 6. Course lifecycle

Teacher management prefix: `/api/v1/courses`

Teachers can:

- List, create, read, update and delete their own courses.
- Upload a course image.
- Create, update, delete and reorder chapters.
- Create, update, delete and reorder lessons.
- Create, update, delete and reorder items.
- Upload item videos and documents.

Ownership is enforced by the backend. A teacher cannot manage another teacher's course.

### Publishing

- Only courses with `is_published = true` appear through public teacher routes.
- Checkout also rejects unpublished courses.
- The teacher dashboard may show both drafts and published courses.

### Optional chapters

`use_chapters` changes how lessons are organized:

- `false`: lessons belong directly to the course.
- `true`: lessons are grouped into chapters.

When chapters are enabled for a course that already has flat lessons, the backend creates a default chapter named `General` (stored as the Arabic-independent value currently used by the API: `\u0639\u0627\u0645`) and moves those lessons into it.

When chapters are disabled, lessons are flattened in chapter/lesson order and the chapters are deleted.

The only chapter containing lessons cannot be deleted unless another chapter exists to receive those lessons.

### Ordering

Chapters, lessons and items have floating-point `order` values. Reordering endpoints accept arrays of `{ id, order }`. Preserve backend-returned ordering; do not assume IDs represent display order.

## 7. Public course visibility versus paid access

The published course detail deliberately exposes its outline to everyone:

- Course title, description, image and price.
- Subject, grade and stream identifiers.
- Chapter, lesson and item titles.
- Duration and flags such as `has_video`, `has_document` and `has_exam`.

For a guest or non-enrolled user:

- `is_subscribed` is `false`.
- Protected video embed URLs are omitted.
- Document paths and exam IDs are omitted.

For a user with an active enrollment:

- `is_subscribed` is `true`.
- Video items may include a short-lived, signed `bunny_stream_embed_url`.
- Document paths and exam IDs are returned.

Never infer access from a previous frontend state. Fetch course detail again after successful payment and when reopening a course so the backend can recalculate access and generate fresh video URLs.

## 8. Checkout and enrollment

Payment prefix: `/api/v1/payments`

### Checkout

1. The authenticated student calls `POST /api/v1/payments/checkout` with:

   ```json
   { "course_id": 123 }
   ```

2. The backend verifies that the course is published and that the user does not already have an active enrollment.
3. It creates a pending enrollment and requests a PayTabs payment page.
4. It returns `{ "redirect_url": "..." }`.
5. The frontend navigates the browser to that URL.

An active enrollment causes `409 Already enrolled`.

### Payment completion

PayTabs sends a server-to-server callback. The backend verifies the callback signature and queries PayTabs directly before trusting the result. It also verifies that the paid amount matches the expected total.

Possible payment states include:

- `pending`
- `completed`
- `failed`
- `refunded`
- `duplicate_paid`
- `cancelled`

The browser return endpoint reports payment status, but access should be confirmed from the backend rather than trusting redirect query parameters.

After the return page reports completion, refetch the user's courses and the public course detail.

### Enrollment rules

An enrollment grants access only when:

```text
payment_status == "completed"
AND expires_at > current time
```

Successful purchases expire 30 days after payment confirmation. `GET /api/v1/my/courses` returns only active, completed enrollments.

Course access is therefore a 30-day subscription, not permanent ownership.

## 9. Pricing and revenue

The course `price` is treated as the teacher's intended earnings. The student pays a larger `total_paid` that covers:

- Teacher earnings.
- The teacher-specific Elemni platform fee.
- The payment gateway percentage and fixed fee.

Current defaults:

- Platform fee: `2%` (`0.02`), configurable per teacher.
- Gateway fee: `2.75%` plus `3 EGP`.
- Currency: `EGP`.

Each enrollment stores a financial snapshot:

- `course_price`
- `platform_fee_rate`
- `gateway_fee_rate`
- `total_paid`
- `platform_revenue`
- `gateway_fee`
- `teacher_earnings`

Do not recalculate historical enrollment values on the frontend. Display values returned by the backend. A later course-price or fee change must not affect an existing enrollment.

## 10. Media flow

Each teacher may have a dedicated Bunny Stream library. The backend stores its API key encrypted.

### Video upload

1. Teacher creates an item.
2. Frontend requests video upload credentials for that item.
3. Frontend uploads directly to Bunny using the returned TUS credentials.
4. Frontend confirms the video ID with the backend.
5. Bunny processes the video and calls the backend webhook.
6. Item status becomes `ready`, `uploaded` or `failed` depending on the webhook status.

Do not upload video bytes through the Elemni API.

### Images and documents

The frontend requests a presigned upload URL, uploads bytes directly to storage, and then confirms/stores the returned key where required. Keep the storage key returned by the API; response serializers may convert it into a public CDN URL for display.

## 11. Error handling contract

Backend errors normally use:

```json
{ "detail": "Human-readable message" }
```

Common statuses:

| Status | Meaning |
| --- | --- |
| `400` | Invalid business combination or operation. |
| `401` | Authentication missing/expired/invalid. |
| `403` | Disabled account or insufficient role. |
| `404` | Resource missing or not owned by the current teacher. |
| `409` | Conflict such as duplicate email, slug or active enrollment. |
| `422` | Request validation failed. |
| `502` / `503` | Payment or storage provider failure. |

Render `detail` when it is safe and useful, while still providing a generic fallback message.

## 12. Current backend gaps and cautions

- Assistant permissions exist in the schema but course routes currently require the teacher role.
- Student `grade_id`, `stream_id`, WhatsApp and parent phone fields exist, but normal registration does not currently collect/populate them.
- There is no student lesson-progress or completion tracking.
- There is no built-in quiz engine; items only store an external `exam_id`.
- There is no certificate workflow.
- `payout_status` is stored on enrollments, but teacher payout execution is not implemented here.
- Duplicate payments are marked, but no automatic refund workflow is implemented here.
- The tenant middleware currently does not resolve or isolate tenants.
- The public flat-course response still wraps lessons in a synthetic chapter with `id: 0` and an empty title. The frontend should hide that wrapper visually when `use_chapters` is `false`.
- Access-token role claims are useful for UI routing, but backend authorization loads the current user and remains authoritative.

## 13. Recommended frontend state transitions

```text
Guest
  → browse teacher/course
  → sign in before checkout

Signed-in student, not enrolled
  → checkout
  → PayTabs redirect
  → return/status screen
  → refetch course + /my/courses

Active student enrollment
  → course detail returns protected references
  → use fresh signed video embed URL

Expired enrollment
  → backend reports is_subscribed=false
  → protected references disappear
  → allow a new checkout
```

The frontend should treat `is_subscribed`, enrollment status and expiration returned by the backend as the source of truth.
