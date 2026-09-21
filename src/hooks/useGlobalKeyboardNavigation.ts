import { useEffect } from 'react';

const selector = 'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function useGlobalKeyboardNavigation() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest('[data-keyboard-nav="off"]')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') return;

      const scope = target.closest('[role="dialog"], form, .page-wrap') || document.body;
      const controls = Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      });
      const index = controls.indexOf(target);
      if (index < 0) return;

      const focusAt = (next: number) => {
        e.preventDefault();
        const el = controls[Math.max(0, Math.min(next, controls.length - 1))];
        el?.focus();
        if (el instanceof HTMLInputElement && ['text','number','search','tel'].includes(el.type)) el.select?.();
      };

      // Ctrl+Enter submits the current form where a real submit control exists.
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = target.closest('form');
        const submit = form?.querySelector<HTMLElement>('button[type="submit"], input[type="submit"]');
        if (submit) { e.preventDefault(); submit.click(); return; }
      }
      // Client-requested counter workflow: End/PageDown = next field; Home/PageUp = previous field.
      if (e.key === 'End' || e.key === 'PageDown') return focusAt(index + 1);
      if (e.key === 'Home' || e.key === 'PageUp') return focusAt(index - 1);
      if (e.key === 'Enter' && !e.shiftKey && target.tagName !== 'BUTTON' && target.tagName !== 'TEXTAREA') return focusAt(index + 1);
      // Tab / Shift+Tab remain native. Ctrl+K remains global search.
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, []);
}
