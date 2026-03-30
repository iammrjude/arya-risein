import { useState, useEffect } from 'react'
import { getCountdown } from '../../utils/time'
import styles from './CountdownTimer.module.css'

export default function CountdownTimer({ deadlineTs, label = 'Time Remaining' }) {
    const [countdown, setCountdown] = useState(getCountdown(deadlineTs))

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(getCountdown(deadlineTs))
        }, 1000)
        return () => clearInterval(interval)
    }, [deadlineTs])

    if (countdown.expired) {
        return (
            <div className={styles.wrapper}>
                <span className={styles.label}>{label}</span>
                <span className={styles.expired}>Deadline Passed</span>
            </div>
        )
    }

    return (
        <div className={styles.wrapper}>
            <span className={styles.label}>{label}</span>
            <div className={styles.timer}>
                <div className={styles.unit}>
                    <span className={styles.value}>{String(countdown.days).padStart(2, '0')}</span>
                    <span className={styles.unitLabel}>days</span>
                </div>
                <span className={styles.colon}>:</span>
                <div className={styles.unit}>
                    <span className={styles.value}>{String(countdown.hours).padStart(2, '0')}</span>
                    <span className={styles.unitLabel}>hrs</span>
                </div>
                <span className={styles.colon}>:</span>
                <div className={styles.unit}>
                    <span className={styles.value}>{String(countdown.minutes).padStart(2, '00')}</span>
                    <span className={styles.unitLabel}>min</span>
                </div>
                <span className={styles.colon}>:</span>
                <div className={styles.unit}>
                    <span className={styles.value}>{String(countdown.seconds).padStart(2, '0')}</span>
                    <span className={styles.unitLabel}>sec</span>
                </div>
            </div>
        </div>
    )
}