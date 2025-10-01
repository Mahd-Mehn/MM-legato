"use client";

import { ModerationDashboard } from "@/components/writer/ModerationDashboard";

export default function ModerationPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Content Moderation</h1>
        <p className="text-muted-foreground mt-2">
          Review and moderate comments on your books to maintain a positive community environment.
        </p>
      </div>
      
      <ModerationDashboard />
    </div>
  );
}