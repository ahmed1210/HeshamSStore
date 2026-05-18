import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Hesham Store",
  description: "Hesham Store Online Shop",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}