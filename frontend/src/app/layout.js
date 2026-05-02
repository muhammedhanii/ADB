import "./globals.css";

export const metadata = {
  title: "3D Recipe Book",
  description: "Manage recipes in an immersive 3D-inspired experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
