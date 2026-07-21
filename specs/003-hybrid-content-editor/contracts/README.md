# API Contracts: Hybrid Course Content Editor

## Overview

All API contracts are defined in `openapi.json` at the project root. This file documents the frontend-to-backend interface for course content operations.

**Base URL**: `/api/v1`

**Auth**: All endpoints require a valid session cookie (set by the auth system). 401 responses redirect to sign-in.

**Content-Type**: Except where noted, all requests use `application/json`. Responses are always `application/json`.

---

## Endpoint Reference

### Chapters

| Method | Path | Operation | Body | Response |
|--------|------|-----------|------|----------|
| GET | `/courses/{course_id}/chapters` | List chapters | — | `ChapterOut[]` |
| POST | `/courses/{course_id}/chapters` | Create chapter | `ChapterCreate` | `ChapterOut` (201) |
| PATCH | `/courses/{course_id}/chapters/{chapter_id}` | Update chapter | `ChapterUpdate` | `ChapterOut` |
| DELETE | `/courses/{course_id}/chapters/{chapter_id}` | Delete chapter | — | 204 |
| PUT | `/courses/{course_id}/chapters/reorder` | Reorder chapters | `ReorderRequest` | `ChapterOut[]` |

### Lessons

| Method | Path | Operation | Query | Body | Response |
|--------|------|-----------|-------|------|----------|
| GET | `/courses/{course_id}/lessons` | List lessons | `chapter_id?` | — | `LessonOut[]` |
| POST | `/courses/{course_id}/lessons` | Create lesson | `chapter_id?` | `LessonCreate` | `LessonOut` (201) |
| PATCH | `/courses/{course_id}/lessons/{lesson_id}` | Update lesson | — | `LessonUpdate` | `LessonOut` |
| DELETE | `/courses/{course_id}/lessons/{lesson_id}` | Delete lesson | — | — | 204 |
| PUT | `/courses/{course_id}/lessons/reorder` | Reorder lessons | — | `ReorderRequest` | `LessonOut[]` |

### Items

| Method | Path | Operation | Body | Response |
|--------|------|-----------|------|----------|
| GET | `/courses/{course_id}/lessons/{lesson_id}/items` | List items | — | `ItemOut[]` |
| POST | `/courses/{course_id}/lessons/{lesson_id}/items` | Create item | `ItemCreate` | `ItemOut` (201) |
| PATCH | `/courses/{course_id}/items/{item_id}` | Update item | `ItemUpdate` | `ItemOut` |
| DELETE | `/courses/{course_id}/items/{item_id}` | Delete item | — | 204 |
| PUT | `/courses/{course_id}/lessons/{lesson_id}/items/reorder` | Reorder items | `ReorderRequest` | `ItemOut[]` |
| POST | `/courses/{course_id}/lessons/{lesson_id}/items/{item_id}/upload-video` | Upload video | multipart/form-data with `file` field | `ItemOut` |
| POST | `/courses/{course_id}/lessons/{lesson_id}/items/{item_id}/request-upload-url` | Request upload URL | query: `filename` | `UploadUrlResponse` |
| POST | `/courses/{course_id}/lessons/{lesson_id}/items/{item_id}/confirm-upload` | Confirm document upload | body: `{ key: string }` | `ItemOut` |

---

## Request/Response Schemas

### ChapterOut

```json
{
  "id": 1,
  "course_id": 1,
  "title": "الكهربية الساكنة",
  "order": 1
}
```

### LessonOut

```json
{
  "id": 1,
  "course_id": 1,
  "chapter_id": 1,
  "title": "قانون كولوم",
  "description": "شرح قانون كولوم وقانون الجذب العام",
  "order": 1
}
```

### ItemOut

```json
{
  "id": 1,
  "lesson_id": 1,
  "title": "فيديو الشرح",
  "bunny_stream_id": "abc-123-def",
  "document_path": null,
  "exam_id": null,
  "order": 1
}
```

### ReorderRequest

```json
{
  "items": [
    { "id": 1, "order": 1 },
    { "id": 2, "order": 2 },
    { "id": 3, "order": 3 }
  ]
}
```
