import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

/**
 * The About / FAQ modal. Its copy is NOT duplicated here — it's read once from
 * the static `#about-content` block in index.html, which is the single source of
 * truth (also crawlable for SEO and mirrored by the FAQPage JSON-LD). The static
 * block is `display:none`; this modal is how users actually reach it.
 */
function readAboutHtml(): string {
  if (typeof document === 'undefined') return '';
  return document.getElementById('about-content')?.innerHTML ?? '';
}

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  const html = useMemo(readAboutHtml, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto font-sans">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">About metronomnom</DialogTitle>
          <DialogDescription>
            A free online metronome — what it does and how to use it.
          </DialogDescription>
        </DialogHeader>
        {/* Injected from our own static HTML (no user input). Child selectors
            style the plain markup to match the app's rounded, themed look. */}
        <div
          className="space-y-1 text-sm leading-relaxed [&>*:first-child]:mt-0 [&_dd]:text-muted-foreground [&_dt]:mt-3 [&_dt]:font-semibold [&_dt]:text-foreground [&_h2]:mt-5 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mt-1 [&_ol]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-muted-foreground [&_p]:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </DialogContent>
    </Dialog>
  );
}
