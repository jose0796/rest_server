import mongoose from "mongoose"
import config from "config"
const db = config.get("mongoURI")

const connectDB = async () => {
    try{
        await mongoose.connect(db, {
            useNewUrlParser:true,
            useUnifiedTopology:true,
            useFindAndModify:false
        })
        console.log('Mongoose connected...')
    }catch(err){
        console.error(err.message)
        connectDB()
    }
}

export default connectDB