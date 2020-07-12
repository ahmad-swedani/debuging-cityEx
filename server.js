'use strict'

/* dotenv */
require('dotenv').config();

/* this is librarys*/
////////////////////////////////////
/*express  */
const express = require('express');

/* who can touch my server */
const cors = require('cors');

/* superagent */
const superagent = require('superagent');

const pg = require('pg');



/////////////////////////////////////

const clint = new pg.Client(process.env.DBU_RL);


/*for get the port number if it not there it will take(3196) */
const PORT = process.env.PORT || 3000;

const app = express();

/*that mean any one can use my server(its will be open to every body) */
app.use(cors());

app.get('/', (req, res) => {
  res.status(200).send('it is work berfectlly')
});


/* http://localhost:3642/location?data=Lunnwood  */
app.get('/location', locatiomFun)  

function locatiomFun(req, res) {
  const city = req.query.city;
  // const locationData = require('./data/ location.json');
  // const locaData = new Location(city, locationData);
  let q =`SELECT * FROM LOCATIONS WHERE search_query ='${city}';`
  clint.query(q)
    .then(dbdata=>{
    if(dbdata.rows.length > 0){
            console.log('from database');

      res.status(200).json(dbdata.rows);
    }else{
      console.log('from APIs');


      let key = process.env.LOCATIONIQ_KEY;
      let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
      superagent.get(url)
        .then(geoData => {
          // console.log('inside superagent');
          // console.log(geoData.body);
          const locationData = new Location(city, geoData.body);
          // console.log(locationData);
          let q1 = `INSERT INTO locations(search_query,formatted_query,latitude,longitude) VALUES ($1, $2, $3, $4);`
          let safevalues =[locationData.search_query,locationData.formatted_query,locationData.latitude,locationData.longitude];
          clint.query(q1,safevalues)
          .then(dbdata=>{

            res.status(200).json(locationData);
          })
        });
      // console.log('after superagent');
    }

  

})


}


var ahmad=[];
function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
  ahmad.push(this);
}

app.get('/locationdata',(req,res)=>{
  let q=`SELECT * FROM locations;`;
  clint.query(q)
  .then(results=>{
    res.status(200).json(results.rows);
  })
  .catch (error => errorHandler(error));
})



app.get('/weather', (req, res) => {
  // const weatherData = require('./data/weather.json');
  // const nWeather = weatherData.data;

  let key = process.env.WEATHER_KEY;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${req.query.latitude}&lon=${req.query.longitude}&key=${key}`;

  superagent.get(url)
    .then(weatherData => {
      // console.log('inside superagent');
      // console.log(geoData.body);
      var notArrResult = [];
      // console.log(weatherData.data)
      // res.send(weatherData.body.data);

      weatherData.body.data.forEach((element,idx) => {
        if(idx < 8){
          let notResult= new Weather(element);
          notArrResult.push(notResult);

        }else{
          // console.log(idx)
        }
        // console.log(locationData);
      });
      res.status(200).json(notArrResult);
    });
});


// var notArrResult=[];
// console.log(weatherData.data)
// weatherData.data.forEach(element => {
//   let notResult= new Weather( element);
//   notArrResult.push(notResult);
//   console.log(notResult);
// });
// res.status(200).send(notArrResult);


function Weather(weatherData) {
  this.forecast = weatherData.weather.description;
  this.time = new Date(weatherData.datetime).toDateString();

}

////////////////////
app.get('/trails', (req, res) => {

  let key = process.env.TRAILS_KEY;
  let url = `http://www.hikingproject.com/data/get-trails?lat=${req.query.latitude}&lon=${req.query.longitude}&maxDistance=10&key=${key}`;

  superagent.get(url)
    .then(trailsData => {
   let arr = trailsData.body.trails.map(element => {
        let rR= new Trails(element);
        return rR;
      });
      res.status(200).json(arr);
    });
});

function Trails(trailsData) {
  this.name = trailsData.name;
  this.location = trailsData.location;
  this.length = trailsData.length;
  this.stars = trailsData.stars;
  this.star_votes = trailsData.starVotes;
  this.summary = trailsData.summary;
  this.trail_url = trailsData.url;
  this.conditions = trailsData.conditionStatus;
  this.condition_date = new Date(trailsData.conditionDate).toDateString();
  this.condition_time = new Date(trailsData.conditionDate).toTimeString();
}






// https://www.hikingproject.com/data/get-trails?lat=40.0274&lon=-105.2519&maxDistance=10&key=200828484-8e942c0cf63c9f3c879c0e7e976b713b
app.get('*', (req, res) => {
  res.status(404).send('Whoops(404)-something went wrong')
});

app.get((error, req, res) => {
  res.status(500).send('Sorry, something went wrong')
});


////////////////////////////////////////
clint.connect()
  .then(()=>{
  
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

})
