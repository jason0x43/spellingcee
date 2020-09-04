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

type Reference = firebase.database.Reference;

export async function init() {
  firebase.initializeApp(firebaseConfig);
}

type UserData = {
  email: string;
  userId: string;
  name: string;
};

export async function getCurrentUser(): Promise<UserData | null> {
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

/**
 * Return the full path of a database reference
 */
export function getRefPath(ref: Reference): string;
export function getRefPath(ref: undefined): undefined;
export function getRefPath(ref: Reference | undefined) {
  if (ref == null) {
    return undefined;
  }
  return ref.toString().slice(ref.root.toString().length);
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

/**
 * Return a handle to the database
 */
export function getDatabase() {
  return firebase.database();
}

/**
 * Load a value from the database
 */
export async function load<T>(ref: string | Reference): Promise<T | undefined> {
  const dbRef = typeof ref === 'string' ? getDatabase().ref(ref) : ref;
  const snapshot = await dbRef.once('value');
  const val = snapshot.val();
  if (val == null) {
    return;
  }
  return val;
}

/**
 * Store a value in the database
 */
export function save(key: string, value: any): void {
  const ref = getDatabase().ref(key);
  ref.set(value);
}

/**
 * A handle to an database subscription
 */
export interface Subscription {
  key: string;
  off(): void;
}

/**
 * Load a value from the database
 */
export function subscribe<T>(ref: string | Reference, callback: (value: T | undefined) => void): Subscription {
  const dbRef = typeof ref === 'string' ? getDatabase().ref(ref) : ref;
  dbRef.on('value', (snapshot) => {
    const value = snapshot.val();
    if (value == null) {
      callback(undefined);
    } else {
      callback(value);
    }
  });

  return {
    get key() {
      return getRefPath(dbRef);
    },

    off() {
      dbRef.off();
    }
  };
}
