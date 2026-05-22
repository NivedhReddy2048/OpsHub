"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Ticket, CheckSquare, Building2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import type { ApiResponse } from "@/types";

interface SearchResult {
  tickets: Array<{ id: number; title: string; status: string; priority: string }>;
  tasks: Array<{ id: number; title: string; status: string; priority: string }>;
  projects: Array<{ id: number; name: string }>;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    
    const handleToggle = () => {
      setOpen((open) => !open);
    };

    document.addEventListener("keydown", down);
    window.addEventListener("toggle-command-palette", handleToggle);
    
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("toggle-command-palette", handleToggle);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Explicitly focus search input when the palette modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  const { data, isLoading } = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return null;
      const res = await api.get<ApiResponse<SearchResult>>(`/search/?q=${encodeURIComponent(debouncedQuery)}`);
      return res.data.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" 
        onClick={() => setOpen(false)}
      />
      <div className="fixed left-[50%] top-[20%] z-50 w-full max-w-lg -translate-x-1/2 rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[60vh]">
        <div className="flex items-center border-b border-border px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {debouncedQuery.length < 2 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Type at least 2 characters to search.</p>
          ) : !isLoading && (!data || (data.tickets.length === 0 && data.tasks.length === 0 && data.projects.length === 0)) ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No results found.</p>
          ) : (
            <div className="space-y-4 py-2">
              {data?.tickets && data.tickets.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Tickets</div>
                  {data.tickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { router.push(`/tickets/${t.id}`); setOpen(false); }}
                      className="w-full flex items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    >
                      <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left truncate">{t.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground uppercase">{t.status.replace("_", " ")}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {data?.tasks && data.tasks.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Tasks</div>
                  {data.tasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { router.push(`/tasks/${t.id}`); setOpen(false); }}
                      className="w-full flex items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    >
                      <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left truncate">{t.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground uppercase">{t.status.replace("_", " ")}</span>
                    </button>
                  ))}
                </div>
              )}

              {data?.projects && data.projects.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Projects</div>
                  {data.projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { router.push(`/projects`); setOpen(false); }}
                      className="w-full flex items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    >
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
