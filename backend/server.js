const express = require('express')
const cors = require('cors')
const dns = require('dns').promises
const os = require('os')
const {exec} = require('child_process')
const ping = require('ping')

const app = express()

app.use(cors())
app.use(express.json())

// --------------------------------------------------
// Get local IP and default gateway
// Works on Windows and macOS
// --------------------------------------------------

function getNetworkInfo() {
  return new Promise(resolve => {
    const isWindows = process.platform === 'win32'

    const command = isWindows
      ? 'ipconfig'
      : 'route -n get default'

    exec(command, (error, stdout) => {
      if (error) {
        resolve({
          localIP: null,
          gateway: null,
        })
        return
      }

      let localIP = null
      let gateway = null

      // -----------------------------
      // WINDOWS
      // -----------------------------

      if (isWindows) {
        const gatewayMatch = stdout.match(
          /Default Gateway[ .]*:\s*([0-9.]+)/
        )

        const ipMatches = [
          ...stdout.matchAll(
            /IPv4 Address[ .]*:\s*([0-9.]+)/g
          ),
        ]

        gateway = gatewayMatch
          ? gatewayMatch[1]
          : null

        if (ipMatches.length > 0) {
          localIP = ipMatches[0][1]
        }
      }

      // -----------------------------
      // MACOS
      // -----------------------------

      else {
        const gatewayMatch = stdout.match(
          /gateway:\s+([0-9.]+)/
        )

        const interfaceMatch = stdout.match(
          /interface:\s+(\S+)/
        )

        gateway = gatewayMatch
          ? gatewayMatch[1]
          : null

        const interfaces = os.networkInterfaces()

        if (interfaceMatch) {
          const interfaceName =
            interfaceMatch[1]

          const networkInterface =
            interfaces[interfaceName]

          if (networkInterface) {
            const ipv4 =
              networkInterface.find(
                network =>
                  network.family === 'IPv4' &&
                  !network.internal
              )

            if (ipv4) {
              localIP = ipv4.address
            }
          }
        }
      }

      resolve({
        localIP,
        gateway,
      })
    })
  })
}

// --------------------------------------------------
// Diagnose network
// --------------------------------------------------

app.get('/api/diagnose', async (req, res) => {
  const result = {
    localIP: null,
    gateway: null,

    gatewayReachable: false,
    gatewayLatency: null,

    internet: false,
    dns: false,

    pingPacketsSent: 5,
    pingPacketsReceived: 0,

    packetLoss: null,
    averageLatency: null,
  }

  // ------------------------------------------------
  // 1. Local IP + Gateway
  // ------------------------------------------------

  const networkInfo = await getNetworkInfo()

  result.localIP = networkInfo.localIP
  result.gateway = networkInfo.gateway

  // ------------------------------------------------
  // 2. Gateway test
  // ------------------------------------------------

  if (result.gateway) {
    try {
      const gatewayPing =
        await ping.promise.probe(
          result.gateway,
          {
            timeout: 2,
          }
        )

      result.gatewayReachable =
        gatewayPing.alive

      result.gatewayLatency =
        gatewayPing.avg !== 'unknown'
          ? Number(gatewayPing.avg)
          : null
    } catch (error) {
      result.gatewayReachable = false
      result.gatewayLatency = null
    }
  }

  // ------------------------------------------------
  // 3. DNS test
  // ------------------------------------------------

  try {
    await dns.lookup('google.com')

    result.dns = true
  } catch (error) {
    result.dns = false
  }

  // ------------------------------------------------
  // 4. Internet test
  // ------------------------------------------------

  try {
    const response = await fetch(
      'https://www.google.com'
    )

    result.internet = response.ok
  } catch (error) {
    result.internet = false
  }

  // ------------------------------------------------
  // 5. Ping test
  // ------------------------------------------------

  try {
    const pingResult =
      await ping.promise.probe(
        '8.8.8.8',
        {
          min_reply: 5,
          timeout: 2,
        }
      )

    result.pingPacketsReceived =
      pingResult.alive ? 5 : 0

    result.packetLoss =
      Number(pingResult.packetLoss)

    result.averageLatency =
      pingResult.avg !== 'unknown'
        ? Number(pingResult.avg)
        : null
  } catch (error) {
    result.pingPacketsReceived = 0
    result.packetLoss = 100
    result.averageLatency = null
  }

  res.json(result)
})

// --------------------------------------------------
// Start server
// --------------------------------------------------

const PORT = process.env.PORT || 5000

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Network Troubleshooting Server running on port ${PORT}`)
  console.log(`Operating System: ${process.platform}`)
})