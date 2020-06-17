import express from "express"
import { auth } from "../../middleware/auth.js"
import { User } from "../../models/users.js"
import validator from "express-validator"
import config from "config"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
const router = express.Router()


// @route GET api/auth
// @desc login 
// @access 
router.get('/',auth, async (req,res) => {
    try{
        const user = await User.findById(req.user.id).select('-pasword')
        res.json(user)
    }catch(err){
        console.log(err.message)
        res.status(500).send("Server error.")
    }
})

router.post('/', [
    validator.check('email',"Please include a valid email").isEmail(),
    validator.check('password',"Password is required").exists()
    ],
    async (req,res) => {
        
        const errors = validator.validationResult(req)
        if (!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()})
        }
        
        const { email, password } = req.body

        try{
            let user = await User.findOne({email})
            if (!user){
                return res.status(400).json({
                    error: [{
                        msg: "Invalid credentials"
                    }]
                })
            }

            const isMatch = await bcrypt.compare(password, user.password)

            if (!isMatch){
                return res.status(400).json({error:[{msg:"Invalid credentials"}]})
            }
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(
                payload, 
                config.get('jwtSecret'),
                {
                    expiresIn:360000
                },
                (err,token) => {
                    if (err) throw err
                    return res.json({ token })
                }
            )



        }catch(err){
            console.error(err.message)
            return res.status(500).json({errors:err.message})
        }

})


export default router