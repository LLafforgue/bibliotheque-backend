var express = require('express');
var router = express.Router();
const {ajoutLiens, favoris} = require('../controllers/liensControllers')
const Lien = require('../models/liens');


//Ajouter un ou plusieurs liens
router.post('/', ajoutLiens);
  
//Mise à du statu de favoris d'un lien
router.put('/favoris/:lienId', favoris);
//Récupérer l'ensemble des liens d'un user
router.get('/', async (req, res)=>{
  
  try {

  const response = await Lien.find({reader:req.user._id})
                            .populate('rubrique')
                            .sort({ rubrique: 1, createdAt: 1 });
  res.status(201).json({liens:response});

  }catch{
  res.status(400).json({ error: 'Aucun lien'});
  }
  
});

module.exports = router;