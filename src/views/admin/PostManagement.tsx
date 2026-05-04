import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Post } from '../../models/post';
import { postService } from '../../controllers/postService';
import { toast } from 'sonner';

export const PostManagement = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Post>>({
    title: '',
    content: '',
    category: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await postService.getAll();
      setPosts(data);
    } catch (error) {
      console.error('Lỗi:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await postService.create(formData);
      toast.success('Tạo bài viết thành công!');
      setFormData({ title: '', content: '', category: '', status: 'draft' });
      setShowForm(false);
      fetchPosts();
    } catch (error) {
      toast.error('Lỗi khi tạo bài viết');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn chắc chắn muốn xóa?')) {
      try {
        await postService.delete(id);
        toast.success('Xóa thành công!');
        fetchPosts();
      } catch (error) {
        toast.error('Lỗi khi xóa');
      }
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 bg-gray-50 min-h-screen p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Quản lý bài viết</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            {showForm ? 'Hủy' : '+ Thêm bài viết'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Thêm bài viết</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Tiêu đề"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
              <textarea
                placeholder="Nội dung"
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg h-32"
                required
              />
              <input
                type="text"
                placeholder="Danh mục"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <select
                value={formData.status || 'draft'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="draft">Nháp</option>
                <option value="published">Xuất bản</option>
              </select>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Tạo bài viết
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left">Tiêu đề</th>
                <th className="px-6 py-3 text-left">Danh mục</th>
                <th className="px-6 py-3 text-left">Trạng thái</th>
                <th className="px-6 py-3 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{post.title}</td>
                  <td className="px-6 py-4">{post.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-white text-sm ${
                      post.status === 'published' ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};