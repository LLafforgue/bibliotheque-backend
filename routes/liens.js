var express = require('express');
var router = express.Router();
const Lien = require('../models/liens');
const User = require('../models/users');
const Rubrique = require('../models/rubriques');
const {hasVideo} = require('../middlewares/hasVideo')
const pLimit = require('p-limit').default;; 

const limit = pLimit(5);



router.post('/', async (req, res) => {
  const { data } = req.body;
  const user = req.user._id;

  // Validations
  if (data.length > 1000) return res.status(400).json({result: false, error: "Too many items (max 1000)" });

  const emptyField = data.some(e => !e.href || !e.salles);
  if (emptyField) return res.status(400).json({result: false, error: "Empty field" });

  // Vérification des vidéos et sauvegarde des liens
  
  const promessesVerification = data.map(lien =>
    limit(async () => {
      try {
        const video = await hasVideo(lien.href);
        console.log('le retour de hasVideo', video)
        const nouveauLien = new Lien({
          href: lien.href,
          description: lien.description,
          video,
          motsClefs: lien.motsClefs,
          user,
        });
        console.log('le lien est ', nouveauLien)
        return await nouveauLien.save(); // Retourne le document sauvegardé (avec _id)
      } catch (error) {
        console.error(`Erreur pour ${lien.description || lien.href}:`, error.message);
        return null;
      }
    })
  );
    console.log('ok :', promessesVerification)

  try {
    const results = await Promise.allSettled(promessesVerification);
    const liensValides = results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);
    console.log('Liens valides:', liensValides.length);

    // Regroupe les _id des liens par salle
    const liensParSalle = {};
    data.forEach((lien) => {
      lien.salles.forEach((salle) => {
        if (!liensParSalle[salle]) liensParSalle[salle] = [];
        const lienSauvegarde = liensValides.find(l => l.href === lien.href);
        if (lienSauvegarde) {
          liensParSalle[salle].push(lienSauvegarde._id);
        }
      });
    });

    // Mise à jour des rubriques avec les _id
    const operationsBulk = Object.entries(liensParSalle).map(([salle, lienIds]) => ({
      updateOne: {
        filter: { name: salle, user },
        update: { $addToSet: { liens: { $each: lienIds } } },
      },
    }));
    await Rubrique.bulkWrite(operationsBulk);

    res.status(200).json({
      result:true,
      data:{
      liensValides: liensValides.length,
      sallesMisesAJour: Object.keys(liensParSalle).length,
      },
      message: "Liens traités avec succès",
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ result: false, error: "Erreur serveur" });
  }
});
  

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