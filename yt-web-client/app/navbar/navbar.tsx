'use client';

import Image from 'next/image';
import Link from 'next/link';

import styles from './navbar.module.css';
import SignIn from "@/app/navbar/sign-in";
import {onAuthStateChangedHelper} from "@/app/firebase/firebase";
import {useEffect, useState} from "react";
import {User} from "firebase/auth";

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChangedHelper((user) => {
            setUser(user);
        });

        return () => unsubscribe();
    });

    return (
        <nav className={styles.nav}>
            <Link href="/">
                <Image src="/youtube-logo.svg" alt="YouTube Logo" height={20} width={90}/>
            </Link>
            <SignIn user={user}/>
        </nav>
    );
}