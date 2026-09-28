'use client';

import { useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ArrowLeft,
  ArrowRight,
  DownloadSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  ShareNetwork,
  X,
} from '@phosphor-icons/react/dist/ssr';
import { registerMotion } from '@/components/motion/registerMotion';
import { prefersReducedMotion } from '@/lib/motion';
import styles from './OfficeFrameStory.module.css';

const FACILITIES: ReadonlyArray<{ label: string; src: string; alt: string; portrait?: boolean }> = [
  { label: 'AscendRev Campus', src: '/images/ascendrev-campus.webp', alt: 'Exterior of the AscendRev campus with its icon on the building sign.' },
  { label: 'Hallway', src: '/images/hallway1.jpg', alt: 'Interior hallway at the AscendRev campus.', portrait: true },
  { label: 'Training Room', src: '/images/ascendrev-training-room.jpg', alt: 'An empty training room with rows of desks and chairs.' },
  { label: 'Boardroom', src: '/images/ascendrev-boardroom.png', alt: 'A conference boardroom with a long table, black chairs, and a wall-mounted screen.', portrait: true },
  { label: 'Full-Scale Operations', src: '/images/office4.jpg', alt: 'Rows of workstations and cubicles on an operations floor.' },
  { label: 'Flexible Operations', src: '/images/ascendrev-flexible-operations.jpg', alt: 'An open operations floor with rows of workstations, blue partitions, and computer stations.' },
  { label: 'Secure Personal Storage', src: '/images/ascendrev-secure-personal-storage.jpg', alt: 'A hallway with secure personal storage lockers outside the offices.', portrait: true },
];

/**
 * Gesture-stepped horizontal facility photo gallery with accessible previews.
 */
export default function OfficeFrameStory(): JSX.Element {
  const rootRef = useRef<HTMLElement>(null);
  const galleryTriggerRef = useRef<ScrollTrigger | null>(null);
  const pendingTourReturnRef = useRef(false);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [activeFacilityIndex, setActiveFacilityIndex] = useState<number | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [shareStatus, setShareStatus] = useState('');
  const closePreviewRef = useRef<HTMLButtonElement>(null);
  const previewDialogRef = useRef<HTMLDivElement>(null);
  const focusReturnRef = useRef<HTMLElement | null>(null);
  const activeFacilityIndexRef = useRef<number | null>(null);
  activeFacilityIndexRef.current = activeFacilityIndex;
  const previewIsOpen = activeFacilityIndex !== null;

  const openFacilityPreview = (index: number): void => {
    const focusedElement = document.activeElement;
    focusReturnRef.current = focusedElement instanceof HTMLElement ? focusedElement : null;
    setPreviewZoom(1);
    setShareStatus('');
    setActiveFacilityIndex(index);
  };

  const moveFacilityPreview = (index: number): void => {
    if (index < 0 || index >= FACILITIES.length) return;
    setPreviewZoom(1);
    setShareStatus('');
    setActiveFacilityIndex(index);
  };

  const shareActiveFacility = async (): Promise<void> => {
    if (activeFacilityIndex === null) return;
    const facility = FACILITIES[activeFacilityIndex];
    const url = new URL(facility.src, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: facility.label, text: `AscendRev facility: ${facility.label}`, url });
        setShareStatus('');
      } else {
        await navigator.clipboard.writeText(url);
        setShareStatus('Photo link copied.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareStatus('Sharing is unavailable on this device.');
    }
  };

  useEffect(() => {
    if (!previewIsOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closePreviewRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setActiveFacilityIndex(null);
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const currentIndex = activeFacilityIndexRef.current;
        if (currentIndex === null) return;
        const offset = event.key === 'ArrowLeft' ? -1 : 1;
        const nextIndex = currentIndex + offset;
        if (nextIndex >= 0 && nextIndex < FACILITIES.length) {
          setActiveFacilityIndex(nextIndex);
          setPreviewZoom(1);
          setShareStatus('');
        }
        return;
      }

      if (event.key === 'Tab') {
        const focusable = previewDialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (focusReturnRef.current?.isConnected) {
        focusReturnRef.current.focus({ preventScroll: true });
      }
    };
  }, [previewIsOpen]);

  useGSAP(
    () => {
      const gallery = rootRef.current?.querySelector<HTMLElement>('[data-facilities-gallery]');
      const viewport = gallery?.querySelector<HTMLElement>('[data-facilities-viewport]');
      const track = gallery?.querySelector<HTMLElement>('[data-facilities-track]');
      if (!gallery || !viewport || !track || showAllFacilities || prefersReducedMotion()) return;

      registerMotion();
      gsap.set(track, { x: 0 });
      setTourIndex(0);
      const horizontalDistance = (): number => Math.max(0, track.scrollWidth - viewport.clientWidth);
      const stepCount = FACILITIES.length - 1;
      let desiredIndex = 0;
      let finalFrameComplete = false;
      let tourActive = false;
      let isAnimating = false;
      let gestureLocked = false;
      let gestureDirection = 0;
      let gestureTimer = 0;
      let pinTrigger: ScrollTrigger | null = null;
      let touchStartY: number | null = null;
      let lastTouchY: number | null = null;
      let touchDirection = 0;
      let touchBlocked = false;
      let touchEntryLocked = false;

      const clampIndex = (index: number): number => Math.max(0, Math.min(stepCount, index));
      const releaseGestureLock = (): void => {
        window.clearTimeout(gestureTimer);
        gestureTimer = window.setTimeout(() => {
          gestureLocked = false;
          gestureDirection = 0;
        // Trackpad momentum commonly continues after the 360ms frame tween.
        // Keep that tail attached to the gesture so one physical flick cannot
        // consume several story frames as the pointer moves outside the cards.
        }, 650);
      };
      const refreshPin = (): void => {
        // Keep a generous pin runway while frames remain. Once frame 07 has
        // finished, collapse it to a single wheel's runway so the next global
        // scroll gesture can leave the gallery immediately. This also guards
        // against a wheel delta slipping past the pin while the cursor is
        // anywhere outside the gallery artwork.
        window.requestAnimationFrame(() => {
          ScrollTrigger.refresh();
          ScrollTrigger.update();
        });
      };
      const setTourActive = (active: boolean): void => {
        if (tourActive === active) return;
        tourActive = active;
        refreshPin();
      };
      const lockGesture = (direction: number): void => {
        gestureLocked = true;
        gestureDirection = direction;
        releaseGestureLock();
      };
      const unlockForDirectionChange = (): void => {
        window.clearTimeout(gestureTimer);
        gestureLocked = false;
        gestureDirection = 0;
      };
      const animateToIndex = (index: number): void => {
        const nextIndex = clampIndex(index);
        if (nextIndex === desiredIndex || isAnimating) return;
        const wasAtFinalFrame = desiredIndex === stepCount;
        const isAtFinalFrame = nextIndex === stepCount;
        if (wasAtFinalFrame && !isAtFinalFrame) {
          // Reopen the pin runway as soon as the user moves back from frame 07.
          finalFrameComplete = false;
          refreshPin();
        }
        if (isAtFinalFrame && !wasAtFinalFrame) finalFrameComplete = false;
        desiredIndex = nextIndex;
        isAnimating = true;
        setTourIndex(nextIndex);
        gsap.to(track, {
          x: () => -horizontalDistance() * (nextIndex / stepCount),
          duration: 0.36,
          ease: 'power2.inOut',
          overwrite: 'auto',
          onComplete: () => {
            isAnimating = false;
            if (isAtFinalFrame) {
              finalFrameComplete = true;
              // Keep the gesture that revealed frame 07 consumed through its
              // momentum tail. A later down gesture can then leave the tour.
            }
            if (wasAtFinalFrame !== isAtFinalFrame) refreshPin();
          },
        });
      };

      const isLightboxEvent = (event: Event): boolean => event.composedPath().some(
        (node) => node instanceof HTMLElement && node.classList.contains(styles.lightboxOverlay),
      );
      const isTextEntryTarget = (target: EventTarget | null): boolean => target instanceof Element
        && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
      const isTriggerActive = (trigger: ScrollTrigger): boolean => {
        const scroll = trigger.scroll();
        return trigger.isActive || (scroll >= trigger.start && scroll <= trigger.end);
      };
      const blockLenisAndBrowser = (event: WheelEvent | TouchEvent): void => {
        if (event.cancelable) event.preventDefault();
        // Lenis checks this marker in its virtual-scroll handler. The listener
        // below runs in capture phase, before Lenis' bubbling wheel/touch hook.
        (event as Event & { lenisStopPropagation?: boolean }).lenisStopPropagation = true;
      };
      const wheelDeltaPixels = (event: WheelEvent): number => {
        if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * (100 / 6);
        if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
        return event.deltaY;
      };
      const setWheelDeltaPixels = (event: WheelEvent, delta: number): void => {
        // Lenis reads these properties after this capture listener. Defining
        // own values keeps its default smooth-wheel path while capping a wheel
        // that crosses into the pin at the exact entrance position.
        Object.defineProperty(event, 'deltaY', { configurable: true, value: delta });
        Object.defineProperty(event, 'deltaMode', { configurable: true, value: WheelEvent.DOM_DELTA_PIXEL });
      };
      const setTouchScrollDelta = (event: TouchEvent, previousY: number, delta: number): void => {
        const touch = event.targetTouches[0] ?? event.touches[0];
        if (!touch) return;
        const boundedTouch = [{ clientX: touch.clientX, clientY: previousY - delta }] as unknown as TouchList;
        Object.defineProperty(event, 'targetTouches', { configurable: true, value: boundedTouch });
      };
      const handleWheel = (event: WheelEvent): void => {
        const trigger = galleryTriggerRef.current;
        if (!trigger || event.ctrlKey || isLightboxEvent(event) || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        const direction = Math.sign(event.deltaY);
        if (!direction) return;

        const scroll = trigger.scroll();
        const rawDelta = wheelDeltaPixels(event);
        if (!isTriggerActive(trigger)) {
          // A high-delta first gesture can leap over the pin before
          // ScrollTrigger sees it. Land at the relevant edge and count this
          // same gesture as one gallery step, so there is no dead entry scroll.
          if (direction > 0 && scroll < trigger.start && scroll + rawDelta >= trigger.start) {
            setWheelDeltaPixels(event, trigger.start + 1 - scroll);
            setTourActive(true);
            lockGesture(direction);
            animateToIndex(desiredIndex + 1);
          } else if (direction < 0 && scroll > trigger.end && scroll + rawDelta <= trigger.end) {
            // Re-enter at frame 07. The crossing gesture only returns the
            // pinned tour to view; later up gestures move back one frame each.
            setWheelDeltaPixels(event, trigger.start + 1 - scroll);
            setTourActive(true);
            lockGesture(direction);
          }
          return;
        }

        setTourActive(true);
        if (isAnimating) {
          blockLenisAndBrowser(event);
          releaseGestureLock();
          return;
        }
        if (gestureLocked && direction === gestureDirection) {
          blockLenisAndBrowser(event);
          releaseGestureLock();
          return;
        }
        if (gestureLocked && direction !== gestureDirection) unlockForDirectionChange();

        const nextIndex = clampIndex(desiredIndex + direction);
        if (nextIndex === desiredIndex) {
          if (direction > 0 && desiredIndex === stepCount && finalFrameComplete) {
            setTourActive(false);
            return;
          }
          if (direction < 0 && desiredIndex === 0) {
            setTourActive(false);
            return;
          }
          if (direction > 0 && desiredIndex === stepCount && !finalFrameComplete) {
            lockGesture(direction);
            blockLenisAndBrowser(event);
            return;
          }
          // At either end, leave scroll ownership with Lenis. The pin has a
          // short natural exit runway only after frame 07 has fully settled.
          return;
        }

        blockLenisAndBrowser(event);
        lockGesture(direction);
        animateToIndex(nextIndex);
      };

      const handleTouchStart = (event: TouchEvent): void => {
        if (!event.touches.length || isLightboxEvent(event)) return;
        // A new finger-down is an explicit new gesture. Unlike wheel input,
        // touch has a reliable gesture boundary, so it need not inherit the
        // wheel-momentum quiet window from a previous interaction.
        if (!isAnimating && gestureLocked) unlockForDirectionChange();
        touchStartY = lastTouchY = event.touches[0].clientY;
        touchDirection = 0;
        touchBlocked = false;
        touchEntryLocked = false;
      };
      const handleTouchMove = (event: TouchEvent): void => {
        const trigger = galleryTriggerRef.current;
        if (!trigger || touchStartY === null || lastTouchY === null || !event.touches.length || isLightboxEvent(event)) return;
        const currentY = event.touches[0].clientY;
        const scroll = trigger.scroll();
        const totalDelta = touchStartY - currentY;
        if (Math.abs(totalDelta) < 14) {
          lastTouchY = currentY;
          return;
        }
        const direction = Math.sign(totalDelta);
        if (touchEntryLocked) {
          blockLenisAndBrowser(event);
          lastTouchY = currentY;
          return;
        }
        if (isAnimating) {
          blockLenisAndBrowser(event);
          releaseGestureLock();
          lastTouchY = currentY;
          touchDirection = 0;
          touchBlocked = false;
          return;
        }
        if (gestureLocked && direction === gestureDirection) {
          blockLenisAndBrowser(event);
          releaseGestureLock();
          lastTouchY = currentY;
          touchDirection = 0;
          touchBlocked = false;
          return;
        }
        if (gestureLocked && direction !== gestureDirection) unlockForDirectionChange();
        if (!isTriggerActive(trigger)) {
          const scrollDelta = touchStartY - currentY;
          let boundedDelta = 0;
          if (scrollDelta > 0 && scroll < trigger.start && scroll + scrollDelta >= trigger.start) {
            boundedDelta = trigger.start + 1 - scroll;
          } else if (scrollDelta < 0 && scroll > trigger.end && scroll + scrollDelta <= trigger.end) {
            boundedDelta = trigger.start + 1 - scroll;
          }
          if (boundedDelta) {
            try {
              setTouchScrollDelta(event, lastTouchY, boundedDelta);
              event.preventDefault();
              touchEntryLocked = true;
              setTourActive(true);
              lockGesture(direction);
              if (direction > 0) animateToIndex(desiredIndex + 1);
            } catch {
              // If a browser does not allow a bounded TouchList, leave this
              // move alone and let the next touch event retry at the boundary.
            }
          }
          lastTouchY = currentY;
          return;
        }

        setTourActive(true);
        if (!direction) return;
        const nextIndex = clampIndex(desiredIndex + direction);
        if (nextIndex === desiredIndex) {
          if ((direction > 0 && desiredIndex === stepCount && finalFrameComplete)
            || (direction < 0 && desiredIndex === 0)) {
            setTourActive(false);
            lastTouchY = currentY;
            return;
          }
          if (direction > 0 && desiredIndex === stepCount && !finalFrameComplete) {
            lockGesture(direction);
            blockLenisAndBrowser(event);
            lastTouchY = currentY;
            return;
          }
          lastTouchY = currentY;
          return;
        }
        touchDirection = direction;
        touchBlocked = true;
        blockLenisAndBrowser(event);
        lastTouchY = currentY;
      };
      const handleTouchEnd = (event: TouchEvent): void => {
        if (touchStartY === null) return;
        if (touchEntryLocked) blockLenisAndBrowser(event);
        touchStartY = null;
        lastTouchY = null;
        if (touchBlocked && touchDirection) {
          const nextIndex = clampIndex(desiredIndex + touchDirection);
          if (nextIndex !== desiredIndex) {
            lockGesture(touchDirection);
            animateToIndex(nextIndex);
          }
        }
        touchDirection = 0;
        touchBlocked = false;
        touchEntryLocked = false;
      };

      const handleKeyDown = (event: KeyboardEvent): void => {
        const trigger = galleryTriggerRef.current;
        if (!trigger || !isTriggerActive(trigger) || event.altKey || event.ctrlKey || event.metaKey || event.repeat || isLightboxEvent(event) || isTextEntryTarget(event.target)) return;
        if (event.code === 'Space' && event.target instanceof Element && event.target.closest('button, a')) return;

        let direction = 0;
        if (event.key === 'ArrowDown' || event.key === 'PageDown' || (event.code === 'Space' && !event.shiftKey)) direction = 1;
        if (event.key === 'ArrowUp' || event.key === 'PageUp' || (event.code === 'Space' && event.shiftKey)) direction = -1;
        if (!direction) return;
        if (isAnimating) {
          event.preventDefault();
          return;
        }
        if (gestureLocked && direction === gestureDirection) {
          event.preventDefault();
          releaseGestureLock();
          return;
        }
        if (gestureLocked && direction !== gestureDirection) unlockForDirectionChange();

        setTourActive(true);
        const nextIndex = clampIndex(desiredIndex + direction);
        if (nextIndex === desiredIndex) {
          if ((direction > 0 && desiredIndex === stepCount && finalFrameComplete)
            || (direction < 0 && desiredIndex === 0)) {
            setTourActive(false);
            return;
          }
          if (direction > 0 && desiredIndex === stepCount && !finalFrameComplete) {
            event.preventDefault();
            lockGesture(direction);
          }
          return;
        }
        event.preventDefault();
        lockGesture(direction);
        animateToIndex(nextIndex);
      };

      pinTrigger = ScrollTrigger.create({
        trigger: gallery,
        pin: gallery,
        start: 'top top',
        // The global capture listener owns vertical gestures while the gallery
        // is active. Keep enough pin runway to survive a missed/oversized wheel
        // delta until all seven frames have been shown, then release naturally.
        end: () => tourActive
          ? `+=${Math.max(window.innerHeight * 1.5, 1200)}`
          : '+=1',
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: () => setTourActive(true),
        onEnterBack: () => {
          if (!tourActive && finalFrameComplete) {
            // A missed capture on reverse entry still returns to frame 07;
            // the crossing gesture is not also counted as a reverse step.
            setTourActive(true);
            lockGesture(-1);
            return;
          }
          setTourActive(true);
        },
        onLeave: (self) => {
          if (!tourActive || self.direction <= 0) return;
          if (finalFrameComplete && desiredIndex === stepCount) {
            setTourActive(false);
            return;
          }

          // A native wheel target can bypass Lenis' capped delta on the entry
          // gesture. If that still carries the document through the pin end,
          // rewind the scroll position into the gallery and consume that same
          // gesture as one frame step. This sentinel runs independently of
          // the pointer target and keeps the pinned panel on screen.
          if (!gestureLocked && !isAnimating && desiredIndex < stepCount) {
            lockGesture(1);
            animateToIndex(desiredIndex + 1);
          }
          self.scroll(self.start + 1);
          ScrollTrigger.update();
        },
        onLeaveBack: (self) => {
          if (!tourActive) {
            if (finalFrameComplete) {
              // Re-enter the sequence at its last completed frame rather than
              // counting the boundary-crossing gesture as an additional step.
              setTourActive(true);
              lockGesture(-1);
              self.scroll(self.start + 1);
              ScrollTrigger.update();
            }
            return;
          }
          if (desiredIndex === 0 && !gestureLocked && !isAnimating) {
            setTourActive(false);
            return;
          }

          // Mirror the same recovery for an unbounded native wheel/touch event
          // moving upward: reverse one frame per gesture until frame 01, then
          // hand the previous section back to the page.
          if (!gestureLocked && !isAnimating && desiredIndex > 0) {
            lockGesture(-1);
            animateToIndex(desiredIndex - 1);
          }
          self.scroll(self.start + 1);
          ScrollTrigger.update();
        },
      });
      galleryTriggerRef.current = pinTrigger;

      window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
      window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
      window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
      window.addEventListener('touchend', handleTouchEnd, { capture: true, passive: true });
      window.addEventListener('touchcancel', handleTouchEnd, { capture: true, passive: true });
      window.addEventListener('keydown', handleKeyDown, { capture: true });

      const refresh = (): void => ScrollTrigger.refresh();
      window.addEventListener('resize', refresh, { passive: true });
      return () => {
        window.clearTimeout(gestureTimer);
        window.removeEventListener('resize', refresh);
        window.removeEventListener('wheel', handleWheel, true);
        window.removeEventListener('touchstart', handleTouchStart, true);
        window.removeEventListener('touchmove', handleTouchMove, true);
        window.removeEventListener('touchend', handleTouchEnd, true);
        window.removeEventListener('touchcancel', handleTouchEnd, true);
        window.removeEventListener('keydown', handleKeyDown, true);
        pinTrigger.kill(true);
        if (galleryTriggerRef.current === pinTrigger) galleryTriggerRef.current = null;
      };
    },
    { scope: rootRef, dependencies: [showAllFacilities], revertOnUpdate: true },
  );

  useEffect(() => {
    if (!prefersReducedMotion() || showAllFacilities) return;

    const viewport = rootRef.current?.querySelector<HTMLElement>('[data-facilities-viewport]');
    if (!viewport) return;

    let frame = 0;
    const updateTourIndex = (): void => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const cards = Array.from(viewport.querySelectorAll<HTMLElement>('[data-facility-card]'));
        const viewportCenter = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
        const nearestIndex = cards.reduce((nearest, card, index) => {
          const cardCenter = card.getBoundingClientRect().left + card.clientWidth / 2;
          const nearestCenter = cards[nearest].getBoundingClientRect().left + cards[nearest].clientWidth / 2;
          return Math.abs(cardCenter - viewportCenter) < Math.abs(nearestCenter - viewportCenter) ? index : nearest;
        }, 0);
        setTourIndex(nearestIndex);
      });
    };

    viewport.addEventListener('scroll', updateTourIndex, { passive: true });
    updateTourIndex();
    return () => {
      viewport.removeEventListener('scroll', updateTourIndex);
      window.cancelAnimationFrame(frame);
    };
  }, [showAllFacilities]);

  useLayoutEffect(() => {
    if (!pendingTourReturnRef.current || showAllFacilities) return;

    // Let React restore the horizontal layout, then refresh against its settled
    // geometry. Keep the current scroll owner in control: moving window.scrollY
    // directly here desynchronizes Lenis' virtual position from the document.
    const scheduledFrames: number[] = [];
    const nextFrame = (callback: FrameRequestCallback): void => {
      scheduledFrames.push(window.requestAnimationFrame(callback));
    };
    nextFrame(() => nextFrame(() => {
      const gallery = rootRef.current?.querySelector<HTMLElement>('[data-facilities-gallery]');
      if (!gallery) return;
      ScrollTrigger.refresh();
      ScrollTrigger.update();
      gallery.focus({ preventScroll: true });
      pendingTourReturnRef.current = false;
    }));

    return () => {
      scheduledFrames.forEach((frame) => window.cancelAnimationFrame(frame));
    };
  }, [showAllFacilities]);

  const openAllFacilities = (): void => {
    // ScrollTrigger reparents a pinned element into its spacer. Revert that DOM
    // mutation before React inserts the grid heading or changes gallery classes.
    const tour = galleryTriggerRef.current;
    if (tour) {
      const track = rootRef.current?.querySelector<HTMLElement>('[data-facilities-track]');
      if (track) gsap.killTweensOf(track);
      tour.kill(true);
    }
    galleryTriggerRef.current = null;
    setShowAllFacilities(true);
    window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      const grid = rootRef.current?.querySelector<HTMLElement>('#all-facilities-grid');
      grid?.focus({ preventScroll: true });
    });
  };

  const returnToTour = (): void => {
    // Keep this safe if a future layout change allows a trigger to survive grid mode.
    const tour = galleryTriggerRef.current;
    if (tour) {
      const track = rootRef.current?.querySelector<HTMLElement>('[data-facilities-track]');
      if (track) gsap.killTweensOf(track);
      tour.kill(true);
    }
    galleryTriggerRef.current = null;
    pendingTourReturnRef.current = true;
    setShowAllFacilities(false);
  };

  return (
    <section ref={rootRef} data-office-story className={styles.section} aria-labelledby="office-story-title">
      <div className={styles.intro}>
        <h2 id="office-story-title" tabIndex={-1}>Facilities Overview</h2>
        <a className={styles.viewAllButton} href="#all-facilities-grid" onClick={openAllFacilities} aria-controls="all-facilities-grid" aria-expanded={showAllFacilities}>
          View all photos <span aria-hidden="true">→</span>
        </a>
      </div>

      <div id="all-facilities-grid" className={`${styles.facilitiesGallery} ${showAllFacilities ? styles.allFacilitiesMode : ''}`} data-facilities-gallery role="region" aria-label="AscendRev facilities overview photo gallery" tabIndex={-1}>
        <div className={styles.galleryViewport} data-facilities-viewport>
          <div className={styles.galleryTrack} data-facilities-track>
            {FACILITIES.map((facility, index) => (
              <figure
                className={`${styles.facilityCard} ${tourIndex === index && !showAllFacilities ? styles.activeFacility : ''} ${facility.portrait ? styles.portraitFacilityCard : ''}`}
                data-facility-card
                key={facility.label}
                aria-current={tourIndex === index && !showAllFacilities ? 'step' : undefined}
              >
                <button
                  className={`${styles.facilityImage} ${facility.portrait ? styles.portraitFacilityImage : ''}`}
                  type="button"
                  onClick={() => openFacilityPreview(index)}
                  aria-label={`Preview ${facility.label} photo`}
                  aria-haspopup="dialog"
                >
                  {facility.portrait && (
                    <span
                      className={styles.facilityBackfill}
                      style={{ backgroundImage: `url("${facility.src}")` }}
                      aria-hidden="true"
                    />
                  )}
                  <Image
                    src={facility.src}
                    alt={facility.alt}
                    fill
                    sizes="76vw"
                    className={`${styles.facilityPhoto} ${facility.label === 'Secure Personal Storage' ? styles.containedFacilityPhoto : ''} ${facility.portrait ? styles.portraitFacilityPhoto : ''}`}
                  />
                  <span className={styles.facilityNumber} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                </button>
                <figcaption>{facility.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        {!showAllFacilities && (
          <div className={styles.galleryProgress}>
            <span className={styles.galleryProgressCount} aria-live="polite" aria-atomic="true">
              {String(tourIndex + 1).padStart(2, '0')} / {String(FACILITIES.length).padStart(2, '0')}
            </span>
            <span className={styles.galleryProgressTrack} role="progressbar" aria-label="Facilities tour progress" aria-valuemin={1} aria-valuemax={FACILITIES.length} aria-valuenow={tourIndex + 1} aria-valuetext={`${FACILITIES[tourIndex].label}, ${tourIndex + 1} of ${FACILITIES.length}`}>
              <span className={styles.galleryProgressFill} style={{ width: `${((tourIndex + 1) / FACILITIES.length) * 100}%` }} />
            </span>
            <span className={styles.galleryProgressLabel} aria-hidden="true">{FACILITIES[tourIndex].label}</span>
          </div>
        )}
        {showAllFacilities && <button className={styles.returnButton} type="button" onClick={returnToTour}>Return to facilities tour</button>}
      </div>

      {activeFacilityIndex !== null && typeof document !== 'undefined' && createPortal((
        <div
          className={styles.lightboxOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveFacilityIndex(null);
          }}
        >
          <div
            ref={previewDialogRef}
            className={styles.lightboxDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="facility-preview-title"
            tabIndex={-1}
          >
            {(() => {
              const facility = FACILITIES[activeFacilityIndex];
              const filename = facility.src.split('/').pop() || 'ascendrev-facility';
              return (
                <>
                  <div className={styles.lightboxTopBar}>
                    <h3 className={styles.lightboxTitle} id="facility-preview-title">
                      {facility.label}
                      <span>{String(activeFacilityIndex + 1).padStart(2, '0')} / {String(FACILITIES.length).padStart(2, '0')}</span>
                    </h3>
                    <div className={styles.lightboxTools}>
                      <button
                        className={styles.lightboxToolButton}
                        type="button"
                        onClick={() => setPreviewZoom((zoom) => Math.max(1, +(zoom - 0.25).toFixed(2)))}
                        disabled={previewZoom <= 1}
                        aria-label="Zoom out"
                        title="Zoom out"
                      >
                        <MagnifyingGlassMinus size={21} aria-hidden="true" />
                      </button>
                      <button
                        className={styles.lightboxToolButton}
                        type="button"
                        onClick={() => setPreviewZoom((zoom) => Math.min(3, +(zoom + 0.25).toFixed(2)))}
                        disabled={previewZoom >= 3}
                        aria-label="Zoom in"
                        title="Zoom in"
                      >
                        <MagnifyingGlassPlus size={21} aria-hidden="true" />
                      </button>
                      <button
                        className={styles.lightboxToolButton}
                        type="button"
                        onClick={() => void shareActiveFacility()}
                        aria-label="Share photo"
                        title="Share photo"
                      >
                        <ShareNetwork size={21} aria-hidden="true" />
                      </button>
                      <a
                        className={styles.lightboxToolButton}
                        href={facility.src}
                        download={filename}
                        aria-label="Download photo"
                        title="Download photo"
                      >
                        <DownloadSimple size={21} aria-hidden="true" />
                      </a>
                      <button
                        ref={closePreviewRef}
                        className={styles.lightboxToolButton}
                        type="button"
                        onClick={() => setActiveFacilityIndex(null)}
                        aria-label="Close photo preview"
                        title="Close photo preview"
                      >
                        <X size={23} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className={styles.lightboxStage}>
                    <button
                      className={styles.lightboxNavButton}
                      type="button"
                      onClick={() => moveFacilityPreview(activeFacilityIndex - 1)}
                      disabled={activeFacilityIndex === 0}
                      aria-label="Previous facility photo"
                      title="Previous photo"
                    >
                      <ArrowLeft size={26} aria-hidden="true" />
                    </button>
                    <div className={styles.lightboxMedia}>
                      <Image
                        key={facility.src}
                        src={facility.src}
                        alt={facility.alt}
                        fill
                        sizes="100vw"
                        className={styles.lightboxPhoto}
                        style={{ transform: `scale(${previewZoom})` }}
                        priority
                      />
                    </div>
                    <button
                      className={styles.lightboxNavButton}
                      type="button"
                      onClick={() => moveFacilityPreview(activeFacilityIndex + 1)}
                      disabled={activeFacilityIndex === FACILITIES.length - 1}
                      aria-label="Next facility photo"
                      title="Next photo"
                    >
                      <ArrowRight size={26} aria-hidden="true" />
                    </button>
                  </div>
                  <p className={styles.lightboxStatus} aria-live="polite" aria-atomic="true">{shareStatus}</p>
                </>
              );
            })()}
          </div>
        </div>
      ), document.body)}
    </section>
  );
}
