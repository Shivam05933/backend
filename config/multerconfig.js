const crypto = require('crypto')
const path = require('path')
const multer = require("multer")


// diskStorage Setup
const storage = multer.diskStorage({ // es pure content se am log image ko save karvate hai filename ke sath //aur ham log ye diskstorage pe save kar rahe hai 
    destination: function(req, file, cb){ // destination -> kaha pe image store hone vala hai 
        cb(null, './public/image/uploads')
    },
    filename: function(req, file, cb){ // filename -> file ka name set kar rahe hai 
        crypto.randomBytes(12, function(err, name){ // ye hame randomBytes dega hame 12 set kiya hai 
            const fn =  name.toString("hex") + path.extname(file.originalname) // bytes.toString("hex")=> random name / path.extname(file.originalname)=> .jpg , .jpeg etc file extention gives
            cb(null, fn)
        })   
    }
})

// Export upload variable
const upload = multer ({ storage:storage });

module.exports = upload; 