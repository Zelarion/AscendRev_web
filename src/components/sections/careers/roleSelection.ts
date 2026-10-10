import type { RoleSlug } from '@/content/careers';

/**
 * A role chosen elsewhere on the page (a quick-apply button) is handed to the
 * application form through one window event, so the two components share no
 * state and either can render on its own.
 */
export const ROLE_SELECTED_EVENT = 'careers:select-role';

export function selectRole(slug: RoleSlug): void {
  window.dispatchEvent(new CustomEvent<RoleSlug>(ROLE_SELECTED_EVENT, { detail: slug }));
}
