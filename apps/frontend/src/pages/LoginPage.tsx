import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { authApi } from '../api/endpoints';
import { Input, Button, Card } from '../components/ui';
import { showToast } from '../components/ui';
import { GraduationCap, Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.data) {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
        showToast.success(`Welcome back, ${res.data.user.name}!`);
        navigate('/dashboard');
      }
    } catch (err: any) {
      showToast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <Card className="w-full max-w-md relative z-10 !p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[rgba(99,102,241,0.2)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[rgba(99,102,241,0.3)] shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <GraduationCap size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Brainwave EduSys</h1>
          <p className="text-muted text-sm">Sign in to manage your institution</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@brainwave.edu"
            icon={<Mail size={16} />}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock size={16} />}
            required
          />
          
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
