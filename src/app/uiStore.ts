import { create } from 'zustand'

interface UiState {
  /** 从日历/看板跳转到表格时,要展开/聚焦的记录 id。 */
  focusAppId: string | null
  setFocusAppId: (id: string | null) => void
  /** 外壳 FAB 请求「新增投递」的计数信号(每次 +1)。 */
  addNonce: number
  requestAdd: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  focusAppId: null,
  setFocusAppId: (id) => set({ focusAppId: id }),
  addNonce: 0,
  requestAdd: () => set((s) => ({ addNonce: s.addNonce + 1 })),
}))
