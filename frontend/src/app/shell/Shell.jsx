import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import ModuleTabs from '../../components/navigation/ModuleTabs'
import styles from './Shell.module.css'

const MODULE_TABS = {
  crowdfunding: [
    { label: 'Explore', to: '/crowdfunding' },
    { label: 'Create', to: '/crowdfunding/create' },
    { label: 'Dashboard', to: '/crowdfunding/dashboard' },
  ],
  launchpad: [
    { label: 'Explore', to: '/launchpad' },
    { label: 'Create', to: '/launchpad/create' },
    { label: 'Dashboard', to: '/launchpad/dashboard' },
  ],
  staking: [
    { label: 'XLM Rewards', to: '/staking/xlm' },
    { label: 'USDC Rewards', to: '/staking/usdc' },
    { label: 'My Positions', to: '/staking/dashboard' },
  ],
}

function getModuleKey(pathname) {
  if (pathname.startsWith('/crowdfunding')) return 'crowdfunding'
  if (pathname.startsWith('/launchpad')) return 'launchpad'
  if (pathname.startsWith('/staking')) return 'staking'
  return null
}

export default function Shell({ children }) {
  const location = useLocation()
  const moduleKey = useMemo(() => getModuleKey(location.pathname), [location.pathname])
  const tabs = moduleKey ? MODULE_TABS[moduleKey] : []

  return (
    <div className={styles.app}>
      <Header />
      {tabs.length > 0 && <ModuleTabs tabs={tabs} />}
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  )
}
