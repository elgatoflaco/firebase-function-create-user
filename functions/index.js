const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
admin.initializeApp(functions.config().firebase);
const firestore = admin.firestore();
const app = express();
app.use(cors({ origin: true }));

app.get("/", function(req, res) {
  res.send("Hello World!");
});

app.post("/new-user", function(req, res) {
  console.log(req);
  admin
    .auth()
    .createUser({
      email: req.body.email,
      emailVerified: true,
      password: req.body.password,
      displayName: req.body.username,
      disabled: false,
      roles: {}
    })
    .then(function(userRecord) {
      // console.log("Successfully created new user:", userRecord.uid);
      firestore
        .collection("users")
        .doc(userRecord.uid)
        .set(
          {
            uid: userRecord.uid,
            username: req.body.username,
            email: req.body.email,
            roles: {}
          },
          { merge: true }
        )
        .then(function() {
          console.log("Document successfully written!");
        })
        .catch(function(error) {
          console.error("Error writing document: ", error);
        });
    })
    .catch(function(error) {
      console.log("Error creating new user:", error);
    });

  res.send("Hello World!");
});

exports.create_user = functions.https.onRequest(app);
