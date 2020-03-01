"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var dns = require("dns");
var btoa = require("btoa");
var atob = require("atob");

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.DB_URI);
mongoose.connect(
  process.env.DB_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => {
    if (mongoose.connection.readyState) return console.log("Connected to db");
    else {
      return console.log("Error connecting!");
    }
  }
);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

var Schema = mongoose.Schema;

var countersSchema = new Schema({
  _id: { type: String, required: true },
  count: { type: Number, default: 0 }
});
var Counter = mongoose.model("Counter", countersSchema);

var urlSchema = new Schema({
  url: '',
  created: ''
});



var URL = mongoose.model("URL", urlSchema);

URL.remove({}, () => {
  console.log("URL collection removed");
});
Counter.remove({}, () => {
  console.log("Counter collection removed");
  var counter = new Counter({ _id: "url_count", count: 1 });
  counter.save(err => {
    if (err) return console.log(err);
    console.log("counter inserted");
  });
});

app.post("/api/shorturl/new", (req, res) => {
  let url = req.body.url;
  let dnsRegex = /^https?:\/\//i;
  let dnsURL = url.replace(dnsRegex, "");
  dns.lookup(dnsURL, (err) => {
    if (err) return res.json({ error: "invalid URL" });
    else {
      URL.findOne({ url: url }, (err, doc) => {
        if (doc) {
          console.log("entry found in db");
          res.json({ original_url: url, short_url: btoa(doc._id) });
        } else {
          console.log("entry NOT found in db, saving new");
          let dbUrl = new URL({
            url: url
          });
          dbUrl.save((err) => {
            if (err) return console.log(err);
            res.json({ original_url: url, short_url: btoa(dbUrl._id) });
          });
        }
      });
    }
  });
});

app.get("/api/shorturl/:hash", (req, res) => {
  let baseid = req.params.hash;
  let id = atob(baseid);
  let shortUrlRegex = /^https?:\/\//
  URL.findOne({ _id: id }, (err, doc) => {
    if (doc) {
      if (shortUrlRegex.test(doc.url) == false) {
        res.redirect("https://" + doc.url);
      }
      else {
        res.redirect(doc.url);
      }
    } 
    else {
      res.redirect("/");
    }
  });
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
