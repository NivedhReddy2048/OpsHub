"use client";

/**
 * components/tickets/TicketAttachments.tsx
 *
 * File attachment upload + list for ticket detail page.
 * Max 10 MB per file (validated client-side and server-side).
 */
import { useRef, ChangeEvent } from "react";
import { Paperclip, Upload, Trash2, FileText, ExternalLink } from "lucide-react";
import { useUploadAttachment, useDeleteAttachment } from "@/hooks/useTickets";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { TicketAttachment } from "@/types";

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface TicketAttachmentsProps {
  ticketId: number;
  attachments: TicketAttachment[];
}

export function TicketAttachments({
  ticketId,
  attachments,
}: TicketAttachmentsProps) {
  const { user } = useAuth();
  const { mutate: upload, isPending: isUploading } =
    useUploadAttachment(ticketId);
  const { mutate: deleteAttachment } = useDeleteAttachment(ticketId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = user?.role === "admin";

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      alert(`File exceeds the ${MAX_MB} MB limit.`);
      return;
    }
    upload(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            Attachments{" "}
            <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {attachments.length}
            </span>
          </h3>
        </div>

        {/* Upload button */}
        <Button
          id="upload-attachment-btn"
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          id="attachment-file-input"
        />
      </div>

      {/* Attachment list */}
      {attachments.length === 0 ? (
        <p className="py-3 text-center text-sm text-muted-foreground">
          No attachments yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-3 bg-card px-4 py-2.5"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {att.original_filename}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatBytes(att.file_size)} ·{" "}
                  {att.uploaded_by?.full_name || att.uploaded_by?.email || "Unknown"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {att.file_url && (
                  <a
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="Open file"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {(isAdmin || att.uploaded_by?.id === user?.id) && (
                  <button
                    onClick={() => deleteAttachment(att.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Delete attachment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-muted-foreground">
        Max file size: {MAX_MB} MB
      </p>
    </div>
  );
}
