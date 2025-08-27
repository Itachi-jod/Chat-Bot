"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import MatrixRain from '@/components/matrix-rain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user) {
      const from = searchParams.get('from') || '/';
      router.replace(from);
    }
  }, [user, router, searchParams]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      <MatrixRain />
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Card className="w-full max-w-sm bg-black/75 backdrop-blur-sm border-glow">
          <CardHeader>
            <CardTitle className="text-2xl text-primary text-glow">CyberStream Login</CardTitle>
            <CardDescription>Enter your username to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-transparent text-accent border-accent focus:ring-accent"
                required
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/80 text-white">
                Enter the Matrix
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
