import { ChevronUp } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface ScrollToTopButtonProps {
  /** Scrollable container ref for modals/tabs; omit to track window scroll */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** Optional key (e.g. activeTab or filter count) to force re-check when view changes */
  watchKey?: string | number;
  /** Hide button (e.g. when a modal or screensaver overlays the main page) */
  hidden?: boolean;
  /** Optional positioning override classes */
  className?: string;
}

const SCROLL_THRESHOLD_PX = 16;

function getNestedScrollables(root: HTMLElement): HTMLElement[] {
  const result: HTMLElement[] = [];
  const candidates = root.querySelectorAll<HTMLElement>('*');

  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i];
    if (el.clientHeight <= 0) continue;
    if (el.scrollHeight <= el.clientHeight + SCROLL_THRESHOLD_PX) continue;
    if (el.dataset.ignoreScrollTop === 'true') continue;

    const style = window.getComputedStyle(el);
    if (style.position === 'absolute' || style.position === 'fixed') continue;
    if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
      result.push(el);
    }
  }

  return result;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  containerRef,
  watchKey,
  hidden = false,
  className,
}) => {
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);

  const checkScrollability = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (containerRef) {
      const container = containerRef.current;
      if (!container) {
        setHasVerticalScroll(false);
        return;
      }

      const containerHasScroll =
        container.scrollHeight > container.clientHeight + SCROLL_THRESHOLD_PX ||
        container.scrollTop > 0;

      if (containerHasScroll) {
        setHasVerticalScroll(true);
        return;
      }

      const nested = getNestedScrollables(container);
      setHasVerticalScroll(nested.length > 0);
      return;
    }

    const docEl = document.documentElement;
    const body = document.body;
    const scrollHeight = Math.max(docEl.scrollHeight, body ? body.scrollHeight : 0);
    const windowHasScroll =
      scrollHeight > window.innerHeight + SCROLL_THRESHOLD_PX || window.scrollY > 0;
    setHasVerticalScroll(windowHasScroll);
  }, [containerRef]);

  useEffect(() => {
    if (hidden) {
      setHasVerticalScroll(false);
      return;
    }

    let rafId: number | null = null;
    const scheduleCheck = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        checkScrollability();
      });
    };

    scheduleCheck();
    const followUpTimer = window.setTimeout(checkScrollability, 180);

    const containerEl = containerRef ? containerRef.current : null;
    const targetNode = containerRef ? containerEl : document.body;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && targetNode) {
      resizeObserver = new ResizeObserver(scheduleCheck);
      resizeObserver.observe(targetNode);
      if (containerEl) {
        Array.from(containerEl.children).forEach((child) => {
          resizeObserver?.observe(child);
        });
      } else if (document.documentElement) {
        resizeObserver.observe(document.documentElement);
      }
    }

    let mutationObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined' && targetNode) {
      mutationObserver = new MutationObserver(() => {
        if (resizeObserver && containerEl) {
          Array.from(containerEl.children).forEach((child) => {
            resizeObserver?.observe(child);
          });
        }
        scheduleCheck();
      });
      mutationObserver.observe(targetNode, {
        childList: true,
        subtree: true,
      });
    }

    window.addEventListener('resize', scheduleCheck, { passive: true });
    if (containerEl) {
      containerEl.addEventListener('scroll', scheduleCheck, { passive: true });
    } else if (!containerRef) {
      window.addEventListener('scroll', scheduleCheck, { passive: true });
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.clearTimeout(followUpTimer);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener('resize', scheduleCheck);
      if (containerEl) {
        containerEl.removeEventListener('scroll', scheduleCheck);
      } else if (!containerRef) {
        window.removeEventListener('scroll', scheduleCheck);
      }
    };
  }, [checkScrollability, containerRef, watchKey, hidden]);

  const handleScrollToTop = () => {
    if (containerRef?.current) {
      const container = containerRef.current;
      container.scrollTo({ top: 0, behavior: 'smooth' });

      const nested = getNestedScrollables(container);
      nested.forEach((el) => {
        if (el.scrollTop > 0) {
          el.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (hidden || !hasVerticalScroll) {
    return null;
  }

  const defaultPosition = containerRef
    ? 'absolute bottom-5 right-5 sm:bottom-6 sm:right-6 z-30'
    : 'fixed bottom-6 right-5 sm:bottom-7 sm:right-7 z-40';

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="최상단으로 이동"
      title="최상단으로 이동"
      className={`${className || defaultPosition} w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#3c424f] hover:bg-[#2a2f3a] active:scale-95 text-white shadow-[0_6px_18px_rgba(15,23,42,0.28)] border border-white/10 flex items-center justify-center transition-all duration-200 cursor-pointer animate-in fade-in zoom-in-95`}
    >
      <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.25]" />
    </button>
  );
};
