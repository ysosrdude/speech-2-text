import type { ReactNode } from 'react'
import { APP_NAME } from '../../constants/app'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-brand">{APP_NAME}</p>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
