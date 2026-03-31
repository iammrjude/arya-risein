import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk'
import styles from './Header.module.css'
import { RxHamburgerMenu } from 'react-icons/rx'

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'ARYA', to: '/token' },
  { label: 'Crowdfunding', to: '/crowdfunding' },
  { label: 'Launchpad', to: '/launchpad' },
  { label: 'Staking', to: '/staking/overview' },
  { label: 'Treasury', to: '/treasury' },
  { label: 'Admin', to: '/admin' },
]

export default function Header() {
  const location = useLocation()
  const buttonMounted = useRef(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (buttonMounted.current) return
    const wrapper = document.querySelector('#swk-button-wrapper')
    if (!wrapper) return

    StellarWalletsKit.createButton(wrapper)
    buttonMounted.current = true

    // Poll for address after user connects via SWK modal
    const interval = setInterval(async () => {
      try {
        const { address } = await StellarWalletsKit.getAddress()
        if (address) {
          // Address found, stop polling
          clearInterval(interval)
          buttonMounted.current = false // allow re-mounting the button on disconnect
        }
      } catch {
        // not connected yet, keep polling
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const activePath = useMemo(() => {
    if (location.pathname.startsWith('/token')) return '/token'
    if (location.pathname.startsWith('/treasury')) return '/treasury'
    if (location.pathname.startsWith('/crowdfunding')) return '/crowdfunding'
    if (location.pathname.startsWith('/launchpad')) return '/launchpad'
    if (location.pathname.startsWith('/staking')) return '/staking/overview'
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
          <div id="swk-button-wrapper" />

          <button
            type="button"
            className={styles.menuButton}
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
          >
            <RxHamburgerMenu size={22} color="#A78BFA" />
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
