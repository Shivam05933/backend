const express = require('express');
const app = express();
const userModel = require('./models/user')
const postModel = require('./models/post')
const cookieParser = require("cookie-parser")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")


app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())


app.get('/', (req, res) => {
    res.render("index");
});

app.get('/login', (req, res) => {
    res.render("login");
});



app.post('/register', async (req,res)=>{
    let {email,password, username, name , age } = req.body; // D structuring 

    let user = await userModel.findOne({email}); // yaha pe user ko find kar rahe hai ki vo already registered to nahi hai na 
    if(user) return res.status(500).send("user already registered"); // agr hai to ye return karo

    bcrypt.genSalt(10, (err, salt)=>{    // user create kar rahe hai 
        bcrypt.hash(password , salt , async (err, hash)=>{
          let user = await  userModel.create({
                username,
                email, 
                age,
                name,
                password:hash
            });
         let token = jwt.sign({ email: email, userid: user._id }, "shhh");
        res.cookie("token", token);
        res.send("registered");
        })
    })



})

app.post('/login', async (req,res)=>{
    let {email,password } = req.body; // D structuring 

    let user = await userModel.findOne({email}); // yaha pe user ko find kar rahe hai ki vo already registered to nahi hai na 
    if(user) return res.status(500).send("user already registered"); // agr hai to ye return karo
    
    


})
 

app.listen(3000);


