import { useCallback } from 'react'
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk'
import { NETWORK_PASSPHRASE } from '../contract/config'

export function useWallet() {
    const getAddress = useCallback(async () => {
        try {
            const { address } = await StellarWalletsKit.getAddress()
            return address || null
        } catch {
            return null
        }
    }, [])

    const signTransaction = useCallback(async (xdr) => {
        let address
        try {
            const result = await StellarWalletsKit.getAddress()
            address = result.address
        } catch {
            throw new Error('Wallet not connected')
        }

        if (!address) throw new Error('Wallet not connected')

        try {
            const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
                networkPassphrase: NETWORK_PASSPHRASE,
                address,
            })
            return signedTxXdr
        } catch (err) {
            if (err.message?.includes('rejected') || err.message?.includes('denied')) {
                throw new Error('Transaction rejected by user.')
            }
            if (err.message?.includes('balance') || err.message?.includes('underfunded')) {
                throw new Error('Insufficient balance for this transaction.')
            }
            throw err
        }
    }, [])

    return {
        getAddress,
        signTransaction
    }
}