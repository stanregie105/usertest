const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");
const cors = require("cors");
const userRoute = require("./server/routes/userRoutes");
const globalErrorHandler = require("./server/controllers/errorController");
//const vehicleRoute = require('./server/routes/vehicleRoutes');
//const orderRoute = require('./server/routes/orderRoutes');
//const talkRoute = require('./server/routes/talkRoutes');
const mongoose = require("mongoose");

//const bodyParser = require("body-parser")




// Start express app
const app = express();

app.enable("trust proxy");




// Serve static files from the React app
/*
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));

  app.get("*", (req, res) => {
   res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "client/public/index.html"));
});
*/

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful!"));

// 3) ROUTES
app.use("/api/v1/users", userRoute);
//app.use("/api/v1/vehicles", vehicleRoute);
//app.use("/api/v1/order", orderRoute);
//app.use("/api/v1/talk", talkRoute);
app.post('/payment', (req, res)=>{
  const body ={
      source: req.body.token.id,
      amount: req.body.amount,
      currency: 'usd'
  };

  stripe.charges.create(body,(stripeErr, stripeRes)=>{
      if(stripeErr){
          res.status(500).send({ error: stripeErr});
      }

      res.status(200).send({ success: stripeRes});
  });
});

// Serving static files
app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV === "production") {
  // Set static folder
  // Serving static files
  app.use(express.static(path.join(__dirname, "client/build")));
  // app.use(express.static("client/build"));
  app.use('*', express.static(path.join(__dirname, "client", "build")));
   //app.get("*", (req, res) => {
    //res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
   //});
}





app.use(compression());

// 1) GLOBAL MIDDLEWARES
// Implement CORS
app.use(cors());
// Access-Control-Allow-Origin *
// api.natours.com, front-end natours.com
// app.use(cors({
//   origin: 'https://www.natours.com'
// }))

app.options("*", cors());
// app.options('/api/v1/tours/:id', cors());



// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());



app.use(globalErrorHandler);

module.exports = app;
