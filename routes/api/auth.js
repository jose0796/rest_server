import express from "express"
import { auth } from "../../middleware/auth.js"
import { User } from "../../models/users.js"
import validator from "express-validator"
import config from "config"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
const router = express.Router()


// @route   GET api/auth
// @desc    returns user model from database using jwt
// @access  Private
router.get('/',auth, async (req,res) => {
    try{
        const user = await User.findById(req.user.id).select('-pasword')
        res.json({success:true,user})
    }catch(err){
        console.log(err.message)
        res.status(500).json({
            success:false,
            errors:[{
                msg:"Server Error"
            }]
        })
    }
})


// @route   GET api/auth
// @desc    returns user model from database using jwt
// @access  Private

router.post('/', [
    validator.check('email',"Please include a valid email").isEmail(),
    validator.check('password',"Password is required").exists()
    ],
    async (req,res) => {
        
        const errors = validator.validationResult(req)
        if (!errors.isEmpty()){
            return res.status(400).json({success:false,errors: errors.array()})
        }
        
        const { email, password } = req.body

        try{
            let user = await User.findOne({email})
            if (!user){
                return res.status(400).json({
                    success:false,
                    errors: [{
                        msg: "Invalid credentials"
                    }]
                })
            }

            const isMatch = await bcrypt.compare(password, user.password)

            if (!isMatch){
                return res.status(400).json({success:false,errors:[{msg:"Invalid credentials"}]})
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
                    return res.json({ success:true,token })
                }
            )



        }catch(err){
            console.error(err.message)
            res.status(500).json({
                success:false,
                errors:[{
                    msg:"Server Error"
                }]
            })
        }

})


export default router