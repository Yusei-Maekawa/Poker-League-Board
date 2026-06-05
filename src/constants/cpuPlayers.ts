/** 試合に追加できる CPU 参加者（Firestore players には登録しない） */
export const CPU_PARTICIPANTS = [
  { id: 'cpu-1', name: 'CPU 1', icon: '🤖' },
  { id: 'cpu-2', name: 'CPU 2', icon: '🤖' },
  { id: 'cpu-3', name: 'CPU 3', icon: '🤖' },
] as const

export type CpuParticipantId = (typeof CPU_PARTICIPANTS)[number]['id']

const cpuIdSet = new Set<string>(CPU_PARTICIPANTS.map((c) => c.id))

export function isCpuPlayerId(playerId: string): boolean {
  return cpuIdSet.has(playerId)
}

export function getCpuParticipant(playerId: string) {
  return CPU_PARTICIPANTS.find((c) => c.id === playerId) ?? null
}
