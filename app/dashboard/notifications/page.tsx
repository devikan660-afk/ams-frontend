"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Info,
  Plus,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  listNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  listBatches,
  INotification,
  CreateNotificationPayload,
  UpdateNotificationPayload,
} from "@/lib/api/notification";

interface DisplayNotification extends INotification {
  type?: "info" | "warning" | "success" | "announcement";
}

type FormData = {
  title: string;
  message: string;
  notificationType: "announcement" | "info" | "warning" | "success";
  priorityLevel: "High" | "Medium" | "Low";
  targetGroup: "college" | "year" | "batch" | "department";
  targetID: string;
  targetUsers: string[];
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const AnyStaff =
    user?.role === "staff" ||
    user?.role === "teacher" ||
    user?.role === "admin" ||
    user?.role === "principal" ||
    user?.role === "hod";

  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<DisplayNotification | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    message: "",
    notificationType: "announcement",
    priorityLevel: "low",
    targetGroup: "college",
    targetID: "",
    targetUsers: [],
  });

  useEffect(() => {
    loadNotifications();
  }, []);
  useEffect(() => {
  if (formData.targetGroup === "batch") {
    loadBatches();
  }
}, [formData.targetGroup]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await listNotifications();
      const displayed = data.map((n) => ({
        ...n,
        type: mapNotificationType(n.notificationType),
      }));
      setNotifications(displayed);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };
  const loadBatches = async () => {
  try {
    const data = await listBatches();
    setBatches(data);
  } catch (error) {
    toast.error("Failed to load batches");
  }
};

  const mapNotificationType = (type: string): "info" | "warning" | "success" | "announcement" => {
    switch (type) {
      case "success": return "success";
      case "warning": return "warning";
      case "announcement": return "announcement";
      case "info":
      default: return "info";
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      notificationType: "announcement",
      priorityLevel: "Low",
      targetGroup: "college",
      targetID: "",
      targetUsers: [],
    });
  };

  const handleCreateNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    try {
      setIsCreating(true);
      const payload: CreateNotificationPayload = {
        title: formData.title,
        message: formData.message,
        notificationType: formData.notificationType,
        priorityLevel: formData.priorityLevel,
        targetGroup: formData.targetGroup,
        ...(formData.targetGroup !== "college" && { targetID: formData.targetID || null }),
        targetUsers: formData.targetUsers,
      };

      await createNotification(payload);
      toast.success("Notification created successfully");
      resetForm();
      setIsCreateOpen(false);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to create notification:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create notification");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateNotification = async () => {
    if (!editingNotification?._id || !formData.title.trim() || !formData.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    try {
      setIsCreating(true);
      const payload: UpdateNotificationPayload = {
        title: formData.title,
        message: formData.message,
        notificationType: formData.notificationType,
        priorityLevel: formData.priorityLevel,
      };

      await updateNotification(editingNotification._id, payload);
      toast.success("Notification updated successfully");
      setEditingNotification(null);
      resetForm();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to update notification:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update notification");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNotification = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      await deleteNotification(id);
      toast.success("Notification deleted successfully");
      await loadNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete notification");
    }
  };

  const openEditDialog = (notification: DisplayNotification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      notificationType: notification.notificationType as any,
      priorityLevel: notification.priorityLevel,
      targetGroup: notification.targetGroup,
      targetID: notification.targetID || "",
      targetUsers: notification.targetUsers || [],
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case "success": return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "info": return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "warning": return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400">Warning</Badge>;
      case "success": return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Success</Badge>;
      case "info": return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">Info</Badge>;
      default: return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400">Announcement</Badge>;
    }
  };

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        <div className="font-semibold text-2xl">Notifications</div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-2xl">Notifications</div>
        {AnyStaff && (
          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Notification</DialogTitle>
                <DialogDescription>Post a notification for your students</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Notification title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Notification message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={formData.notificationType} onValueChange={(value: any) => setFormData({ ...formData, notificationType: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={String(formData.priorityLevel)} onValueChange={(value) => setFormData({ ...formData, priorityLevel: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                     <SelectItem value="High">High</SelectItem>
<SelectItem value="Medium">Medium</SelectItem>
<SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Group</Label>
                  <Select value={formData.targetGroup} onValueChange={(value: any) => setFormData({ ...formData, targetGroup: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="college">College Wide</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="batch">Batch</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                
                    </SelectContent>
                  </Select>
                </div>
               {formData.targetGroup !== "college" && (
  <div>
    <Label htmlFor="targetID">Target ID</Label>

    {formData.targetGroup === "batch" ? (
      <Select
        value={formData.targetID}
        onValueChange={(value) =>
          setFormData({ ...formData, targetID: value })
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Batch" />
        </SelectTrigger>
        <SelectContent>
          {batches.map((batch) => (
            <SelectItem key={batch._id} value={batch._id}>
              {batch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : (
      <Input
        id="targetID"
        placeholder={`Enter ${formData.targetGroup} identifier`}
        value={formData.targetID}
        onChange={(e) =>
          setFormData({ ...formData, targetID: e.target.value })
        }
      />
    )}
  </div>
)}
              
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>Cancel</Button>
                <Button onClick={handleCreateNotification} disabled={isCreating}>
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {sortedNotifications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedNotifications.map((notification) => (
            <div
              key={notification._id || notification.id}
              className={`p-4 border rounded-lg transition-colors flex justify-between items-start ${
                notification.isRead ? "border-border bg-muted/20" : "border-primary/30 bg-primary/5"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-2">
                  <div className="mt-0.5">{getNotificationIcon(notification.type || "announcement")}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      {getNotificationBadge(notification.type || "announcement")}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Posted by {typeof notification.createdBy === "object" ? (notification.createdBy as any)?.name : notification.createdBy || "Unknown"}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(notification.createdAt || 0), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
              {AnyStaff && (
                <div className="flex gap-2 ml-4">
                  <Dialog
                    open={editingNotification?._id === notification._id && !!notification._id}
                    onOpenChange={(open) => { if (!open) { setEditingNotification(null); resetForm(); } }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(notification)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Notification</DialogTitle>
                        <DialogDescription>Update the notification details</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="edit-title">Title</Label>
                          <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div>
                          <Label htmlFor="edit-message">Message</Label>
                          <Textarea id="edit-message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select value={formData.notificationType} onValueChange={(value: any) => setFormData({ ...formData, notificationType: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="announcement">Announcement</SelectItem>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="success">Success</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Priority</Label>
                         <Select
  value={formData.priorityLevel}
  onValueChange={(value: any) =>
    setFormData({ ...formData, priorityLevel: value })
  }
>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">High</SelectItem>
                              <SelectItem value="2">Medium</SelectItem>
                              <SelectItem value="1">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => { setEditingNotification(null); resetForm(); }} disabled={isCreating}>Cancel</Button>
                        <Button onClick={handleUpdateNotification} disabled={isCreating}>
                          {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Update
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteNotification(notification._id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}