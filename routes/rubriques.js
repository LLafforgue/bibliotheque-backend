var express = require('express');
var router = express.Router();
const {addRubrique, getRubriques, upDateNameRubriques} = require('../controllers/rubriquesControllers');

router.post('/', addRubrique);

router.get('/', getRubriques);

router.put('/:id', upDateNameRubriques);


module.exports = router;
