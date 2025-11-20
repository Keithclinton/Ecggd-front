import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { AuthProvider } from '../components/AuthProvider'
import Header from '../components/Header'
import { useRouter } from 'next/router'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const noHeaderPages = ['/login', '/register'];
  const showHeader = !noHeaderPages.includes(router.pathname);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
        <title>CCGD LMS</title>
      </Head>
      <AuthProvider>
        {showHeader && <Header />}
        <Component {...pageProps} />
      </AuthProvider>
    </>
  )
}
