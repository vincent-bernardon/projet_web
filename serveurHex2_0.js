const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server);

var joueurs = [] ;
var hex = [];
for (i=0; i<121; i++) {
    hex.push(-1);
}
var jeton = -1;
var dernierPion = -1;

app.get('/', (request, response) => {
    response.sendFile('clientHex2_0.html', {root: __dirname});
});

server.listen(8888, () => { 
    console.log('Le serveur écoute sur le port 8888'); 
});

io.on('connection', (socket) => {
    socket.on('test', data => {
        console.log("Message reçu d'un client");
        socket.emit('test', {'quiterepond': 'le serveur !'})
    });

    function reset(){
        jeton = -1;
        dernierPion = -1;
        joueurs = [] ;
        hex = [];
        for (i=0; i<121; i++) {
            hex.push(-1);
        }
    }
    socket.on('reset', reset);

    socket.on('entree', nomJoueur => {
        console.log("arrivage de "+nomJoueur);
        if(joueurs.length<2){
            if(!joueurs.includes(nomJoueur)){
                console.log("entree du joueur");
                console.dir("entree du joueur");
                joueurs.push(nomJoueur);
                if(joueurs.length == 2 && dernierPion == -1){
                    jeton = 0;
                }
                let nomsJoueurs = joueurs.join(' ');
                socket.emit('entree',{'nomJoueur':nomJoueur, 'numJoueur':joueurs.length-1, 'nomsJoueurs':nomsJoueurs});
                if(joueurs.length > 1){
                    socket.broadcast.emit('entreeAutreJoueur', {'nomJoueur':nomJoueur,'nomsJoueurs':nomsJoueurs});
                }
            }else{
                console.log("mission failed : entree du joueur");
                socket.emit('message', 'Joueur déja enregistré');
            }
        } else{
            socket.emit('message', 'Déja deux joueur');
        }
    });

    socket.on('pion', data =>{
        if(jeton != -1){
            if(data.numJoueur == jeton){
                let position = data.numHexagone;
                if(position>=0 && position <121){
                    if(hex[position] == -1){
                        hex[position] = jeton;
                        jeton++; 
                        if(jeton == 2){ 
                            jeton = 0;
                        }
                        console.log("Pion palcé en "+position+" par "+data.numJoueur);
                        io.emit('pion', {'numHexagone': data.numHexagone, 'numJoueur': data.numJoueur}); //faire le io sinon que le client qui est aucourant
                    }else{
                        socket.emit("message", "Emplacement deja pris");
                    }
                }else{
                    socket.emit("message", "coordonnées pas bonne");
                }
            }else{
                socket.emit("message", "pas a toi de jouer");
            }
        }else{
            socket.emit('message', 'Parti pas débuté');
        }
    });
});