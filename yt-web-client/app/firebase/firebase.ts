// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    User
} from "firebase/auth";
import {user} from "firebase-functions/v1/auth";
import {userInfo} from "node:os";
import {getAll} from "@firebase/remote-config";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBTb9ZVRMRbfn7mpOi4x2-lj3sZxw0y-pU",
    authDomain: "clone-4e1d1.firebaseapp.com",
    projectId: "clone-4e1d1",
    appId: "1:308023586744:web:8edc15730facd756d3a94d",
    measurementId: "G-WGW3G1XK5R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();

/*
 * Signs the user in with a Google popup.
 * @returns A promise that resolves with the user's credentials.
 */
export function signInWithGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider());
}

/*
 * Signs the user out.
 * @returns A promise that resolves when the user is signed out.
 */

export function signOut() {
    return auth.signOut();
}

/*
 * Trigger a callback when user auth state changes.
 * @returns A function to unsubscribe callback.
 */

export function onAuthStateChangedHelper(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}