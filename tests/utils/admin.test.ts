import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('isBootstrapAdminUid', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ADMIN_UIDS', 'admin-a, admin-b')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns true for listed uids', async () => {
    const { isBootstrapAdminUid } = await import('../../src/utils/admin')
    expect(isBootstrapAdminUid('admin-a')).toBe(true)
    expect(isBootstrapAdminUid('admin-b')).toBe(true)
  })

  it('returns false for unknown or empty uid', async () => {
    const { isBootstrapAdminUid } = await import('../../src/utils/admin')
    expect(isBootstrapAdminUid('other')).toBe(false)
    expect(isBootstrapAdminUid(null)).toBe(false)
    expect(isBootstrapAdminUid(undefined)).toBe(false)
  })
})
