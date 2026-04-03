import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import DocsPage from './DocsPage'
import FAQPage from './FAQPage'

describe('Info pages', () => {
  it('renders the FAQ page with trust-focused questions', () => {
    render(
      <MemoryRouter>
        <FAQPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /Questions people ask before they trust a crowdfunding platform/i })).toBeInTheDocument()
    expect(screen.getByText(/What makes Arya different from a centralized crowdfunding platform/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open Docs/i })).toBeInTheDocument()
  })

  it('renders the docs page with ecosystem sections', () => {
    render(
      <MemoryRouter>
        <DocsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /How Arya works as a connected fundraising ecosystem/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Crowdfunding' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Read FAQ/i })).toBeInTheDocument()
  })
})
