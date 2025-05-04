
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { Toaster } from "@/components/ui/toaster";
import { SyncProvider } from "@/context/SyncContext";

createRoot(document.getElementById("root")!).render(
  <Router>
    <SyncProvider>
      <App />
      <Toaster />
    </SyncProvider>
  </Router>
);
