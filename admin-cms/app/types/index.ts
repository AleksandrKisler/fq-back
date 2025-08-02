export interface Article {
  id?: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  main_image?: string;
  publish_date: string;
  meta_title?: string;
  meta_description?: string;
  created_at?: string;
  updated_at?: string;
}