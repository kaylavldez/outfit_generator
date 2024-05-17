process.stdin.setEncoding("utf8");
const path = require("path");
const express = require("express");

let app = express();
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(express.static('./'));
app.use(express.static('templates/'));
app.use(express.json());

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));

require("dotenv").config({path: path.resolve(__dirname, '.env')}); 
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = {db: "outfitGenerator", collection: "users"};
const {MongoClient, ServerApiVersion} = require('mongodb');

let currUser = "";
/****************************** WEBSERVER STARTS ******************************/
const portNumber = process.env.PORT || 10000;
const prompt = "Stop to shut down the server: \n";
app.listen(`${portNumber}`, () => {
    console.log(`Web server started and running at http://localhost:${portNumber}`);
    process.stdout.write(prompt);
});

process.stdin.on("readable", function () {
const input = process.stdin.read();
    if (input !== null) {
        const command = input.toString().trim();
        if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0);
        }
        process.stdout.write(prompt);
    }
});
/******************************** USER LOGS IN ********************************/
app.get("/", (req, res) => {
    res.render("login", {port: portNumber, msg: "login"})
});

app.post("/", async (req, res) => {
    const {username, password} = req.body;
    const user = await findUser(username);
    if (user && user.password === password) {
        currUser = user;
        res.redirect("/create");
    } else {
        /* user doesn't exist or wrong password */
        const msg = "please enter valid information"
        res.render("login", {port: portNumber, msg: msg});
    }
});
/******************************** USER SIGNS UP ********************************/
app.get("/signUp", (req, res) => {
    res.render("signUp", {port: portNumber, msg: "please enter a username and password"});
});

app.post("/signUp", async (req, res) => {
    const user = await findUser(req.body.username);
    if (user) {
        const msg = "this user already exists"
        res.render("signUp", {port: portNumber, msg: msg});
    } else {
        const newUser = {
            username: req.body.username,
            password: req.body.password,
            outfits: []
        }
        signUpUser(newUser);
        currUser = newUser;
        res.redirect("/create");
    }
});
/***************************** USER VIEWS CREATE *****************************/
app.get("/create", async (req, res) => {
    /* API included here */
    const result = await fetch('https://goweather.herokuapp.com/weather/College+Park');
    let temp = ""
    try {
        const json = await result.json();
        temp = json['temperature'];
    } catch (e) {
        temp = "status " + result['status'];
    }
    res.render("create", {temperature: temp});
});

app.post("/create", (req, res) => {
    console.log("HERE:", currUser);
    let newOutfit = {
        top: req.body.top,
        bottoms: req.body.bottoms,
        shoes: req.body.shoes,
        purse: req.body.purse,
    }
    saveOutfit(currUser.username, newOutfit).catch(console.error);
    res.end();
});
/*************************** MONGODB ASYNC FUNCTIONS ***************************/
async function findUser(username) {
    const client = new MongoClient(uri, {useNewUrlParser: true, 
                                         useUnifiedTopology: true, 
                                         serverApi: ServerApiVersion.v1});
    try {
        await client.connect();
        console.log("Finding user in database...");
        return await lookUp(client, databaseAndCollection, username);
    } catch (e) {
        console.error();
        return null;
    } finally {
        await client.close();
    }
}

async function lookUp(client, databaseAndCollection, username) {
    let filter = {username: username};
    const result = await client.db(databaseAndCollection.db)
                               .collection(databaseAndCollection.collection)
                               .findOne(filter);
    console.log(result);
    return result;
}

async function signUpUser(user) {
    const client = new MongoClient(uri, {useNewUrlParser: true, 
                                         useUnifiedTopology: true, 
                                         serverApi: ServerApiVersion.v1});
    try {
        await client.connect();
        console.log("Adding user to database...");
        await addUser(client, databaseAndCollection, user);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
  
async function addUser(client, databaseAndCollection, user) {
    const result = await client.db(databaseAndCollection.db)
                               .collection(databaseAndCollection.collection)
                               .insertOne(user);
    console.log(`User added with id: ${result.insertedId}`);
}

async function saveOutfit(username, newOutfit) {
    const client = new MongoClient(uri, {useNewUrlParser: true, 
                                         useUnifiedTopology: true, 
                                         serverApi: ServerApiVersion.v1});
    try {
        await client.connect();
        console.log("Adding outfit to user archives...");
        await addOutfit(client, databaseAndCollection, username, newOutfit)
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function addOutfit(client, databaseAndCollection, username, newOutfit) {
    let filter = {username : username};
    let update = {$push: {outfits: newOutfit}};
    const result = await client.db(databaseAndCollection.db)
                               .collection(databaseAndCollection.collection)
                               .updateOne(filter, update);
    console.log(`User archives modified: ${JSON.stringify(result)}`);
}