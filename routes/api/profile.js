import express from "express"
import request from "request"
import { Profile } from "../../models/profile.js"
import { auth } from "../../middleware/auth.js"
import validator from "express-validator"
import { User } from "../../models/users.js"
import config from "config"
const router = express.Router()


// @route GET api/profile/me
// @desc get current user profile
// @access private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name'])
        if (!profile) {
            return res.status(400).json({
                success:false,
                errors: [
                    {
                        msg: "No profile for this user"
                    }
                ]
            })
        }

        res.status(200).json({success:true,profile})

    } catch (err) {
        console.log(err.message)
        res.status(500).send({success:false,errors:[{msg:"Unknown error"}]})
    }
})

router.post('/', [
    auth,
    validator.check('status', 'Status is required').not().isEmpty(),
    validator.check('skills', 'Skills is required').not().isEmpty(),
],
    async (req, res) => {
        const errors = validator.validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success:false,
                errors: [
                    errors.array()
                ]
            })
        }

        const {
            company,
            website,
            location,
            bio,
            status,
            githubusername,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin,
            skills
        } = req.body

        const profileFields = {}

        profileFields.user = req.user.id


        if (company) profileFields.company = company
        if (website) profileFields.website = website
        if (location) profileFields.location = location
        if (bio) profileFields.bio = bio
        if (status) profileFields.status = status
        if (githubusername) profileFields.githubusername = githubusername
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim())
        }
        if (youtube) profileFields.youtube = youtube
        if (facebook) profileFields.facebook = facebook
        if (twitter) profileFields.twitter = twitter
        if (instagram) profileFields.instagram = instagram
        if (linkedin) profileFields.linkedin = linkedin

        try {
            let profile = await Profile.findOne({user:req.user.id})

            if (profile){
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id }, 
                    { $set: profileFields },
                    { new: true})

                return res.json({success:true,profile})
                
            }

            profile = new Profile(profileFields)
            await profile.save()

            return res.json({success:true,profile})


        } catch (err) {
            console.log(err.message)
            res.status(500).json({
                success:false,
                errors: [
                    {
                        msg: err.message
                    }
                ]
            })
        }

    }

)

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public 

router.get('/', async (req,res) => {
    try{
        const profiles = await Profile.find().populate('user', ['name'])
        res.json(profiles)
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

// @route   GET api/profile/user/:user_id
// @desc    Get profile from user
// @access  Public 


router.get('/user/:user_id', async (req,res) => {
    try{
        const profile = await Profile.findOne({user:req.params.user_id}).populate('user', ['name'])
        
        if (!profile) return res.status(400).json({
                    success:true,
                    errors:[
                        {
                            msg: "There is no profile for this user."
                        }
                    ]
                }
            )
        
        res.json(profile)
    }catch(err){
        console.log(err.message)
        if (err.kind == 'ObjectId'){
            return res.status(400).json(
                {
                    success:false,
                    errors:[
                        {
                            msg: "Profile not found"
                        }
                    ]
                }
            )
        }

        res.status(500).json({
            success:false,
            errors:[{
                msg:"Server Error"
            }]
        })
    }
})

// @route   GET api/profile
// @desc    Delete profile 
// @access  Private 

router.delete('/', auth, async (req,res) => {
    try{
        // @todo - remove users posts 

        // remove profile 
        await Profile.findOneAndDelete({user: req.user.id})
        // remove user 
        await User.findOneAndRemove({_id: req.user.id})

        res.json({
            success:true,
            msg: "Profile succesfully removed"
        })

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

// @route PUT api/profile/experience 
// @desc  Add profile experience 
// @access Private 

router.put('/experience',[
        auth,
        validator.check('title', 'Title is required').not().isEmpty(),
        validator.check('company', 'Company is required').not().isEmpty(),
        validator.check('from', 'Starting date is required').not().isEmpty()
    ], async (req,res) => {
        const errors = validator.validationResult(req)
        if (!errors.isEmpty()){
            return res.status(400).json(
                {   
                    success:false,
                    errors: errors.array()
                }
            )
        }

        const {
            title,
            company,
            location,
            from,
            to,
            current,
            description
        } = req.body 

        const newExp = {}
        newExp.title = title
        newExp.company = company
        newExp.from = from
        if (location) newExp.location = location
        if (to) newExp.to = to
        if (current) newExp.current = current
        if (description) newExp.description = description


        try{
            const profile = await Profile.findOne({user: req.user.id})
            profile.experience.unshift(newExp)
            await profile.save()
            res.json(profile)

        }catch(err){
            console.log(err.message)
            return res.status(500).send("Server Error")
        }
    }
    
)

router.delete('/experience/:exp_id', 
    auth, 
    async (req, res) => {
        try{
            const profile = await Profile.findOne({user: req.user.id})
            if (!profile){
                return res.status(400).json({success:false,errors:[{msg:"Profile does not exists"}]})
            }

            const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)
            profile.experience.splice(removeIndex,1)

            await profile.save()

            return res.json({success:true,profile})
        }catch(err){
            console.log(err.message)
            res.status(500).json(
                {
                    success:false,
                    errors:[
                        {
                            msg:"Server error"
                        }
                    ]
                })
        }
})


// @route PUT api/profile/education 
// @desc  Add profile education 
// @access Private 

router.put('/education',[
    auth,
    validator.check('school', 'School is required').not().isEmpty(),
    validator.check('degree', 'Degree is required').not().isEmpty(),
    validator.check('fieldofstudy', 'Field of study is required').not().isEmpty(),
    validator.check('from', 'Starting is required').not().isEmpty()
], async (req,res) => {
    const errors = validator.validationResult(req)
    if (!errors.isEmpty()){
        return res.status(400).json({success: false,errors: errors.array()})
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body 

    const newEdu = {}
    newEdu.school = school
    newEdu.degree = degree
    newEdu.fieldofstudy = fieldofstudy
    newEdu.from = from
    if (to) newEdu.to = to
    if (current) newEdu.current = current
    if (description) newEdu.description = description


    try{
        const profile = await Profile.findOne({user: req.user.id})
        profile.education.unshift(newEdu)
        await profile.save()
        res.json({success:false,profile})

    }catch(err){
        console.log(err.message)
        return res.status(500).json({success:false,errors:[{msg:"Server Error"}]})
    }
}

)

router.delete('/education/:edu_id', 
    auth, 
    async (req, res) => {
        try{
            const profile = await Profile.findOne({user: req.user.id})
            if (!profile){
                return res.status(400).json({success:false,errors:[{msg:"Profile does not exists"}]})
            }
            
            const removeIndex = profile.education.map(item => item.id).indexOf(req.params.exp_id)
            profile.education.splice(removeIndex,1)

            await profile.save()

            return res.json({success:false,profile})
        }catch(err){
            console.log(err.message)
            res.status(500).json({success:false,errors:[{msg:"Server error"}]})
        }
})

// @route   GET api/profile/github/:username
// @desc    get user repos from github
// @access  Public

router.get('/github/:username',(req,res) => {
    try{
        const options ={
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubClientSecret')}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js'}
        }

        request(options, (error,response,body) => {
            if (error) console.error(err)
            if (response.statusCode !== 200) res.status(404).json({success:false, errors:[{msg:"Github profile not found"}]})
            res.json(JSON.parse(body))
        })
    }catch(err){
        console.log(err.message)
        res.status(500).json({success:false, errors:[{msg:"Server error"}]})
    }
})


export default router