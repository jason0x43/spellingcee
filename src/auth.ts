import firebase from 'firebase/app';
import 'firebase/auth';

export interface AuthUser {
  userId: string;
  name: string;
}

export async function getCurrentUser(): Promise<AuthUser | undefined> {
  return await new Promise((resolve) => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        resolve({
          userId: user.uid!,
          name: user.displayName!,
        });
      } else {
        resolve(undefined);
      }
    });
  });
}

export async function signIn(): Promise<AuthUser | undefined> {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  const result = await firebase.auth().signInWithPopup(provider);
  const { user } = result;

  if (user) {
    return {
      userId: user.uid!,
      name: user.displayName!,
    };
  }
}

export async function signOut() {
  await firebase.auth().signOut();
}
