'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';
import {
  EASE_OUT_EXPO,
  EASE_OUT_EXPO_BEZIER,
  EASE_OUT_QUART,
  EASE_OUT_QUART_BEZIER,
} from '@/lib/motion';

let registered = false;

/**
 * Register GSAP's plugins and this project's two eases, exactly once per page
 * load.
 *
 * `gsap.registerPlugin` is itself idempotent, but `CustomEase.create` is not
 * free and every motion primitive calls this on mount, so the guard keeps it
 * to a single pass.
 *
 * Callers must invoke this from inside `useGSAP` or `useEffect`. Those never
 * run during the server render, which is what keeps GSAP away from the
 * static-export build step (SPEC.md §1: there is no Node process at runtime,
 * and the export is rendered once at build time).
 */
export function registerMotion(): void {
  if (registered) return;
  registered = true;
  gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);
  CustomEase.create(EASE_OUT_QUART, EASE_OUT_QUART_BEZIER);
  CustomEase.create(EASE_OUT_EXPO, EASE_OUT_EXPO_BEZIER);
}
