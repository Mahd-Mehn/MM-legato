"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  MessageSquare, 
  Shield,
  Trash2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { ResolveReportDialog } from "./ResolveReportDialog";
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

interface ModerationLog {
  id: string;
  action: string;
  target_type: string;
  reason?: string;
  created_at: string;
  moderator_username?: string;
}

interface ModerationDashboardData {
  pending_reports: CommentReport[];
  recent_actions: ModerationLog[];
  total_pending: number;
  total_resolved_today: number;
}

export function ModerationDashboard() {
  const [data, setData] = useState<ModerationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<CommentReport | null>(null);

  const fetchDashboardData = async () => {
    try {
      const dashboardData = await moderationAPI.getDashboard();
      setData(dashboardData);
    } catch (error) {
      console.error("Error fetching moderation data:", error);
      toast.error("Failed to load moderation dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleReportResolved = () => {
    setSelectedReport(null);
    fetchDashboardData();
  };

  const formatReason = (reason: string) => {
    return reason.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load moderation dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_pending}</div>
            <p className="text-xs text-muted-foreground">
              Require your attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_resolved_today}</div>
            <p className="text-xs text-muted-foreground">
              Reports handled today
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">
            <MessageSquare className="h-4 w-4 mr-2" />
            Pending Reports
            {data.total_pending > 0 && (
              <Badge variant="destructive" className="ml-2">
                {data.total_pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Shield className="h-4 w-4 mr-2" />
            Recent Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {data.pending_reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground text-center">
                  No pending reports at the moment. Great job keeping your community safe!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.pending_reports.map((report) => (
                <Card key={report.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {report.description && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-1">Report Details:</p>
                        <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          {report.description}
                        </p>
                      </div>
                    )}
                    {report.comment && (
                      <div>
                        <p className="text-sm font-medium mb-1">Reported Comment:</p>
                        <div className="bg-muted p-3 rounded border-l-2 border-l-muted-foreground">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">
                              {report.comment.author.username}
                            </span>
                          </div>
                          <p className="text-sm">{report.comment.content}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Moderation Actions</CardTitle>
              <CardDescription>
                Your recent moderation activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {data.recent_actions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No recent actions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.recent_actions.map((log, index) => (
                      <div key={log.id}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {log.action === "delete_comment" ? (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            ) : log.action === "dismiss_report" ? (
                              <X className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Shield className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              {formatAction(log.action)}
                            </p>
                            {log.reason && (
                              <p className="text-sm text-muted-foreground">
                                {log.reason}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {index < data.recent_actions.length - 1 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedReport && (
        <ResolveReportDialog
          report={selectedReport}
          open={!!selectedReport}
          onOpenChange={(open) => !open && setSelectedReport(null)}
          onResolved={handleReportResolved}
        />
      )}
    </div>
  );
}