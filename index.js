console.log("File index.js loaded successfully");

// load dependencies
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
require("dotenv").config();

// load passport-dependencies
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

// load database objects
const dbObjects = require(__dirname + "/model/dbObjects.js");
//require(__dirname + "/model/dbExerciseInit.js");

const Exercise = dbObjects.Exercise;
const Set = dbObjects.Set;
const Workout = dbObjects.Workout;
const FinishedWorkout = dbObjects.FinishedWorkout;
const finishedWorkoutSchema =  dbObjects.finishedWorkoutSchema;
const CurrentWorkout = dbObjects.CurrentWorkout;
const currentWorkoutSchema =  dbObjects.currentWorkoutSchema;
//const User = dbObjects.User;
//const userSchema = dbObjects.userSchema;
//const Post = dbObjects.Post;

// create and set up express.js app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");


// set up session
app.use(session({
    secret: process.env.SECRET, // stores our secret in our .env file
    resave: false,              // other config settings explained in the docs
    saveUninitialized: false
}));

// set up passport
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect("mongodb://localhost:27017/testdb",
    {
        useNewUrlParser: true, // these avoid MongoDB deprecation warnings
        useUnifiedTopology: true
    });

    const userSchema = new mongoose.Schema(
        {
            username: String,
            password: String,
            currentWorkouts: [currentWorkoutSchema],
            finishedWorkouts: [finishedWorkoutSchema]
            // weight: Number,  // optional
            // height: Number,  // extra
            // age: Number      // data
        });

    userSchema.plugin(passportLocalMongoose);
    const User = mongoose.model("User", userSchema);

    const postSchema = new mongoose.Schema(
        {
            _id: Number,
            creator: userSchema,
            content: String,
            title: String
            // date_posted: Date // replaceable with mongoDB getTimestamp() method
        });
    const Post = mongoose.model("Post", postSchema);


// create a strategy for storing users with Passport
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const port = 3000;
app.listen(port, function() {
    console.log("Server is running on port " + port);
});

app.post("/register", function(req, res) {
    console.log("Registering a new user");
    // calls a passport-local-mongoose function for registering new users
    // expect an error if the user already exists!
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/")
        } else {
            // authenticate using passport-local
            // what is this double function syntax?! It's called currying.
            passport.authenticate("local")(req, res, function(){
                res.redirect("/landing")
            });
        }
    });
});

app.post("/login", function(req, res) {
    console.log("A user is logging in")
    // create a user
    const user = new User ({
        username: req.body.username,
        password: req.body.password
     });
     // try to log them in
    req.login (user, function(err) {
        if (err) {
            // failure
            console.log(err);
            res.redirect("/")
        } else {
            // success
            // authenticate using passport-local
            passport.authenticate("local")(req, res, function() {
                res.redirect("/landing"); 
            });
        }
    });
});

app.get("/logout", function(req, res){
    console.log("A user logged out")
    req.logout();
    res.redirect("/");
})

// this function doesn't work, currentWorkouts is undefined
app.post("/addWorkout", function(req, res){
      User.find(
        {username: req.user.username},
        function(err, result){
        if (err) {
           console.log(err);
        } else {
       console.log(result.currentWorkouts);
        result.currentWorkouts.push({workout_id:req.body.workoutId})
       
       res.redirect("/landing");
        }
    });
});


app.get("/", function (request, response) {
    response.redirect("/login");
});

app.get("/landing", function (request, response) {
    response.render("landing");
});

app.get("/exercises", function (request, response) {
    
    const exerciseList = [];

    Exercise.find({}, (err, Exercises) => {
        if (err) {
            console.log(err);
        } else {
            Exercises.forEach((Exercise) => {
                exerciseList.push(Exercise);
            })
            console.log(exerciseList);
            
        }
    response.render("exercises", {exercises: exerciseList});
});
    
});

app.get("/workouts", function (request, response) {

    const workoutList = [];

    Workout.find({}, (err, Workouts) => {
        if (err) {
            console.log(err);
        } else {
            Workouts.forEach((Workout) => {
                workoutList.push(Workout);
            })
        }
    response.render("workouts", {workouts: workoutList});
});

});

app.get("/workoutBuilder", function (request, response) {
    response.render("workoutBuilder");
});


app.get("/forum", function (request, response) {
    const forumList = [];

    Post.find({}, (err, Posts) => {
        if (err) {
            console.log(err);
        } else {
            Posts.forEach((Post) => {
                forumList.push(Post);
            })       
        }
        console.log(forumList.length);
    response.render("forum", {posts: forumList}); 
});
});

app.post("/addToForum", function(req, res){
    console.log(req.body.numberOfPosts);
    res.render("newPost", {numberOfPosts: req.body.numberOfPosts, username: req.user.username});
});


app.post("/postIt", function(req, res){
 var postContent = req.body.postContent;
 var postTitle = req.body.postTitle;
 var creatorOfPost = req.user;
 var id = req.body.postId++;

 Post.create({
     _id: id,
     creator: creatorOfPost,
     content: postContent,
     title: postTitle
 }, function(){
     res.redirect("/forum");
 })
});




app.get("/login", function (request, response) {
    response.render("login");
});

app.get("/logout", function (request, response) {
    // log user out
    response.redirect("/landing"); // TEMPORARY REDIRECTION
});

app.post("/logout", function (request, response) {
    response.redirect("/logout");
})