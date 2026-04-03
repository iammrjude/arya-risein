import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AryaTokenPage from './AryaTokenPage'

const mockSwap = vi.fn()
const mockPoolStatus = vi.fn()
const mockQuote = vi.fn()

vi.mock('../../../hooks/useWallet', () => ({
  useWallet: () => ({
    getAddress: vi.fn().mockResolvedValue('GWALLET'),
    signTransaction: vi.fn(),
  }),
}))

vi.mock('../../../contract/client', () => ({
  getAryaSwapQuote: (...args) => mockQuote(...args),
  getAryaXlmPoolStatus: (...args) => mockPoolStatus(...args),
  swapAryaAgainstXlm: (...args) => mockSwap(...args),
}))

describe('AryaTokenPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPoolStatus.mockResolvedValue({
      poolId: 'POOL123',
      poolExists: true,
      aryaReserve: 500000,
      xlmReserve: 5000,
    })
    mockQuote.mockResolvedValue({
      destinationAmount: '2500',
      destinationAssetLabel: 'ARYA',
    })
    mockSwap.mockResolvedValue({ hash: 'hash123' })
  })

  it('shows the fixed total supply and live pool price', async () => {
    render(<AryaTokenPage />)

    expect(await screen.findByText('100,000,000 ARYA')).toBeInTheDocument()
    expect(await screen.findByText('1 ARYA = 0.01 XLM')).toBeInTheDocument()
    expect(screen.getByText('POOL123')).toBeInTheDocument()
  })

  it('loads a swap quote when the user enters an amount', async () => {
    render(<AryaTokenPage />)

    fireEvent.change(screen.getByPlaceholderText('25.0'), { target: { value: '25' } })

    await waitFor(() => expect(mockQuote).toHaveBeenCalledWith({ direction: 'buy', amount: '25' }))
    expect(await screen.findByText('2,500 ARYA')).toBeInTheDocument()
  })
})
