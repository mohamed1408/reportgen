var express = require('express');
var app = express();
const bodyParser = require('body-parser')
const moment = require('moment')
const path = require('path');
const sql = require('mssql');
const retaildb = require('mssql')
var cors = require('cors')
const retailconnstr = "Server=tcp:biz1server.database.windows.net,1433;Initial Catalog=biz1retaildb;Persist Security Info=False;User ID=dbadmin;Password=B1zd0m##;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

app.use(cors())
app.use(bodyParser.json());
app.use('/assets', express.static('assets'))

app.post('/uploadreport', (req, res) => {
    let data = req.body.data
    let config = req.body.config
    retaildb.connect(retailconnstr, (err) => {
        if(err) {return}
        var req = new retaildb.Request();
        let datetime = new Date()
        datetime.setDate(1)
        datetime.setMonth(new Date(config.date).getMonth()+1)
        datetime = moment(datetime).format('YYYY-MM-DDThh:mm:ss')
        let temptable  = ``
        data.forEach((dt, i) => {
            temptable += `select ${i+1} i, '${dt.product}' name, ${dt.price} price, ${dt.amount} amount, ${dt.gst} gst ${i==0 ? 'into #sampledata' : ''}\n`
            if(i < (data.length-1))
                temptable += `union all\n`
        })

        let query = `
        DECLARE @count int = 0, @top int = 0, @companyid int = 3, @amount float = 0, @price float = 0
        declare @data table(name nvarchar(max), gst float, spreadamt float, gstno nvarchar(max))
        SELECT @count = COUNT(i) FROM #sampledata
        WHILE @count > 0
        begin
          select @amount = amount, @price = case when price=0 then 1 ELSE price END FROM #sampledata WHERE i = @count
          SET @top = case when CAST(@amount/@price as int) in (0,1) THEN 1 ELSE CAST(@amount/@price as int) end
          if @top > 20
          begin
            set @top = 20
          end
          insert into @data(name, gst, spreadamt, gstno)
          select i.name, i.gst, s.percentage*i.amount/100, '${config.GSTNO}' from #sampledata i, dbo.spread(@top) s
          WHERE i = @count AND (s.percentage*i.amount/100) >= i.price
          set @count = @count - 1
        end

        INSERT into ordereditems(id, product, amount, tax1, tax2, companyid, rptdate, rptdatetime)
        SELECT newid(), name, d.spreadamt, d.gst/2, d.gst/2, c.id, '${config.date}', '${datetime}' FROM @data d
        join companys c on c.gstno = d.gstno
        order by newid() asc

        INSERT into items(name)
        SELECT DISTINCT name FROM #sampledata WHERE name NOT IN (SELECT name from items)

        insert into itemdetails(name, price, tax)
        SELECT name, price, gst from #sampledata WHERE name NOT IN (SELECT name from itemdetails)
        `

        req.query(temptable + query, (err2, recordset) => {
            if(err2) {
                console.log(temptable + query)
                console.log(err2)
                return
            }
            console.log(recordset)
        })
    })
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

var server = app.listen(6000, function () {
    console.log('Server url: http://localhost:' + server.address().port);
});
