import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  'zh-CN': {
    translation: {
      app: { title: '简历投递管理' },
      nav: { table: '表格', kanban: '看板', calendar: '日历', settings: '设置' },
    },
  },
  en: {
    translation: {
      app: { title: 'Resume Tracker' },
      nav: { table: 'Table', kanban: 'Kanban', calendar: 'Calendar', settings: 'Settings' },
    },
  },
}

void i18n.use(initReactI18next).init({
  resources,
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
})

export default i18n
