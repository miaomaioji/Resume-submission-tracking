import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { initDb } from '@/db/repository'
import { applyMd3Theme } from '@/app/m3-theme'
import '@/lib/i18n'
import './index.css'

// 首帧前先按系统偏好注入 M3 配色,避免闪烁(挂载后 Layout 再按设置精修)
applyMd3Theme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
void initDb()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </React.StrictMode>,
)
