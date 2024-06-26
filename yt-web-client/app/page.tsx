import styles from './page.module.css'
import Link from "next/link";


export default function Home() {
    return (
        <main className={styles.main}>
            <div className={styles.description}>
                <p>Click <Link href={"/watch"}>here</Link> to watch.</p>
            </div>
        </main>
    )
}