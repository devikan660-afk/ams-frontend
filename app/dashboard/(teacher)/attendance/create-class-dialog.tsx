"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { createAttendanceSession, type CreateSessionData, type SessionType } from "@/lib/api/attendance-session";
import { listBatches, type Batch } from "@/lib/api/batch";
import { listSubjects, type Subject } from "@/lib/api/subject";
import { format } from "date-fns";

interface CreateClassDialogProps {
  onClassCreated?: () => void;
}

export default function CreateClassDialog({ onClassCreated }: CreateClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    batch: "",
    subject: "",
    session_type: "regular" as SessionType,
    hours_taken: "1",
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [batchesData, subjectsData] = await Promise.all([
        listBatches({ limit: 100 }),
        listSubjects({ limit: 100 }),
      ]);
      setBatches(batchesData.batches);
      setSubjects(subjectsData.subjects);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + parseFloat(formData.hours_taken) * 60 * 60 * 1000);

      const sessionData: CreateSessionData = {
        batch: formData.batch,
        subject: formData.subject,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        hours_taken: parseFloat(formData.hours_taken),
        session_type: formData.session_type,
      };

      await createAttendanceSession(sessionData);
      setOpen(false);
      setFormData({
        batch: "",
        subject: "",
        session_type: "regular",
        hours_taken: "1",
      });
      onClassCreated?.();
    } catch (error) {
      console.error("Failed to create class:", error);
      alert(error instanceof Error ? error.message : "Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full md:w-auto">
          <Plus className="mr-2 h-5 w-5" />
          Create New Class
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Create a new attendance session for your class. The session will start immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Batch Selection */}
          <div className="space-y-2">
            <Label htmlFor="batch">Batch *</Label>
            <Select
              value={formData.batch}
              onValueChange={(value) => setFormData({ ...formData, batch: value })}
              disabled={loadingData}
            >
              <SelectTrigger id="batch">
                <SelectValue placeholder={loadingData ? "Loading batches..." : "Select batch"} />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch._id} value={batch._id}>
                    {batch.name} ({batch.adm_year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject Selection */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select
              value={formData.subject}
              onValueChange={(value) => setFormData({ ...formData, subject: value })}
              disabled={loadingData}
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder={loadingData ? "Loading subjects..." : "Select subject"} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject._id} value={subject._id}>
                    {subject.name} ({subject.subject_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <Label htmlFor="session_type">Session Type *</Label>
            <Select
              value={formData.session_type}
              onValueChange={(value) => setFormData({ ...formData, session_type: value as SessionType })}
            >
              <SelectTrigger id="session_type">
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="extra">Extra Class</SelectItem>
                <SelectItem value="practical">Practical/Lab</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hours */}
          <div className="space-y-2">
            <Label htmlFor="hours">Duration (hours) *</Label>
            <Select
              value={formData.hours_taken}
              onValueChange={(value) => setFormData({ ...formData, hours_taken: value })}
            >
              <SelectTrigger id="hours">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">30 minutes</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="1.5">1.5 hours</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="2.5">2.5 hours</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info */}
          <div className="bg-muted p-3 rounded-lg text-sm">
            <p className="text-muted-foreground">
              <strong>Start time:</strong> {format(new Date(), "hh:mm a, MMM dd, yyyy")}
            </p>
            {formData.hours_taken && (
              <p className="text-muted-foreground mt-1">
                <strong>End time:</strong>{" "}
                {format(
                  new Date(Date.now() + parseFloat(formData.hours_taken) * 60 * 60 * 1000),
                  "hh:mm a, MMM dd, yyyy"
                )}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingData || !formData.batch || !formData.subject}>
              {loading ? "Creating..." : "Create Class"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
