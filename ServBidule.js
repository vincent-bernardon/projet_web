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
var blckUsed = false;
var nbJoueurs = 2;
var nbCDamier = 0;
var nbLDamier = 0;

app.get('/', (request, response) => {
    response.sendFile('ClientBidule.html', {root: __dirname});
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
        if(joueurs.length==0){
            socket.emit('PremierJ',nomJoueur);
        }
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

    socket.on('parametrage',data =>{
        console.log('entré dans parametrage');
        nbJoueurs=data.nbjoueurs;
        nbCDamier=data.nbCDamier;
        nbLDamier=data.nbLDamier;
        console.log(nbJoueurs+" "+nbCDamier+" "+nbLDamier);
        io.emit('paramatrageS', {'nbCDamier':nbCDamier, 'nbLDamier':nbLDamier});
    });

    socket.on('isSet', data=>{
        if(nbCDamier>0 && nbLDamier>0){
            io.emit('paramatrageS', {'nbCDamier':nbCDamier, 'nbLDamier':nbLDamier});
        }
    });

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
            socket.emit('message', 'Let me OUT!!!');
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
     *  fonction pour le pion
     * 
    */
   /*
    socket.on('pionS', data =>{
        if(jeton != -1){
            if(data.numJoueur == jeton){
                let position = data.numHexagone;
                if(position>=0 && position <121){
                    if(hex[position] == -1 || hex[position] == 0||hex[position] == 1||hex[position] == 2 || hex[position] == 3 ){
                        if(data.blocker){
                            if(data.compteBlck<=data.nbBlck){
                                blckUsed = true;
                                hex[position]=42;
                            }else{
                                socket.emit('message', 'Vous avez utilisé tout vos blockeurs!');
                            }
                        }else{
                            if(blckUsed){
                                socket.emit('message', 'Vous venez de jouer');
                                blckUsed = false;
                            }else{
                            hex[position] = jeton;
                            jeton++;
                                if(jeton == 2){ 
                                    jeton = 0;
                                }
                                else{
                                    socket.emit("message", "Emplacement deja pris");
                                }
                            }
                        }
                        console.log("Pion placé en "+position+" par "+data.numJoueur);
                        io.emit('pionC', {'numHexagone': data.numHexagone, 'numJoueur': data.numJoueur, 'blocker': data.blocker, 'compteBlck': data.compteBlck});
                        blckUsed = false;
                    }else{
                        socket.emit("message", "coordonnées pas bonne");
                    }
                }else{
                socket.emit("message", "pas a toi de jouer");
                }
            }else{
            socket.emit('message', 'Parti pas débuté');
            }
        }
    });*/
    socket.on('pionS', data =>{
        if(jeton != -1){
            if(data.numJoueur == jeton){
                let position = data.numHexagone;
                if(position>=0 && position <121){
                    if(hex[position] != 42){
                        if(data.blocker){ // rajouter que si on joue blocker, peux pas rejouer par la suite
                            hex[position]=42;
                        }else{
                            hex[position] = jeton;
                            jeton++;
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
