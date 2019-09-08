const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const router = express.Router();
const cors = require("cors");
admin.initializeApp(functions.config().firebase);
const firestore = admin.firestore();
const app = express();
var bodyParser = require("body-parser");
const path = require("path");
const os = require("os");
const fs = require("fs");
const Busboy = require("busboy");
const csv = require("csvtojson");
app.use(router);
app.use(bodyParser.json());

var whitelist = ["http://localhost:3000", "https://tudominio.com"];
var corsOptions = {
  origin: function(origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
};
router.use(cors(corsOptions));
// app.use(cors({ origin: true }));

router.get("/", function(req, res) {
  res.send("It´s works!");
});

router.post("/new-user", function(req, res) {
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

router.post("/csv", function(req, res) {
  if (req.method !== "POST") {
    // Return a "method not allowed" error
    return res.status(405).end();
  }
  const busboy = new Busboy({ headers: req.headers });
  let uploadData = null;

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    const filepath = path.join(os.tmpdir(), filename);
    uploadData = { file: filepath, type: mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on("finish", () => {
    csv()
      .fromFile(uploadData.file)
      .then(jsonObj => {
        console.log(jsonObj);
        jsonObj.map(function(usuario) {
          admin
            .auth()
            .createUser({
              email: usuario.email,
              emailVerified: true,
              phone: usuario.phone,
              password: usuario.password,
              displayName: usuario.username,
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
                    username: usuario.username,
                    phone: usuario.phone,
                    email: usuario.email,
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
        });
      });
    res.status(200).json({
      message: "It worked!"
    });
  });
  busboy.end(req.rawBody);
});

exports.create_user = functions.https.onRequest(app);
