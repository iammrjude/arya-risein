import { NavLink } from 'react-router-dom'
import styles from './ModuleTabs.module.css'

export default function ModuleTabs({ tabs }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
