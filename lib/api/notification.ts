/**
 * Notifications API Service
 * Handles all notification-related API operations
 */
function getAuthHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export interface INotification {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  notificationType: "announcement" | "info" | "results";
priorityLevel: "High" | "Medium" | "Low";
targetGroup: "college" | "year" | "batch" | "department";
  createdBy?: string;
  targetID?: string | null;
  targetUsers?: string[];
  readBy?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
 notificationType?: "announcement" | "info" | "results";
priorityLevel?: "High" | "Medium" | "Low";
targetGroup: "college" | "year" | "batch" | "department";
  targetID?: string | null;
  targetUsers?: string[];
}

export interface UpdateNotificationPayload {
  title?: string;
  message?: string;
  notificationType?: "announcement" | "info" | "results";
  priorityLevel?: "High" | "Medium" | "Low";
  targetGroup?: "college" | "year" | "batch" | "department";
  targetID?: string | null;
  targetUsers?: string[];
}

interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

/**
 * Fetch all notifications for the logged-in user
 */
export async function listNotifications(): Promise<INotification[]> {
  try {
    const response = await fetch(`${API_BASE}/notifications`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

  if (!response.ok) {
  const error = await response.json().catch(() => ({
    message: "Failed to fetch notifications",
  }));
  throw new Error(error.message);
}

    const result: ApiResponse<{ notifications: INotification[] }> = await response.json();
    return result.data.notifications || [];
} catch (error) {
  console.error("Failed to fetch notifications:", error);
  throw error;
}
}
/**
 * Create a new notification (staff only)
 */
export async function createNotification(
  payload: CreateNotificationPayload
): Promise<INotification> {
   
  // Validate required fields
  if (!payload.title || !payload.title.trim()) {
    throw new Error("Title is required");
  }
  if (!payload.message || !payload.message.trim()) {
    throw new Error("Message is required");
  }
const response = await fetch(`${API_BASE}/notifications`, {
  method: "POST",
  headers: getAuthHeaders(),
  credentials: "include",
 body: JSON.stringify({
  title: payload.title.trim(),
  message: payload.message.trim(),
  notificationType: payload.notificationType || "info",
  priorityLevel: payload.priorityLevel || "Low",
  targetGroup: payload.targetGroup,
  targetID:
    payload.targetGroup === "college"
      ? null
      : payload.targetUsers?.some((u) =>
          ["parent", "teacher", "staff"].includes(u)
        )
      ? "all"
      : payload.targetID,
  targetUsers: payload.targetUsers || ["student"],
}),
});

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to create notification" }));
    throw new Error(error.message || "Failed to create notification");
  }

  const result: ApiResponse<INotification> = await response.json();
  return result.data;
}

/**
 * Update an existing notification (staff only)
 */
export async function updateNotification(
  id: string,
  payload: UpdateNotificationPayload
): Promise<INotification> {
    
  if (!id) {
    throw new Error("Notification ID is required");
  }

  const response = await fetch(`${API_BASE}/notifications/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to update notification" }));
    throw new Error(error.message || "Failed to update notification");
  }

  const result: ApiResponse<{ notification: INotification }> = await response.json();
  return result.data.notification;
}

/**
 * Delete a notification (staff only)
 */
export async function deleteNotification(id: string): Promise<void> {
 
  if (!id) {
    throw new Error("Notification ID is required");
  }

  const response = await fetch(`${API_BASE}/notifications/${id}`, {
       method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to delete notification" }));
    throw new Error(error.message || "Failed to delete notification");
  }
}
export async function getUnreadCount(): Promise<number> {
  try {
    const notifications = await listNotifications();
    return notifications.filter((n) => !n.readBy || n.readBy.length === 0).length;
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
}
export async function listBatches() {
  const response = await fetch(`${API_BASE}/batches`, {
    method: "GET",
    headers: getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch batches");
  }
  return result.data || [];
}