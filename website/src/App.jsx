import { useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function App() {
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [quality, setQuality] = useState('best')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [platforms, setPlatforms] = useState([])
  const [activeTab, setActiveTab] = useState('download')

  const fetchPlatforms = async () => {
    try {
      const res = await axios.get(`${API_BASE}/platforms`)
      setPlatforms(res.data.data.platforms)
    } catch (err) {
      console.error('Failed to fetch platforms:', err)
    }
  }

  const handleDownload = async (e) => {
    e.preventDefault()
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }
    if (!apiKey.trim()) {
      setError('Please enter your API key')
      return
    }

    setLoading(true)
    setError('')
    setResults(null)

    try {
      const res = await axios.post(
        `${API_BASE}/download`,
        { url, quality, includeMetadata: true },
        { headers: { 'x-api-key': apiKey } }
      )
      setResults(res.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1>Media Downloader API</h1>
          <p>Download media from YouTube, Instagram, TikTok, Spotify, and more</p>
        </div>
      </header>

      <main className="main container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'download' ? 'active' : ''}`}
            onClick={() => { setActiveTab('download'); fetchPlatforms(); }}
          >
            Download
          </button>
          <button 
            className={`tab ${activeTab === 'platforms' ? 'active' : ''}`}
            onClick={() => { setActiveTab('platforms'); fetchPlatforms(); }}
          >
            Platforms
          </button>
          <button 
            className={`tab ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            Documentation
          </button>
        </div>

        {activeTab === 'download' && (
          <div className="content">
            <form onSubmit={handleDownload} className="download-form">
              <div className="form-group">
                <label>API Key</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Media URL</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter URL (YouTube, Instagram, TikTok, etc.)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Quality</label>
                <select 
                  className="input"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="best">Best (Auto)</option>
                  <option value="2160">4K (2160p)</option>
                  <option value="1440">2K (1440p)</option>
                  <option value="1080">Full HD (1080p)</option>
                  <option value="720">HD (720p)</option>
                  <option value="480">SD (480p)</option>
                  <option value="360">Low (360p)</option>
                </select>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="loading"></span> : 'Download'}
              </button>
            </form>

            {results && (
              <div className="results">
                <div className="results-header">
                  <h3>Download Results</h3>
                  <span className={`badge ${results.summary.errors > 0 ? 'badge-warning' : 'badge-success'}`}>
                    {results.summary.success}/{results.summary.total} Success
                  </span>
                </div>

                {results.data.results.map((item, index) => (
                  <div key={index} className="result-item">
                    <div className="result-header">
                      <span className="platform">{item.platformName}</span>
                      <span className={`badge ${item.success ? 'badge-success' : 'badge-error'}`}>
                        {item.success ? 'Success' : 'Failed'}
                      </span>
                    </div>

                    {item.metadata && (
                      <div className="metadata">
                        <p><strong>Title:</strong> {item.metadata.title}</p>
                        {item.metadata.duration && (
                          <p><strong>Duration:</strong> {Math.floor(item.metadata.duration / 60)}:{String(item.metadata.duration % 60).padStart(2, '0')}</p>
                        )}
                        {item.metadata.uploader && (
                          <p><strong>Uploader:</strong> {item.metadata.uploader}</p>
                        )}
                      </div>
                    )}

                    {item.files && item.files.length > 0 && (
                      <div className="files">
                        {item.files.map((file, fIndex) => (
                          <a 
                            key={fIndex} 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="file-link"
                          >
                            📥 {file.filename} ({(file.size_bytes / 1024 / 1024).toFixed(2)} MB)
                          </a>
                        ))}
                      </div>
                    )}

                    {item.error && (
                      <p className="error-text">{item.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'platforms' && (
          <div className="content">
            <h2>Supported Platforms</h2>
            <div className="platforms-grid">
              {platforms.map((platform) => (
                <div key={platform.platform} className="platform-card">
                  <h3>{platform.name}</h3>
                  <div className="platform-info">
                    <span className={`badge ${platform.cookieAvailable ? 'badge-success' : platform.requiresCookie ? 'badge-error' : 'badge-warning'}`}>
                      {platform.cookieAvailable ? 'Cookie Available' : platform.requiresCookie ? 'Cookie Required' : 'No Cookie'}
                    </span>
                    <span className="badge badge-success">
                      {platform.supportsMultiMedia ? 'Multi-Media' : 'Single'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="content">
            <h2>API Documentation</h2>
            <div className="docs-section">
              <h3>Base URL</h3>
              <code>http://localhost:3000/api</code>

              <h3>Endpoints</h3>
              <table>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>GET</td>
                    <td>/health</td>
                    <td>Health check</td>
                  </tr>
                  <tr>
                    <td>POST</td>
                    <td>/download</td>
                    <td>Download media</td>
                  </tr>
                  <tr>
                    <td>GET</td>
                    <td>/platforms</td>
                    <td>List supported platforms</td>
                  </tr>
                </tbody>
              </table>

              <h3>Example Request</h3>
              <pre>{`curl -X POST http://localhost:3000/api/download \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://youtu.be/example", "quality": "best"}'`}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
