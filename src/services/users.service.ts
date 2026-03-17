import { cloudflare as supabase } from '@/integrations/cloudflare/client';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type Profile = Tables<'profiles'>;

export const usersService = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Failed to fetch profile for user ${userId}`, error);
      throw error;
    }
  },

  async updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Failed to update profile for user ${userId}`, error);
      throw error;
    }
  },

  async createProfile(userId: string, profileData: Partial<Omit<Profile, 'id'>> = {}): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ id: userId, ...profileData }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Failed to create profile for user ${userId}`, error);
      throw error;
    }
  },
};
