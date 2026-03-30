import { Link } from 'react-router-dom'
import styles from './Footer.module.css'

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <span>AryaFund</span>
            <span className={styles.dot}>·</span>
            <span>Built on Stellar Testnet</span>
            <span className={styles.dot}>·</span>

            <a href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
            >
                stellar.org ↗
            </a>
            <span className={styles.dot}>·</span>
            <Link to="/admin" className={styles.link}>Admin</Link>
        </footer >
    )
}