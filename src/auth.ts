import firebase from 'firebase/app';
import 'firebase/auth';
import { User } from './types';

export async function getCurrentUser(): Promise<User | null> {
  return await new Promise((resolve) => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        resolve({
          email: user.email!,
          userId: user.uid!,
          name: user.displayName!,
        });
      } else {
        resolve(null);
      }
    });
  });
}

export async function signIn(): Promise<User | null> {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await firebase.auth().signInWithPopup(provider);
  const { user } = result;

  if (user) {
    return {
      email: user.email!,
      userId: user.uid!,
      name: user.displayName!,
    };
  }

  return null;
}

export async function signOut() {
  await firebase.auth().signOut();
}
