export const metadata = { title: "Daily Diary Study", robots: "noindex, nofollow" };
export default function RootLayout({ children }) {
  return <html lang="en"><body style={{fontFamily:"system-ui", padding:32, background:"#fcf8fb",color:"#2d2330"}}>{children}</body></html>;
}
