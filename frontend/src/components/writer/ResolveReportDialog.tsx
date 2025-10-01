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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { moderationAPI } from "@/lib/api";

interface CommentReport {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
  comment?: {
    id: string;
    content: string;
    author: {
      username: string;
      profile_picture_url?: string;
    };
  };
  reporter_username?: string;
}

interface ResolveReportDialogProps {
  report: CommentReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResolved: () => void;
}

export function ResolveReportDialog({ 
  report, 
  open, 
  onOpenChange, 
  onResolved 
}: ResolveReportDialogProps) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResolve = async (action: "delete_comment" | "dismiss_report") => {
    setIsSubmitting(true);
    try {
      await moderationAPI.resolveReport(
        report.id, 
        action, 
        resolutionNotes.trim() || undefined
      );

      const actionText = action === "delete_comment" ? "deleted" : "dismissed";
      toast.success(`Report ${actionText} successfully`);
      onResolved();
    } catch (error) {
      console.error("Error resolving report:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resolve report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatReason = (reason: string) => {
    return reason.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "harassment":
      case "hate_speech":
      case "violence":
        return "destructive";
      case "spam":
        return "secondary";
      case "inappropriate_content":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Review Report
          </DialogTitle>
          <DialogDescription>
            Review this report and decide on the appropriate action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Details */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Report Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={getReasonColor(report.reason)}>
                    {formatReason(report.reason)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Reported by {report.reporter_username}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {report.description && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Report Details</h4>
                <div className="bg-muted p-3 rounded text-sm">
                  {report.description}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Reported Comment */}
          {report.comment && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Reported Comment</h4>
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  {report.comment.author.profile_picture_url && (
                    <img
                      src={report.comment.author.profile_picture_url}
                      alt={report.comment.author.username}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="font-medium text-sm">
                    {report.comment.author.username}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">
                  {report.comment.content}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Resolution Notes */}
          <div className="space-y-2">
            <Label htmlFor="resolution-notes">Resolution Notes (optional)</Label>
            <Textarea
              id="resolution-notes"
              placeholder="Add any notes about your decision..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              maxLength={2000}
              rows={3}
            />
            <div className="text-xs text-muted-foreground text-right">
              {resolutionNotes.length}/2000
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleResolve("dismiss_report")}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <X className="h-4 w-4 mr-2" />
              Dismiss Report
            </Button>
          </div>
          <Button
            variant="destructive"
            onClick={() => handleResolve("delete_comment")}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}