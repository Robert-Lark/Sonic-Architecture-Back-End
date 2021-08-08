require("dotenv").config();
const Discogs = require('disconnect').Client;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors")

const port = process.env.PORT || 3001;
app.use(
  cors({
    origin: "*",
  })
);

mongoose.connect(process.env.DATABASE_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));

app.use(express.json());

const userRouter = require("./routes/userRoutes");


app.use("/user", userRouter);


app.get("/", (req, res) => {
	res.json({
		message: "Welcome to the API",
	});
});



//get Request Token


app.get('/authorize', (req, res) => {
	var oAuth = new Discogs().oauth();
	oAuth.getRequestToken(
		process.env.DISCOGS_API_KEY, 
		process.env.DISCOGS_API_SECRET, 
		'http://localhost:3000/dashboard', 
		function(err, requestData){
            
			// Persist "requestData" here so that the callback handler can 
			// access it later after returning from the authorize url
      if (typeof localStorage === "undefined" || localStorage === null) {
        var LocalStorage = require('node-localstorage').LocalStorage;
        localStorage = new LocalStorage('./scratch');
      }
            const serializedRequestData = JSON.stringify(requestData)
            localStorage.setItem("request", serializedRequestData)

			res.redirect(requestData.authorizeUrl);
		}
	);
});



// get access token

app.get('/callback', (req, res) => {
    let deserializedRequestData = JSON.parse(localStorage.getItem("request"))
	var oAuth = new Discogs(deserializedRequestData).oauth();
	oAuth.getAccessToken(
		req.query.oauth_verifier, // Verification code sent back by Discogs
		function(err, accessData){

      if (typeof localStorage === "undefined" || localStorage === null) {
        var LocalStorage = require('node-localstorage').LocalStorage;
        localStorage = new LocalStorage('./scratch');
      }

			// Persist "accessData" here for following OAuth calls 
            const serializedAccessData = JSON.stringify(accessData)
            localStorage.setItem("access", serializedAccessData)
			res.send('Received access token!');
		}
	);
});


// make the OAuth call

app.get('/identity', (req, res) => {
    let deserializedAccessData = JSON.parse(localStorage.getItem("access"))
	var dis = new Discogs(deserializedAccessData);
	dis.getIdentity(function(err, data){
		res.send(data);
	});
});




app.listen(port, () => console.log(`listening on port ${port}`))
