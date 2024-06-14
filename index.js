const express = require('express');
require('dotenv').config();
const Life360 = require('./life360');
const Database = require('./db')
const densityClustering = require('density-clustering');

const port = 80;
const app = express();
app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');

const dbConfig = {
    host: 'localhost',
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME,
};

app.get('/', async (req, res) => {
    try{
        // const people = await log.db.getAllPersonName();
        // res.render('home', {peopleList : people});
        //only put me on it for now
        res.render('home', {peopleList: ['ColinLi']})
    } catch(error){
        console.error(error);
    }
});

app.get('/map/:personId', async (req, res) => {
    const personId = req.params.personId;
    try {
        const points = await log.db.getAllData(personId);

        const data = points.map(point => [point.latitude, point.longitude]);
        const dbscan = new densityClustering.DBSCAN();
        const clusters = dbscan.run(data, 0.0005, 1); // make 2nd param lower for more clusters

        const representativePoints = clusters.map(cluster => {
            const latitudes = cluster.map(index => points[index].latitude);
            const longitudes = cluster.map(index => points[index].longitude);
            const centroidLatitude = latitudes.reduce((a, b) => a + b) / latitudes.length;
            const centroidLongitude = longitudes.reduce((a, b) => a + b) / longitudes.length;
            return { latitude: centroidLatitude, longitude: centroidLongitude };
        });

        res.render('map', { pointList: representativePoints, name: personId });
    } catch (error) {
        console.error(error);
    }
});

app.post('/update', async (req, res) => {
    const data = req.body;
    if(data == null){
        return;
    }
    const locData = data.locations[0];
    const deviceId = locData.properties.device_id
    const timestamp = locData.properties.timestamp;
    const epochTime = new Date(timestamp).getTime() / 1000;
    const lat = locData.geometry.coordinates[1];
    const long = locData.geometry.coordinates[0];
    logger.logData(deviceId, epochTime, lat, long);
});

class Logger{ 
    constructor(dbConfig){ 
        this.db = new Database(dbConfig); 
        this.insertCounter = 0;
    }; 

    getNameFromId(id){
        if(id == 3333) //temporary solution for now
            return "ColinLi";
    }

    //log location data into db
    async logData(deviceId, timestamp, lat, long){
        const name = this.getNameFromId(deviceId);
        try {
            await this.db.insertLocationData(name, lat, long, timestamp);
            console.log("TEST INSERT", lat, long, name, timestamp);
            this.insertCounter++;
            if(this.insertCounter >= 100){
                this.insertCounter = 0;
                console.log("Inserted data")
            }
        } catch(error){
            console.error('Error inserting location data:', error);
        }
    }
}

async function startServer() {
    try {
        app.listen(port, '0.0.0.0', () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch(error){
        console.error('Error initializing the database:', error);
    }
}
const logger = new Logger(dbConfig);
startServer();

