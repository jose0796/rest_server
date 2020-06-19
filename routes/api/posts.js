import express from "express"
import { auth } from "../../middleware/auth.js"
import validator from "express-validator"
import { Post } from "../../models/posts.js"
import { User } from "../../models/users.js"
const router = express.Router()

// @route   POST api/posts
// @desc    add new post 
// @access  Private 


router.post('/', [
    auth,
    validator.check('text').not().isEmpty()
    ], async (req,res) => {
    try{
        const error = validator.validationResult(req)
        if (!error.isEmpty()){
            return res.status(400).json({success:false, errors:error.array()})
        }

        const user = await User.findById(req.user.id).select('-password')

        const {
            text,
            likes,
            comments,
            date
        } = req.body

        const newPost = {}
        newPost.user = req.user.id
        newPost.text = text
        newPost.name = user.name
        if (likes) newPost.likes = likes
        if (comments) newPost.comments = comments
        if (date) newPost.date = date

        const post = new Post(newPost)

        await post.save()

        return res.json({success:true, post})
        
    }catch(err){
        console.log(err.message)
        res.status(500).json({success:false,errors:[{msg:"Server Error"}]})
    }
})

// @route   GET api/posts
// @desc    get all posts 
// @access  Private

router.get('/', auth, async (req,res)=> {
    try{
        const posts = await Post.find().sort({date:-1})
        res.json({success:true,posts})
    }catch(err){
        console.log(err.message)
        res.status(500).json({success:false,errors:[{msg:"Server Error"}]})
    }
})


// @route   GET api/posts/:id
// @desc    get a posts 
// @access  Private

router.get('/', auth, async (req,res)=> {
    try{
        const post = await Post.findById(req.params.id)
        if (!post){
            return res.status(404).json({success:false, errors:[{msg:"Post not found."}]})
        }
        res.json({success:true,post})
    }catch(err){
        console.log(err.message)

        if (err.kind === 'ObjectId'){
            return res.status(404).json({success:false, errors:[{msg:"Post not found."}]})
        }
        res.status(500).json({success:false,errors:[{msg:"Server Error"}]})
    }
})


// @route   DELETE api/posts/:post_id
// @desc    delete post 
// @access  Private 
router.delete('/:post_id', auth, async (req,res) => {
    try{
        const post = await Post.findOneAndDelete({user:req.user.id, _id: req.params.post_id})

        if (!post) 
            return res.status(400).json({success:false,errors:[{msg:"Post not found"}]})

        return res.json({success:true, post})

    }catch(err){
        console.log(err.message)
        if (err.kind === 'ObjectId'){
            return res.status(404).json({success:false, errors:[{msg:"Post not found."}]})
        }

        res.status(500).json({success:false,errors:[{msg:"Server Error"}]})
    }
})


export default router