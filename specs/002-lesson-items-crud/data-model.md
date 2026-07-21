# Data Model: Lesson Items

## Item (from API — `ItemOut`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | `number` | Yes | Unique identifier |
| lesson_id | `number` | Yes | Parent lesson ID |
| title | `string` | Yes | Display name (max 200 chars) |
| bunny_stream_id | `string \| null` | Yes (nullable) | Bunny CDN video stream ID |
| document_path | `string \| null` | Yes (nullable) | Document file path |
| exam_id | `number \| null` | Yes (nullable) | Linked exam ID |
| order | `number` | Yes | Sort position (1-based) |

## Item Type (derived field, not in API)

| Condition | Type | Display |
|-----------|------|---------|
| `bunny_stream_id` is set | `Video` | 🎬 Video badge |
| `document_path` is set | `Document` | 📄 Document badge |
| `exam_id` is set | `Exam` | ✍️ Exam badge |
| None set | `Text` | Text-only (no badge) |

Priority: Video > Document > Exam (if multiple set, first match wins)

## Create / Update Schemas

### ItemCreate

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | `string` | Yes | 1-200 characters |
| document_path | `string \| null` | No | Pre-set document path (optional) |
| exam_id | `number \| null` | No | Pre-link exam (optional) |

### ItemUpdate

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | `string` | No | 1-200 characters |
| document_path | `string \| null` | No | Update or clear document |
| exam_id | `number \| null` | No | Update or clear exam link |

## Reorder

Reuses existing `ReorderItem` schema from `chapters-schema.ts`:
```typescript
{ id: number; order: number }
```

Request body: `{ items: ReorderItem[] }`

## State Transitions

```
EMPTY (text-only) → VIDEO (upload video)
                   → DOCUMENT (upload document)
                   → EXAM (link exam)
```

Items can have multiple content types (e.g., video + document).
