import './globals.css';

export const metadata = {
  title: 'Color Walk / 城市色彩漫游',
  description: '每天锁定一种颜色，只让它成为街拍主角。',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased font-body">{children}</body>
    </html>
  );
}