import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowUpRight,
  Archive,
  Check,
  Inbox,
  LogOut,
  Mail,
} from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const inquiries = useQuery(api.inquiries.listInquiries);
  const archiveInquiry = useMutation(api.inquiries.archiveInquiry);
  const markInquiryRead = useMutation(api.inquiries.markInquiryRead);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const list = inquiries ?? [];
  const unreadCount = list.filter((inquiry) => inquiry.readAt == null).length;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#86868b]">Ebad Ahsan studio workspace</p>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
                Project inbox{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
              </h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#71b25c]/15 px-2.5 py-0.5 text-xs font-semibold text-[#71b25c]">
                  <span className="size-1.5 rounded-full bg-[#71b25c]" />
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#86868b]">
              Requests submitted from your site&apos;s booking form land here.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
            >
              <a href="/">
                View site
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md transition-colors hover:bg-white/10 hover:text-white"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </header>

        {inquiries === null ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-neutral-900/60 px-6 py-16 text-center backdrop-blur-sm">
            <span className="flex size-14 items-center justify-center rounded-full border border-white/15 text-[#86868b]">
              <Inbox className="size-6" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Inbox restricted</h2>
              <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-[#86868b]">
                This inbox is owner-only. Sign in with the email set as{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-white/80">
                  OWNER_NOTIFICATION_EMAIL
                </code>{" "}
                in the project&apos;s Keys/API keys tab to view requests.
              </p>
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-neutral-900/60 px-6 py-16 text-center backdrop-blur-sm">
            <span className="flex size-14 items-center justify-center rounded-full border border-white/15 text-[#86868b]">
              <Inbox className="size-6" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">
                {inquiries === undefined ? "Loading…" : "No inquiries yet"}
              </h2>
              <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-[#86868b]">
                When visitors submit the &quot;Request a Project&quot; form on your landing
                page, their requests will show up here instantly.
              </p>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((inquiry) => {
              const unread = inquiry.readAt == null;
              return (
              <li
                key={inquiry._id}
                className={cn(
                  "rounded-2xl border bg-neutral-900/60 p-5 backdrop-blur-sm transition-all duration-300",
                  unread
                    ? "border-[#71b25c]/35 hover:border-[#71b25c]/70 hover:shadow-[0_0_24px_rgba(113,178,92,0.10)]"
                    : "border-white/10 hover:border-[#71b25c]/40",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base font-semibold text-white">
                        {inquiry.name}
                      </h2>
                      {unread && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#71b25c]/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#71b25c]">
                          <span className="size-1.5 rounded-full bg-[#71b25c]" />
                          New
                        </span>
                      )}
                      {inquiry.company && (
                        <span className="text-sm text-[#86868b]">· {inquiry.company}</span>
                      )}
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-[#a1a1a6]">
                        {inquiry.projectType}
                      </span>
                    </div>
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-[#a1a1a6] transition-colors hover:text-[#71b25c]"
                    >
                      <Mail className="size-3.5" />
                      {inquiry.email}
                    </a>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {unread ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 rounded-full text-[#71b25c] hover:bg-[#71b25c]/10 hover:text-[#71b25c]"
                        onClick={() => markInquiryRead({ id: inquiry._id, read: true })}
                        title="Mark as read"
                      >
                        <Check className="size-4" />
                        <span className="hidden sm:inline">Mark read</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 rounded-full text-[#86868b] hover:bg-white/5 hover:text-white"
                        onClick={() => markInquiryRead({ id: inquiry._id, read: false })}
                        title="Mark as unread"
                      >
                        <span className="hidden sm:inline">Mark unread</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1.5 rounded-full text-[#86868b] hover:bg-white/5 hover:text-white"
                      onClick={() => archiveInquiry({ id: inquiry._id })}
                      title="Archive"
                    >
                      <Archive className="size-4" />
                      <span className="hidden sm:inline">Archive</span>
                    </Button>
                  </div>
                </div>

                {(inquiry.budget || inquiry.timeline) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {inquiry.budget && (
                      <span className="rounded-lg border border-white/10 bg-[#0d0d0d] px-2.5 py-1 text-xs text-[#a1a1a6]">
                        Budget: <span className="text-white">{inquiry.budget}</span>
                      </span>
                    )}
                    {inquiry.timeline && (
                      <span className="rounded-lg border border-white/10 bg-[#0d0d0d] px-2.5 py-1 text-xs text-[#a1a1a6]">
                        Timeline: <span className="text-white">{inquiry.timeline}</span>
                      </span>
                    )}
                  </div>
                )}

                <p className={cn("mt-3 text-sm leading-relaxed text-[#d4d4d8]")}>
                  {inquiry.message}
                </p>

                <p className="mt-3 text-xs text-[#86868b]/70">{formatDate(inquiry.createdAt)}</p>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
