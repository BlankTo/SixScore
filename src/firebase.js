import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB0WHiVa-WklF1ynL_yi63Pf0c92Stvit4",
  authDomain: "greencheck-6f8db.firebaseapp.com",
  projectId: "greencheck-6f8db",
  storageBucket: "greencheck-6f8db.appspot.com",
  messagingSenderId: "301219115750",
  appId: "1:301219115750:web:f0a25d38e42fe79b530127",
  measurementId: "G-ZY7B38G49W"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const firestore = firebase.firestore();