/**
 * MCP Tool: submitRunEvent
 * Posts an event to the CONTINUUM ingestion API.
 * Reuses API's dedup + validation logic (E11000, $jsonSchema).
 */
export async function submitRunEvent(
  apiBaseUrl: string,
  event: {
    _id: string;
    run_id: string;
    type: string;
    step?: number;
    payload?: Record<string, any>;
    error_message?: string;
  }
): Promise<{ success: boolean; message: string; event?: any; error?: string; code?: string }> {
  try {
    const response = await fetch(`${apiBaseUrl}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });

    const data = await response.json() as any;

    if (response.status === 409) {
      return { success: false, message: "Duplicate event rejected by DB", code: "DUPLICATE_EVENT", error: data.error };
    }
    if (response.status === 422 || response.status === 400) {
      return { success: false, message: "Schema validation failed", code: "SCHEMA_VIOLATION", error: data.error };
    }
    if (!response.ok) {
      return { success: false, message: "API error", error: data.error };
    }

    return { success: true, message: "Event submitted successfully", event: data };
  } catch (err: any) {
    return { success: false, message: "Network error", error: err.message };
  }
}
