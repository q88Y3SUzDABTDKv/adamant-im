import { Cryptos, TransactionStatus as TS } from '@/lib/constants'

export default {
  methods: {
    /**
     * Get transaction status from ETH, ERC20, DOGE modules.
     * @param {{ id: string, type: string, hash: string }} admSpecialMessage
     * @param {string} partnerId Partner ADM address
     */
    fetchTransactionStatus (admSpecialMessage, partnerId) {
      const { type, hash, senderId, recipientId } = admSpecialMessage

      // ADM transaction already has property `status`
      if (type === Cryptos.ADM) return

      this.fetchCryptoAddresses(type, recipientId, senderId)
      this.fetchTransaction(type, hash)
    },
    /**
     * Fetch transaction and save to state.
     * @param {string} type Transaction type
     * @param {string} hash Transaction hash
     */
    fetchTransaction (type, hash) {
      const cryptoModule = type.toLowerCase()

      return this.$store.dispatch(`${cryptoModule}/getTransaction`, {
        hash
      })
    },

    fetchCryptoAddresses (type, recipientId, senderId) {
      const recipientCryptoAddress = this.$store.dispatch('partners/fetchAddress', {
        crypto: type,
        partner: recipientId
      })
      const senderCryptoAddress = this.$store.dispatch('partners/fetchAddress', {
        crypto: type,
        partner: senderId
      })

      return Promise.all([recipientCryptoAddress, senderCryptoAddress])
    },

    verifyTransactionDetails (transaction, admSpecialMessage, {
      recipientCryptoAddress,
      senderCryptoAddress
    }) {
      if (
        transaction.hash === admSpecialMessage.hash &&
        +transaction.amount === +admSpecialMessage.amount &&
        transaction.senderId.toLowerCase() === senderCryptoAddress.toLowerCase() &&
        transaction.recipientId.toLowerCase() === recipientCryptoAddress.toLowerCase()
      ) {
        return true
      }

      return false
    },

    getTransactionStatus (admSpecialMessage) {
      const { hash, type, senderId, recipientId } = admSpecialMessage

      // ADM transaction already has property `status`
      if (type === Cryptos.ADM) return admSpecialMessage.status

      const getterName = type.toLowerCase() + '/transaction'
      const getter = this.$store.getters[getterName]

      const transaction = getter(hash)
      let status = (transaction && transaction.status) || TS.PENDING

      const recipientCryptoAddress = this.$store.getters['partners/cryptoAddress'](recipientId, type)
      const senderCryptoAddress = this.$store.getters['partners/cryptoAddress'](senderId, type)

      if (status === 'SUCCESS') {
        if (this.verifyTransactionDetails(transaction, admSpecialMessage, {
          recipientCryptoAddress,
          senderCryptoAddress
        })) {
          status = TS.DELIVERED
        } else {
          status = TS.INVALID
        }
      } else {
        status = status === 'PENDING'
          ? TS.PENDING
          : TS.REJECTED
      }

      return status
    }
  }
}