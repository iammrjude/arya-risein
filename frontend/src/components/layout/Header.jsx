import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk'
import { useWallet } from '../../hooks/useWallet'
import { truncateAddress } from '../../utils/stellar'
import styles from './Header.module.css'

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Crowdfunding', to: '/crowdfunding' },
  { label: 'Launchpad', to: '/launchpad' },
  { label: 'Staking', to: '/staking/xlm' },
  { label: 'Admin', to: '/admin' },
]

export default function Header() {
  const location = useLocation()
  const { getAddress } = useWallet()
  const [address, setAddress] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const walletWrapper = useRef(null)

  useEffect(() => {
    async function syncAddress() {
      const next = await getAddress()
      setAddress(next)
    }

    syncAddress()
    const interval = setInterval(syncAddress, 2000)
    return () => clearInterval(interval)
  }, [getAddress])

  useEffect(() => {
    const wrapper = walletWrapper.current
    if (!wrapper) return
    wrapper.innerHTML = ''
    StellarWalletsKit.createButton(wrapper)
  }, [location.pathname])

  const activePath = useMemo(() => {
    if (location.pathname.startsWith('/crowdfunding')) return '/crowdfunding'
    if (location.pathname.startsWith('/launchpad')) return '/launchpad'
    if (location.pathname.startsWith('/staking')) return '/staking/xlm'
    if (location.pathname.startsWith('/admin')) return '/admin'
    return '/'
  }, [location.pathname])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>◆</span>
            <span className={styles.logoText}>Arya</span>
          </Link>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`${styles.navLink} ${activePath === item.to ? styles.active : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.right}>
          {address && (
            <div className={styles.walletInfo}>
              <span className={styles.connectedDot} />
              <span className={styles.address}>{truncateAddress(address, 8, 8)}</span>
            </div>
          )}
          <div ref={walletWrapper} className={styles.walletButton} />
          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`${styles.mobileLink} ${activePath === item.to ? styles.active : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <p className={styles.mobileHint}>All platform pages stay visible here for quick discovery.</p>
        </div>
      )}
    </header>
  )
}
