"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface AuthContextType {
  user: string | null;
  login: (username: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProviderContent = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('cyberstream_user');
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
        console.error("Could not access local storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const isAuthPage = pathname === '/login';
      const from = searchParams.get('from');

      if (!user && !isAuthPage) {
        router.replace(`/login?from=${pathname}`);
      } else if (user && isAuthPage) {
         router.replace(from || '/');
      }
    }
  }, [user, isLoading, pathname, router, searchParams]);


  const login = (username: string) => {
    setUser(username);
    try {
      localStorage.setItem('cyberstream_user', username);
    } catch (error) {
      console.error("Could not access local storage", error);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('cyberstream_user');
    } catch (error) {
       console.error("Could not access local storage", error);
    }
    router.push('/login');
  };
  
  if (isLoading) {
    return <div className="w-full h-screen bg-background flex items-center justify-center text-primary text-glow">Loading Session...</div>;
  }

  const isAuthPage = pathname === '/login';
  if (!user && !isAuthPage) {
     return <div className="w-full h-screen bg-background flex items-center justify-center text-primary text-glow">Redirecting to login...</div>;
  }


  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};


export default function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<div className="w-full h-screen bg-background flex items-center justify-center text-primary text-glow">Loading...</div>}>
            <AuthProviderContent>{children}</AuthProviderContent>
        </Suspense>
    )
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
