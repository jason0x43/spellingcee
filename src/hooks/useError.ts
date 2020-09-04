import { createSharedState } from './sharedState';

const errorStateManager = createSharedState<Error | string | undefined>(undefined);
const { useSharedState } = errorStateManager;

export default function useError() {
  return useSharedState();
}
