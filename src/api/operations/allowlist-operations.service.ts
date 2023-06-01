import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AllowlistOperationRequestApiModel } from './models/allowlist-operation-request-api.model';
import { AllowlistOperationsRepository } from '../../repositories/allowlist-operations/allowlist-operations.repository';
import { AllowlistsRepository } from '../../repositories/allowlist/allowlists.repository';
import { Time } from '../../time';
import { ClientSession, Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { AllowlistCreator } from '@6529-collections/allowlist-lib/allowlist/allowlist-creator';
import { AllowlistOperation } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation';
import { Pool } from '@6529-collections/allowlist-lib/app-types';
import { AllowlistOperationResponseApiModel } from './models/allowlist-operation-response-api.model';

@Injectable()
export class AllowlistOperationsService {
  constructor(
    private readonly allowlistsRepository: AllowlistsRepository,
    private readonly allowlistOperationsRepository: AllowlistOperationsRepository,
    @InjectConnection()
    private readonly connection: Connection,
    @Inject(AllowlistCreator.name) private allowlistCreator: AllowlistCreator,
  ) {}

  private validateOperation(params: {
    code: AllowlistOperationCode;
    params: any;
  }) {
    try {
      this.allowlistCreator.validateOperation(params);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async mock(allowlistId: string) {
    await this.allowlistOperationsRepository.deleteByAllowlistId({
      allowlistId,
    });
    const operations: AllowlistOperation[] = [
      {
        code: AllowlistOperationCode.GET_COLLECTION_TRANSFERS,
        params: {
          id: 'transfer-pool-1',
          name: 'The memes',
          description: 'Transfers of the memes',
          contract: '0x33fd426905f149f8376e227d0c9d3340aad17af1',
          blockNo: 17185669,
        },
      },
      {
        code: AllowlistOperationCode.GET_COLLECTION_TRANSFERS,
        params: {
          id: 'transfer-pool-2',
          name: 'Gradient',
          description: 'Transfers of the gradient',
          contract: '0x0c58ef43ff3032005e472cb5709f8908acb00205',
          blockNo: 17185669,
        },
      },
      {
        code: AllowlistOperationCode.GET_COLLECTION_TRANSFERS,
        params: {
          id: 'transfer-pool-3',
          name: 'raw',
          description: 'Transfers of the raw',
          contract: '0x07e24ee32163da59297b5341bef8f8a2eead271e',
          blockNo: 17185669,
        },
      },
      {
        code: AllowlistOperationCode.GET_COLLECTION_TRANSFERS,
        params: {
          id: 'transfer-pool-4',
          name: 'Foundation',
          description: 'Foundation',
          contract: '0x3b3ee1931dc30c1957379fac9aba94d1c48a5405',
          blockNo: 17185669,
        },
      },
      {
        code: AllowlistOperationCode.CREATE_TOKEN_POOL,
        params: {
          id: 'token-pool-1',
          name: '6529 Meme Cards 1 to 94',
          description: 'Meme Cards 1 to 94',
          transferPoolId: 'transfer-pool-1',
          tokenIds: '1-94',
        },
      },
      {
        code: AllowlistOperationCode.CREATE_TOKEN_POOL,
        params: {
          id: 'token-pool-2',
          name: 'Gradient',
          description: 'Gradient Cards',
          transferPoolId: 'transfer-pool-2',
        },
      },
      {
        code: AllowlistOperationCode.CREATE_TOKEN_POOL,
        params: {
          id: 'token-pool-3',
          name: 'raw',
          description: 'raw Cards',
          transferPoolId: 'transfer-pool-3',
        },
      },
      {
        code: AllowlistOperationCode.CREATE_TOKEN_POOL,
        params: {
          id: 'token-pool-4',
          name: '65291/1s',
          description: '65291/1s',
          tokenIds: '113532',
          transferPoolId: 'transfer-pool-4',
        },
      },
      {
        code: AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL,
        params: {
          id: 'custom-token-pool-1',
          name: 'Artist choice',
          description: 'Artist choice',
          tokens: [
            { owner: '0x01fdc1943701784250906f2dd1a0b90e24045e29' },
            { owner: '0x035da52e7aa085f7e71764c0c8a1ce6690e3dfef' },
            { owner: '0x038db6c62d0f072616e2b8db7d3d7cfc829f7f65' },
            { owner: '0x07d3088a697dc1647413e0b7393746dd2d6c8a55' },
            { owner: '0x092cd1a6d222a167f5d0767e6444c8b45c92cc72' },
          ],
        },
      },
      {
        code: AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL,
        params: {
          id: 'custom-token-pool-2',
          name: 'Team',
          description: 'Team wallets',
          tokens: [
            { owner: '0xfd22004806a6846ea67ad883356be810f0428793' },
            { owner: '0xc3c9737cce778d7583f31ae7c4f2ab8782ed51e5' },
            { owner: '0xA62DA2Ea9F5bB03a58174060535ae32131973178' },
            { owner: '0xE16dF6503Acd3c79b6E032f62c61752bEC16eeF2' },
            { owner: '0x9769334FC882775F4951865aA473481880669D47' },
            { owner: '0x3852471D266d9e2222CA9Fdd922BAFC904Dc49e5' },
            { owner: '0x88D3574660711e03196aF8A96f268697590000Fa' },
            { owner: '0x885846850aaBf20d8f8e051f400354D94a32FF55' },
            { owner: '0x61D9d9cc8C3203daB7100eA79ceD77587201C990' },
            { owner: '0xE359aB04cEC41AC8C62bc5016C10C749c7De5480' },
            { owner: '0xfe3b3F0D64F354b69A5B40D02f714E69cA4B09bd' },
            { owner: '0x8889EBB11295F456541901f50BCB5f382047cAaC' },
            { owner: '0x4269AaDfd043b58cbA893BfE6029C9895C25cb61' },
            { owner: '0xbDf82b13580b918ebc3c24b4034E8468EA168E21' },
            { owner: '0x83EE335ca72759CAeDeD7b1afD11dCF75F48436b' },
            { owner: '0xddA3cb2741FaC4a87CAebec9EFC7963087304097' },
            { owner: '0xF9e129817BC576f937e4774E3C3Aec98787Cfb91' },
            { owner: '0x8e63380aC1e34c7D61bf404aF63e885875C18Ce3' },
            { owner: '0xaf5c021754Ab82Bf556BC6C90650dE21Cf92d1c7' },
            { owner: '0x7f3774EAdae4beB01919deC7f32A72e417Ab5DE3' },
            { owner: '0xC03E57b6acE9Dd62C84A095E11E494E3C8FD4D42' },
            { owner: '0xe70d73c76fF3b4388EE9C58747F0EaA06C6b645B' },
            { owner: '0x8BA68CFe71550EfC8988D81d040473709B7F9218' },
            { owner: '0xa743c8c57c425B84Cb2eD18C6B9ae3aD21629Cb5' },
            { owner: '0x1b7844CfaE4C823Ac6389855D47106a70c84F067' },
            { owner: '0x76D078D7e5755B66fF50166863329D27F2566b43' },
          ],
        },
      },
      {
        code: AllowlistOperationCode.CREATE_WALLET_POOL,
        params: {
          id: 'wallet-pool-1',
          name: 'Wallets to remove',
          description: 'Wallets to remove',
          wallets: [
            '0x3a3548e060be10c2614d0a4cb0c03cc9093fd799',
            '0x4b76837f8d8ad0a28590d06e53dcd44b6b7d4554',
            '0x0887773b5f43c58f0da7bd0402fc2d49482eb845',
            '0xcda72070e455bb31c7690a170224ce43623d0b6f',
            '0x41a322b28d0ff354040e2cbc676f0320d8c8850d',
            '0x000000000000000000000000000000000000dead',
          ],
        },
      },
      {
        code: AllowlistOperationCode.ADD_PHASE,
        params: {
          id: 'phase-1',
          name: 'Phase 1',
          description: 'Phase 1',
        },
      },
      {
        code: AllowlistOperationCode.ADD_COMPONENT,
        params: {
          id: 'component-1',
          name: 'Meme Cards 1 to 94',
          description: 'Meme Cards 1 to 94',
          phaseId: 'phase-1',
        },
      },
      {
        code: AllowlistOperationCode.ADD_ITEM,
        params: {
          id: 'item-1',
          name: 'Meme Cards 1 to 94',
          description: 'Meme Cards 1 to 94',
          componentId: 'component-1',
          poolType: Pool.TOKEN_POOL,
          poolId: 'token-pool-1',
        },
      },
      {
        code: AllowlistOperationCode.ADD_ITEM,
        params: {
          id: 'item-2',
          name: 'Gradient',
          description: 'Gradient',
          componentId: 'component-1',
          poolType: Pool.TOKEN_POOL,
          poolId: 'token-pool-2',
        },
      },
    ];
    let order = 1;
    for (const operation of operations) {
      await this.add({
        code: operation.code,
        params: operation.params,
        order: order++,
        allowlistId,
      });
    }
  }

  async add({
    code,
    params,
    order,
    allowlistId,
  }: AllowlistOperationRequestApiModel & {
    allowlistId: string;
  }): Promise<AllowlistOperationResponseApiModel> {
    const allowlist = await this.allowlistsRepository.findById(allowlistId);
    if (!allowlist) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlistId} does not exist`,
      );
    }

    await this.validateOperation({ code, params });
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.allowlistOperationsRepository.incOrdersForAllowlistSinceOrder(
        {
          sinceOrder: order,
          allowlistId,
        },
        session,
      );
      const dto = await this.allowlistOperationsRepository.save(
        {
          code,
          params,
          order,
          allowlistId,
          createdAt: Time.currentMillis(),
        },
        session,
      );
      const ranLaterOperations =
        await this.allowlistOperationsRepository.getAllRanForAllowlistSinceOrder(
          {
            allowlistId,
            order,
          },
          session,
        );
      if (ranLaterOperations.length > 0) {
        await this.allowlistOperationsRepository.updateAllForAllowlistToNeverRan(
          allowlistId,
          session,
        );
      }
      await session.commitTransaction();

      return dto;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }

  async findByAllowlistId(
    allowlistId: string,
  ): Promise<AllowlistOperationResponseApiModel[]> {
    return this.allowlistOperationsRepository.findByAllowlistId(allowlistId);
  }

  async delete({
    allowlistId,
    operationOrder,
  }: {
    allowlistId: string;
    operationOrder: number;
  }) {
    const allowlist = await this.allowlistsRepository.findById(allowlistId);
    if (!allowlist) {
      throw new BadRequestException(
        `Allowlist with ID ${allowlist} does not exist`,
      );
    }
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.allowlistOperationsRepository.delete(
        {
          order: operationOrder,
          allowlistId,
        },
        session,
      );
      await this.allowlistOperationsRepository.decOrdersForAllowlistSinceOrder(
        {
          sinceOrder: operationOrder,
          allowlistId,
        },
        session,
      );
      const ranLaterOperations =
        await this.allowlistOperationsRepository.getAllRanForAllowlistSinceOrder(
          {
            allowlistId,
            order: operationOrder,
          },
          session,
        );
      if (ranLaterOperations.length > 0) {
        await this.allowlistOperationsRepository.updateAllForAllowlistToNeverRan(
          allowlistId,
          session,
        );
      }
      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }
}
