import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar/navbar";
import { AuthProvider } from './components/AuthProvider';
import { CartProvider } from './context/CartContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://www.homeplates.nl'),
  title: "HomePlates - Fresh Homemade Food in the Netherlands",
  description: "Discover delicious homemade meals from local cooks in the Netherlands. Order fresh, home-cooked food for pickup in Hilversum, Rotterdam, Utrecht, Eindhoven, and more.",
  keywords: "homemade food Netherlands, local cooks, food delivery, home cooking, fresh meals, Dutch home cooks, community cooking, Hilversum, Rotterdam, Utrecht, Eindhoven",
  icons: {
    icon: '/images/logoICO.ico',
    shortcut: '/images/logoICO.ico',
    apple: '/images/logo.png',
  },
  openGraph: {
    title: "HomePlates - Fresh Homemade Food in the Netherlands",
    description: "Discover delicious homemade meals from local cooks in the Netherlands. Order fresh, home-cooked food for pickup.",
    type: "website",
    locale: "nl_NL",
    siteName: "HomePlates",
    url: "https://www.homeplates.nl",
    images: [
      {
        url: '/images/logo.png',
        width: 512,
        height: 512,
        alt: 'HomePlates Logo',
      }
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.homeplates.nl",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geistSans.className}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
