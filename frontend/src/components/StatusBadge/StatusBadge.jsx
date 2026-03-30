import styles from './StatusBadge.module.css'

export default function StatusBadge({ status }) {
    const cssKey = status?.toLowerCase().replace(' ', '-')
    return (
        <span className={`${styles.badge} ${styles[cssKey]}`}>
            {status}
        </span>
    )
}