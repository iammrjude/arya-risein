import styles from './ConnectPrompt.module.css'

export default function ConnectPrompt({ onConnect, loading }) {
    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <div className={styles.orb} />
                <div className={styles.orbOuter} />
                <div className={styles.icon}>◈</div>
                <h1 className={styles.title}>Arya</h1>
                <p className={styles.subtitle}>
                    Decentralized crowdfunding on the Stellar network.
                    <br />
                    Connect your wallet to browse or create campaigns.
                </p>
                <button
                    className={styles.connectBtn}
                    onClick={onConnect}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className={styles.spinner} />
                            Connecting...
                        </>
                    ) : (
                        <>
                            Connect Wallet
                            <span className={styles.btnArrow}>→</span>
                        </>
                    )}
                </button>
                <div className={styles.features}>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>◈</span>
                        <span>Create campaigns</span>
                    </div>
                    <div className={styles.featureDivider}>—</div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>◎</span>
                        <span>Donate XLM</span>
                    </div>
                    <div className={styles.featureDivider}>—</div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>⟶</span>
                        <span>Track progress</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
