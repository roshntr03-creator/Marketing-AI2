import { useState } from 'react';
import { type User } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useToasts } from './useToasts';
import { useLocalization } from './useLocalization';

export const useSettings = (user: User | null) => {
  const { addToast } = useToasts();
  const { t } = useLocalization();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    });
    if (error) {
      addToast(t('profile_update_error'), 'error');
      console.error(error);
    } else {
      addToast(t('profile_saved_success'), 'success');
    }
    setLoadingProfile(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast(t('passwords_do_not_match'), 'error');
      return;
    }
    if (!password) return;
    setLoadingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      addToast(t('password_update_error'), 'error');
      console.error(error);
    } else {
      addToast(t('password_changed_success'), 'success');
      setPassword('');
      setConfirmPassword('');
    }
    setLoadingPassword(false);
  };

  return {
    fullName,
    setFullName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loadingProfile,
    loadingPassword,
    handleProfileUpdate,
    handlePasswordUpdate,
  };
};
