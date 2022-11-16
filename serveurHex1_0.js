const { response } = require("express");
var express = require("express");
var app = express();
app.listen(8888);
app.get('/', function(request, response) { 
    response.sendFile("clientHex1_0.html", {root: __dirname});
});

app.get('/joueurs', function(request, response){
    response.json([]);
})