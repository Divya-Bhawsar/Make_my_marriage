import { describe, it, expect, afterEach } from 'vitest';
import { resolveAbsoluteInviteUrl } from '../team.utils';

describe('Team Utils - resolveAbsoluteInviteUrl', () => {
  afterEach(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  it('returns empty string when input is empty or null', () => {
    expect(resolveAbsoluteInviteUrl('')).toBe('');
  });

  it('returns raw inviteUrl when running on server-side without window', () => {
    delete (globalThis as unknown as { window?: unknown }).window;
    expect(resolveAbsoluteInviteUrl('/member-invitation/token123')).toBe('/member-invitation/token123');
  });

  it('prepends window.location.origin to relative URLs on client', () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: {
        origin: 'https://counting-old-mankind.ngrok-free.dev',
        hostname: 'counting-old-mankind.ngrok-free.dev',
      },
    };

    const result = resolveAbsoluteInviteUrl('/member-invitation/token123');
    expect(result).toBe('https://counting-old-mankind.ngrok-free.dev/member-invitation/token123');
  });

  it('replaces localhost origin with current ngrok/tunnel origin for external mobile recipients', () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: {
        origin: 'https://counting-old-mankind.ngrok-free.dev',
        hostname: 'counting-old-mankind.ngrok-free.dev',
      },
    };

    const result = resolveAbsoluteInviteUrl('http://localhost:3000/member-invitation/token456');
    expect(result).toBe('https://counting-old-mankind.ngrok-free.dev/member-invitation/token456');
  });

  it('preserves localhost origin when browsing on localhost', () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: {
        origin: 'http://localhost:3000',
        hostname: 'localhost',
      },
    };

    const result = resolveAbsoluteInviteUrl('http://localhost:3000/member-invitation/token789');
    expect(result).toBe('http://localhost:3000/member-invitation/token789');
  });

  it('preserves existing production domain URLs', () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: {
        origin: 'https://makemymarriage.in',
        hostname: 'makemymarriage.in',
      },
    };

    const result = resolveAbsoluteInviteUrl('https://makemymarriage.in/member-invitation/tok-prod');
    expect(result).toBe('https://makemymarriage.in/member-invitation/tok-prod');
  });
});
