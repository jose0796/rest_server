import jwt from "jsonwebtoken"
import config from "config"



const auth = (req,res,next) => {
    const token = req.header('x-auth-token')

    if (!token){
        return res.status(401).json({error: [
            {
                msg: "No token, authorization failed."
            }
        ]})
    }

    try{
        const decoded = jwt.verify(token, config.get('jwtSecret'))
        req.user = decoded.user
        next()
    }catch(err){
        res.status(401).json({error: [{msg: "Token is not valid."}]})
    }
}

export {
    auth
}