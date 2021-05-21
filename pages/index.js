import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Header from '../components/header';
import Profile from '../components/Profile';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name='description' content='Generated by create next app' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Header></Header>

      <main className={styles.main}>
        <Profile></Profile>
      </main>
    </div>
  );
}
