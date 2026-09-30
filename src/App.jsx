import {useState} from 'react'
import './App.css'

function App() {
  const [diagnosis, setDiagnosis] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const diagnoseNetwork = async () => {
    setLoading(true)
    setError('')
    setDiagnosis(null)

    try {
      const response = await fetch('https://network-troubleshooting-backend.onrender.com/api/diagnose')

      if (!response.ok) {
        throw new Error('Server error')
      }

      const data = await response.json()

      setDiagnosis(data)

      const historyItem = {
        id: Date.now(),
        time: new Date().toLocaleString(),

        localIP: data.localIP,
        gateway: data.gateway,

        gatewayReachable:
          data.gatewayReachable,

        internet: data.internet,
        dns: data.dns,

        packetLoss: data.packetLoss,
        latency: data.averageLatency,
      }

      setHistory(previousHistory => [
        historyItem,
        ...previousHistory,
      ])
    } catch (error) {
      setError(
        'Cannot connect to the diagnostic server. Start the backend server first.'
      )
    }

    setLoading(false)
  }

  const getDiagnosis = () => {
    if (!diagnosis) {
      return null
    }

    if (diagnosis.gateway === null) {
      return {
        title: '⚠️ Gateway Not Detected',
        message:
          'The default gateway could not be detected.',
        recommendations: [
          'Check your Wi-Fi or Ethernet connection.',
          'Check your network settings.',
          'Reconnect to the network.',
        ],
      }
    }

    if (!diagnosis.gatewayReachable) {
      return {
        title: '⚠️ Gateway Not Reachable',
        message:
          'The computer could not communicate with the default gateway.',
        recommendations: [
          'Check your Wi-Fi connection.',
          'Reconnect to the network.',
          'Move closer to the router.',
          'Restart the router if necessary.',
        ],
      }
    }

    if (diagnosis.packetLoss >= 50) {
      return {
        title: '⚠️ High Packet Loss',
        message:
          'A large percentage of packets were lost.',
        recommendations: [
          'Check Wi-Fi signal strength.',
          'Move closer to the router.',
          'Disconnect unused devices.',
          'Test the connection again.',
        ],
      }
    }

    if (diagnosis.packetLoss > 0) {
      return {
        title: '⚠️ Packet Loss Detected',
        message:
          'Some packets were lost during the test.',
        recommendations: [
          'Check Wi-Fi signal strength.',
          'Reconnect to the network.',
          'Check network usage by other devices.',
          'Run the test again.',
        ],
      }
    }

    if (
      diagnosis.averageLatency !== null &&
      diagnosis.averageLatency > 200
    ) {
      return {
        title: '⚠️ High Network Latency',
        message:
          'The average network response time is high.',
        recommendations: [
          'Check whether other devices are using heavy bandwidth.',
          'Move closer to the router.',
          'Reconnect to the network.',
          'Run the test again.',
        ],
      }
    }

    if (!diagnosis.internet) {
      return {
        title: '⚠️ Internet Connectivity Problem',
        message:
          'The local network is reachable, but Internet connectivity failed.',
        recommendations: [
          'Check your Internet connection.',
          'Restart the router if necessary.',
          'Check another device on the same network.',
        ],
      }
    }

    if (!diagnosis.dns) {
      return {
        title: '⚠️ Possible DNS Problem',
        message:
          'Internet connectivity is available, but DNS resolution failed.',
        recommendations: [
          'Check your DNS configuration.',
          'Reconnect to the network.',
          'Try another DNS server.',
        ],
      }
    }

    return {
      title: '✓ Network Checks Passed',
      message:
        'The basic network tests completed successfully.',
      recommendations: [
        'Local network connectivity is working.',
        'Internet connectivity is working.',
        'DNS resolution is working.',
        'No significant packet loss was detected.',
      ],
    }
  }

  const diagnosisResult = getDiagnosis()

  return (
    <div className="app">

      <div className="header">
        <h1>
          Network Troubleshooting Assistant
        </h1>

        <p>
          Diagnose common network problems using
          real network tests.
        </p>
      </div>

      <button
        className="diagnose-button"
        onClick={diagnoseNetwork}
        disabled={loading}
      >
        {loading
          ? 'Checking Network...'
          : '🔍 Diagnose My Network'}
      </button>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading">
          <p>
            Running network diagnostics...
          </p>
          <p>
            Please wait.
          </p>
        </div>
      )}

      {diagnosis && !loading && (
        <>
          <div className="result-card">

            <h2>
              Network Diagnosis
            </h2>

            <div className="diagnostic-row">
              <span>Local IP Address</span>
              <strong>
                {diagnosis.localIP ||
                  'Not detected'}
              </strong>
            </div>

            <div className="diagnostic-row">
              <span>Default Gateway</span>
              <strong>
                {diagnosis.gateway ||
                  'Not detected'}
              </strong>
            </div>

            <div className="diagnostic-row">
              <span>
                Gateway Connectivity
              </span>

              {diagnosis.gatewayReachable ? (
                <span className="success">
                  ✓ Reachable
                </span>
              ) : (
                <span className="failure">
                  ✗ Not Reachable
                </span>
              )}
            </div>

            <div className="diagnostic-row">
              <span>
                Gateway Latency
              </span>

              <strong>
                {diagnosis.gatewayLatency !== null
                  ? `${diagnosis.gatewayLatency} ms`
                  : 'Not available'}
              </strong>
            </div>

            <div className="diagnostic-row">
              <span>
                Internet Connectivity
              </span>

              {diagnosis.internet ? (
                <span className="success">
                  ✓ Working
                </span>
              ) : (
                <span className="failure">
                  ✗ Failed
                </span>
              )}
            </div>

            <div className="diagnostic-row">
              <span>
                DNS Resolution
              </span>

              {diagnosis.dns ? (
                <span className="success">
                  ✓ Working
                </span>
              ) : (
                <span className="failure">
                  ✗ Failed
                </span>
              )}
            </div>

            <div className="diagnostic-row">
              <span>
                Packets Sent
              </span>

              <strong>
                {diagnosis.pingPacketsSent}
              </strong>
            </div>

            <div className="diagnostic-row">
              <span>
                Packets Received
              </span>

              <strong>
                {diagnosis.pingPacketsReceived}
              </strong>
            </div>

            <div className="diagnostic-row">
              <span>
                Packet Loss
              </span>

              <strong>
                {diagnosis.packetLoss !== null
                  ? `${diagnosis.packetLoss}%`
                  : 'Not available'}
              </strong>
            </div>

            <div className="diagnostic-row">
              <span>
                Average Latency
              </span>

              <strong>
                {diagnosis.averageLatency !== null
                  ? `${diagnosis.averageLatency} ms`
                  : 'Not available'}
              </strong>
            </div>

          </div>

          {diagnosisResult && (
            <div className="diagnosis-message">

              <h2>
                Diagnosis & Recommendation
              </h2>

              <h3>
                {diagnosisResult.title}
              </h3>

              <p>
                {diagnosisResult.message}
              </p>

              <h4>
                Recommended Actions
              </h4>

              <ul>
                {diagnosisResult.recommendations.map(
                  (item, index) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>

            </div>
          )}

          <button
            className="test-button"
            onClick={diagnoseNetwork}
          >
            🔄 Test Again
          </button>
        </>
      )}

      {history.length > 0 && (
        <div className="history-card">

          <h2>
            📋 Troubleshooting History
          </h2>

          {history.map(item => (
            <div
              className="history-item"
              key={item.id}
            >

              <div className="history-header">

                <strong>
                  {item.time}
                </strong>

                {item.internet &&
                item.dns &&
                item.packetLoss === 0 ? (
                  <span className="success">
                    ✓ Healthy
                  </span>
                ) : (
                  <span className="failure">
                    ⚠ Problem Detected
                  </span>
                )}

              </div>

              <div className="history-details">

                <p>
                  <strong>IP:</strong>{' '}
                  {item.localIP || 'N/A'}
                </p>

                <p>
                  <strong>Gateway:</strong>{' '}
                  {item.gateway || 'N/A'}
                </p>

                <p>
                  <strong>Internet:</strong>{' '}
                  {item.internet
                    ? 'Working'
                    : 'Failed'}
                </p>

                <p>
                  <strong>DNS:</strong>{' '}
                  {item.dns
                    ? 'Working'
                    : 'Failed'}
                </p>

                <p>
                  <strong>Packet Loss:</strong>{' '}
                  {item.packetLoss !== null
                    ? `${item.packetLoss}%`
                    : 'N/A'}
                </p>

                <p>
                  <strong>Latency:</strong>{' '}
                  {item.latency !== null
                    ? `${item.latency} ms`
                    : 'N/A'}
                </p>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  )
}

export default App