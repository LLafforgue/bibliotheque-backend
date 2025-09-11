var express = require('express');
var router = express.Router();
const uid2 = require('uid2');
const fetch = require('node-fetch');
const Lien = require('../models/liens');
const User = require('../models/users');
const Rubrique = require('../models/rubriques');
const {checkToken} = require('../middlewares/auth')


const { JSDOM } = require('jsdom');

// POST /api/liens
router.post('/', checkToken, async (req, res) => {
  const { href, rubrique, description} = req.body; //token ou reader ?
  const rub = await Rubrique.findOne({name:rubrique})
  if (!href || !rubrique) {
    return res.status(400).json({ error: 'Empty field' });
  }
  if(rub){
    let videoDetected = false;
    let title = 'undefined';
    try {
      const response = await fetch(href, { timeout: 5000 });
      if (!response.ok) {
        throw new Error('Lien inaccessible');
      }
      
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      title = document.title;
      
      // Recherche de vidéo : <video>, iframe YouTube, Vimeo, etc.
      const hasVideo = document.querySelector('video') ||
                      document.querySelector('iframe[src*="youtube"]') ||
                      document.querySelector('iframe[src*="vimeo"]');

      if (hasVideo) videoDetected = true;
    } catch (error) {
      console.warn('Analyse échouée :', error.message);
      // On peut quand même enregistrer le lien, sans marquer la vidéo
    }

    try {
      const lien = new Lien({
        href: href.toLowerCase(),
        rubrique:rub._id,
        description: description||title,
        reader: req.user._id,
        video: videoDetected
      });

      const saved = await lien.save();
      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur: '+err });
    }
  }else{
    return res.status(400).json({error:'rubrique does not exist'})
  }
});

//Récupérer l'ensemble des liens d'un user
router.get('/:token', checkToken, async (req, res)=>{
  
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