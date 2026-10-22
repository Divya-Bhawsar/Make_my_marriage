/**
 * Utility functions for Wedding Committee and Member Collaborator components.
 */

/**
 * Resolves an invitation URL to an absolute, clickable URL.
 * Ensures that relative paths or localhost URLs (when viewed via public tunnels or production domains)
 * are properly converted using the user's active browser origin (window.location.origin).
 */
export function resolveAbsoluteInviteUrl(inviteUrl: string): string {
  if (!inviteUrl) return '';

  if (typeof window !== 'undefined') {
    // If it's a relative path e.g. /member-invitation/:token
    if (inviteUrl.startsWith('/')) {
      return `${window.location.origin}${inviteUrl}`;
    }

    try {
      const parsed = new URL(inviteUrl);
      const isLocalhostUrl = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      const isCurrentOriginLocalhost =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      // If URL has localhost/127.0.0.1 but organizer is accessing via ngrok or public domain
      if (isLocalhostUrl && !isCurrentOriginLocalhost) {
        return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      return parsed.toString();
    } catch {
      return `${window.location.origin}/${inviteUrl.replace(/^\/+/, '')}`;
    }
  }

  return inviteUrl;
}
