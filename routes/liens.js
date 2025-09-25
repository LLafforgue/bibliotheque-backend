var express = require('express');
var router = express.Router();
const {ajoutLiens, favoris, allFavoris} = require('../controllers/liensControllers')
const Lien = require('../models/liens');


//Ajouter un ou plusieurs liens
router.post('/', ajoutLiens);
  
//Mise à du statu de favoris d'un lien
router.put('/favoris/:lienId', favoris);

//Récupérer l'ensemble des liens favoris d'un user
router.get('/favoris', allFavoris);

module.exports = router;