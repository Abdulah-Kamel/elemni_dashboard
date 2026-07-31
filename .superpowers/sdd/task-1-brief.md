### Task 1: Install `react-easy-crop` and widen `uploadToPresignedUrl` to accept `Blob`

**Files:**
- Modify: `package.json`
- Modify: `src/lib/upload.ts`

**Interfaces:**
- Consumes: (none)
- Produces: `uploadToPresignedUrl(url: string, file: File | Blob): Promise<Response>` — signature widened from `File` to `File | Blob` to accommodate the crop modal's output.

#### Steps

- [ ] **Step 1: Install `react-easy-crop`**

```bash
npm install react-easy-crop@6.2.3
```

Expected: installs `react-easy-crop@6.2.3` in `node_modules` and `package.json`.

- [ ] **Step 2: Widen `uploadToPresignedUrl` parameter type**

Edit `src/lib/upload.ts` — change the `file` parameter type from `File` to `File | Blob`:

```ts
export async function uploadToPresignedUrl(url: string, file: File | Blob): Promise<Response> {
  return fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": "application/octet-stream" },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json src/lib/upload.ts
git commit -m "chore: install react-easy-crop, widen uploadToPresignedUrl to accept Blob"
```
