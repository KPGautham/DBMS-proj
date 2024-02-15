import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds=10;
env.config();

app.use(express.urlencoded({extended :true}));

app.use(session({
    secret : process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized : true,
    cookie:{
        maxAge: 1000*60*60*24
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));

const db = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE
  }).promise();
  


app.get("/", (req,res)=>{

    // let sql = 'SELECT * FROM SALESMAN;'
    // let [result] = await db.query(sql);
    // console.log(result);
    // result.forEach((i)=>{
    //     console.log(i);
    // });
    if(req.isAuthenticated()){
        res.render("home.ejs");
    } else{   
        res.render("login.ejs");
    }

});

app.get("/home",  (req,res)=>{
    if(req.isAuthenticated()){
        res.render("home.ejs");
    } else{   

        res.render("login.ejs");
    }
});

app.get("/login", (req, res)=>{
    res.render("login.ejs");
});

app.get("/register", (req,res)=>{
    res.render("register.ejs");
});

app.post("/login",passport.authenticate("local",{
    successRedirect:"/home",
    failureRedirect : "/login"
}));

app.post("/register", async (req,res)=>{

    const username = req.body.username;
    const password = req.body.password;

    try{
        const [checkResult] = await db.query("SELECT * FROM USER WHERE USERNAME = ? ", [username]) ;
        if (checkResult.length>0){
            req.redirect("/login");
        } else {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                  console.error("Error hashing password:", err);
                } else {
                  const [result] = await db.query(
                    "INSERT INTO user (username, password) VALUES (?, ?);",
                    [username, hash]
                  );
                  res.redirect("/login");
                  
                }
              });
        }
       // const hashedpassword = await bcrypt.hash(req.body.password, saltRounds);

    } catch (err){
        console.log(err);

    }
});


passport.use(new Strategy(async function verify(username,password,cb) {

    try {
        const [result] = await db.query("SELECT * FROM user WHERE username = ? ", [
          username,
        ]);
        if (result.length > 0) {
          const user = result[0];
          console.log(user);
          const storedHashedPassword = user.PASSWORD;
          console.log(storedHashedPassword);
          console.log(password);
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              //Error with password check
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                //Passed password check
                return cb(null, user);
              } else {
                //Did not pass password check
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
}));

passport.serializeUser((user,cb)=>{
    cb(null,user);
});

passport.deserializeUser((user,cb)=>{
    cb(null,user);
});

app.listen(port, (req,res)=>{

    console.log(`Listening on port ${port}`);
});