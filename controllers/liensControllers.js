const Lien = require('../models/liens');
const Rubrique = require('../models/rubriques');
const {hasVideo} = require('../middlewares/hasVideo')
const pLimit = require('p-limit').default;
const limit = pLimit(5);

exports.ajoutLiens = async (req, res) => {
const { data } = req.body;
  const user = req.user._id; // fourni par ton middleware d'auth

  try {
    // Vérification des vidéos et sauvegarde des liens
    const promesses = data.map((lien) =>
      limit(async () => {
        try {
          const video = await hasVideo(lien.href);

          const nouveauLien = new Lien({
            href: lien.href,
            description: lien.description || "",
            video,
            motsClefs: lien.motsClefs || [],
            user,
          });

          return await nouveauLien.save();
        } catch (error) {
          console.error(`Erreur lors du traitement de ${lien.href}:`, error.message);
          return { error: true, href: lien.href, message: error.message };
        }
      })
    );

    const results = await Promise.allSettled(promesses);

    // Séparation succès / erreurs
    const liensSauvegardes = [];
    const erreurs = [];

    results.forEach((r) => {
      if (r.status === "fulfilled") {
        if (r.value && !r.value.error) {
          liensSauvegardes.push(r.value);
        } else if (r.value?.error) {
          erreurs.push(r.value);
        }
      } else {
        erreurs.push({ error: true, message: r.reason?.message || "Unknown error" });
      }
    });

    // Indexation rapide par href
    const mapLiens = new Map(liensSauvegardes.map((l) => [l.href, l]));

    // Regroupe les _id des liens par salle
    const liensParSalle = {};
    data.forEach((lien) => {
      lien.salles.forEach((salle) => {
        const lienSauvegarde = mapLiens.get(lien.href);
        if (lienSauvegarde) {
          if (!liensParSalle[salle]) liensParSalle[salle] = [];
          liensParSalle[salle].push(lienSauvegarde._id);
        }
      });
    });

    // Mise à jour des rubriques
    const operationsBulk = Object.entries(liensParSalle).map(([salle, lienIds]) => ({
      updateOne: {
        filter: { name: salle, user },
        update: { $addToSet: { liens: { $each: lienIds } } },
        upsert: true, // au besoin : crée la rubrique si elle n'existe pas
      },
    }));

    if (operationsBulk.length > 0) {
      await Rubrique.bulkWrite(operationsBulk);
    }

    // Réponse
    res.status(200).json({
      result: true,
      data: {
        liensSauvegardes: liensSauvegardes.length,
        erreurs: erreurs.length,
        sallesMisesAJour: Object.keys(liensParSalle).length,
      },
      erreurs, // facultatif, à retirer si tu veux garder la réponse plus "light"
      message: "Liens traités avec succès",
    });
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({ result: false, error: "Erreur serveur" });
  }
};

exports.favoris = async (req, res) => {
  const { lienId } = req.params;  // Suppose que la route est définie avec `/:lienId`
  console.log(lienId)
  const userId = req.user?._id;

  try {
    const update = await Lien.updateOne(
      { user: userId, _id: lienId },
       [
        {
        $set: { favoris: { $not: ["$favoris"] } }
        }
       ]
    );

    if (update.matchedCount === 0) {
      return res.status(404).json({ result: false, error: "Lien non trouvé" });
    }

    if (!update.acknowledged) {
      return res.status(500).json({ result: false, error: "Échec de la mise à jour" });
    }

    // Succès
    res.json({
      result: true,
      data: {
        matched: update.matchedCount > 0,
        modified: update.modifiedCount > 0,
        favoris: update.modifiedCount > 0 ? !req.body.favoris : undefined
      }
    });

  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({
      result: false,
      error: err.message.includes("Cast to ObjectId failed")
        ? "ID de lien invalide"
        : "Erreur serveur"
    });
  }
}
