import { create } from 'zustand'

interface UiState {
  /** 从日历/看板跳转到表格时,要展开/聚焦的记录 id。 */
  focusAppId: string | null
  setFocusAppId: (id: string | null) => void
}

export const useUiStore = create<UiState>()((set) => ({
  focusAppId: null,
  setFocusAppId: (id) => set({ focusAppId: id }),
}))
