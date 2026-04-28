
import ReactDOM from 'react-dom/client';
import { AppRouter } from './Router';
import './styles/globals.css';
import { GoogleOAuthProvider } from "@react-oauth/google";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="246390104711-tmpj7b8nilinq6302nt3lh9j9gig0hkj.apps.googleusercontent.com">
    <AppRouter />
  </GoogleOAuthProvider>
);