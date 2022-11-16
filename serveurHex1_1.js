const { response } = require("express");
var express = require("express");
var app = express();
app.listen(8888);
var joueurs = [] ;
app.get('/', function(request, response) { 
    response.sendFile("clientHex1_0.html", {root: __dirname});
});

app.get('/joueurs', function(request, response){
    response.json(joueurs);
})

app.get('/entree/:nomJoueur', (request, respons)=>{
    let nomJoueur = request.params.nomJoueur;
    if(joueurs.length<2 && !joueurs.includes(nomJoueur)){
        joueurs.push(nomJoueur);
    } 
    response.json(joueurs);
})

app.get('/sortie/:nomJoueur', (request, respons)=>{
    let nomJoueur = request.params.nomJoueur;
    let index = joueurs.indexOf(nomJoueur);
    if(index != -1){
        joueurs.splice(index,1);
    } 
    response.json(joueurs);
})
