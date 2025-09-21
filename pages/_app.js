
import '../public/styles.css'
import Nav from '../components/Nav'
export default function MyApp({ Component, pageProps }) {
  return (<>
    <Nav />
    <div className="page-wrap"><Component {...pageProps} /></div>
  </>)
}
