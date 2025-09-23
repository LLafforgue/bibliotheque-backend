const Rubrique = require('../models/rubriques');

exports.addRubrique = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ result: false, error: "Champ 'name' manquant" });
  }

  const user = req.user;

  const existing = await Rubrique.findOne({ name, user: user._id });
  if (existing) {
    return res.status(400).json({ result: false, error: `La rubrique '${name}' existe déjà` });
  }

  try {
    const rub = new Rubrique({
      name,
      user: user._id,
      position: (await Rubrique.countDocuments({ user: user._id })) + 1,
      liens: []
    });

    const saved = await rub.save();
    res.status(200).json({ result: true, data: saved });
  } catch (err) {
    console.error("Erreur d'enregistrement :", err);
    res.status(500).json({ result: false, error: "Erreur serveur" });
  }
};

exports.getRubriques = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(400).json({ result: false, error: "Utilisateur inexistant" });
  }

  try {
    const rubriques = await Rubrique.aggregate([
      { $match: { user: user._id } },
      {$lookup: {
      from: "liens", // Nom de la collection à joindre
      localField: "liens", // Champ dans la collection courante (ex: "authorId")
      foreignField: "_id", // Champ dans l'autre collection (ex: "_id" de l'auteur)
      as: "liens" // Nom du champ qui contiendra les résultats joints
      }},
      { $addFields: { number: { $size: '$liens' } } },
      { $sort: { position: 1 } }
    ]);

    res.status(200).json({ result: true, data: rubriques });
  } catch (err) {
    console.error("Erreur de lecture :", err);
    res.status(500).json({ result: false, error: "Erreur serveur" });
  }
};

exports.upDateNameRubriques = async (req, res) => {
  const { id } = req.params;
  console.log("ID de la rubrique à modifier :", id);

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ result: false, error: "Champ 'name' manquant" });
  }

  const user = req.user;
  try {
    const rub = await Rubrique.findOne({ _id: id, user: user._id });
    if (!rub) {
      return res.status(404).json({ result: false, error: "Rubrique inexistante" });
    }

    rub.name = name;
    const saved = await rub.save();
    res.status(200).json({ result: true, data: saved });
  } catch (err) {
    console.error("Erreur de modification :", err);
    res.status(500).json({ result: false, error: "Erreur serveur" });
  }
};

exports.upDatePositions = async (req, res) => {
  const user = req.user._id;
  const bodyData = req.body.data;
  
  if (bodyData.length > 1000) {
      return res.status(413).json({
          result: false,
          error: "Trop de données envoyées. La limite est fixée à 1000 éléments."
        });
    }
    console.log(bodyData[0]);
    
    const updates = bodyData.map(({ _id, position }) => ({
        updateOne: {
            filter: { user: user, _id: _id },
            update: { $set: { position } }
        }
    }));
    console.log(updates[0].update);

  try {
    const {modifiedCount, matchedCount } = await Rubrique.bulkWrite(updates);

    if (modifiedCount>0) {
      if (matchedCount === bodyData.length) {
        if (modifiedCount === bodyData.length) {
          return res.status(200).json({
            result: true,
            data: "Toutes les données ont bien été modifiées"
          });
        } else {
          return res.status(207).json({
            result: false,
            error: `${modifiedCount} données sur ${bodyData.length} modifiées`
          });
        }
      } else {
        return res.status(404).json({
          result: false,
          error: `${modifiedCount} données sur ${bodyData.length} non identifiées`
        });
      }
    } else {
      return res.status(500).json({
        result: false,
        error: "Modifications non réalisées"
      });
    }
  } catch (err) {
    return res.status(500).json({
      result: false,
      error: err.message || "Erreur serveur"
    });
  }
};
