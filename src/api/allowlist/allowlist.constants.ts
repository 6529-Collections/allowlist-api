import { AllowlistOperationCode } from '@6529-collections/allowlist-lib/allowlist/allowlist-operation-code';

export const UNIQUE_WALLET_COUNTS_OPS_RELEVANCY: Record<
  AllowlistOperationCode,
  boolean
> = {
  [AllowlistOperationCode.CREATE_ALLOWLIST]: true,
  [AllowlistOperationCode.GET_COLLECTION_TRANSFERS]: true,
  [AllowlistOperationCode.CREATE_TOKEN_POOL]: true,
  [AllowlistOperationCode.CREATE_CUSTOM_TOKEN_POOL]: true,
  [AllowlistOperationCode.CREATE_WALLET_POOL]: true,
  [AllowlistOperationCode.ADD_PHASE]: true,
  [AllowlistOperationCode.ADD_COMPONENT]: true,
  [AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_ALL_ITEM_WALLETS]: true,
  [AllowlistOperationCode.COMPONENT_ADD_SPOTS_TO_WALLETS_EXCLUDING_CERTAIN_COMPONENTS]:
    true,
  [AllowlistOperationCode.COMPONENT_SELECT_RANDOM_WALLETS]: true,
  [AllowlistOperationCode.COMPONENT_SELECT_RANDOM_PERCENTAGE_WALLETS]: true,
  [AllowlistOperationCode.ADD_ITEM]: true,
  [AllowlistOperationCode.ITEM_EXCLUE_TOKEN_IDS]: true,
  [AllowlistOperationCode.ITEM_SELECT_TOKEN_IDS]: true,
  [AllowlistOperationCode.ITEM_REMOVE_FIRST_N_TOKENS]: true,
  [AllowlistOperationCode.ITEM_REMOVE_LAST_N_TOKENS]: true,
  [AllowlistOperationCode.ITEM_SELECT_FIRST_N_TOKENS]: true,
  [AllowlistOperationCode.ITEM_SELECT_LAST_N_TOKENS]: true,
  [AllowlistOperationCode.ITEM_SORT_WALLETS_BY_TOTAL_TOKENS_COUNT]: false,
  [AllowlistOperationCode.ITEM_SORT_WALLETS_BY_UNIQUE_TOKENS_COUNT]: false,
  [AllowlistOperationCode.ITEM_SELECT_WALLETS_OWNING_TOKEN_IDS]: true,
  [AllowlistOperationCode.ITEM_REMOVE_FIRST_N_WALLETS]: true,
  [AllowlistOperationCode.ITEM_SELECT_FIRST_N_WALLETS]: true,
  [AllowlistOperationCode.ITEM_REMOVE_WALLETS_FROM_CERTAIN_COMPONENTS]: true,
  [AllowlistOperationCode.ITEM_SORT_WALLETS_BY_MEMES_TDH]: false,
  [AllowlistOperationCode.TRANSFER_POOL_CONSOLIDATE_WALLETS]: true,
  [AllowlistOperationCode.TOKEN_POOL_CONSOLIDATE_WALLETS]: true,
  [AllowlistOperationCode.ITEM_REMOVE_WALLETS_FROM_CERTAIN_TOKEN_POOLS]: true,
  [AllowlistOperationCode.MAP_RESULTS_TO_DELEGATED_WALLETS]: false,
};
