import {useState} from 'react'
import './App.css'

const API_URL =
  'https://network-troubleshooting-backend.onrender.com'

function App() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  const diagnoseNetwork = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/diagnose`
      )

      if (!response.ok) {
        throw new Error(
          'Unable to connect to diagnostic server'
        )
      }

      const result = await response.json()

      setData(result)

      const historyItem = {
        time: new Date().toLocaleString(),
        ip: result.localIP || 'N/A',
        gateway: result.gateway || 'N/A',
        internet: result.internet
          ? 'Working'
          : 'Not Working',
        dns: result.dns
          ? 'Working'
          : 'Not Working',
        packetLoss:
          result.packetLoss !== null
            ? `${result.packetLoss}%`
            : 'N/A',
        latency:
          result.averageLatency !== null
            ? `${result.averageLatency} ms`
            : 'N/A',
      }

      setHistory(prev => [
        historyItem,
        ...prev,
      ])
    } catch (err) {
      setError(
        'Cannot connect to the diagnostic server. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const getDiagnosis = () => {
    if (!data) {
      return null
    }

    // Internet problem
    if (!data.internet) {
      return {
        title: '⚠️ Internet Connection Problem',
        message:
          'Internet connectivity could not be established.',
        actions: [
          'Check your Wi-Fi or Ethernet connection.',
          'Restart your router.',
          'Check your network settings.',
        ],
      }
    }

    // DNS problem
    if (!data.dns) {
      return {
        title: '⚠️ DNS Resolution Problem',
        message:
          'Internet access is available, but DNS resolution failed.',
        actions: [
          'Check your DNS settings.',
          'Try using a public DNS server.',
          'Restart your network connection.',
        ],
      }
    }

    // Cloud gateway limitation
    if (
      data.gateway === null &&
      data.operatingSystem === 'linux'
    ) {
      return {
        title: 'ℹ️ Gateway Test Unavailable',
        message:
          'The diagnostic server is running in a cloud environment and cannot access the gateway of your personal device.',
        actions: [
          'Internet connectivity is working.',
          'DNS resolution is working.',
          'Run the backend locally for full gateway testing.',
        ],
      }
    }

    // Local gateway unavailable
    if (data.gateway === null) {
      return {
        title: '⚠️ Gateway Not Detected',
        message:
          'The default gateway could not be detected.',
        actions: [
          'Check your Wi-Fi or Ethernet connection.',
          'Check your network settings.',
          'Reconnect to the network.',
        ],
      }
    }

    // Gateway unreachable
    if (data.gatewayReachable === false) {
      return {
        title: '⚠️ Gateway Not Reachable',
        message:
          'The default gateway was detected but could not be reached.',
        actions: [
          'Check your Wi-Fi or Ethernet connection.',
          'Restart your router.',
          'Check your network configuration.',
        ],
      }
    }

    // Everything working
    return {
      title: '✅ Network Working Normally',
      message:
        'Your network connectivity tests completed successfully.',
      actions: [
        'Internet connectivity is working.',
        'DNS resolution is working.',
        'The default gateway is reachable.',
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
          Diagnose common network problems using real
          network tests.
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

            <h2>Network Diagnosis</h2>

            <div className="grid">

              <div>
                <span>Operating System</span>
                <strong>
                  {data.operatingSystem}
                </strong>
              </div>

              <div>
                <span>Local IP Address</span>
                <strong>
                  {data.localIP || 'Not detected'}
                </strong>
              </div>

              <div>
                <span>Default Gateway</span>
                <strong>
                  {data.gateway || 'Not detected'}
                </strong>
              </div>

              <div>
                <span>Gateway Connectivity</span>
                <strong>
                  {data.gatewayReachable === null
                    ? 'Not available'
                    : data.gatewayReachable
                    ? '✓ Reachable'
                    : '✗ Not Reachable'}
                </strong>
              </div>

              <div>
                <span>Gateway Latency</span>
                <strong>
                  {data.gatewayLatency !== null
                    ? `${data.gatewayLatency} ms`
                    : 'Not available'}
                </strong>
              </div>

              <div>
                <span>Internet Connectivity</span>
                <strong>
                  {data.internet
                    ? '✓ Working'
                    : '✗ Not Working'}
                </strong>
              </div>

              <div>
                <span>DNS Resolution</span>
                <strong>
                  {data.dns
                    ? '✓ Working'
                    : '✗ Not Working'}
                </strong>
              </div>

              <div>
                <span>Packets Sent</span>
                <strong>
                  {data.pingPacketsSent}
                </strong>
              </div>

              <div>
                <span>Packets Received</span>
                <strong>
                  {data.pingPacketsReceived !== null
                    ? data.pingPacketsReceived
                    : 'Not available'}
                </strong>
              </div>

              <div>
                <span>Packet Loss</span>
                <strong>
                  {data.packetLoss !== null
                    ? `${data.packetLoss}%`
                    : 'Not available'}
                </strong>
              </div>

              <div>
                <span>Average Latency</span>
                <strong>
                  {data.averageLatency !== null
                    ? `${data.averageLatency} ms`
                    : 'Not available'}
                </strong>
              </div>

            </div>
          </section>

          {diagnosis && (
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
          )}

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
                    Gateway: {item.gateway}
                  </p>

                  <p>
                    Internet: {item.internet}
                  </p>

                  <p>
                    DNS: {item.dns}
                  </p>

                  <p>
                    Packet Loss: {item.packetLoss}
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