var express = require('express');
var router = express.Router();
const Lien = require('../models/liens');
const User = require('../models/users');
const Rubrique = require('../models/rubriques');
const plimit = require('p-limit')
const {hasVideo} = require('../middlewares/hasVideo')


// POST /api/liens
// router.post('/', async (req, res) => {
//   const {data} = req.body; 
//   if (data.length>1000) res.status(400).json({result:false, error:'too many datas'});

//   const user = req.user._id;
//   //vérification des champs
//   const emptyField = data.some(e => !e.href || !e.salle );
//   if (emptyField) res.status(400).json({ error: 'Empty field' });
 
//   const sallesToSet = data.reduce((acc, lien) => {
//     lien.salles.forEach((salle) => {
//       let salleExist = acc.find((item) => item.salle === salle);
//       if (!salleExist) {
//         salleExist = { salle, liens: new Set() };
//         acc.push(salleExist);
//       }
//       salleExist.liens.add(lien.href); 
//     });
//     return acc;
//   }, []);

//   // Conversion des Sets en tableaux
//   const sallesToUpDate = sallesToSet.map((item) => ({
//     salle: item.salle,
//     liens: Array.from(item.liens),
//   }));
  

   
//   const limit = plimit(5)
//   //sauvegarde des liens et vérifications vidéo en parallèle    

//   const promessesVerification = data.map(lien =>
//     limit(async () => {
//       try {
//         const video = await hasVideo(lien.href);
//         const nouveauLien = new Lien({
//           href: lien.href,
//           description: lien.description,
//           video: video,
//           motsClefs:lien.motsClefs,
//           user:user
//         });
//         return nouveauLien.save();
//       } catch (error) {
//         console.error(`Erreur pour ${lien.description}:`, error);
//         return null;
//       }
//     })
//   );
//   const liensValides = (await Promise.all(promessesVerification)).filter(lien => lien !== null);
    
//   const operationsBulk = sallesToUpDate.map((lien) => ({
//     updateOne: {
//       filter: { name: lien.salle, user:user },
//       update: { $addToSet: { liens: lien.liens } },
//     },
//   }));

//   await Rubrique.bulkWrite(operationsBulk);

//   return { message: "Liens traités avec succès", liensValides };
//   });

router.post('/', async (req, res) => {
  const { data } = req.body;
  const user = req.user._id;

  // Validations
  if (data.length > 1000) return res.status(400).json({ error: "Too many items (max 1000)" });

  const emptyField = data.some(e => !e.href || !e.salles);
  if (emptyField) return res.status(400).json({ error: "Empty field" });

  // Vérification des vidéos et sauvegarde des liens
  const limit = plimit(5);
  const promessesVerification = data.map(lien =>
    limit(async () => {
      try {
        const video = await hasVideo(lien.href);
        const nouveauLien = new Lien({
          href: lien.href,
          description: lien.description,
          video,
          motsClefs: lien.motsClefs,
          user,
        });
        return await nouveauLien.save(); // Retourne le document sauvegardé (avec _id)
      } catch (error) {
        console.error(`Erreur pour ${lien.description || lien.href}:`, error.message);
        return null;
      }
    })
  );

  try {
    const liensValides = (await Promise.all(promessesVerification))
      .filter(lien => lien !== null);

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
      message: "Liens traités avec succès",
      liensValides: liensValides.length,
      sallesMisesAJour: Object.keys(liensParSalle).length,
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ error: "Erreur serveur" });
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