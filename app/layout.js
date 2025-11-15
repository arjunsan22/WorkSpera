import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Providers from './providers';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "WorkSpera",
  description: "Connect with love",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
<Providers>{children}</Providers>
      </body>
    </html>
  );
}
