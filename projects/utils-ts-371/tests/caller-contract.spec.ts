import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import type { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { AppManager } from '@algorandfoundation/algokit-utils/types/app-manager'
import {
  type Account,
  type Address,
  OnApplicationComplete,
  encodeAddress,
  encodeUint64,
  getApplicationAddress,
} from 'algosdk'
import { readFileSync } from 'node:fs'

import { CalledContractClient, CalledContractFactory } from './CalledContractClient.ts'
import { CallerContractClient, CallerContractFactory } from './CallerContractClient.ts'
import { getRandomBytes } from './utils/bytes.js'

describe('Test', () => {
  const localnet = algorandFixture()

  let user: Address & Account & TransactionSignerAccount
  let calledContractClient: CalledContractClient
  let callerContractClient: CallerContractClient

  beforeAll(async () => {
    await localnet.newScope()
    const { algorand, generateAccount } = localnet.context

    user = await generateAccount({ initialFunds: (100).algo() })

    // deploy called contract
    {
      const calledContractFactory = algorand.client.getTypedAppFactory(CalledContractFactory, {
        defaultSender: user,
        defaultSigner: user.signer,
      })
      const { appClient, result } = await calledContractFactory.deploy()
      calledContractClient = appClient
      expect(result.appId).not.toEqual(0n)
    }

    // deploy caller contract
    {
      const callerContractFactory = algorand.client.getTypedAppFactory(CallerContractFactory, {
        defaultSender: user,
        defaultSigner: user.signer,
      })
      const { appClient, result } = await callerContractFactory.deploy()
      callerContractClient = appClient
      expect(result.appId).not.toEqual(0n)
    }
  })

  test('throws custom error message when outer call', async () => {
    await expect(calledContractClient.send.fail()).rejects.toThrow('custom error message')
  })

  test('throws custom error message when inner call', async () => {
    await expect(
      callerContractClient.send.call({
        sender: user,
        args: [calledContractClient.appId],
        extraFee: (1000).microAlgos(),
      }),
    ).rejects.toThrow('custom error message')
  })
})
