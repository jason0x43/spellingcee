import React, { FunctionComponent, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, AppState, signIn, signOut } from '../store';
import Button from './Button';
import './MenuBar.css';

const MenuBar: FunctionComponent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: AppState) => state.user);

  const handleSignin = useCallback(async () => {
    dispatch(signIn());
  }, [dispatch]);

  const handleSignout = useCallback(async () => {
    dispatch(signOut());
  }, [dispatch]);

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

export default MenuBar;
