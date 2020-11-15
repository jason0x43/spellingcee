import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './App';
import firebase from 'firebase/app';
import store, {loadUser} from './store';
import './index.css';

const firebaseConfig = {
  apiKey: 'AIzaSyAWUPCDe-0s5G4KSuzQUJb6muv7pizbcNo',
  authDomain: 'spellingcee.hopku.net',
  databaseURL: 'https://spellingcee-5a8a2.firebaseio.com',
  projectId: 'spellingcee-5a8a2',
  storageBucket: 'spellingcee-5a8a2.appspot.com',
  messagingSenderId: '87201244588',
  appId: '1:87201244588:web:8d4cb54274aa8f6a744609',
};

firebase.initializeApp(firebaseConfig);

store.dispatch(loadUser());

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
