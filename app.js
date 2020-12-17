const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const bodyParser = require('body-parser');
const session = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');
// const Userdetail = require("./models/Userdetail");
const { json } = require('body-parser');


require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
// app.use(express.urlencoded());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.use(session({
    secret: 'secret.',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/grootDB", { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = mongoose.model("User", userSchema);

const userdetailSchema = new mongoose.Schema({
    name: String,
    age: Number,
    dob: {
        type: Date,
        format: "%d-%m-%Y"
    },
    firstName: String,
    lastName: String,
    more: [{
        address1: {
        type: String
    },
        address2: {
        type: String
    },
        phoneno: {
        type: String
    },
        }]
});

const Userdetail = mongoose.model("Userdetail", userdetailSchema)

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
        clientID: process.env.APP_ID,
        clientSecret: process.env.APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets",
        //profileFields: ['id']

    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ['profile'] }));

app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/details');
    });

app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/details');
    });

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});


app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

app.post("/register", function(req, res) {
    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect("/details");
            });
        }
    });
});

app.post("/login", function(req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect("/details");
            });
        }
    });
});



app.post("/userdetail", async(req, res) => {
    try{
    const { name } = req.body;
    const { age } = req.body;
    const { dob } = req.body;
    const { firstName } = req.body;
    const { lastName } = req.body;
    const { more } = req.body;

    console.log(req.body);
    const userdetail = await Userdetail.create({
        name,
        age,
        dob,
        firstName,
        lastName,
        more
    });
    console.log(userdetail);
    return res.status(201).json(userdetail);
    }catch(error){
        return res.status(500).json({"error":error});
    }
});

app.get('/details', async (req, res) => {
    try {
        const userdetails = await Userdetail.find()
        if(userdetails){
            res.render("details", {userDetails: userdetails})
        }else{
            return res.status(404).json({});
        }
    } catch (error) {
        return res.status(500).json({"error":error})
    }
})


app.listen(3000, function() {
    console.log("Listening on port 3000");
});



