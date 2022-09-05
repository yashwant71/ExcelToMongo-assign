const dbconnect =require('./config/mongoconfig');
const mongodb =require('mongodb')
require("dotenv").config()
const xlsx = require('xlsx');
var fs = require('fs');
var express = require('express');
var app = express();
// var mongoose = require('mongoose');
var multer = require('multer');
var async = require('async');


var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/xlsx');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
var upload = multer({
    storage: storage
});

app.set('view engine', 'html'); //for app.render
app.engine('html', require('ejs').renderFile);
var params={}

//static folder  
app.use('/static', express.static('static')) // For serving static files=
app.use(express.urlencoded())

app.get('/', (req, res) => {
    res.render(__dirname + '/index.html',params);
});

// Upload excel file and import to mongodb
app.post('/uploadfile', upload.single("uploadfile"),(req, res) => {
    var filenamevar = req.file.filename;
    convertExcelFileToJsonUsingXlsx(__dirname + '/uploads/xlsx/' + req.file.filename, filenamevar);
    
    res.render(__dirname + '/thanks',params); 
});

// convertExcelFileToJsonUsingXlsx()
async function convertExcelFileToJsonUsingXlsx(filepathdata, filename) {
    // console.log()
    const file = xlsx.readFile(filepathdata);
    const sheetNames = file.SheetNames;
    const totalSheets = sheetNames.length;
    // Variable to store our data 
    let parsedData = [];
    // Loop through sheets
    for (let i = 0; i < totalSheets; i++) {
        // Convert to json using xlsx
        const tempData = xlsx.utils.sheet_to_json(file.Sheets[sheetNames[i]]);
        // Skip header row which is the colum names
        tempData.shift();
        // Add the sheet's json to our data array
        parsedData.push(...tempData);
    }
    // call a function to save the data in a json file
    return generateJSONFile(parsedData, filename);
}

async function generateJSONFile(parsedData, filename) {
    // console.log(filename)
    try {
        filename = filename.substr(0, filename.lastIndexOf("."))+ ".json";
        fs.writeFileSync('./uploads/json/' + filename, JSON.stringify(parsedData))
        var exceldata = fs.readFileSync('./uploads/json/' + filename)
        var exceldataparsed = JSON.parse(exceldata)
        var collectionname=filename.substr(0, filename.lastIndexOf("."))+Math.random();

        mongoadd(exceldataparsed,collectionname)
    } catch (err) {
        console.error(err)
    }
}   
async function mongoadd(exceldataparsed,collectionname,){
    const db= await dbconnect();
    col =db.collection(collectionname)

    async.eachSeries(exceldataparsed, function (event, callback) {
        async function somefunc(event){
            const result = await col.insertOne(event)
            console.log(result)
            callback()
        }
        somefunc(event)
    }, function(err){   
        if(!err){
            console.log("done insertion! in: ",collectionname);
            duplicate(col,deleteDuplicates)
        }
    });
}
function duplicate(col,callback){
    //for getting duplicates by email
    col.aggregate([{ $group: { 
    _id: { Email: "$Email"},
    count: { $sum:  1 },
    docs: { $push: "$_id" }
    }},
    { $match: {
    count: { $gt : 1 }}}]).toArray()
    .then(res=>{
        // console.log(res.length!=0)
        console.log(res)
        if(res.length!=0){
            var ids=res[0].docs
            // ids=JSON.stringify(ids);
            for(var i=0;i<ids.length-1;i++){
                // id=JSON.stringify(ids[i])    
                id=ids[i]
                callback(id,col)
            }
        }
        else{
            console.log("no duplicate email found")
        }
    })
}

async function deleteDuplicates(id,col){
    // {"_id": ObjectId(id)}
    const result =await col.deleteOne({"_id": new mongodb.ObjectId(id)})
    if(result.deletedCount===1){
        console.log("Successfully deleted one duplicate with id: .",id);
    } else {
      console.log("No documents matched the query. Deleted 0 documents.");
    }
}

var port = process.env.PORT || 4000;
app.listen(port, () => console.log('http://localhost:' + port + '/'));