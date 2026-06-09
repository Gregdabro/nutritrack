import { NavLink, Outlet, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { section: 'Главное', items: [
    { path: '/',         icon: 'ti-layout-dashboard', label: 'Дашборд' },
    { path: '/diary',    icon: 'ti-notebook',         label: 'Дневник' },
    { path: '/workouts', icon: 'ti-barbell',          label: 'Тренировки' },
  ]},
  { section: 'Здоровье', items: [
    { path: '/wellbeing', icon: 'ti-heart-rate-monitor', label: 'Самочувствие' },
    { path: '/weight',    icon: 'ti-scale',              label: 'Вес' },
  ]},
  { section: 'Данные', items: [
    { path: '/products', icon: 'ti-eggs',     label: 'Продукты' },
    { path: '/settings', icon: 'ti-settings', label: 'Настройки' },
  ]},
];

const PAGE_TITLES = {
  '/':          'Дашборд',
  '/diary':     'Дневник питания',
  '/workouts':  'Тренировки',
  '/wellbeing': 'Самочувствие',
  '/weight':    'Вес',
  '/products':  'База продуктов',
  '/settings':  'Настройки',
};

export default function Layout() {
  const location = useLocation();

  // Determine page title — handle nested routes like /workouts/:id
  const basePath = '/' + (location.pathname.split('/')[1] || '');
  const title = PAGE_TITLES[basePath] || PAGE_TITLES[location.pathname] || 'NutriTrack';

  return (
    <div className={styles.app}>
      {/* Sidebar */}
      <nav className={styles.sidebar}>
        <NavLink to="/" className={styles.sidebarLogo}>
          <div className={styles.logoMark}>
            <i className="ti ti-leaf" aria-hidden="true" />
          </div>
          <span className={styles.logoText}>NutriTrack</span>
        </NavLink>

        {NAV_ITEMS.map((group) => (
          <div key={group.section}>
            <div className={styles.navSection}>{group.section}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                <i className={`ti ${item.icon}`} aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}

        <div className={styles.sidebarBottom}>
          <div className={styles.userChip}>
            <div className={styles.avatar}>NT</div>
            <div>
              <div className={styles.userName}>NutriTrack</div>
              <div className={styles.userSub}>MVP</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className={styles.main}>
        <div className={styles.topbar}>
          <span className={styles.topbarTitle}>{title}</span>
        </div>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
