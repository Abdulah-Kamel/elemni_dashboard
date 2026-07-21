# Research: Hybrid Course Content Editor

## Unknowns Resolved

### 1. Concurrent Edit Risk (No version field)

**Decision**: Optimistic update with rollback on error. No explicit conflict resolution.

**Rationale**: Since ChapterOut/LessonOut/ItemOut have no `updated_at` or version field, there is no mechanism to detect when another teacher has modified the same entity between read and write. The reorder endpoint sends a full `{id, order}[]` array each time. The last write wins. The UI:
1. Applies reorder optimistically (instant visual feedback)
2. Sends the reorder request to the API
3. On error (4xx/5xx) → reverts to previous order and shows an error toast with a "Refresh" action
4. On success → keeps the new order silently

**Alternatives considered**:
- Adding a version field client-side — would be ignored by the API since the backend doesn't use one
- Polling for changes — unnecessary complexity for single-teacher editing

---

### 2. Reorder Payload Format

**Decision**: Always send integer orders (1, 2, 3...n) in the `ReorderItem[]` array. Treat the API's fractional order support as an internal implementation detail.

**Rationale**: The OpenAPI spec defines `ReorderItem.order` as `number` (not integer), but the frontend always knows the exact position after a drag. Sending sequential integers is cleaner and matches what the UI displays. The API may recalculate internally — that's its concern.

**Edge case**: When dragging an item to position 3 between positions 2 and 3 (fractional 2.5), the frontend renumbers all siblings sequentially: `items.map((item, idx) => ({ id: item.id, order: idx + 1 }))`.

---

### 3. Lesson/Item Detail Surface: Panel, Not Route

**Decision**: Use a `Sheet` (slide-over panel) from shadcn/ui for lesson/item detail surfaces. Not a route.

**Rationale**:
- The spec requires preserving scroll position and expanded lesson states when navigating back
- A route would cause a full navigation, losing all local component state (expanded items, scroll position)
- A panel overlays on the current page, preserving all context beneath
- On mobile, a panel takes the full screen but can be dismissed to return exactly where the teacher was
- Cross-chapter lesson moves (open question in spec): use a "Move to Chapter" action in the ⋯ menu that opens a chapter picker dialog. This is a menu action, not a drag gesture.

**Design reference**: The mockups (`hybrid_chapter_page.html`) show all item operations happening inline within the lesson expansion. There is no separate detail page in the mockups — confirming the panel approach.

---

### 4. Item Processing States — Frontend Implementation

**Decision**: Infer processing state from the API response fields. Track local-only states during upload.

**State mapping**:

| State | Detection | UI Treatment |
|-------|-----------|-------------|
| `empty` | `bunny_stream_id = null` AND `document_path = null` AND no upload in progress | Show upload action buttons |
| `uploading` | Local state flag (`useState`) | Spinner on item tile, "Uploading..." text |
| `processing` | Video upload just completed (Bunny transcoding). Inferred within first 30s after upload finishes before `bunny_stream_id` becomes non-null. | Amber chip with loader icon |
| `ready` | `bunny_stream_id` is non-null (video) OR `document_path` is non-null (document) | Green "جاهز" chip |
| `failed` | Upload error or explicit API error | Red chip, error toast |

**Bubble-up to lesson**: When any item in a lesson has a non-ready state (uploading, processing, failed), the lesson row shows a small badge indicating the state. The mockup `hybrid_chapter_page.html` shows this: the second lesson "المجال الكهربي" has an amber "بيتحول" badge next to the ⋯ menu.

---

### 5. Cross-Chapter Lesson Moves

**Decision**: Option B — "Move to Chapter" action inside the ⋯ `DropdownMenu`.

**Implementation**: Selecting "Move to Chapter" opens a `Dialog` with a radio list of available chapters (fetched from the course). Selecting a chapter and confirming moves the lesson via a server action (if the API supports it) or via delete+recreate (if not). This is scoped to a future enhancement; the ⋯ menu shows the option but it may be disabled or not implemented in v1 depending on API support.
