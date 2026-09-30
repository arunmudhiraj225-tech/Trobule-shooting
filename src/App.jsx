import {useState} from 'react'
import './App.css'

const API_URL =
  'https://network-troubleshooting-backend.onrender.com'

function App() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  const getPublicIP = async () => {
    try {
      const response = await fetch(
        'https://api.ipify.org?format=json'
      )

      const result = await response.json()

      return result.ip
    } catch {
      return null
    }
  }

  const testInternet = async () => {
    const start = performance.now()

    try {
      const response = await fetch(
        'https://www.google.com/generate_204',
        {
          method: 'GET',
          cache: 'no-store',
          mode: 'no-cors',
        }
      )

      const end = performance.now()

      return {
        working: true,
        latency: Math.round(end - start),
      }
    } catch {
      return {
        working: false,
        latency: null,
      }
    }
  }

  const testBackend = async () => {
    const start = performance.now()

    try {
      const response = await fetch(
        `${API_URL}/api/diagnose`,
        {
          cache: 'no-store',
        }
      )

      if (!response.ok) {
        throw new Error('Backend unavailable')
      }

      const end = performance.now()

      return {
        working: true,
        latency: Math.round(end - start),
      }
    } catch {
      return {
        working: false,
        latency: null,
      }
    }
  }

  const diagnoseNetwork = async () => {
    setLoading(true)
    setError('')

    try {
      const [publicIP, internet, backend] =
        await Promise.all([
          getPublicIP(),
          testInternet(),
          testBackend(),
        ])

      const browserInfo = {
        operatingSystem:
          navigator.userAgentData?.platform ||
          navigator.platform ||
          'Unknown',

        browser:
          navigator.userAgent,

        online:
          navigator.onLine,
      }

      const result = {
        operatingSystem:
          browserInfo.operatingSystem,

        publicIP,

        internet:
          internet.working,

        internetLatency:
          internet.latency,

        backend:
          backend.working,

        backendLatency:
          backend.latency,

        dns:
          publicIP !== null,

        gateway:
          null,

        gatewayAvailable:
          false,
      }

      setData(result)

      const historyItem = {
        time: new Date().toLocaleString(),

        ip:
          publicIP || 'Not detected',

        internet:
          internet.working
            ? 'Working'
            : 'Not Working',

        dns:
          publicIP
            ? 'Working'
            : 'Not Working',

        latency:
          internet.latency !== null
            ? `${internet.latency} ms`
            : 'N/A',
      }

      setHistory(prev => [
        historyItem,
        ...prev,
      ])
    } catch (err) {
      setError(
        'Unable to complete the network diagnosis.'
      )
    } finally {
      setLoading(false)
    }
  }

  const getDiagnosis = () => {
    if (!data) {
      return null
    }

    if (!data.internet) {
      return {
        title: '⚠️ Internet Connection Problem',

        message:
          'Your browser could not establish an Internet connection.',

        actions: [
          'Check your Wi-Fi or Ethernet connection.',
          'Reconnect to the Internet.',
          'Restart your router if necessary.',
        ],
      }
    }

    if (!data.dns) {
      return {
        title: '⚠️ DNS / Web Resolution Problem',

        message:
          'The public connectivity test could not complete.',

        actions: [
          'Check your DNS settings.',
          'Reconnect to your network.',
          'Try again after a few seconds.',
        ],
      }
    }

    if (!data.backend) {
      return {
        title: '⚠️ Diagnostic Server Unavailable',

        message:
          'Your Internet connection is working, but the diagnostic backend could not be reached.',

        actions: [
          'Wait a few seconds and try again.',
          'Check the backend deployment.',
        ],
      }
    }

    return {
      title: '✅ Network Working Normally',

      message:
        'Your Internet connection and diagnostic services are working.',

      actions: [
        'Internet connectivity is working.',
        'Web/DNS connectivity is working.',
        'The diagnostic server is reachable.',
      ],
    }
  }

  const diagnosis = getDiagnosis()

  return (
    <div className="app">

      <header className="hero">

        <h1>
          Network Troubleshooting Assistant
        </h1>

        <p>
          Diagnose common network problems using real network tests.
        </p>

        <button
          onClick={diagnoseNetwork}
          disabled={loading}
        >
          {loading
            ? 'Testing Network...'
            : '🔍 Diagnose My Network'}
        </button>

      </header>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {data && (
        <>
          <section className="card">

            <h2>
              Network Diagnosis
            </h2>

            <div className="grid">

              <div>
                <span>
                  Operating System
                </span>

                <strong>
                  {data.operatingSystem}
                </strong>
              </div>

              <div>
                <span>
                  Public IP Address
                </span>

                <strong>
                  {data.publicIP ||
                    'Not detected'}
                </strong>
              </div>

              <div>
                <span>
                  Internet Connectivity
                </span>

                <strong>
                  {data.internet
                    ? '✓ Working'
                    : '✗ Not Working'}
                </strong>
              </div>

              <div>
                <span>
                  Internet Latency
                </span>

                <strong>
                  {data.internetLatency !== null
                    ? `${data.internetLatency} ms`
                    : 'Not available'}
                </strong>
              </div>

              <div>
                <span>
                  DNS / Web Connectivity
                </span>

                <strong>
                  {data.dns
                    ? '✓ Working'
                    : '✗ Not Working'}
                </strong>
              </div>

              <div>
                <span>
                  Diagnostic Server
                </span>

                <strong>
                  {data.backend
                    ? '✓ Reachable'
                    : '✗ Unavailable'}
                </strong>
              </div>

              <div>
                <span>
                  Server Latency
                </span>

                <strong>
                  {data.backendLatency !== null
                    ? `${data.backendLatency} ms`
                    : 'Not available'}
                </strong>
              </div>

              <div>
                <span>
                  Default Gateway
                </span>

                <strong>
                  Not available in browser
                </strong>
              </div>

            </div>

          </section>

          <section className="card">

            <h2>
              Diagnosis & Recommendation
            </h2>

            <h3>
              {diagnosis.title}
            </h3>

            <p>
              {diagnosis.message}
            </p>

            <h4>
              Recommended Actions
            </h4>

            <ul>
              {diagnosis.actions.map(
                (action, index) => (
                  <li key={index}>
                    {action}
                  </li>
                )
              )}
            </ul>

            <button
              onClick={diagnoseNetwork}
              disabled={loading}
            >
              🔄 Test Again
            </button>

          </section>

          <section className="card">

            <h2>
              📋 Troubleshooting History
            </h2>

            {history.length === 0 ? (
              <p>
                No tests performed yet.
              </p>
            ) : (
              history.map((item, index) => (
                <div
                  className="history"
                  key={index}
                >
                  <strong>
                    {item.time}
                  </strong>

                  <p>
                    IP: {item.ip}
                  </p>

                  <p>
                    Internet: {item.internet}
                  </p>

                  <p>
                    DNS: {item.dns}
                  </p>

                  <p>
                    Latency: {item.latency}
                  </p>
                </div>
              ))
            )}

          </section>
        </>
      )}

    </div>
  )
}

export default App