const express = require('express');
const app = express();
const userModel = require('./models/user')
const postModel = require('./models/post')
const cookieParser = require("cookie-parser")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const user = require('./models/user');
const post = require('./models/post');
const upload = require("./config/multerconfig")
const path = require("path")

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser())






// ------------------------------------------------
app.get('/', (req, res) => {
    res.render("index");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get("/profile/upload", (req,res)=>{
    res.render("profileupload");
})

app.post('/upload', isLoggedIn , upload.single("image"), async (req,res)=>{
    let user = await userModel.findOne({email: req.user.email})
    user.profilepic = req.file.filename;
    await user.save();
    res.redirect("/profile")
})

app.get('/profile', isLoggedIn,async (req, res) => {// ye ak protected route hai 
    let user = await userModel.findOne({email: req.user.email}).populate("posts") // we are chcking here kon sa user login hai usko find kar rahe hai 
    res.render("profile", {user});// hamne profile.ejs banaya hai usko open karenge es route pe 
})

app.get('/like/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user")// here we have find all the post and populate user field  
    
    if(post.likes.indexOf(req.user.userid) === -1){ // post ke likes array me id's hongi agr userid nahi hai matalab -1 to like karva do
        post.likes.push(req.user.userid)// yaha pe hamne post ke like array me user ki id put kar di hai // basically like karva rahe hai 
    }
    else{ // agr user hai to hame like hatana hai  
        post.likes.splice(post.likes.indexOf(req.user.userid), 1)// post ke likes array me se es index ke bande ko hatao " post.likes.indexOf(req.user.userid) " aur kitne ko hatao 1 ko to 1 like hat jaye ga  
    }

    await post.save(); // to hamne yaha pe dono hi case me save kiya hai post ka like bade ya gate
    res.redirect("/profile")

})

app.get('/edit/:id', isLoggedIn, async (req , res)=>{
    let post = await postModel.findOne({_id: req.params.id}).populate("user")

    res.render("edit", { post });
})

app.post("/update/:id" , isLoggedIn , async (req, res) =>{
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content}) // yaha pe sabse pahle hamne findOne kiya hai"{_id: req.params.id}" and fir upfate kiye hai "{content: req.body.content}"

    res.redirect("/profile")
})

app.post('/post', isLoggedIn , async (req,res)=>{
    let user = await userModel.findOne({email: req.user.email}); // we are finding user
    let {content} = req.body; // D strcturing

    let post = await postModel.create({ // post create ho chuka hai
        user:user._id, // esse pata chale ga post ko ki user kon hai 
        content
    })
    user.posts.push(post._id);// ab ham user ko bata rahe hai ki usne post create kiya hai / to ham user ke posts me es post ki id push kar rahe hai 
    await user.save();
    res.redirect("/profile")
})

app.post('/register', async (req, res) => {
    let { email, password, username, name, age } = req.body; // D structuring 

    let user = await userModel.findOne({ email }); // yaha pe user ko find kar rahe hai ki vo already registered to nahi hai na 
    if (user) return res.status(500).send("user already registered"); // agr hai to ye return karo

    bcrypt.genSalt(10, (err, salt) => {    // user create kar rahe hai 
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userModel.create({
                username,
                email,
                age,
                name,
                password: hash
            });
            let token = jwt.sign({ email: email, userid: user._id }, "shhh");
            res.cookie("token", token);
            res.redirect("/login?success=registered");
        })
    })
})

app.post('/login', async (req, res) => {
    let { email, password } = req.body; // D structuring 

    let user = await userModel.findOne({ email }); // yaha pe user ko find kar rahe hai ki us naam (email) ka user hai bhi ya nahi 
    if (!user) return res.status(500).send("something went wrong"); // agr hai to ye return karo aur bplna hai something went wrong 

    bcrypt.compare(password, user.password, function (err, result) { // yaha pe hai user ka old and new password ko chack kar rahe hai login karte time 
        if (result) {
            let token = jwt.sign({ email: email, userid: user.id }, "shhh")
            res.cookie("token", token);
            res.status(200).redirect("/profile"); // agr user ka password sahi hai to usko profile pe redirect kar do 
        }
        else res.redirect("/login") // agr password galat hai to fir se usi same page pe rhne do fir se login karne do 
    })
})

app.get("/logout", (req, res) => {
    res.cookie("token", "")
    res.redirect("/login")
})

function isLoggedIn(req, res, next) {            // middleware for protected route  // agr ham kisi profile rout pe hai aur login nahi hai to ye bole ga aap pahle login ho 
    if (!req.cookies.token) {   // yaha pe ham log check kar rahe hai agr koi new user aaye ga  to usko redirect kar do /login route pe ki fir se login karo 
        return res.redirect("/login");
    }

    try {
        let data = jwt.verify(req.cookies.token, "shhh");  // agr valid user hai to usko verify karo aur uske andar jo bhi data hai usko data naam ke variable me dalo 
        req.user = data; // use data ko yaha se ham send kar rahe hai 
        next();
    } catch (err) {
        res.send("invalid token");
    }
}


app.listen(3000);


