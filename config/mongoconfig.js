require("dotenv").config()
const {MongoClient} = require('mongodb');
var databasename ='excelDB';

async function dbconnect(){
    const client = new MongoClient(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true }); 
    try {
        console.log('connecting...1')
        let result =await client.connect();
        console.log('connecting...2')
        return result.db(databasename);
    } catch (e) {
        console.error(e);
    } 
}
// dbconnect()
module.exports=dbconnect;

 