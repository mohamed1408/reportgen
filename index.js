var express = require('express');
var app = express();
const bodyParser = require('body-parser')
const moment = require('moment')
const path = require('path');
const sql = require('mssql');
const retaildb = require('mssql')
const connstr = "Data Source=biz1server.database.windows.net;Initial Catalog=biz1pos;Persist Security Info=True;User ID=dbadmin;Password=B1zd0m##;MultipleActiveResultSets=True"
const retailconnstr = "Server=tcp:biz1server.database.windows.net,1433;Initial Catalog=biz1retaildb;Persist Security Info=False;User ID=dbadmin;Password=B1zd0m##;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
const axios = require('axios')
app.use(bodyParser.json());
app.use('/assets', express.static('assets'))

app.get('/', (req, res) => {
    const options = {
        root: path.join(__dirname)
    };
 
    res.sendFile('index.html', options, function (err) {
        if (err) {
            next(err);
        } else {
            console.log('Sent:', 'index.html');
        }
    });
})

const retaildbqr = (data, config) => {
    axios.post("http://localhost:6000/uploadreport", {
      data: data,
      config: config
    })
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
        console.log(error)
    });
}

app.post('/generatereport', (req, res) => {
    console.log("index.js line: 56", req.body)
    const b = req.body
    sql.connect(connstr, (err1) => {
        if(err1) {
            res.send({status: 0, data: [], msg: "failed to connect db.", error: err1})
            return
        }
        var request = new sql.Request();
        let query = `exec dbo.qwertyuiop ${b["0"]}, ${b["5"]}, ${b["12"]}, ${b["18"]}`
        console.log(query, b)
        request.query(query, (err2, recordset) => {
            if(err2) {
                console.log(`exec dbo.qwertyuiop ${b["0"]} ${b["5"]} ${b["12"]} ${b["18"]}`, err2)
                res.send({status: 0, data: [], msg: "failed to execute query.", error: err2})
                return
            }
            retaildbqr(recordset.recordset, b)
            res.send({status: 200, msg: "success", data: recordset.recordset, b})
        })
    })
})

app.get('/retaildbtest', (req, res) => {
    retaildb.connect(retailconnstr, (err) => {
        if(err) {
            res.send({status: 0, error: err})
            return
        }
        let query = `SELECT specific_name
                    FROM INFORMATION_SCHEMA.ROUTINES
                    WHERE ROUTINE_TYPE = 'PROCEDURE' order by specific_name asc;`
        let req = new retaildb.Request();
        req.query(query, (err2, recordset) => {
            if(err2) {
                res.send({status: 0, error: err2})
                return
            }
            res.send({status: 200, data: recordset.recordset})
        })
    })
})

var server = app.listen(5000, function () {
    console.log('Server url: http://localhost:' + server.address().port);
});

// const func = async () => {
//     try {
//         console.log("qwerty")
//         // make sure that any items are correctly URL encoded in the connection string
//         await sql.connect('Data Source=biz1server.database.windows.net;Initial Catalog=biz1pos;Persist Security Info=True;User ID=dbadmin;Password=B1zd0m##;MultipleActiveResultSets=True')
//         const result = await sql.query`select * from sampledata`
//         console.log(result)
//     } catch (err) {
//         console.log(err)
//     }
// }

// func()
