import { useState, useEffect } from 'react';
import { type User } from '../types.ts';
import { auth } from '../lib/firebaseClient.ts';
import { updateProfile, updatePassword } from 'firebase/auth';
import { useToasts } from './useToasts.ts';
import { useLocalization } from './useLocalization.ts';

export const useSettings = (user: User | null) => {
  const { addToast } = useToasts();
  const { t } = useLocalization();

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.displayName || '');
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoadingProfile(true);
    try {
      await updateProfile(auth.currentUser, { displayName: fullName });
      addToast(t('profile_saved_success'), 'success');
    } catch (error) {
      addToast(t('profile_update_error'), 'error');
      console.error(error);
    }
    setLoadingProfile(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast(t('passwords_do_not_match'), 'error');
      return;
    }
    if (!password || !auth.currentUser) return;

    setLoadingPassword(true);
    try {
      await updatePassword(auth.currentUser, password);
      addToast(t('password_changed_success'), 'success');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      addToast(t('password_update_error'), 'error');
      console.error(error);
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