var express = require('express');
var app = express();
const bodyParser = require('body-parser')

const path = require('path');
const sql = require('mssql');
const connstr = "Data Source=biz1server.database.windows.net;Initial Catalog=biz1pos;Persist Security Info=True;User ID=dbadmin;Password=B1zd0m##;MultipleActiveResultSets=True"

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

app.post('/generatereport', (req, res) => {
    console.log(req.body)
    const b = req.body
    sql.connect(connstr, (err1) => {
        if(err1) {
            res.send({status: 0, data: [], msg: "failed to connect db."})
        }
        var request = new sql.Request();
        request.query(`exec dbo.qwertyuiop ${b["0"]}, ${b["5"]}, ${b["12"]}, ${b["18"]}`, (err2, recordset) => {
            if(err2) {
                console.log(`exec dbo.qwertyuiop ${b["0"]} ${b["5"]} ${b["12"]} ${b["18"]}`, err2)
                res.send({status: 0, data: [], msg: "failed to execute query."})
            }
            res.send({status: 200, msg: "success", data: recordset.recordset})
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