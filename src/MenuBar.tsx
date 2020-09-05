import React, {useCallback} from 'react';
import {signIn, signOut} from './auth';
import Button from './Button';
import {AppDispatch} from './state';
import {Profile} from './types';
import './MenuBar.css';

export interface MenuBarProps {
  user: Profile | undefined | null;
  dispatch: AppDispatch;
}

export default function MenuBar(props: MenuBarProps) {
  const { dispatch, user } = props;

  const handleSignin = useCallback(async () => {
    const data = await signIn();
    dispatch({ type: 'setUser', payload: data });
  }, [dispatch]);

  const handleSignout = useCallback(async () => {
    await signOut();
    dispatch({ type: 'clearUser' });
  }, [dispatch]);

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
