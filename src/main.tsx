
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/a11y.css'

// Wrap in a try-catch to handle errors during initial render
try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element not found");
  
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error("Failed to render application:", error);
  
  // Provide fallback UI in case of critical error
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Unable to load application</h2>
        <p>Please try refreshing the page</p>
      </div>
    `;
  }
}
