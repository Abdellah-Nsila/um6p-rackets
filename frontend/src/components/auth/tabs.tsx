'use client';

import { X } from 'lucide-react';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { ForgotPasswordForm } from './forgot-password-form'; // Add this import
import { useAuthPopupStore } from '@/store/auth_popup';

export function AuthTabs() {
  const close = useAuthPopupStore((state) => state.close);
  const activeTab = useAuthPopupStore((state) => state.activeTab);
  const setTab = useAuthPopupStore((state) => state.setTab);

  return (
    <div className="relative flex flex-col w-[calc(100vw-2rem)] max-w-150 max-h-[85vh] mx-auto">
      {/* Exit Button */}
      <button
        onClick={close}
        className="absolute top-4 right-4 z-50 p-1.5 bg-background/60 hover:bg-muted rounded-full transition-colors cursor-pointer"
      >
        <X className="size-5 text-muted-foreground" />
      </button>

      <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
        {/* Changed from ternary operator to exact matches to support 3 tabs */}
        {activeTab === 'login' && (
          <LoginForm
            onSuccess={close}
            onSwitchToRegister={() => setTab('register')}
            onSwitchToForgot={() => setTab('forgot')} // Wired up the forgot link!
          />
        )}

        {activeTab === 'register' && (
          <RegisterForm
            onSuccess={() => close()}
            onSwitchToLogin={() => setTab('login')}
          />
        )}

        {activeTab === 'forgot' && (
          <ForgotPasswordForm onSwitchToLogin={() => setTab('login')} />
        )}
      </div>
    </div>
  );
}
