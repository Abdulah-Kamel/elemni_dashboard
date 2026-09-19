# Dual-Media Item Creation Design

## Goal

Allow a teacher to create one lesson item with a video, a PDF document, or both without leaving the creation flow.

## Scope

This is a dashboard-only change. No backend source files, tests, schemas, endpoints, models, or migrations will be modified.

### In Scope

- Replace the create-item type choice with independent video and PDF attachment rows.
- Require at least one attachment before submission.
- Upload both selected files sequentially to the same item.
- Preserve successful work when a later upload fails.
- Retry only failed uploads without creating a duplicate item.
- Keep existing single-attachment editing behavior unchanged.
- Add dashboard tests for creation, validation, partial failure, and retry behavior.

### Out Of Scope

- Backend changes of any kind.
- New combined or batch-upload endpoints.
- Database migrations or item schema changes.
- Parallel uploads.
- Changes to exam attachment behavior.
- Redesigning the existing item edit dialog.

## Current State

The item model already exposes `bunny_stream_id` and `document_path` as independent nullable fields. The dashboard already uses separate request, direct upload, confirmation, and deletion endpoints for each attachment type. Existing items can therefore contain both attachments, and the edit dialog manages both independently.

The gap is the create flow in `ItemList`. Its shared `UploadDialog` requires the teacher to choose either video or document, accepts one file, uploads it, and closes. Adding the second attachment requires reopening the created item through Edit.

## Architecture

Add a creation-specific dialog for creating lesson items. Keep the existing `UploadDialog` for adding one missing attachment to an existing item.

The create dialog owns:

- the item title
- the selected video file
- the selected PDF file
- the created item identity
- per-attachment upload state
- per-attachment failure state

`ItemList` continues to own item mutations, query-cache updates, curriculum notifications, and the existing upload action calls. No new API abstraction is required.

## Interaction Design

### Step 1: Item Title

The teacher enters a required title using the existing 200-character limit. Continuing is disabled until the trimmed title is non-empty.

### Step 2: Attachments

Show a compact attachment checklist with two independent rows:

- Video, optional
- PDF document, optional

Each row allows the teacher to choose, replace, or remove its file before submission. A selected row displays the filename. The final action is disabled until at least one valid file is selected.

The primary action reads `Create item` when one file is selected and `Create item with 2 files` when both are selected. Equivalent Arabic copy is required.

### Upload State

Each selected row can display:

- Selected
- Uploading
- Uploaded
- Failed

The dialog cannot be dismissed while an upload request is active. After a partial failure, it may be closed; the successfully created item and attachments remain available in the curriculum and can be completed later through Edit.

## Data Flow

1. Validate the trimmed title and require at least one selected file.
2. Create the item once through the existing create mutation.
3. Store the returned item identity in the active dialog flow.
4. If a video is selected and not already uploaded, request video credentials, upload through Bunny TUS, and confirm the video.
5. Update the item cache and notify the course preview after successful video confirmation.
6. If a PDF is selected and not already uploaded, request its presigned URL, upload it, and confirm the document.
7. Update the item cache and notify the course preview after successful document confirmation.
8. Close and reset the dialog only after all selected attachments succeed.

Uploads are sequential, with video first and PDF second. A retry resumes from the first failed or incomplete attachment and skips every attachment already confirmed.

## Failure Handling

- Failure before item creation leaves no item and permits a full retry.
- Failure after item creation retains the created item ID so retry does not create another item.
- If video succeeds and PDF fails, retain the video and show only the PDF as failed.
- Retrying after a partial failure uploads only the PDF.
- Existing API error messages are shown when available, with the current localized generic upload error as fallback.
- Closing after a partial failure preserves the partial item; it does not attempt rollback or remote asset deletion.
- Reopening a fresh create flow resets all prior item and attachment state.

## Backend Compatibility

The existing backend already supports the required state and operations:

- video and document references coexist on one item
- video and document uploads use independent endpoint flows
- confirming one attachment does not clear the other
- deleting one attachment does not remove the other reference

This design intentionally relies on that existing behavior and makes no backend changes.

## Testing

### Creation Dialog

- Requires a non-empty title.
- Requires at least one attachment.
- Accepts video only.
- Accepts PDF only.
- Accepts both video and PDF.
- Rejects invalid video files, oversized videos, and non-PDF documents using existing constraints.
- Shows selected filenames and allows replacing or removing each selection.
- Prevents dismissal while an upload is active.
- Provides English and Arabic labels for new states and actions.

### Upload Orchestration

- Creates one item and uploads a selected video.
- Creates one item and uploads a selected PDF.
- Creates one item, uploads video, then uploads PDF.
- Updates the cached item after each successful confirmation.
- Notifies the curriculum preview after creation and successful attachment confirmations.
- Preserves the created item and successful video when PDF upload fails.
- Retries only the failed PDF without recreating the item or re-uploading the video.
- Resets all flow state after complete success or when opening a new creation flow.

### Regression Coverage

- Existing item editing can still add either missing attachment independently.
- Existing video-only and document-only items continue to render and upload correctly.
- Existing item reorder and deletion behavior remains unchanged.

## Verification

Run dashboard unit tests, TypeScript checking, and linting. No backend test suite is required because backend files are out of scope.

## Success Criteria

- A teacher can create an item with only a video, only a PDF, or both.
- Selecting both creates exactly one item and associates both uploads with it.
- Video uploads before PDF when both are selected.
- A second-upload failure never discards the first successful attachment.
- Retrying a partial failure never creates a duplicate item or repeats successful uploads.
- Existing edit and upload flows continue to work.
- No backend repository file is changed.
