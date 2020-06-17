import express from "express"
import connectDB from "./config/db.js"
import usersRoutes from "./routes/api/users.js"
import profileRoutes from "./routes/api/profile.js"
import authRoutes from "./routes/api/auth.js"

const app = express()


connectDB()

app.use(express.json({extended: false}))

app.get('/', (req,res) => res.send('Api Running'))

app.use('/api/users', usersRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/auth', authRoutes)
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

