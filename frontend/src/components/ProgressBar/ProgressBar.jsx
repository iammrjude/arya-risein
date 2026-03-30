import styles from './ProgressBar.module.css'
import { formatXlm } from '../../utils/format'

export default function ProgressBar({ totalRaised, goalAmount }) {
    const raised = Number(totalRaised)
    const goal = Number(goalAmount)
    const percent = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0
    const is70 = percent >= 70

    return (
        <div className={styles.wrapper}>
            <div className={styles.track}>
                <div
                    className={`${styles.fill} ${is70 ? styles.fill70 : ''}`}
                    style={{ width: `${percent}%` }}
                />
                <div className={styles.marker70} title="70% threshold" />
            </div>
            <div className={styles.labels}>
                <span className={styles.raised}>
                    {formatXlm(raised)} XLM raised
                </span>
                <span className={styles.percent}>
                    {percent.toFixed(1)}%
                </span>
                <span className={styles.goal}>
                    {formatXlm(goal)} XLM goal
                </span>
            </div>
        </div>
    )
}
