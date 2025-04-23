const API_BASE_URL = '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...restOptions } = options;
  
  // Construct URL with query parameters
  const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  try {
    const response = await fetch(url.toString(), {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...restOptions.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Example usage:
// GET request
export async function getData() {
  return apiRequest<YourResponseType>('/data');
}

// POST request
export async function postData(data: YourDataType) {
  return apiRequest<YourResponseType>('/data', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// PUT request
export async function updateData(id: string, data: YourDataType) {
  return apiRequest<YourResponseType>(`/data/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// DELETE request
export async function deleteData(id: string) {
  return apiRequest<YourResponseType>(`/data/${id}`, {
    method: 'DELETE',
  });
}

// Example component
async function MyComponent() {
  try {
    const data = await getData();
    // Handle the data
  } catch (error) {
    // Handle errors
  }
} 