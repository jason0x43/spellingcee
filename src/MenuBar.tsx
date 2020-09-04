import React, { useCallback } from 'react';
import Button from './Button';
import useUser from './hooks/useUser';
import { signIn, signOut } from './firebase';
import './MenuBar.css';

export default function MenuBar() {
  const [user, setUser] = useUser();

  const handleSignin = useCallback(async () => {
    const data = await signIn();
    setUser(data);
  }, [setUser]);

  const handleSignout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, [setUser]);

  return (
    <div className="MenuBar">
      {user ? (
        <Button type="link" onClick={handleSignout}>
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
