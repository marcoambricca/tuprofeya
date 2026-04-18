import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'SuperProfe — Encontrá tu profe ideal',
  description: 'Plataforma de clases particulares virtuales. Conectamos alumnos con los mejores profesores.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </AuthProvider>
      </body>
    </html>
  );
}
