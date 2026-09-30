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
// Get local IP
// Works on Windows and macOS
// --------------------------------------------------

function getLocalIP() {
  const interfaces = os.networkInterfaces()

  for (const name of Object.keys(interfaces)) {
    for (const network of interfaces[name]) {
      const isIPv4 =
        network.family === 'IPv4' ||
        network.family === 4

      if (isIPv4 && !network.internal) {
        return network.address
      }
    }
  }

  return null
}

// --------------------------------------------------
// Get default gateway
// Works on Windows, macOS and Linux
// --------------------------------------------------

function getGateway() {
  return new Promise(resolve => {
    const platform = process.platform

    let command

    if (platform === 'win32') {
      command = 'ipconfig'
    } else if (platform === 'darwin') {
      command = 'route -n get default'
    } else {
      command = 'ip route'
    }

    exec(command, (error, stdout) => {
      if (error) {
        resolve(null)
        return
      }

      let gateway = null

      // Windows
      if (platform === 'win32') {
        const match = stdout.match(
          /Default Gateway[ .]*:\s*([0-9.]+)/
        )

        if (match) {
          gateway = match[1]
        }
      }

      // macOS
      else if (platform === 'darwin') {
        const match = stdout.match(
          /gateway:\s+([0-9.]+)/
        )

        if (match) {
          gateway = match[1]
        }
      }

      // Linux
      else {
        const match = stdout.match(
          /default via ([0-9.]+)/
        )

        if (match) {
          gateway = match[1]
        }
      }

      resolve(gateway)
    })
  })
}

// --------------------------------------------------
// Diagnose network
// --------------------------------------------------

app.get('/api/diagnose', async (req, res) => {
  const result = {
    operatingSystem: process.platform,

    localIP: getLocalIP(),

    gateway: null,

    gatewayReachable: null,
    gatewayLatency: null,

    internet: false,
    dns: false,

    pingPacketsSent: 5,
    pingPacketsReceived: null,

    packetLoss: null,
    averageLatency: null,
  }

  // ------------------------------------------------
  // 1. Get gateway
  // ------------------------------------------------

  result.gateway = await getGateway()

  // ------------------------------------------------
  // 2. Test gateway
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

      if (gatewayPing.avg !== 'unknown') {
        result.gatewayLatency =
          Number(gatewayPing.avg)
      }
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

    if (pingResult.alive) {
      result.pingPacketsReceived = 5

      result.packetLoss =
        Number(pingResult.packetLoss)

      if (pingResult.avg !== 'unknown') {
        result.averageLatency =
          Number(pingResult.avg)
      }
    }
  } catch (error) {
    result.pingPacketsReceived = null
    result.packetLoss = null
    result.averageLatency = null
  }

  res.json(result)
})

// --------------------------------------------------
// Start server
// --------------------------------------------------

const PORT = process.env.PORT || 5000

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Network Troubleshooting Server running on port ${PORT}`
  )

  console.log(
    `Operating System: ${process.platform}`
  )
})