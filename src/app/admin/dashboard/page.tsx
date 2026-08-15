'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/lib/AuthContext'
import { useRouter } from 'next/navigation'
import styles from './AdminDashboard.module.css'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { LayoutDashboard, Users, Settings, FileText, Menu, X, CheckSquare, BarChart3, Flame } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  _count?: {
    tasks: number
  }
}

interface TaskStats {
  total: number
  completed: number
  pending: number
}

interface DashboardStats {
  totalUsers: number
  totalTasks: number
  completionRate: number
  activeToday: number
}

export default function AdminDashboard() {
  const { session, logout, isAdmin } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTasks: 0,
    completionRate: 0,
    activeToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSidebarExpanded, setSidebarExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('stats')
  const [expandedStat, setExpandedStat] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (!isAdmin) {
      router.push('/')
      return
    }

    fetchDashboardData()
  }, [session, isAdmin, router])

  const fetchDashboardData = async () => {
    try {
      // Mock Data
      setStats({
        totalUsers: 2,
        totalTasks: 5,
        completionRate: 40,
        activeToday: 1,
      })
      setUsers([
        { id: '1', email: 'admin', name: 'Administrador', role: 'ADMIN', _count: { tasks: 5 } },
        { id: '2', email: 'user', name: 'Usuário', role: 'USER', _count: { tasks: 0 } },
      ])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const completedTasks = Math.round((stats.totalTasks * stats.completionRate) / 100);
  const pendingTasks = stats.totalTasks - completedTasks;
  const pieData = [
    { name: 'Concluídas', value: completedTasks, color: '#4a7c59' }, 
    { name: 'Pendentes', value: pendingTasks, color: '#c8442f' },
  ];

  const statCards = [
    { id: 'users', icon: <Users size={24} />, label: 'Usuários', value: stats.totalUsers },
    { id: 'tasks', icon: <CheckSquare size={24} />, label: 'Tarefas', value: stats.totalTasks },
    { id: 'rate', icon: <BarChart3 size={24} />, label: 'Taxa de conclusão', value: `${stats.completionRate.toFixed(1)}%` },
    { id: 'active', icon: <Flame size={24} />, label: 'Ativos hoje', value: stats.activeToday },
  ];

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoArea}>
            <span className={styles.logoMark}>●</span>
            <h1 className={styles.logoText}>ToDo Admin</h1>
          </div>
          <div className={styles.userSection}>
            <span className={styles.userRole}>ADM</span>
            <div className={styles.userMenu}>
              <span className={styles.userName}>{session?.user.name}</span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Sair
              </button>
            </div>
          </div>
        </div>
        <div className={styles.headerRule} />
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Sidebar */}
        <motion.aside 
          className={styles.sidebar}
          animate={{ width: isSidebarExpanded ? 240 : 64 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        >
          <button 
            className={styles.sidebarToggle}
            onClick={() => setSidebarExpanded(!isSidebarExpanded)}
          >
            {isSidebarExpanded ? <X size={16} /> : <Menu size={16} />}
          </button>

          <nav className={styles.nav}>
            <div className={styles.navSection}>
              <div className={styles.navLabelContainer}>
                <AnimatePresence>
                  {isSidebarExpanded && (
                    <motion.p 
                      className={styles.navLabel}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      Dashboard
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              <div onClick={() => setActiveTab('stats')} className={`${styles.navItem} ${activeTab === 'stats' ? styles.navItemActive : ''}`}>
                <div className={styles.navIcon}><LayoutDashboard size={20} /></div>
                <AnimatePresence>
                  {isSidebarExpanded && (
                    <motion.span 
                      className={styles.navText}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                    >
                      Estatísticas
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              
              <div onClick={() => setActiveTab('users')} className={`${styles.navItem} ${activeTab === 'users' ? styles.navItemActive : ''}`}>
                <div className={styles.navIcon}><Users size={20} /></div>
                <AnimatePresence>
                  {isSidebarExpanded && (
                    <motion.span 
                      className={styles.navText}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    >
                      Usuários
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className={styles.navSection}>
              <div className={styles.navLabelContainer}>
                <AnimatePresence>
                  {isSidebarExpanded && (
                    <motion.p 
                      className={styles.navLabel}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      Gerenciamento
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div onClick={() => setActiveTab('reports')} className={`${styles.navItem} ${activeTab === 'reports' ? styles.navItemActive : ''}`}>
                <div className={styles.navIcon}><FileText size={20} /></div>
                <AnimatePresence>
                  {isSidebarExpanded && (
                    <motion.span 
                      className={styles.navText}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2, delay: 0.15 }}
                    >
                      Relatórios
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div onClick={() => setActiveTab('settings')} className={`${styles.navItem} ${activeTab === 'settings' ? styles.navItemActive : ''}`}>
                <div className={styles.navIcon}><Settings size={20} /></div>
                <AnimatePresence>
                  {isSidebarExpanded && (
                    <motion.span 
                      className={styles.navText}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2, delay: 0.2 }}
                    >
                      Configurações
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </nav>
        </motion.aside>

        {/* Content */}
        <section className={styles.content}>
          {/* Stats Tab (Progresso Geral) */}
          <div style={{ display: activeTab === 'stats' ? 'block' : 'none' }}>
            {/* Stats Grid */}
            <div className={styles.statsGrid} id="stats">
              {statCards.map(stat => {
                const isExpanded = expandedStat === stat.id;
                return (
                  <motion.div 
                    layout
                    key={stat.id}
                    onClick={() => setExpandedStat(isExpanded ? null : stat.id)}
                    className={`${styles.statCard} ${isExpanded ? styles.statCardExpanded : styles.statCardCollapsed}`}
                    style={{ borderRadius: isExpanded ? '12px' : '40px' }}
                  >
                    <motion.div layout className={styles.statIcon}>
                      {stat.icon}
                    </motion.div>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          className={styles.statContent}
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className={styles.statLabel}>{stat.label}</p>
                          <p className={styles.statValue}>{stat.value}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>

          {/* Chart Section */}
          <section className={styles.chartSection}>
            <div className={styles.sectionHeader} style={{ marginBottom: '0.5rem' }}>
              <h2 className={styles.sectionTitle}>Progresso Geral</h2>
              <p className={styles.sectionSubtitle}>
                Distribuição de tarefas concluídas vs pendentes
              </p>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={1000}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      borderColor: 'var(--border)',
                      borderRadius: '4px',
                      color: 'var(--ink)'
                    }} 
                    itemStyle={{ color: 'var(--ink)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
          </div>

          {/* Users Tab */}
          <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}>
          <section className={styles.usersSection} id="users">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Usuários do sistema</h2>
              <p className={styles.sectionSubtitle}>
                Total de {stats.totalUsers} usuários registrados
              </p>
            </div>

            <div className={styles.usersTable}>
              <div className={styles.tableHeader}>
                <div className={styles.tableCol} style={{ flex: 2 }}>
                  Nome
                </div>
                <div className={styles.tableCol} style={{ flex: 2 }}>
                  Email
                </div>
                <div className={styles.tableCol} style={{ flex: 1 }}>
                  Cargo
                </div>
                <div className={styles.tableCol} style={{ flex: 1 }}>
                  Tarefas
                </div>
                <div className={styles.tableCol} style={{ flex: 1 }}>
                  Ações
                </div>
              </div>

              <div className={styles.tableBody}>
                {users.map((user, index) => (
                  <div
                    key={user.id}
                    className={styles.tableRow}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className={styles.tableCol} style={{ flex: 2 }}>
                      <span className={styles.userName}>{user.name}</span>
                    </div>
                    <div className={styles.tableCol} style={{ flex: 2 }}>
                      <span className={styles.userEmail}>{user.email}</span>
                    </div>
                    <div className={styles.tableCol} style={{ flex: 1 }}>
                      <span
                        className={`${styles.badge} ${
                          user.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser
                        }`}
                      >
                        {user.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                      </span>
                    </div>
                    <div className={styles.tableCol} style={{ flex: 1 }}>
                      <span className={styles.taskCount}>
                        {user._count?.tasks || 0}
                      </span>
                    </div>
                    <div className={styles.tableCol} style={{ flex: 1 }}>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className={styles.viewBtn}
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          </div>

          {/* Reports Tab */}
          <div style={{ display: activeTab === 'reports' ? 'block' : 'none' }}>
            <section className={styles.usersSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Relatórios</h2>
                <p className={styles.sectionSubtitle}>Módulo em desenvolvimento...</p>
              </div>
            </section>
          </div>

          {/* Settings Tab */}
          <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
            <section className={styles.usersSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Configurações</h2>
                <p className={styles.sectionSubtitle}>Módulo em desenvolvimento...</p>
              </div>
            </section>
          </div>
        </section>
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className={styles.modal} onClick={() => setSelectedUser(null)}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Detalhes do usuário</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className={styles.closeBtn}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nome:</span>
                <span className={styles.detailValue}>{selectedUser.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{selectedUser.email}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Cargo:</span>
                <span className={styles.detailValue}>{selectedUser.role}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tarefas:</span>
                <span className={styles.detailValue}>
                  {selectedUser._count?.tasks || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
