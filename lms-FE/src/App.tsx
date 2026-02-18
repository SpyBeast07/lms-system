import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

interface HealthResponse {
  status: string;
  database: string;
}

function App() {
  const [count, setCount] = useState(0)
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    setHealthData(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/health');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHealthData(data);
    } catch (e: any) {
      setError(e.message || 'An error occurred fetching health status');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>

        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Backend Health Check</h2>
          <button onClick={checkHealth} disabled={loading}>
            {loading ? 'Checking...' : 'Check API Health'}
          </button>
          
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          
          {healthData && (
            <div style={{ marginTop: '10px', textAlign: 'left' }}>
              <pre>{JSON.stringify(healthData, null, 2)}</pre>
            </div>
          )}
        </div>

      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
