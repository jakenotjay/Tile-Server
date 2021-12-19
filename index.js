const express = require('express');
const app = express()
const https = require('https')
const Stream = require('stream').Transform;
const fs = require('fs');
const port = 5000;

// earth engine url here
const url = "";

function getTileUrl(coord, zoom) {
    let tileUrl = url
    .replace("{x}", coord.x)
    .replace("{y}", coord.y)
    .replace("{z}", zoom);

    console.log(
        `getting map url ${tileUrl}`
    );

    return tileUrl;
}

function getTile(coord, zoom) {

    var filename = `${coord.x}${coord.y}${zoom}.png`
    var url = getTileUrl(coord, zoom);
    

    return new Promise((resolve, reject) => {
        // check if file already exists
        // not sure this is working correctly yet
        try {
            if(fs.existsSync(filename)) {
                console.log("returning file that already exists", filename);
                resolve(filename);
            }
        } catch (error) {
            reject(error);
        }

        // if not get it
        https.request(url, (response) => {
            var data = new Stream();
        
            response.on('data', (chunk) => {
                data.push(chunk);
            });
    
            response.on('end', () => {
                fs.writeFile(filename, data.read(), (error) => {
                    if(error) {
                        reject(error);
                    }
                    resolve(filename)
                    console.log("file saved", filename)
                });
            });
        }).end();
    })
}


/**
 * Route path: /getTiles/:z/:x/:y
 * Request URL: http://localhost:3000/getTiles/1/2/3
 * req.params: {"z": 1, "x": "2", "y": 3}
 */
app.get('/getTiles/:z/:x/:y', (req, res) => {

    console.log("got the request with params", req.params)

    var coords = {
        x: req.params.x,
        y: req.params.y
    }

    var zoom = req.params.z

    getTile(coords, zoom).then((filename) => {
        // must specify root file location
        res.sendFile(filename, {root: __dirname}, (err) => {
            if(err) throw err
            console.log("sent response back for filename", filename);
        });
    }).catch((reason) => {
        console.error('Failed to get tile', reason);
    })
})

app.listen(port, () => {
    console.log(`Tile server listening at http://localhost:${port}`)
})