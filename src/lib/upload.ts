export async function uploadFile(url: string, file: File): Promise<Response> {
  const formData = new FormData();
  formData.append("file", file);
  return fetch(url, { method: "POST", body: formData });
}

export async function uploadToPresignedUrl(url: string, file: File): Promise<Response> {
  return fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": "application/octet-stream" },
  });
}
