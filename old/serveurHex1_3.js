const { response } = require("express");
var express = require("express");
var app = express();
app.listen(8888);
var joueurs = [] ;
var hex = [];
for (i=0; i<121; i++) {
    hex.push(-1);
}
var jeton = -1, dernierPion = -1;

app.get('/', function(request, response) { 
    response.sendFile("clientHex1_3.html", {root: __dirname});
});

app.get('/joueurs', function(request, response){
    response.json(joueurs);
});

app.get('/entree/:nomJoueur', (request, response)=>{
    let nomJoueur = request.params.nomJoueur;
    if(joueurs.length<2){
        if(!joueurs.includes(nomJoueur)){
            console.log("entree du joueur");
            joueurs.push(nomJoueur);
            response.json({joueurs:joueurs , erreur: ""}); 
        }else{
            console.log("mission failed : entree du joueur");
            response.json({joueurs:joueurs , erreur: "Joueur déja enregistré"});
        }
        
    } else{
        response.json({joueurs:joueurs , erreur: "partie full"});
    }
});

app.get('/sortie/:nomJoueur', (request, response)=>{
    let nomJoueur = request.params.nomJoueur;
    let index = joueurs.indexOf(nomJoueur);
    if(index != -1){
        joueurs.splice(index,1);
        response.json({joueurs:joueurs , erreur: ""});
    }else{
        response.json({joueurs:joueurs , erreur: "joueur inconnu"});
    }
});

app.get('/pion/:position/:numJoueur', (request, response)=>{
    if(jeton == -1){
        return response.json({message: "partie pas commencer"}); 
    }
    let numJoueur= request.params.position;
    if(numJoueur!=jeton){
        return response.json({message: "pas le bon tour"}); 
    }
    let position = parseInt(request.params.position);
    if(position<0 && position>121){
        return response.json({message: "coordonnées incorrectes"});
    }
    if(hex[position] != -1){
        return response.json({message: "deja pris"});
    }
    hex[position]=jeton;
    jeton++;
    if(jeton>=2){
        jeton = 0;
    }
    dernierPion = position;
    console.log("pion placé en "+position+" par "+joueurs[numJoueur]);
    return response.json({message: "Pion placé Marcel"+position});
});

app.get('/dernierPion', (request, response)=>{
    return response.json({
        joueur: hex[dernierPion],
        position: dernierPion
    });
});

app.get('/etatPartie', (request, response)=>{
    return response.json(hex);
});

app.get('/etatJeton', (request, response)=>{
    return response.json(jeton);
});

