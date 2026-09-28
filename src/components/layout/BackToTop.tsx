'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from '@phosphor-icons/react';

const NEAR_PAGE_END_VIEWPORTS = 1.15;
const MINIMUM_NEAR_END_DISTANCE = 640;

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const updateVisibility = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
        const nearEndDistance = Math.max(
          MINIMUM_NEAR_END_DISTANCE,
          window.innerHeight * NEAR_PAGE_END_VIEWPORTS,
        );
        setIsVisible(remaining <= nearEndDistance);
      });
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('ascendrev:lenis-scroll', updateVisibility);
    window.addEventListener('resize', updateVisibility);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('ascendrev:lenis-scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  const returnToTop = () => {
    window.dispatchEvent(new Event('ascendrev:scroll-to-top'));
  };

  return (
    <button
      type="button"
      aria-label="Return to top"
      title="Return to top"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      onClick={returnToTop}
      className={`fixed bottom-5 right-5 z-[100] inline-flex size-12 items-center justify-center rounded-full border border-white/30 bg-[linear-gradient(145deg,var(--gold-300),var(--gold-500))] text-[var(--gold-ink)] shadow-[0_12px_32px_rgba(1,13,31,0.3)] outline-none transition-[opacity,transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(1,13,31,0.38)] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy-900)] motion-reduce:transition-none ${isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
    >
      <ArrowUp size={20} weight="bold" aria-hidden="true" />
    </button>
  );
}
