'use client'

import React, { useState } from 'react'
import Sidebar from './Sidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { Bell, Search, Sun, Moon, User } from 'lucide-react'

interface MainLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  icon?: React.ReactNode
}

export default function MainLayout({ children, title, subtitle, actions, icon }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      } transition-all duration-300`}>
        
        {/* Top header */}
        <header className="bg-card border-b border-border px-6 py-4 transition-all duration-200">
          <div className="flex items-center justify-between">
            {/* Title section */}
            <div className="min-w-0 flex-1">
              {title && (
                <div className="flex items-center space-x-3">
                  {icon && (
                    <div className="transform transition-transform duration-200 hover:scale-110">
                      {icon}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-foreground transition-colors duration-200">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-sm text-muted-foreground mt-1 transition-colors duration-200">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions and user menu */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary w-64 transition-all duration-200 hover:border-muted-foreground"
                />
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 transform transition-transform duration-300 hover:rotate-180" />
                ) : (
                  <Moon className="w-5 h-5 transform transition-transform duration-300 hover:rotate-12" />
                )}
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent transition-all duration-200 hover:scale-105 active:scale-95">
                <Bell className="w-5 h-5 transform transition-transform duration-200 hover:rotate-12" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
              </button>

              {/* Custom actions */}
              {actions}

              {/* User menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 rounded-lg text-foreground hover:bg-accent transition-all duration-200 hover:scale-105 active:scale-95">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-110">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="hidden md:block text-sm font-medium transition-colors duration-200">Alex</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
