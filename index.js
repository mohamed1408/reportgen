var express = require('express');
var app = express();
const bodyParser = require('body-parser')
const moment = require('moment')
const path = require('path');
const sql = require('mssql');
const retaildb = require('mssql')
const connstr = "Data Source=biz1server.database.windows.net;Initial Catalog=biz1pos;Persist Security Info=True;User ID=dbadmin;Password=B1zd0m##;MultipleActiveResultSets=True"
const retailconnstr = "Server=tcp:biz1server.database.windows.net,1433;Initial Catalog=biz1pos;Persist Security Info=False;User ID=dbadmin;Password=B1zd0m##;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
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
    retaildb.connect(retailconnstr, (err) => {
        if(err) {return}
        var req = new retaildb.Request();
        let datetime = new Date()
        datetime.setDate(1)
        datetime.setMonth(new Date(config.date).getMonth()+1)
        datetime = moment(datetime).format('YYYY-MM-DDThh:mm')
        let temptable  = ``
        data.forEach((dt, i) => {
            temptable += `select ${i+1} i, '${dt.product}' name, ${dt.price} price, ${dt.amount} amount, ${dt.gst} gst ${i==0 ? 'into #sampledata' : ''}\n`
            if(i < (data.length-1))
                temptable += `union all\n`
        })
        // console.log(temptable)
        let query = `
            exec dbo.datapopulate
        `
        req.query(temptable + query, (err2, recordset) => {
            if(err2) {
                console.log(err2)
                return
            }
            console.log(recordset)
        })
    })
}

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
            retaildbqr(recordset.recordset, b)
            res.send({status: 200, msg: "success", data: recordset.recordset, b})
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
