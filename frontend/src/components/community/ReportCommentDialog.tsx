"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { moderationAPI } from "@/lib/api";

interface ReportCommentDialogProps {
  commentId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam or repetitive content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "violence", label: "Violence or threats" },
  { value: "copyright", label: "Copyright infringement" },
  { value: "other", label: "Other" },
];

export function ReportCommentDialog({ 
  commentId, 
  open: controlledOpen, 
  onOpenChange, 
  onReportSubmitted 
}: ReportCommentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use controlled open state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason for reporting");
      return;
    }

    setIsSubmitting(true);
    try {
      await moderationAPI.reportComment(
        commentId, 
        reason, 
        description.trim() || undefined
      );

      toast.success("Comment reported successfully. Thank you for helping keep our community safe.");
      setOpen(false);
      setReason("");
      setDescription("");
      onReportSubmitted?.();
    } catch (error) {
      console.error("Error reporting comment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to report comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive">
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Comment</DialogTitle>
          <DialogDescription>
            Help us maintain a safe and respectful community by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for reporting *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((reasonOption) => (
                  <SelectItem key={reasonOption.value} value={reasonOption.value}>
                    {reasonOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context that might help us understand the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
            />
            <div className="text-xs text-muted-foreground text-right">
              {description.length}/1000
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}