import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAWUPCDe-0s5G4KSuzQUJb6muv7pizbcNo',
  authDomain: 'spellingcee-5a8a2.firebaseapp.com',
  databaseURL: 'https://spellingcee-5a8a2.firebaseio.com',
  projectId: 'spellingcee-5a8a2',
  storageBucket: 'spellingcee-5a8a2.appspot.com',
  messagingSenderId: '87201244588',
  appId: '1:87201244588:web:8d4cb54274aa8f6a744609',
};

export async function init() {
  firebase.initializeApp(firebaseConfig);
}

type UserData = {
  email: string;
  userId: string;
  name: string;
};

export async function getCurrentUser(): Promise<UserData | undefined> {
  return await new Promise((resolve) => {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        resolve({
          email: user.email!,
          userId: user.uid!,
          name: user.displayName!,
        });
      } else {
        resolve(undefined);
      }
    });
  });
}

export async function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await firebase.auth().signInWithPopup(provider);
  const user = result.user!;
  return {
    email: user.email!,
    userId: user.uid!,
    name: user.displayName!,
  };
}

export async function signOut() {
  await firebase.auth().signOut();
}

export function getDatabase() {
  return firebase.database();
}
