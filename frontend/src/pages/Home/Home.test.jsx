import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Home from './Home'

vi.mock('../../hooks/useContract', () => ({
  useCampaigns: () => ({
    campaigns: [
      { id: 1, title: 'Alpha', status: 'Active' },
      { id: 2, title: 'Beta', status: 'Successful' },
    ],
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}))

vi.mock('../../components/CampaignCard/CampaignCard', () => ({
  default: ({ campaign }) => <div>{campaign.title}</div>,
}))

describe('Home', () => {
  it('renders the crowdfunding browse page filters and campaigns', () => {
    render(<Home />)

    expect(screen.getByText('Decentralized Crowdfunding')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Active' })).toBeInTheDocument()
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })
})
