export interface Post {
  _id: string;
  title: string;
  content: string;
  author: string;
  image?: string;
  category: string;
  views: number;
  likes: number;
  status: 'draft' | 'published';
  createdAt: string;
}