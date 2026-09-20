# Remove Item Upload Size Limit

## Scope

Remove the dashboard's hardcoded 500 MB client-side size check for item video
attachments. The dashboard must continue validating attachment type, attachment
count, and duplicate attachment types.

## Design

The item upload validator remains the boundary for fast client-side shape and
type validation, but it no longer enforces a byte-size policy. The video branch
will reject non-video MIME types and accept videos of any size. The upload flow
is unchanged: it requests an upload target, streams the file to Bunny, and
surfaces provider/API failures through the existing upload error state.

No backend endpoint, storage configuration, or document-upload behavior changes
are included. Any operational or provider limit remains authoritative outside
the dashboard.

## Testing

- Remove the `MAX_VIDEO_SIZE` constant and `video_too_large` validation error.
- Update unit coverage so an oversized video file is accepted.
- Preserve coverage for invalid video types and existing attachment-selection
  constraints.
- Run the focused validator tests and the dashboard lint/build checks available
  in the repository.
