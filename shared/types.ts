export type EmotionState = 'idle' | 'happy' | 'comfort' | 'stern'

export interface PetReactionPayload {
  emotion: EmotionState
  durationMs: number
}
