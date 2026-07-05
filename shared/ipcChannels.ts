export const IPC_CHANNELS = {
  PET_DRAG_START: 'pet:drag-start',
  PET_DRAG_MOVE: 'pet:drag-move',
  PET_CLICK: 'pet:click',
  PET_REACTION: 'pet:reaction',
  PANEL_OPEN: 'panel:open',
  PANEL_TEST_REACTION: 'panel:test-reaction',
  PLANS_LIST: 'plans:list',
  PLANS_CREATE: 'plans:create',
  PLANS_UPDATE: 'plans:update',
  PLANS_DELETE: 'plans:delete',
  PLANS_SET_DONE: 'plans:set-done',
  CHECKINS_LIST_FOR_DATE: 'checkins:list-for-date',
  CHECKINS_TOGGLE: 'checkins:toggle'
} as const
