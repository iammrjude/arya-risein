import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Admin from './Admin'

const refreshCrowdfunding = vi.fn()
const refreshRegistry = vi.fn()
const refreshLaunchpad = vi.fn()
const refreshStaking = vi.fn()

const mockClient = {
  fundTreasuryWithArya: vi.fn(),
  getAssetTrustlineStatus: vi.fn(),
  setRegistryAryaToken: vi.fn(),
  setRegistryContracts: vi.fn(),
  setRegistryTreasury: vi.fn(),
  transferCrowdfundingOwnership: vi.fn(),
  transferLaunchpadOwnership: vi.fn(),
  transferRegistryOwnership: vi.fn(),
  transferStakingOwnership: vi.fn(),
  updateActionWindowDays: vi.fn(),
  updateFeeSettings: vi.fn(),
  updateLaunchpadFeeSettings: vi.fn(),
  updateLaunchpadStakingContract: vi.fn(),
  updateLaunchpadTreasuryWallet: vi.fn(),
  updateMinLockupDays: vi.fn(),
  updateStakeToken: vi.fn(),
  updateStakingContract: vi.fn(),
  updateTreasuryWallet: vi.fn(),
}

vi.mock('../../hooks/useContract', () => ({
  useCampaigns: () => ({
    campaigns: [{
      id: 7,
      title: 'Demo Campaign',
      organizer: 'GOWNER',
      total_raised: '10000000',
      goal_amount: '10000000',
      status: 'Active',
    }],
    loading: false,
  }),
  usePlatformSettings: () => ({
    settings: {
      owner: 'GOWNER',
      treasury_wallet: 'GTREASURY',
      staking_contract: 'CSTAKING',
      fee_basis_points: 250,
      staking_share_basis_points: 5000,
      action_window_days: 7,
    },
    loading: false,
    refresh: refreshCrowdfunding,
  }),
  useRegistryConfig: () => ({
    config: {
      owner: 'GOWNER',
      treasury: 'GTREASURY',
      arya_token: 'CARYA',
      staking_contract: 'CSTAKING',
      crowdfunding_contract: 'CCROWD',
      launchpad_contract: 'CLAUNCH',
    },
    loading: false,
    refresh: refreshRegistry,
  }),
  useLaunchpadSettings: () => ({
    settings: {
      owner: 'GOWNER',
      treasury_wallet: 'GLAUNCHTREASURY',
      staking_contract: 'CSTAKING',
      fee_basis_points: 300,
      staking_share_basis_points: 4500,
    },
    loading: false,
    refresh: refreshLaunchpad,
  }),
  useStakingOverview: () => ({
    settings: {
      owner: 'GOWNER',
      stake_token: 'CARYA',
      xlm_reward_token: 'CXLM',
      min_lockup_days: 7,
    },
    loading: false,
    refresh: refreshStaking,
  }),
}))

vi.mock('../../hooks/useWallet', () => ({
  useWallet: () => ({
    getAddress: vi.fn().mockResolvedValue('GOWNER'),
    signTransaction: vi.fn(),
  }),
}))

vi.mock('../../contract/client', () => mockClient)

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient.getAssetTrustlineStatus.mockResolvedValue({
      accountExists: true,
      hasTrustline: true,
      balance: '1250.0000000',
    })
    Object.values(mockClient).forEach((fn) => {
      if (typeof fn?.mockResolvedValue === 'function' && fn !== mockClient.getAssetTrustlineStatus) {
        fn.mockResolvedValue({ hash: 'abc123' })
      }
    })
  })

  it('renders the expanded admin controls for registry, launchpad, and staking', async () => {
    render(<Admin />)

    expect(await screen.findByText('Launchpad Admin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set ARYA Token' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Set Contracts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update Fees' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update Treasury' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update Staking Contract' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update Stake Token' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update Lockup' })).toBeInTheDocument()
  })

  it('submits the new admin actions with parsed values', async () => {
    render(<Admin />)
    await screen.findByText('Registry Admin')

    fireEvent.change(screen.getByLabelText('Registry ARYA Token'), { target: { value: 'CARYA2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Set ARYA Token' }))

    await waitFor(() => expect(mockClient.setRegistryAryaToken).toHaveBeenCalledWith({
      ownerAddress: 'GOWNER',
      aryaToken: 'CARYA2',
      signTransaction: expect.any(Function),
    }))

    fireEvent.change(screen.getByLabelText('Fee (basis points)'), { target: { value: '350' } })
    fireEvent.change(screen.getByLabelText('Staking Share (basis points)'), { target: { value: '5500' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Update Fees' })[1])

    await waitFor(() => expect(mockClient.updateLaunchpadFeeSettings).toHaveBeenCalledWith({
      ownerAddress: 'GOWNER',
      feeBasisPoints: 350,
      stakingShareBasisPoints: 5500,
      signTransaction: expect.any(Function),
    }))

    fireEvent.change(screen.getByLabelText('Minimum Lockup (days)'), { target: { value: '14' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Lockup' }))

    await waitFor(() => expect(mockClient.updateMinLockupDays).toHaveBeenCalledWith({
      ownerAddress: 'GOWNER',
      minLockupDays: 14,
      signTransaction: expect.any(Function),
    }))
  })
})
