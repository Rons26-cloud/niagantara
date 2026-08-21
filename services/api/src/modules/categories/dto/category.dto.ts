export type CategoryInput = {
  name: string;
  description?: string | null;
  status?: 'active' | 'archived';
};
