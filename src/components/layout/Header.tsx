import React, { useState } from 'react';
import { Menu, Sun, Moon, Settings, Bell, Search, ChevronDown, LogOut } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';

export function Header() {
  const { settings, toggleTheme, toggleSidebar, setActiveModule } = useStore();
  const { user, logout } = useAuthStore();
  const [userOpen, setUserOpen] = useState(false);

  const displayName = user?.name ?? settings.engineerName ?? 'Engineer';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="ec-header">
      {/* Hamburger */}
      <button className="ec-header-btn" onClick={toggleSidebar} title="Toggle sidebar">
        <Menu style={{ width: 20, height: 20 }} />
      </button>

      {/* Search bar */}
      <div className="ec-search">
        <Search style={{ width: 18, height: 18, color: '#475569', flexShrink: 0 }} />
        <input type="text" placeholder="Search modules, calculations, standards..." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span className="ec-kbd">Ctrl</span>
          <span className="ec-kbd">K</span>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>

        {/* Theme toggle */}
        <button className="ec-header-btn" onClick={toggleTheme} title="Toggle theme">
          {settings.theme === 'dark'
            ? <Sun style={{ width: 18, height: 18 }} />
            : <Moon style={{ width: 18, height: 18 }} />}
        </button>

        {/* Notifications */}
        <button className="ec-header-btn">
          <Bell style={{ width: 18, height: 18 }} />
          <span className="ec-notif-badge">3</span>
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: '#1E293B', margin: '0 8px' }} />

        {/* User profile */}
        <div style={{ position: 'relative' }}>
          <button className="ec-user-profile" onClick={() => setUserOpen((p) => !p)}>
            <div className="ec-avatar">{initials}</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', lineHeight: 1.3 }}>{displayName}</div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.3 }}>Electrical Manager</div>
            </div>
            <ChevronDown style={{ width: 14, height: 14, color: '#475569', marginLeft: 2 }} />
          </button>

          {userOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setUserOpen(false)} />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: 200,
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: 12,
                boxShadow: '0 20px 50px rgba(0,0,0,.50)',
                zIndex: 50, overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #334155' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{displayName}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{user?.email ?? ''}</div>
                </div>
                <div style={{ padding: '6px 0' }}>
                  <button
                    onClick={() => { setActiveModule('settings'); setUserOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'none', border: 'none', color: '#94A3B8', fontSize: 14, cursor: 'pointer', transition: 'all 150ms' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#253347')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Settings style={{ width: 16, height: 16 }} /> Settings
                  </button>
                  <button
                    onClick={() => { logout(); setUserOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'none', border: 'none', color: '#EF4444', fontSize: 14, cursor: 'pointer', transition: 'all 150ms' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <LogOut style={{ width: 16, height: 16 }} /> Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
