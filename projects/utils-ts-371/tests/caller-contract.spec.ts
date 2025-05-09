import { AlgorandClient } from '@algorandfoundation/algokit-utils'
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
import { CalledContractClient, CalledContractFactory } from './CalledContractClient'
import { CallerContractClient, CallerContractFactory } from './CallerContractClient'

describe('Test', () => {
  const localnet = algorandFixture()

  let user: Address & Account & TransactionSignerAccount
  let calledContractClient: CalledContractClient
  let callerContractClient: CallerContractClient
  let algorandClient: AlgorandClient

  beforeAll(async () => {
    await localnet.newScope()
    const { algorand, generateAccount } = localnet.context

    user = await generateAccount({ initialFunds: (100).algo() })
    algorandClient = algorand

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

  test('throws custom error message when outer call and using another client', async () => {
    await expect(
      callerContractClient.algorand
        .newGroup()
        .addAppCallMethodCall({
          appId: calledContractClient.appId,
          method: calledContractClient.appClient.getABIMethod('fail')!,
          sender: user,
        })
        .send(),
    ).rejects.toThrow('custom error message')
  })

  test.only('throws custom error message when inner call', async () => {
    try {
      await callerContractClient.send.call({
        sender: user,
        args: [calledContractClient.appId],
        extraFee: (1000).microAlgos(),
      })
    } catch (e) {
      console.debug(e)
      console.debug(`HERE!: Outer: ${callerContractClient.appId} Inner: ${calledContractClient.appId}`)
    }
  })
})
