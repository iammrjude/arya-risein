import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk'
import styles from './Header.module.css'

export default function Header() {
    const buttonMounted = useRef(false)
    const location = useLocation()

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

    function isActive(path) {
        return location.pathname === path
    }

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <Link to="/" className={styles.logo}>
                    <span className={styles.logoIcon}>◈</span>
                    <span className={styles.logoText}>Arya</span>
                </Link>
                <nav className={styles.nav}>
                    <Link to="/" className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}>
                        Browse
                    </Link>
                    <Link to="/create" className={`${styles.navLink} ${isActive('/create') ? styles.active : ''}`}>
                        Create
                    </Link>
                    <Link to="/dashboard" className={`${styles.navLink} ${isActive('/dashboard') ? styles.active : ''}`}>
                        Dashboard
                    </Link>
                </nav>
            </div>

            <div className={styles.right}>
                <div id="swk-button-wrapper" />
            </div>
        </header>
    )
}
