import { AppRouter } from './Router';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors closeButton expand />
    </>
  );
}

export default App;