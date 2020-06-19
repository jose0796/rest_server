import express from "express"
import validator from 'express-validator'
import { User } from '../../models/users.js'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
import config from "config"

const check = validator.check
const validateResult = validator.validationResult
const router = express.Router()

// @route GET api/users
// @desc gets  
// @access 
router.get('/', (req,res) => res.send("Hello World"))
router.post('/create', [
    check('name', "Name is required").not().isEmpty(),
    check('email',"Please include a valid email").isEmail(),
    check('password',"Please enter a password with 8 or more characters").isLength({min:8})
    ],
    async (req,res) => {
        const errors = validateResult(req)
        if (!errors.isEmpty()){
            return res.status(400).json({success:false, errors: errors.array()})
        }
        
        const { name, email, password } = req.body

        try{
            let user = await User.findOne({name,email})
            if (user){
                return res.status(400).json({
                    success:false,
                    errors: [{
                        msg: "User already exists"
                    }]
                })
            }


            user = new User({
                name,
                email,
                password
            })

            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(password, salt)

            await user.save()

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
                    return res.json({success:true, token })
                }
            )



            // res.send("User registered")

        }catch(err){
            console.error(err.message)
            res.status(500).json({success:true,errors:err.message})
        }

})

export default router