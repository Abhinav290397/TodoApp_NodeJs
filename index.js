const express = require('express');   //importing express.
const mongoose = require('mongoose'); //importing express.
require("dotenv").config();        //npm i dotenv - We put our important data inside .env file so that we can hide it from public.
const bcrypt = require('bcryptjs');  //npm i bcryptjs -> it a package which  is used to encrypt the password(password is visible in our db without this).
const session = require('express-session');     //npm i express-session connect-mongodb-session -> (This and below line is needed for session-based  auth)
const mongodbSession = require('connect-mongodb-session')(session); 
const {ObjectDb} = require('mongodb');

//file imports
const { userDataValidation, isEmailValidator } = require('./utils/authUtil');
const userModel = require('./Models/userModel');
const isAuth = require('./middleware/isAuthMiddleware');
const todoModel = require('./Models/todoModel');

//constants
const app = express();
const PORT = process.env.port || 8000 ;  //Way to access data from .env file.(It returns in form of string )
const MONGO_URI =  process.env.MONGO_URI; //Way to access data from .env file. //The password for my MongoDB is 7754,which we have write here(in the link generated bu mongoDB).
const store = new mongodbSession({
    uri: process.env.MONGO_URI,
    collection: "sessions"
})

//middlewares
app.set("view engine", "ejs"); //Setting the view enjine of express to ejs (view engine helps the express to render certain files on cliet side.) (ejs -> embeded Js syntax).
app.use(express.urlencoded({extended: true})); 
app.use(express.json()); 
app.use(session({
    secret: process.env.SECRET_KEY, //stores the session id.
    store: store, //store is telling the express session what is location of db.
    resave: false,
    saveUninitialized: false
}));
app.use(express.static("public")); //This will make the public folder as static and it will readble by the client.


// making db connection with mongoose.
mongoose.connect(MONGO_URI).then(() => {
    console.log("MongoDB connected succefully");
}).catch((err) => {
    console.log(err);
});


//APIs-

app.get("/", (req, res) => {
    return res.send('Server is running Good!!!!');
});

//register api.
app.get("/register", (req,res) => {
    return res.render("registerPage");  //render knows the views folder and the file in it so we dont need to import it or use .ejs extension.
});

app.post('/register-user', async(req, res) => {
    console.log(req.body);
    const{name, email, username, password} = req.body;

    //data validation-
    try{
        await userDataValidation({name, email, username, password});
    }
    catch(err){
        return res.status(400).json(err); //400 - client side error.
        //or we can write like this-
        /*return res.send({
            status: 400,
            message: "Data Invalid",
            err: err
        })*/
    }
    //If user(email) already exists.
    const userEmailExist = await userModel.findOne({email: email});
    if(userEmailExist){
        return res.send({
            status:400,
            message:"Email already exists"
        });
    }
    //If user(username) already exists.
    const userUsernameExist = await userModel.findOne({username: username}); //findOne() is the mongoose query.
    if(userUsernameExist){                       //In general way -> findOne({data in db: req.body.data})
        return res.send({
            status:400,
            message:"Username already exists"
        });
    }

    //Encrypting Password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT)); // bcrypt.hash(' your password', 10) -> 10 - It shows how strong password you want, higher the no. stronger stronger the password.
    console.log(hashedPassword);

    //store the data in db -  (refer usermodel file);
    //1.1st way to store the data in db
    /*const userDb = await userModel.create({
        name: name,
        email: email,
        username: username,
       password: password,
    })*/

   //2.2nd way to store the data in db.(both ways are good mostly used is 2nd).
    const userObj = new userModel({  //creating object of db memory.
        name: name,
        email: email,
        username: username,
        password: hashedPassword,
    });
    try{                                   //(db can throw error in saving the data so we have to try-catch)
        const userDb = await userObj.save(); //saving data
        console.log(userDb);
        return res.redirect("/dashboard");
        /*return res.send({
            status:"201",
            message: "Register Successfully...Yay!!",
            data: userDb
        });*/
        //or we can write this
        //return res.status(201).json({message:"Register Success", data:userDb})
    }
    catch(err){
        return res.send({
            status: 500, //500 db error (internal server error)
            message: "Internal server error",
            err: err
        })
    }
}); 

//login api.
app.get("/login", (req,res) => {
    return res.render("loginPage");
});

app.post("/login-user", async(req,res) => {
    console.log(req.body);

    const{loginId, password} = req.body;   //destructuring..it means loginId stores loginId comes from client-side, same for password.
    //loginId may contain either username or email

    if(!loginId || !password){  //loginId & password must be enter by user.
        return res.status(400).json("Missing Login credentials");
    }
    
    try{
        //1.find the user with loginId.(ether email or username)
        let userDb;     //userDb have all the info. about user.
        if(isEmailValidator({str: loginId})){ //this will check if the coming user id is email via this isEmailValidator fn.
            userDb = await userModel.findOne({email: loginId}); //findOne is the mongoose query.(In this this query compares the loginId with emails in db) In general way -> findOne({data in db: req.body.data})
        }
        else{                        //this will check if the coming user id is username.
            userDb = await userModel.findOne({username: loginId}); //(In this, this query compares the loginId with username in db)
        }
        if(!userDb){
            return res.status(400).json("User Not Fount..Pls Register first!!");
        }
        //2.compare thye password.
        const isMatch = await bcrypt.compare(password,userDb.password); //for encrypted password in db
        //const isMatch = password === userDb.password;  //for non-encrypted password in db
        console.log(isMatch);
        if(!isMatch){
            return res.status(400).json("password is incorrect");
        }

        //3.then add session based auth.
        //-First we want to store the session in db.
        req.session.isAuth = true;
        req.session.user = {
            userId: userDb._id,
            email: userDb.email,
            username: userDb.username,
        } 
        console.log(req.session);
        return res.redirect("/dashboard");
        /*return res.send({
            status:200,
            message: "Login Success!!!!"
        });*/
    }
    catch(err){
        return res.send({
            status: 500,
            message: "Internal server error",
            err: err
        });
    }
});

//Here we are making the API protected.(Dashboard page)
app.get('/dashboard', isAuth, (req, res) => {
    return res.render("dashboardPage");
});

//Now implementing the Logout api,
app.post("/logout", (req, res) => {
    req.session.destroy((err) => { //req.session has a inbuilt property named 'destroy', it  will logout the user and delete the session from db.
        if(err){
            return res.status(500).json(err);
        }
        return res.redirect("/login");
    })
})

//Creating APIs for todo's.(It should be protected API).
app.post("/create-item",isAuth, async(req, res) => {
    console.log("Wrangler",req.body);
    console.log("Rangerover....",req.session);

    const todoText = req.body.todo;
    const username = req.session.user.username;
    console.log("Cadillac...",req.session.user.username);

    //data validation.
    if(!todoText){
        return res.send({
            status: 400,
            message: "Missing Todo text",
        })
    }
    if(typeof todoText !== "string"){
        return res.send({
            status: 400,
            message: "Todo is not a text",
        })
    }
    
    //create an object and use obj.save method.
    const todoObj = todoModel({
        //schema : values coming from client side. 
        todo: todoText,
        username: username,
    });

    //save data(todo) in db using object.
    try{
        const todoDb = await todoObj.save();
        return res.send({
            status: 201,
            message: "Todo created succesfully",
            data: todoDb,
        });
    }
    catch(err){
       return res.send({
        status: 500,
        message: "Internal server error",
        err: err
       });
    }
});
 
//Now read the todo from the db. (/read-item?skip=10)
app.get("/read-item", isAuth, async(req, res) => {
    const SKIP = Number(req.query.skip) || 0;   //In this we are applying the pagination.
    const LIMIT = 5;
    const username = req.session.user.username;
    try{
        //const todoDb = await todoModel.find({ username: username}); //Here the unique factor is username,so we apply find query on username.find query(function) will return an array of objects,each object contain a todo created by that user.
        //console.log("Kwid",todoDb);

        //mongodb aggregate method.
        //pagination, match //The pagination we apply using mongoDb not using JS coding logic.
        const todoDb = await todoModel.aggregate([
            {
                $match : {username: username}
            },
            {
                $skip: SKIP //It defines how much todos/data you want to skip from starting.
            },
            {
                $limit: LIMIT //It defines how much of todos/data to be shown at a time.
            }
        ]);
        console.log(todoDb);
        if(todoDb.length === 0){ //todoDb is an array of objects contains todo created by user, If there is no todo created by user then its length = 0.
            return res.send({
                status: 204,//204 for no content
                message:"No Todos found"
            });
        }
        return res.send({
            status: 200,
            message: "Read success",
            data: todoDb
        })
    }
    catch(err){
        return res.send({
            status: 500,
            message: "Internal Server error",
            err:err
        });
    }
});

//Now we have to edit a todo
app.post("/edit-item", isAuth, async(req,res) => {
    const newData = req.body.newData; //the user enters the new data.
    const todoId = req.body.todoId;

    const usernameReq = req.session.user.username; //From session we get the username, that who is the person making this request. 
     
    console.log(newData, todoId);

    //data validation
    if(!todoId){
        return res.send({
            status: 400,
            message: "Missing Todo Id",
        });
    }
    if(!newData){
        return res.send({
            status: 400,
            message: "Missing Todo text",
        });
    }
    if(typeof newData !== "string"){
        return res.send({
            status: 400,
            message: "Todo is not a text",
        })
    }
    
    
    try{
        //find the todo from db.
        const todoDb = await todoModel.findOne({ _id: todoId});
        console.log(todoDb.username, usernameReq); //todoDb.username is the owner of todo and usernameReq wants to make thye change in todo.
        //ownership check
        if(todoDb.username !== usernameReq){
            return res.send({
                status: 403, //forbidden
                message: "Not allowed to edit the todo "
            })
        }
        //Now we have to update todo in db.
        const previousData = await todoModel.findOneAndUpdate(
            { _id: todoId}, //It is 1st parameter on basis of which we find the data.
            {todo: newData} // It is new data means whatever we want to update.
        );
        return res.send({
            status: 200,
            message: "todo updated successfully",
            data: previousData
        });
    }
    catch(err){
        return res.send({
            status: 500,
            message: "internal server error",
            err: err
        })
    }
});

app.post("/delete-item", isAuth, async(req, res) => {
    const todoId = req.body.todoId;
    const usernameReq = req.session.user.username; //Who is making the request.
    if(!todoId){
        return res.send({
            status: 400,
            message: "Missing todo id"
        });
    }
    try{
        //find todo from db
        const todoDb = await todoModel.findOne({_id: todoId});
        console.log(todoDb.username, usernameReq);
        //check for owner
        if(todoDb.username !== usernameReq){
            return res.send({
                status :403, //forbidden
                message: "Not allowed to delete todo"
            });
        }
        const previousData = await todoModel.findOneAndDelete({_id: todoId}); //It will find and delete the date , and return the deleted data. or we can use deleteOne()
        return res.send({
            status: 200,
            message: "Todo deleted successfully", 
            data: previousData
        })
    }
    catch(err){
        return res.send({
            status:500,
            message: "Internal server error",
            err: err
        })
    }

});

app.listen(PORT, () => {
    console.log(`Our Server is running at:${PORT}`);
    console.log(`http://localhost:${PORT}`);
});