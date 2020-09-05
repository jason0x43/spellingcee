import firebase from 'firebase/app';
import 'firebase/auth';
import { Profile } from './types';

export async function getCurrentUser(): Promise<Profile | null> {
  return await new Promise((resolve) => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        resolve({
          userId: user.uid!,
          name: user.displayName!,
        });
      } else {
        resolve(null);
      }
    });
  });
}

export async function signIn(): Promise<Profile | null> {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await firebase.auth().signInWithPopup(provider);
  const { user } = result;

  if (user) {
    return {
      userId: user.uid!,
      name: user.displayName!,
    };
  }

  return null;
}

export async function signOut() {
  await firebase.auth().signOut();
}
