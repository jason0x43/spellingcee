import { Dispatch } from 'react';
import { createSharedState } from './sharedState';
import { getCurrentUser } from '../firebase';
import useError from './useError';

export interface UserState {
  userId: string;
  name: string;
  email: string;
}

const userStateManager = createSharedState<UserState | null | undefined>(
  undefined
);
const { useSharedState } = userStateManager;
let started = false;

export default function useUser(): [
  UserState | null | undefined,
  Dispatch<UserState | null>
] {
  const [user, setUser] = useSharedState();
  const [, setError] = useError();

  if (!started) {
    started = true;
    getCurrentUser().then(setUser, setError);
  }

  return [user, setUser];
}
