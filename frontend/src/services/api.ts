const API_BASE_URL = "http://localhost:3000";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

async function getErrorMessage(response: Response) {
  const errorData = await response.json().catch(() => null);
  return errorData?.message || `Request failed with status ${response.status}`;
}

export async function getApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<T> = await response.json();
  return result.data as T;
}

export async function postApi<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: ApiResponse<T> = await response.json();
  return result.data as T;
}

export async function putApi(path: string, data: unknown): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  await response.json();
}