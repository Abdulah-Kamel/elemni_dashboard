# Data Model: Chapter Reorder

## Client-Side State

### Chapter (from API — `ChapterOut`)

| Field | Type | Description |
|-------|------|-------------|
| id | `number` | Unique identifier |
| course_id | `number` | Parent course ID |
| title | `string` | Chapter display name |
| order | `number` | Sort position (1-based) |

### ReorderItem (sent to API)

| Field | Type | Description |
|-------|------|-------------|
| id | `number` | Chapter ID |
| order | `number` | New sort position |

### ReorderRequest (API payload)

```typescript
{
  items: ReorderItem[]  // Full ordered list of all chapters
}
```

### ReorderState (component-local)

| Field | Type | Description |
|-------|------|-------------|
| chapters | `ChapterOut[]` | Currently displayed order (may differ from server) |
| activeId | `number \| null` | Chapter currently being dragged (null when idle) |
| optimistic | `boolean` | Whether the current state is optimistic (not yet confirmed) |
| error | `string \| null` | Reorder error message |

## State Transitions

```
IDLE → DRAGGING (user picks up a chapter)
  → REORDERING (chapters shift as user drags over targets)
    → OPTIMISTIC_CONFIRMED (user drops — UI updates instantly)
      → SERVER_CONFIRMED (API returns 200 — state matches server)
      → SERVER_FAILED (API error — revert to previous order)
    → CANCELLED (user presses Escape — revert to original order)
```

## API Contract

**Endpoint**: `PUT /api/v1/courses/{courseId}/chapters/reorder`

**Request**:
```json
{
  "items": [
    { "id": 1, "order": 1 },
    { "id": 3, "order": 2 },
    { "id": 2, "order": 3 }
  ]
}
```

**Response (200)**:
```json
[
  { "id": 1, "course_id": 7, "title": "...", "order": 1 },
  { "id": 3, "course_id": 7, "title": "...", "order": 2 },
  { "id": 2, "course_id": 7, "title": "...", "order": 3 }
]
```

**Error (409)**: `{ "detail": "Course was modified. Please refresh and try again." }`
