export interface Comment {
  _id: string;
  post: string;
  author: string;
  email: string;
  content: string;
  approved: boolean;
  createdAt: string;
}