import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Shell from './Shell'

vi.mock('../../components/layout/Header', () => ({
  default: () => <div>Header</div>,
}))

vi.mock('../../components/layout/Footer', () => ({
  default: () => <div>Footer</div>,
}))

describe('Shell', () => {
  it('shows crowdfunding module tabs on crowdfunding routes', () => {
    render(
      <MemoryRouter initialEntries={['/crowdfunding/dashboard']}>
        <Shell>
          <div>Child content</div>
        </Shell>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Explore' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('shows staking reward tabs on staking routes', () => {
    render(
      <MemoryRouter initialEntries={['/staking/usdc']}>
        <Shell>
          <div>Staking content</div>
        </Shell>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'XLM Rewards' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'USDC Rewards' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Positions' })).toBeInTheDocument()
  })

  it('hides module tabs on routes without a module section', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Shell>
          <div>Admin content</div>
        </Shell>
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link', { name: 'Explore' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'XLM Rewards' })).not.toBeInTheDocument()
    expect(screen.getByText('Admin content')).toBeInTheDocument()
  })
})
