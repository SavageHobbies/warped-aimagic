'use client'

import React, { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import { 
  Package, 
  TrendingUp, 
  Eye, 
  DollarSign, 
  Plus, 
  Scan,
  Bot,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  Activity,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ComponentType<any>
  color: 'blue' | 'green' | 'purple' | 'orange'
  trend?: 'up' | 'down'
}

const MetricCard = ({ title, value, change, changeLabel, icon: Icon, color, trend }: MetricCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500', 
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

interface ActivityItem {
  id: string
  type: 'scan' | 'listing' | 'sale' | 'ai_generation'
  title: string
  description: string
  time: string
  status?: 'success' | 'pending' | 'error'
}

const ActivityFeed = ({ activities }: { activities: ActivityItem[] }) => {
  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case 'scan':
        return <Scan className="w-4 h-4" />
      case 'listing':
        return <Package className="w-4 h-4" />
      case 'sale':
        return <DollarSign className="w-4 h-4" />
      case 'ai_generation':
        return <Bot className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
      default:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <Link 
          href="/activity" 
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all
        </Link>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              getStatusColor(activity.status)
            }`}>
              {getActivityIcon(activity.type, activity.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activity.description}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const QuickActions = () => {
  const actions = [
    {
      name: 'Scan Product',
      description: 'Scan a barcode to add to inventory',
      href: '/scanner',
      icon: Scan,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Add Product',
      description: 'Manually add a new product',
      href: '/add-product', 
      icon: Plus,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Generate AI Content',
      description: 'Create AI-powered descriptions',
      href: '/ai-content',
      icon: Bot,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      name: 'View Inventory',
      description: 'Manage your product inventory',
      href: '/inventory',
      icon: Package,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
          >
            <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3 transition-colors`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {action.name}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalListings: 1248,
    activeListings: 982, 
    totalViews: 21800,
    revenue: 18450.75
  })

  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'scan',
      title: 'Vintage Leather Jacket scanned',
      description: 'Product added to inventory',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      id: '2', 
      type: 'ai_generation',
      title: 'AI content generated',
      description: 'Generated descriptions for 5 products',
      time: '15 minutes ago',
      status: 'success'
    },
    {
      id: '3',
      type: 'listing',
      title: 'Modern Art Print listed',
      description: 'Listed on eBay for $45.00',
      time: '1 hour ago',
      status: 'success'
    },
    {
      id: '4',
      type: 'sale',
      title: 'Sale completed',
      description: 'Golf Set sold for $145.00',
      time: '2 hours ago',
      status: 'success'
    }
  ])

  return (
    <MainLayout 
      title="Welcome back, Alex!"
      subtitle="Here's what's happening with your inventory today"
    >
      <div className="p-6 space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Listings"
            value={metrics.totalListings.toLocaleString()}
            change={13.2}
            changeLabel="from last month"
            icon={Package}
            color="blue"
            trend="up"
          />
          <MetricCard
            title="Active Listings"
            value={metrics.activeListings.toLocaleString()}
            change={8.1}
            changeLabel="from last month"
            icon={CheckCircle}
            color="green"
            trend="up"
          />
          <MetricCard
            title="Total Views"
            value={`${(metrics.totalViews / 1000).toFixed(1)}k`}
            change={23.5}
            changeLabel="from last month"
            icon={Eye}
            color="purple"
            trend="up"
          />
          <MetricCard
            title="Revenue This Month"
            value={`$${metrics.revenue.toLocaleString()}`}
            change={15.3}
            changeLabel="from last month"
            icon={DollarSign}
            color="orange"
            trend="up"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <ActivityFeed activities={activities} />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Top Performing Listings</h3>
            <div className="space-y-4">
              {[
                { name: 'Vintage Leather Jacket', views: 2740, sales: 3 },
                { name: 'Handmade Ceramic Mug', views: 1850, sales: 2 },
                { name: 'Antique Wooden Chair', views: 1690, sales: 1 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.views} views</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{item.sales} sales</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Category Breakdown</h3>
            <div className="space-y-4">
              {[
                { name: 'Fashion & Apparel', percentage: 35, color: 'bg-blue-500' },
                { name: 'Home Goods', percentage: 28, color: 'bg-green-500' },
                { name: 'Electronics', percentage: 20, color: 'bg-purple-500' },
                { name: 'Collectibles', percentage: 17, color: 'bg-orange-500' }
              ].map((category, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{category.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{category.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`${category.color} h-2 rounded-full`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
