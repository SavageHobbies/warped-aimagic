'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Package, 
  Scan, 
  List, 
  BarChart3, 
  Settings, 
  CreditCard,
  Plus,
  FileText,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  badge?: string
  description?: string
}

const navigation: NavItem[] = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: BarChart3,
    description: 'Overview and analytics'
  },
  { 
    name: 'Add Product', 
    href: '/add-product', 
    icon: Scan,
    description: 'Scan or add products'
  },
  { 
    name: 'My Inventory', 
    href: '/inventory', 
    icon: Package,
    description: 'Manage products'
  },
  { 
    name: 'My Listings', 
    href: '/listings', 
    icon: List,
    description: 'eBay listings'
  },
  { 
    name: 'Drafts', 
    href: '/drafts', 
    icon: FileText,
    description: 'Draft listings'
  },
]

const secondaryNavigation: NavItem[] = [
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings,
    description: 'Account settings'
  },
  { 
    name: 'Billing', 
    href: '/billing', 
    icon: CreditCard,
    description: 'Billing & subscription'
  },
]

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href)
    
    return (
      <Link
        href={item.href}
        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
          active
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
        onClick={() => setMobileOpen(false)}
      >
        <item.icon 
          className={`flex-shrink-0 w-5 h-5 ${
            collapsed ? 'mr-0' : 'mr-3'
          } ${
            active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'
          }`} 
        />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="truncate">{item.name}</div>
            {item.description && (
              <div className={`text-xs mt-0.5 ${
                active ? 'text-primary-foreground/80' : 'text-muted-foreground'
              }`}>
                {item.description}
              </div>
            )}
          </div>
        )}
        {item.badge && !collapsed && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            active ? 'bg-primary/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center px-4 ${collapsed ? 'justify-center' : 'justify-between'} h-16 border-b border-border`}>
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Package className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl text-foreground">AI Magic</span>
          </div>
        )}
        {collapsed && <Package className="w-8 h-8 text-primary" />}
        
        {/* Desktop collapse toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
        
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>
        
        <div className="pt-6 mt-6 border-t border-border">
          <div className="space-y-1">
            {secondaryNavigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            AI Magic Lister v1.0
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${mobileOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div className="fixed top-0 left-0 bottom-0 w-64 bg-card shadow-xl">
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 ${
        collapsed ? 'lg:w-16' : 'lg:w-64'
      } bg-card border-r border-border transition-all duration-300`}>
        {sidebarContent}
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 flex items-center justify-center w-10 h-10 rounded-lg bg-card shadow-lg border border-border text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  )
}
