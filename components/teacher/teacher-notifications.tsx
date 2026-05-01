"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, Plus, Edit, Trash2, AlertCircle, Info, CheckCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  listNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  INotification,
  CreateNotificationPayload,
} from "@/lib/api/notification";

type NotificationFormData = {
  title: string;
  message: string;
  notificationType: "announcement" | "info" | "warning" | "success";
  targetGroup: "college" | "year" | "batch" | "department" | "individual";
  priorityLevel: number;
  targetID?: string | null;
  targetUsers?: string[];
};

export default function TeacherNotifications() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<INotification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<NotificationFormData>({
    title: "",
    message: "",
    notificationType: "announcement",
    targetGroup: "college",
    priorityLevel: 1,
    targetID: null,
    targetUsers: [],
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listNotifications();
      setNotifications(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch notifications";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      notificationType: "announcement",
      targetGroup: "college",
      priorityLevel: 1,
      targetID: null,
      targetUsers: [],
    });
  };

  const handleCreateNotification = async () => {
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    if (!formData.message.trim()) { toast.error("Message is required"); return; }

    try {
      setIsSubmitting(true);
      const payload: CreateNotificationPayload = {
        title: formData.title,
        message: formData.message,
        notificationType: formData.notificationType,
        targetGroup: formData.targetGroup,
        priorityLevel: formData.priorityLevel,
        targetID: formData.targetID || null,
        targetUsers: formData.targetUsers || [],
      };
      await createNotification(payload);
      toast.success("Notification created successfully");
      setIsCreateOpen(false);
      resetForm();
      await fetchNotifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateNotification = async () => {
    if (!editingNotification?._id) { toast.error("Invalid notification"); return; }
    if (!formData.title.trim()) { toast.error("Title is required"); return; }
    if (!formData.message.trim()) { toast.error("Message is required"); return; }

    try {
      setIsSubmitting(true);
      await updateNotification(editingNotification._id, {
        title: formData.title,
        message: formData.message,
        notificationType: formData.notificationType,
        targetGroup: formData.targetGroup,
        priorityLevel: formData.priorityLevel,
        targetID: formData.targetID || null,
      });
      toast.success("Notification updated successfully");
      setEditingNotification(null);
      resetForm();
      await fetchNotifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotification = async (id: string | undefined) => {
    if (!id) { toast.error("Invalid notification ID"); return; }
    try {
      await deleteNotification(id);
      toast.success("Notification deleted successfully");
      await fetchNotifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete notification");
    }
  };

  const openEditDialog = (notification: INotification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      notificationType: notification.notificationType as any,
      targetGroup: notification.targetGroup,
      priorityLevel: notification.priorityLevel,
      targetID: notification.targetID || null,
      targetUsers: notification.targetUsers || [],
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "info": return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "success": return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Success</Badge>;
      case "info": return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">Info</Badge>;
      case "warning": return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Warning</Badge>;
      default: return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400">Announcement</Badge>;
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { resetForm(); setEditingNotification(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Notification</DialogTitle>
                <DialogDescription>Post a notification for your students</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Notification title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Notification message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <Select value={String(formData.priorityLevel)} onValueChange={(value) => setFormData({ ...formData, priorityLevel: Number(value) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Group</Label>
                  <Select value={formData.targetGroup} onValueChange={(value: any) => setFormData({ ...formData, targetGroup: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="college">All (College)</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                      <SelectItem value="batch">Batch</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      
                    </SelectContent>
                  </Select>
                </div>
                {formData.targetGroup !== "college" && (
                  <div className="space-y-2">
                    <Label htmlFor="targetID">Target ID / Code</Label>
                    <Input
                      id="targetID"
                      placeholder={`Enter ${formData.targetGroup} identifier`}
                      value={formData.targetID || ""}
                      onChange={(e) => setFormData({ ...formData, targetID: e.target.value || null })}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleCreateNotification} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sortedNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">Create one to notify your students</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map((notification) => (
              <div key={notification._id || notification.id} className="p-4 border rounded-lg transition-colors border-border bg-muted/20">
                <div className="flex items-start gap-3 mb-2">
                  <div className="mt-0.5">{getNotificationIcon(notification.notificationType)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <div className="flex items-center gap-1">{getNotificationBadge(notification.notificationType)}</div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(notification.createdAt || 0), { addSuffix: true })}</span>
                        <span>•</span>
                        <span className="capitalize">{notification.targetGroup}</span>
                        {notification.targetID && (<><span>•</span><span>ID: {notification.targetID}</span></>)}
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Edit Dialog */}
                        <Dialog
                          open={editingNotification?._id === notification._id && !!notification._id}
                          onOpenChange={(open) => { if (!open) { setEditingNotification(null); resetForm(); } }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(notification)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Notification</DialogTitle>
                              <DialogDescription>Update your notification details</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-title">Title</Label>
                                <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-message">Message</Label>
                                <Textarea id="edit-message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={4} />
                              </div>
                              <div className="space-y-2">
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
                              <div className="space-y-2">
                                <Label>Priority Level</Label>
                                <Select value={String(formData.priorityLevel)} onValueChange={(value) => setFormData({ ...formData, priorityLevel: Number(value) })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Low</SelectItem>
                                    <SelectItem value="2">Medium</SelectItem>
                                    <SelectItem value="3">High</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => { setEditingNotification(null); resetForm(); }} disabled={isSubmitting}>Cancel</Button>
                              <Button onClick={handleUpdateNotification} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteNotification(notification._id)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}