# Implementation Plan: Lesson Items CRUD

## Technical Context

**Feature**: Create, read, update, delete, and reorder items (video, document, exam, text) inside lessons.

**Current State**:
- No item files exist anywhere in `src/` (schemas, queries, actions, components)
- API backend has 8 item endpoints fully defined in OpenAPI spec
- `endpoints.ts` has no item endpoint entries
- Reorder infrastructure (`@dnd-kit`, `reorderItemSchema`) already built for chapters/lessons
- Lesson components (`LessonList`, `LessonCard`) exist but don't reference items
- No item i18n keys exist
- No item mock handlers exist
- No video/upload packages in `package.json`

**API Endpoints** (all confirmed on backend):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/courses/{courseId}/lessons/{lessonId}/items` | List items |
| POST | `/api/v1/courses/{courseId}/lessons/{lessonId}/items` | Create item |
| PATCH | `/api/v1/courses/{courseId}/items/{itemId}` | Update item |
| DELETE | `/api/v1/courses/{courseId}/items/{itemId}` | Delete item |
| PUT | `/api/v1/courses/{courseId}/lessons/{lessonId}/items/reorder` | Reorder items |
| POST | `/api/v1/courses/{courseId}/lessons/{lessonId}/items/{itemId}/upload-video` | Upload video |
| POST | `/api/v1/courses/{courseId}/lessons/{lessonId}/items/{itemId}/request-upload-url` | Request doc upload URL |
| POST | `/api/v1/courses/{courseId}/lessons/{lessonId}/items/{itemId}/confirm-upload` | Confirm doc upload |

**API Schemas**: `ItemOut`, `ItemCreate`, `ItemUpdate`, `Body_upload_item_video`, `ConfirmUploadSchema`, `ReorderRequest`, `ReorderItem`

**Key unknowns**:
1. How to handle Bunny CDN video upload from the browser (direct upload vs proxy)
2. How to integrate items into the existing lesson expansion UI
3. Whether document upload (presigned URL) needs a separate package

## Constitution Check

No `.specify/memory/constitution.md` exists. No constitutional constraints apply.

## Gate Evaluation

| Gate | Status | Notes |
|------|--------|-------|
| Spec exists and approved | ✅ PASS | `spec.md` complete, checklist all pass |
| No NEEDS CLARIFICATION markers | ✅ PASS | 0 markers in spec |
| API endpoints available | ✅ PASS | 8 endpoints confirmed on backend |
| Technical feasibility confirmed | ✅ PASS | Standard CRUD + upload patterns |

Gate evaluation: **ALL PASS** — proceed to Phase 0.

---

## Phase 0: Research

**Goal**: Resolve technical unknowns and document decisions.

### Unknowns to Research

1. **Bunny CDN video upload flow** — does the API proxy the upload or provide a direct upload URL?
2. **Document upload flow** — what does `request-upload-url` return? How to upload to presigned URL?
3. **Item display location** — should items appear inside the expanded lesson area, or as a separate dedicated view?
4. **Existing upload patterns** — are there any existing upload implementations in the codebase?

### Deliverable

`research.md` with all decisions documented.

---

## Phase 1: Design

### 1. Data Model (`data-model.md`)

Client-side schemas and state model for items.

### 2. Contracts (`/contracts/`)

Server action interfaces, component props, upload flow contracts.

### 3. Quickstart (`quickstart.md`)

Validation guide for testing the feature end-to-end.

---

## Phase 2: Implementation (future)

Implementation details in `tasks.md`.

## Phase 3: Verification (future)

Test plans and acceptance criteria.
