import { Link } from 'react-router-dom'
import StatusBadge from '../StatusBadge/StatusBadge'
import ProgressBar from '../ProgressBar/ProgressBar'
import CountdownTimer from '../CountdownTimer/CountdownTimer'
import { getCountdown } from '../../utils/time'
import { truncateAddress } from '../../utils/stellar'
import styles from './CampaignCard.module.css'

export default function CampaignCard({ campaign }) {
    const { id, title, description, goal_amount, total_raised, deadline, organizer, status } = campaign

    const statusLabel = status[0]
    const goalReached = Number(campaign.total_raised) >= Number(campaign.goal_amount)
    const countdown = getCountdown(deadline)
    const displayStatus = (goalReached && statusLabel === 'Active')
        ? 'Goal Met'
        : statusLabel

    return (
        <Link to={`/crowdfunding/campaign/${id}`} className={styles.card}>
            <div className={styles.cardHeader}>
                <h3 className={styles.title}>{title}</h3>
                <StatusBadge status={displayStatus} />
            </div>
            <p className={styles.description}>{description}</p>
            <div className={styles.progress}>
                <ProgressBar totalRaised={total_raised} goalAmount={goal_amount} />
            </div>
            <div className={styles.footer}>
                {goalReached && !countdown.expired ? (
                    <div className={styles.goalMetMessage}>
                        <span>{displayStatus}</span>
                    </div>
                ) : (
                    <CountdownTimer deadlineTs={deadline} label="Ends in" />
                )}
                <div className={styles.organizer}>
                    <span className={styles.organizerLabel}>by</span>
                    <span className={styles.organizerAddress}>{truncateAddress(organizer)}</span>
                </div>
            </div>
        </Link>
    )
}
