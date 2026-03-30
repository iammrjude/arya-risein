import styles from './TxStatus.module.css'
import { explorerUrl } from '../../utils/stellar'

export default function TxStatus({ status, hash, error, onClose }) {
    if (!status) return null

    return (
        <div className={`${styles.wrapper} ${styles[status]}`}>
            {status === 'pending' && (
                <div className={styles.inner}>
                    <span className={styles.spinner} />
                    <span className={styles.message}>Transaction pending...</span>
                </div>
            )}

            {status === 'success' && (
                <div className={styles.inner}>
                    <span className={styles.icon}>✓</span>
                    <div className={styles.content}>
                        <span className={styles.message}>Transaction confirmed</span>
                        {hash && (

                            <a href={explorerUrl(hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.link}
                            >
                                View on Stellar.Expert ↗
                            </a>
                        )}
                    </div>
                    {onClose && (
                        <button className={styles.closeBtn} onClick={onClose}>✕</button>
                    )}
                </div>
            )}

            {status === 'error' && (
                <div className={styles.inner}>
                    <span className={styles.icon}>✕</span>
                    <div className={styles.content}>
                        <span className={styles.message}>Transaction failed</span>
                        {error && <span className={styles.error}>{error}</span>}
                    </div>
                    {onClose && (
                        <button className={styles.closeBtn} onClick={onClose}>✕</button>
                    )}
                </div>
            )}
        </div>
    )
}