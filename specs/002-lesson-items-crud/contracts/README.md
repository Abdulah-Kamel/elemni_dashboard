# Contracts: Lesson Items CRUD

## Server Action Contracts

### `createItem(courseId, lessonId, data): ActionResult<ItemOut>`

- `POST /api/v1/courses/{courseId}/lessons/{lessonId}/items`
- Body: `ItemCreate` (title required)
- Returns: `{ success: true, data: ItemOut }` or `{ success: false, error }`
- Revalidates cache tag `items:${courseId}:${lessonId}`
- On 401: redirect to sign-out

### `updateItem(courseId, itemId, data): ActionResult<ItemOut>`

- `PATCH /api/v1/courses/{courseId}/items/{itemId}`
- Body: `ItemUpdate` (all fields optional)
- Returns: `{ success: true, data: ItemOut }` or `{ success: false, error }`
- Revalidates cache tag `items:${courseId}:*`
- On 401: redirect to sign-out

### `deleteItem(courseId, itemId): ActionResult<void>`

- `DELETE /api/v1/courses/{courseId}/items/{itemId}`
- Returns: `{ success: true, data: undefined }` or `{ success: false, error }`
- Revalidates

### `reorderItems(courseId, lessonId, items): ActionResult<ItemOut[]>`

- `PUT /api/v1/courses/{courseId}/lessons/{lessonId}/items/reorder`
- Body: `{ items: ReorderItem[] }`
- Returns: `ChapterOut[]` in same pattern as chapters/lessons

### `uploadItemVideo(courseId, lessonId, itemId, file): ActionResult<ItemOut>`

- `POST .../upload-video` (multipart/form-data)
- NOT using `apiFetch` — uses raw `fetch()` with `FormData`
- On success: returns updated ItemOut with `bunny_stream_id` set
- Shows loading state during upload

### Document Upload Flow

1. `requestUploadUrl(courseId, lessonId, itemId, filename)` → `{ url: string, key: string }`
   - Uses `apiFetch` (JSON request, JSON response)
2. Upload file to `url` via `PUT` with `Content-Type: application/octet-stream`
   - Raw `fetch()` to external presigned URL
3. `confirmUpload(courseId, lessonId, itemId, key)` → `ItemOut`
   - Uses `apiFetch` (JSON request, JSON response)

## Component Contracts

### `ItemListProps`

```typescript
interface ItemListProps {
  initialItems: ItemOut[];
  courseId: number;
  lessonId: number;
  error: string | null;
}
```

### `ItemCardProps`

```typescript
interface ItemCardProps {
  item: ItemOut;
  courseId: number;
  lessonId: number;
  onUpdate: (item: ItemOut) => void;
  onDelete: (itemId: number) => void;
}
```

### SortableItemCard (internal wrapper)

Same pattern as `SortableChapterCard` / `SortableLessonCard` — wraps `ItemCard` with `useSortable` from @dnd-kit.

## Endpoints to Add in `endpoints.ts`

```typescript
items: {
  list: (courseId: number, lessonId: number) =>
    `/api/v1/courses/${courseId}/lessons/${lessonId}/items`,
  detail: (courseId: number, itemId: number) =>
    `/api/v1/courses/${courseId}/items/${itemId}`,
  reorder: (courseId: number, lessonId: number) =>
    `/api/v1/courses/${courseId}/lessons/${lessonId}/items/reorder`,
  uploadVideo: (courseId: number, lessonId: number, itemId: number) =>
    `/api/v1/courses/${courseId}/lessons/${lessonId}/items/${itemId}/upload-video`,
  requestUploadUrl: (courseId: number, lessonId: number, itemId: number) =>
    `/api/v1/courses/${courseId}/lessons/${lessonId}/items/${itemId}/request-upload-url`,
  confirmUpload: (courseId: number, lessonId: number, itemId: number) =>
    `/api/v1/courses/${courseId}/lessons/${lessonId}/items/${itemId}/confirm-upload`,
}
```

## Cache Tags

- `items:${courseId}:${lessonId}` — for list and mutations
