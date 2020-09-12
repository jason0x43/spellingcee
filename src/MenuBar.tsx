import React, { useCallback } from 'react';
import { signIn, signOut } from './auth';
import Button from './Button';
import { User } from './types';
import './MenuBar.css';

export interface MenuBarProps {
  user: User;
  setUser(user: User | undefined): Promise<void>;
}

export default function MenuBar(props: MenuBarProps) {
  const { user, setUser } = props;

  const handleSignin = useCallback(async () => {
    const data = await signIn();
    await setUser(data);
  }, [setUser]);

  const handleSignout = useCallback(async () => {
    await signOut();
    await setUser(undefined);
  }, [setUser]);

  return (
    <div className="MenuBar">
      {user.userId !== 'local' ? (
        <Button
          type="link"
          onClick={handleSignout}
          tooltip={`${user.name} (${user.userId})`}
        >
          Sign out
        </Button>
      ) : (
        <Button type="link" onClick={handleSignin}>
          Sign in
        </Button>
      )}
    </div>
  );
}
