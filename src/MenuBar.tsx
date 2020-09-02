import React, { useCallback } from 'react';
import Button from './Button';
import useAppState from './hooks/useAppState';
import { signIn, signOut } from './firebase';
import './MenuBar.css';

export default function MenuBar() {
  const [appState, setAppState] = useAppState();

  const handleSignin = useCallback(async () => {
    const data = await signIn();
    setAppState({
      ...appState,
      user: data
    });
  }, [appState, setAppState]);

  const handleSignout = useCallback(async () => {
    await signOut();
    setAppState({
      ...appState,
      user: undefined
    });
  }, [appState, setAppState]);

  return (
    <div className="MenuBar">
      {appState.user ? (
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
