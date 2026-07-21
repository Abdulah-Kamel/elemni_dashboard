# Contracts: Chapter Reorder with Animations

## Server Action Contract

### `reorderChapters(courseId, items): ActionResult<ChapterOut[]>`

**Location**: `src/features/course-management/chapters-actions.ts`

**Input**:
- `courseId: number` — parent course ID
- `items: Array<{ id: number; order: number }>` — full ordered list

**Returns**: `ActionResult<ChapterOut[]>`
- `{ success: true; data: ChapterOut[] }` on success
- `{ success: false; error: { type, message, fields? } }` on failure

**Behavior**:
- Calls `PUT /api/v1/courses/{courseId}/chapters/reorder`
- Sends `{ items: [{ id, order }, ...] }` in request body
- Revalidates cache tag `chapters:${courseId}`
- On `Unauthorized`: redirects to sign-out
- On `Conflict` (409): returns error with message from spec FR-06

## Component Contracts

### `ReorderableChapterListProps`

Extended version of existing `ChapterListProps` with reorder state:

```typescript
interface ReorderableChapterListProps {
  initialChapters: ChapterOut[];
  courseId: number;
  lessons?: LessonOut[];
  lessonError?: string | null;
  error: string | null;
}
```

### `ReorderButtonBarProps`

```typescript
interface ReorderButtonBarProps {
  chapter: ChapterOut;
  chapters: ChapterOut[];
  onMoveUp: (chapterId: number) => void;
  onMoveDown: (chapterId: number) => void;
}
```

### Drag Event Contracts

- **DragStart**: `{ active: { id: string } }`
- **DragOver**: `{ active: { id: string }, over: { id: string } | null }`
- **DragEnd**: `{ active: { id: string }, over: { id: string } | null }`
- **DragCancel**: `{ active: { id: string } }`
