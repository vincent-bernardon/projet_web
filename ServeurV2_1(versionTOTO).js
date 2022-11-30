const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server);

var joueurs = [] ;
var hex = [];
var messages = [];
for (i=0; i<121; i++) {
    hex.push(-1);
}
var jeton = -1;
var dernierPion = -1;

app.get('/', (request, response) => {
    response.sendFile('ClientV2_1(versionTOTO).html', {root: __dirname});
});

server.listen(8888, () => { 
    console.log('Le serveur écoute sur le port 8888'); 
});

io.on('connection', (socket) => {
    socket.on('test', data => {
        console.log("Message reçu d'un client");
        socket.emit('test', {'quiterepond': 'le serveur !'})
    });

    /**
     *  ---------------------------------
     *  fonctions pour ADMIN
     * 
    */  
    function reset(){
        jeton = -1;
        dernierPion = -1;
        joueurs = [] ;
        hex = [];
        for (i=0; i<121; i++) {
            hex.push(-1);
        }
    }
    socket.on('resetS', reset);
    /**
     *  
     *  ----------------------------------
     * 
    */

    /**
     *  ---------------------------------
     *  fonctions pour actualiser
     * 
    */  
    socket.on('joueursS', () => {
        let nomsJoueurs = joueurs.join(' ');
        socket.emit('joueursC', nomsJoueurs);
    });
    /**
     *  
     *  ----------------------------------
     * 
    */    

    /**
     *  ---------------------------------
     *  fonctions pour entrer dans la partie
     * 
    */  
    socket.on('entreeS', nomJoueur => {
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
                socket.emit('entreeC',{'nomJoueur':nomJoueur, 'numJoueur':joueurs.length-1, 'nomsJoueurs':nomsJoueurs});
                if(joueurs.length > 1){
                    socket.broadcast.emit('entreeAutreJoueurC', {'nomJoueur':nomJoueur,'nomsJoueurs':nomsJoueurs});
                }
            }else{
                console.log("mission failed : entree du joueur");
                socket.emit('message', 'Joueur déja enregistré');
            }
        } else{
            socket.emit('message', 'Déja deux joueur');
        }
    });
    /**
     *  
     *  ----------------------------------
     * 
    */

    /**
     *  ---------------------------------
     *  fonctions pour quitter la partie
     * 
    */ 
    socket.on('sortieS', nomJoueur =>{
        console.log("demande de sorti pour "+ nomJoueur);
        let index = joueurs.indexOf(nomJoueur);
        if(index != -1){
            joueurs.splice(index,1);
            let nomsJoueurs = joueurs.join(' ');
            socket.emit('sortieC',nomJoueur);
            io.emit('joueursC',nomsJoueurs);

            socket.broadcast.emit('choixContinu', index);

            if(index == 0){
                socket.broadcast.emit('switchNum', index);
            }
            
        }else{
            socket.emit('message', 'Joueur peu pas sortire');
        }
    });
    /**
     *  
     *  ----------------------------------
     * 
    */

    /**
     *  ---------------------------------
     *  fonctions pour la popup
     * 
    */
    socket.on('softresetS', data =>{
        jeton = 0;
        dernierPion = -1;
        hex = [];
        for (i=0; i<121; i++) {
            hex.push(-1);
        }

    });
    /**
     *  
     *  ----------------------------------
     * 
    */

    /**
     *  ---------------------------------
     *  fonction pour la popup
     * 
    */
    socket.on('pionS', data =>{
        if(jeton != -1){
            if(data.numJoueur == jeton){
                let position = data.numHexagone;
                if(position>=0 && position <121){
                    /*if(hex[position] == 3){
                        socket.emit("message", "Case bloqué");
                    }else{*/
                    if(hex[position] == -1){
                        if(data.blocker){
                            hex[position]=42;
                        }else{
                            hex[position] = jeton;
                            jeton++;                                            //Je n'ai pas encore mis le 'if' qui demande si l'hexagone est bloqué (j'ai un doute quand a où le mettre)
                            if(jeton == 2){ 
                                jeton = 0;
                            }
                            console.log("Pion placé en "+position+" par "+data.numJoueur);
                        }

                            io.emit('pionC', {'numHexagone': data.numHexagone, 'numJoueur': data.numJoueur, 'blocker': data.blocker});
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
    /**
     *  
     *  ----------------------------------
     * 
    */

    /**
     *  ---------------------------------
     *  fonctions pour le chat
     * 
    */ 
    socket.on('chat', data =>{
        let nomJoueur = joueurs[data.numJoueur];
        if(joueurs.indexOf(nomJoueur) != -1){
            let message = nomJoueur+" : "+data.message;
            if(messages.length > 3){
                messages.splice(3,1);   
            }
            messages.unshift(message);
            console.dir(messages);
            io.emit('chatrotation', messages);
        }else{
            socket.emit('message', 'peux pas écrire');
        }
    });
    /**
     *  
     *  ----------------------------------
     * 
    */

    /**
     *  ----------------------------------
     * Fonctions case bloquante           Basiquement c'est la fonction pion mais le pion quelle met est pas egale au type 0 mais 3 (à combiner avec un 'if' dans pion)
     * 
     */
    socket.on('nope',data =>{
        console.log("Bloqueur en attente");
        if(jeton != -1){
            if(data.numJoueur == jeton){
                let position = data.numHexagone;
                if(position>=0 && position <121){
                    if(hex[position] == -1||hex[position] !=42){ //mettre un "ou blocker"
                        if(data.bocker == true){
                            hex[position]=42;
                        }else{
                            hex[position] = jeton;
                            jeton++; 
                            if(jeton == 2){ 
                                jeton = 0; 
                            }
                        }
                        
                        console.log("Pion bloqueur mis en "+position+" par "+data.numJoueur);
                        io.emit('backNope', {'numHexagone': data.numHexagone, 'numJoueur': data.numJoueur});
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
    /**
     * 
     *  ----------------------------------
     * 
     */


});
