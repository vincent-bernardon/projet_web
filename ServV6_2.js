const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = new require("socket.io")(server);

var joueurs = [] ;
var hex = [];
var messages = [];
var jeton = -1;
var dernierPion = -1;
var nbJoueurs = 2;
var nbCDamier = 0;
var nbLDamier = 0;

app.get('/', (request, response) => {
    response.sendFile('ClientV6_2.html', {root: __dirname});
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
        if(joueurs.length<nbJoueurs){
            if(!joueurs.includes(nomJoueur)){
                console.log("entree du joueur");
                console.dir("entree du joueur");
                joueurs.push(nomJoueur);
                if(joueurs.length == nbJoueurs && dernierPion == -1){
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
        nbJoueurs=Number(data.nbjoueurs);
        nbCDamier=Number(data.nbCDamier);
        nbLDamier=Number(data.nbLDamier);
        for (i=0; i<((nbLDamier)*(nbCDamier)); i++) {
            hex.push(-1);
        }
        console.log(nbJoueurs+" "+nbCDamier+" "+nbLDamier);
        io.emit('paramatrageS', {'nbCDamier':nbCDamier, 'nbLDamier':nbLDamier, 'nbjoueurs':data.nbjoueurs});
    });

    socket.on('isSet', data=>{
        if(nbCDamier>0 && nbLDamier>0){
            socket.emit('paramatrageS', {'nbCDamier':nbCDamier, 'nbLDamier':nbLDamier});
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
            socket.emit('sudC',nomJoueur);
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
        let ui = hex.length;
        hex = [];
        for (i=0; i<ui; i++) {
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
    socket.on('pionS', data =>{
        if(jeton != -1){
            if(data.numJoueur == jeton){
                let position = data.numHexagone;
                if(position>=0 && position <hex.length){
                    if(hex[position] != 42){
                        let casse = false;
                        if(data.blocker){ 
                            hex[position]=42;

                        }else if(data.explosif){
                            hex[position]=43;
                            jeton++;
                            if(jeton == nbJoueurs){ 
                                jeton = 0;
                            } 
                        }else if(hex[position] == 43){
                            hex[position]=-1;
                            casse = true;
                            jeton++;
                            if(jeton == nbJoueurs){ 
                                jeton = 0;
                            } 

                        }else{
                            hex[position] = jeton;
       
                            
                            debug = 1;
                            let dP = [];
                            let aP = [position];
                            console.log(dP + "   "+aP);
                            console.dir(dP + "   "+aP);
                            victoire(dP,aP,nord=false,sud=false,est=false,west=false);

                            jeton++;
                            if(jeton == nbJoueurs){ 
                                jeton = 0;
                            } 

                            console.log("Pion placé en "+position+" par "+data.numJoueur);
                            
                        }
                        io.emit('pionC', {'numHexagone': data.numHexagone, 'numJoueur': data.numJoueur, 'blocker': data.blocker, 'explosif':data.explosif, 'casse':casse});

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
     *  ---------------------------------
     *  fonctions pour la win
     * 
    */
    let debug =1;
    function victoire(dejaParcouru, aParcourir, nord, sud, est, west){
        console.log("dejaParcouru="+dejaParcouru + "   aParcourir="+aParcourir+"     nord="+nord + "   sud="+sud+ "   est="+est+ "   west="+west);
        console.dir("dejaParcouru="+dejaParcouru + "   aParcourir="+aParcourir+"     nord="+nord + "   sud="+sud+ "   est="+est+ "   west="+west);
        console.log('CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'+hex.length);
        console.dir('CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC');

        if(aParcourir.length == 0){
            console.log('NNNNNNNN');
            console.dir('NNNNNNNN');
            return 2;
        }
        if(debug > 0){
            console.log('STARTSTARTSTARTSTARTSTARTSTART');
            console.dir('STARTSTARTSTARTSTARTSTARTSTART');
            debug--;
        }
        

        aParcourir.reverse();
        let maPose = aParcourir.pop();
        aParcourir.reverse();

        
        if(!nord && maPose>=0 && maPose <nbCDamier){
            nord = true;
            console.log('nord ='+nord);
            console.dir('nord ='+nord);
        }
        if(!sud && maPose<=hex.length && maPose>=((hex.length)-(nbCDamier))){
            sud = true;
            console.log('sud ='+sud);
            console.dir('sud ='+sud);
        }
        if(!west && maPose%nbCDamier==0){
            west = true;
            console.log('west ='+west);
            console.dir('west ='+west);
        }
        if(!est && maPose%nbCDamier==(nbCDamier-1)){
            est = true;
            console.log('est ='+est);
            console.dir('est ='+est);
        }


        console.log('maPose-1='+(maPose-1)+'   maPose='+maPose+'  hex[maPose-1]='+hex[maPose-1]+"  hex[maPose]="+hex[maPose]);
        console.dir('maPose-1='+(maPose-1)+'   maPose='+maPose+'hex[maPose-1]='+hex[maPose-1]+"  hex[maPose]="+hex[maPose]);
        if(hex[maPose-1]==hex[maPose] && !dejaParcouru.includes(maPose-1) && !(maPose%nbCDamier==0)){
            aParcourir.push(maPose-1);
            console.log('51aParcourir ='+aParcourir);
            console.dir('51aParcourir ='+aParcourir);
        }
        console.log('maPose+1='+(maPose+1)+'   maPose='+maPose+'hex[maPose+1]='+hex[maPose+1]+"  hex[maPose]="+hex[maPose]);
        console.dir('maPose+1='+(maPose+1)+'   maPose='+maPose+'hex[maPose+1]='+hex[maPose+1]+"  hex[maPose]="+hex[maPose]);
        if(hex[maPose+1]==hex[maPose] && !dejaParcouru.includes(maPose+1) && !(maPose%nbCDamier==(nbCDamier-1))){
            aParcourir.push(maPose+1);
            console.log('52aParcourir ='+aParcourir);
            console.dir('52aParcourir ='+aParcourir);
        }
        console.log('maPose-(nbCDamier-1)='+(maPose-(nbCDamier-1))+'   maPose='+maPose+'hex[maPose-(nbCDamier-1)]='+hex[maPose-(nbCDamier-1)]+"  hex[maPose]="+hex[maPose]);
        console.dir('maPose-(nbCDamier-1)='+(maPose-(nbCDamier-1))+'   maPose='+maPose+'hex[maPose-(nbCDamier-1)]='+hex[maPose-(nbCDamier-1)]+"  hex[maPose]="+hex[maPose]);
        if(hex[maPose-(nbCDamier-1)]==hex[maPose] && !dejaParcouru.includes(maPose-(nbCDamier-1)) && !(maPose%nbCDamier==(nbCDamier-1))){
            aParcourir.push(maPose-(nbCDamier-1));
            console.log('53aParcourir ='+aParcourir);
            console.dir('53aParcourir ='+aParcourir);
        }
        console.log('maPose-(nbCDamier)='+(maPose-(nbCDamier))+'   maPose='+maPose+'hex[maPose-(nbCDamier)]='+hex[maPose-(nbCDamier)]+"  hex[maPose]="+hex[maPose]);
        console.dir('maPose-(nbCDamier)='+(maPose-(nbCDamier))+'   maPose='+maPose+'hex[maPose-(nbCDamier)]='+hex[maPose-(nbCDamier)]+"  hex[maPose]="+hex[maPose]);
        if(hex[maPose-(nbCDamier)]==hex[maPose] && !dejaParcouru.includes(maPose-(nbCDamier))){
            aParcourir.push(maPose-(nbCDamier));
            console.log('54aParcourir ='+aParcourir);
            console.dir('54aParcourir ='+aParcourir);
        }
        console.log('maPose+(nbCDamier-1)='+(maPose+(nbCDamier-1))+'   maPose='+maPose+'hex[maPose+(nbCDamier-1)]='+hex[maPose+(nbCDamier-1)]+"  hex[maPose]="+hex[maPose]);
        console.dir('maPose+(nbCDamier-1)='+(maPose+(nbCDamier-1))+'   maPose='+maPose+'hex[maPose+(nbCDamier-1)]='+hex[maPose+(nbCDamier-1)]+"  hex[maPose]="+hex[maPose]);
        if(hex[maPose+(nbCDamier-1)]==hex[maPose] && !dejaParcouru.includes(maPose+(nbCDamier-1)) && !(maPose%nbCDamier==0)){
            aParcourir.push(maPose+(nbCDamier-1));
            console.log('55aParcourir ='+aParcourir);
            console.dir('55aParcourir ='+aParcourir);
        }
        console.log('nbCDamier='+nbCDamier);
        console.dir('nbCDamier='+nbCDamier);
        let temp = maPose+Number(nbCDamier);
        console.log('temp='+temp);
        console.dir('temp='+temp);
        console.log('maPose+nbCDamier='+(maPose+nbCDamier)+'   maPose='+maPose+'hex[maPose+(nbCDamier)]='+hex[maPose+(nbCDamier)]+"  hex[maPose]="+hex[maPose]);
        console.dir('maPose+(nbCDamier='+(maPose+nbCDamier)+'   maPose='+maPose+'hex[maPose+(nbCDamier)]='+hex[maPose+(nbCDamier)]+"  hex[maPose]="+hex[maPose]);
        if(hex[maPose+(nbCDamier)]==hex[maPose] && !dejaParcouru.includes(maPose+(nbCDamier))){
            aParcourir.push(maPose+(nbCDamier));
            console.log('56aParcourir ='+aParcourir);
            console.dir('56aParcourir ='+aParcourir);
        }

        
        if((nord && sud)||(est && west)){
            console.log("VICTOIRE");
            console.dir("VICTOIRE");
            io.emit('victoire', {'qui':joueurs[jeton],'constance':0});
            jeton=-1;
            return 0;
        }else{
            dejaParcouru.push(maPose);
            victoire(dejaParcouru, aParcourir, nord, sud, est, west);
        }

    }

    

    socket.on('affiche', data=>{
        io.emit('softreset', {'num':data.numJoueur});
    });


    /**
     * 
     *  ----------------------------------
     * 
     */


});
