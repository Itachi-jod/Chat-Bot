"use client";

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import MatrixRain from '@/components/matrix-rain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoggingIn(true);
      login(username.trim());
    }
  };

  return (
    <main className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      <MatrixRain />
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-black/75 backdrop-blur-sm border-glow">
          <CardHeader>
            <CardTitle className="text-2xl text-primary text-glow">CyberStream Login</CardTitle>
            <CardDescription>Enter your username to access the terminal</CardDescription>
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
                disabled={isLoggingIn}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/80 text-black" disabled={isLoggingIn}>
                {isLoggingIn ? 'Authenticating...' : 'Enter the Matrix'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
