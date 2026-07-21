# Research: Lesson Items CRUD

## Unknowns Resolved

### 1. Bunny CDN Video Upload Flow

**Decision**: Frontend sends video file directly to the API proxy endpoint via `multipart/form-data` using a raw `fetch()` call (not `apiFetch`)

**Rationale**:
- The API endpoint `POST .../upload-video` accepts `multipart/form-data` with a `file` field
- `apiFetch` only supports JSON and sets `Content-Type: application/json` — it cannot handle multipart
- The backend handles Bunny CDN ingestion — frontend never interacts with Bunny directly
- Upload progress can be tracked via `XMLHttpRequest` or `fetch` with `onUploadProgress` (limited) — for MVP, a simple spinner suffices
- No Bunny SDK packages needed in frontend

**Alternatives considered**:
- Using `apiFetch` with a custom formatter — not possible due to JSON restriction
- Adding multipart support to `apiFetch` — would add complexity to a JSON-focused client

### 2. Document Upload Flow

**Decision**: Implement a custom fetch helper for the three-phase document upload

**Rationale**:
1. `POST .../request-upload-url?filename=...` — returns a presigned upload URL (response body shape TBD at runtime)
2. `PUT {presigned_url}` — upload the file directly to the presigned URL with `Content-Type: application/octet-stream`
3. `POST .../confirm-upload` with `{ key: "..." }` — confirms upload, returns updated `ItemOut`

**Key details**:
- The `request-upload-url` response is `{}` in the OpenAPI spec — we'll type it as `{ url: string; key: string }` at runtime
- The presigned URL upload is a direct `PUT` to an external URL (not the app API)
- No additional packages needed — browser `fetch()` handles this natively

### 3. Item Display Location

**Decision**: Items render inside each `LessonCard` when the lesson is expanded, following the same pattern as chapter → lesson expansion

**Rationale**:
- Consistent UX: chapters expand to show lessons, lessons expand to show items
- No new page navigation needed
- Leverages existing `ChapterCard` expansion pattern (bordered container below header)
- Teachers can see items at a glance without navigating away

**UI hierarchy**:
```
Chapter → [expand] → Lessons → [expand] → Items
```

### 4. Item File Structure

**Decision**: Follow the exact same file organization pattern as chapters and lessons

| File | Purpose |
|------|---------|
| `items-schema.ts` | Zod schemas: `ItemOut`, `ItemCreate`, `ItemUpdate` |
| `items-queries.ts` | Server-only data fetching: `listItems(courseId, lessonId)` |
| `items-actions.ts` | Server actions: `createItem`, `updateItem`, `deleteItem`, `reorderItems`, `uploadItemVideo`, `requestUploadUrl`, `confirmUpload` |
| `components/item-card.tsx` | Item display card with type badge, actions |
| `components/item-list.tsx` | Sortable item list with @dnd-kit, create dialog |

### 5. Video Upload UX

**Decision**: Show a simple file input (hidden) triggered by a "Upload Video" button. On file selection, upload immediately with a loading spinner overlay on the item card. No progress bar for MVP.

**Rationale**:
- Simple to implement
- Consistent with common file upload patterns
- Progress tracking requires XHR which adds complexity
- `sonner` toast for success/error feedback

## File Upload Helper

A small utility function for multipart uploads and presigned URL uploads will be needed in `src/lib/api/upload.ts`:
- `uploadFile(url, file)` — sends file as multipart/form-data
- `uploadToPresignedUrl(url, file)` — PUT file to external URL

## Dependencies

| Package | Purpose | Required? |
|---------|---------|-----------|
| None | All uploads use native `fetch()` | No new packages needed |
