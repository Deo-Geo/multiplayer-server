const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const { createClient } = require("@supabase/supabase-js")

const SUPABASE_URL = "https://fcbxcqzifniragntdhlc.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjYnhjcXppZm5pcmFnbnRkaGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTgwNjYsImV4cCI6MjA4NDMzNDA2Nn0.j5HBD_PMxwgIGGAjuPeEVYIsPgcUM4OAvO_7i6RR4L4"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "https://projectballs.netlify.app",
    methods: ["GET", "POST"]
  }
})


const players = {}

io.on("connection", socket => {
  console.log("Player connected:", socket.id)

  players[socket.id] = {
    x: Math.random() * 500,
    y: Math.random() * 500,
    name: "Guest",
    color: "#ff0000"

  }

  io.emit("players", players)

  socket.on("setName", async name => {
    players[socket.id].name = name

    await supabase.from("players").upsert({
      id: socket.id,
      name
    })

    io.emit("players", players)
  })
  socket.on("setColor", (color) => {
  if (players[socket.id]) {
    players[socket.id].color = color
    io.emit("players", players)
  }
})

  socket.on("move", data => {
    const p = players[socket.id]
    if (!p) return

    p.x += data.dx
    p.y += data.dy
    io.emit("players", players)
  })

  socket.on("disconnect", async () => {
    delete players[socket.id]

    await supabase.from("players").delete().eq("id", socket.id)

    io.emit("players", players)
  })
})

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running")
})
