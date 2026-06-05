import { useAppContext } from '../context/AppProvider'

export function useAuth() {
  const {
    user,
    myPlayer,
    hasPlayerProfile,
    authLoading,
    isAdmin,
    isBootstrapAdmin,
    canManageAdmins,
    isPlayerParticipationSuspended,
    login,
    logout,
    deleteOwnAccount,
  } = useAppContext()

  return {
    user,
    myPlayer,
    hasPlayerProfile,
    loading: authLoading,
    isAdmin,
    isBootstrapAdmin,
    canManageAdmins,
    isPlayerParticipationSuspended,
    login,
    logout,
    deleteOwnAccount,
  }
}
