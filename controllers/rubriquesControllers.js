const Rubrique = require('../models/rubriques')

exports.addRubrique = async (req, res) =>{
    console.log(req.user)
    const {name} = req.body;
    if(!name) return res.status(400).json({result:'field missing'});

    const user = req.user;

    const existing = await Rubrique.findOne({ name, user: user._id });
    if (existing) {
    return res.status(400).json({ error: `Rubrique ${name} already exist` });
    }
    try{
        const rub = new Rubrique({
        name,
        user:user._id,
        position: (await Rubrique.countDocuments({user:user._id}))+1,
        liens : []
    })
    

    const saved = await rub.save()
    res.status(200).json({result:saved});
    }catch(err){
    console.error("Erreur d'enregistrement :", err);
    res.status(500).json({error:'Erreur serveur'})
    }
};

exports.getRubriques = async (req, res)=>{
        const user = req.user;
    if(!user) return res.status(400).json({error:'User inexistant'});   
    try{
        const rubriques = await Rubrique.aggregate([
            { $match: { user: user._id } },
            { $addFields: { number: { $size: '$liens' } } },
            { $project: { liens: 0 } }, 
            { $sort: { position: 1 } } 
        ]);
        
        res.status(200).json({result:true, data:rubriques});
    }catch(err){
        console.error("Erreur de lecture :", err);
        res.status(500).json({result:false, error:'Erreur serveur'})
    }
};

exports.upDateNameRubriques = async (req, res)=>{

    const {id} = req.params;
    console.log("ID de la rubrique à modifier :", id);
    const {name} = req.body;
    if(!name) return res.status(400).json({result:'field missing'});
    const user = req.user;
    try{
        const rub = await Rubrique.findOne({_id:id, user:user._id})
        if(!rub) return res.status(400).json({error:'Rubrique inexistante'});
        rub.name = name;
        const saved = await rub.save();
        res.status(200).json({result:saved});
    }catch(err){
        console.error("Erreur de modification :", err);
        res.status(500).json({error:'Erreur serveur'})
    }
};


