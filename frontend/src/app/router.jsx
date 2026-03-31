import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Shell from './shell/Shell'
import styles from './router.module.css'

const LandingPage = lazy(() => import('../modules/home/pages/LandingPage'))
const CrowdfundingBrowsePage = lazy(() => import('../modules/crowdfunding/pages/CrowdfundingBrowsePage'))
const CrowdfundingCampaignPage = lazy(() => import('../modules/crowdfunding/pages/CrowdfundingCampaignPage'))
const CrowdfundingCreatePage = lazy(() => import('../modules/crowdfunding/pages/CrowdfundingCreatePage'))
const CrowdfundingDashboardPage = lazy(() => import('../modules/crowdfunding/pages/CrowdfundingDashboardPage'))
const LaunchpadExplorePage = lazy(() => import('../modules/launchpad/pages/LaunchpadExplorePage'))
const LaunchpadCreatePage = lazy(() => import('../modules/launchpad/pages/LaunchpadCreatePage'))
const LaunchpadProjectPage = lazy(() => import('../modules/launchpad/pages/LaunchpadProjectPage'))
const LaunchpadDashboardPage = lazy(() => import('../modules/launchpad/pages/LaunchpadDashboardPage'))
const StakingOverviewPage = lazy(() => import('../modules/staking/pages/StakingOverviewPage'))
const StakingRewardPoolPage = lazy(() => import('../modules/staking/pages/StakingRewardPoolPage'))
const StakingDashboardPage = lazy(() => import('../modules/staking/pages/StakingDashboardPage'))
const AdminPage = lazy(() => import('../modules/admin/pages/AdminPage'))
const AryaTokenPage = lazy(() => import('../modules/token/pages/AryaTokenPage'))
const TreasuryPage = lazy(() => import('../modules/treasury/pages/TreasuryPageEntry'))

export default function AppRoutes() {
  return (
    <Shell>
      <Suspense fallback={<div className={styles.loading}>Loading module...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/token" element={<AryaTokenPage />} />
          <Route path="/treasury" element={<TreasuryPage />} />

          <Route path="/crowdfunding" element={<CrowdfundingBrowsePage />} />
          <Route path="/crowdfunding/create" element={<CrowdfundingCreatePage />} />
          <Route path="/crowdfunding/campaign/:id" element={<CrowdfundingCampaignPage />} />
          <Route path="/crowdfunding/dashboard" element={<CrowdfundingDashboardPage />} />

          <Route path="/launchpad" element={<LaunchpadExplorePage />} />
          <Route path="/launchpad/create" element={<LaunchpadCreatePage />} />
          <Route path="/launchpad/project/:id" element={<LaunchpadProjectPage />} />
          <Route path="/launchpad/dashboard" element={<LaunchpadDashboardPage />} />

          <Route path="/staking" element={<Navigate to="/staking/xlm" replace />} />
          <Route path="/staking/xlm" element={<StakingRewardPoolPage rewardAsset="xlm" />} />
          <Route path="/staking/usdc" element={<StakingRewardPoolPage rewardAsset="usdc" />} />
          <Route path="/staking/dashboard" element={<StakingDashboardPage />} />
          <Route path="/staking/overview" element={<StakingOverviewPage />} />

          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Suspense>
    </Shell>
  )
}
