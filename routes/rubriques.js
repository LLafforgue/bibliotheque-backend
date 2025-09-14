var express = require('express');
var router = express.Router();
const {addRubrique, getRubriques, upDateNameRubriques, upDatePositions} = require('../controllers/rubriquesControllers');

router.post('/', addRubrique);

router.get('/', getRubriques);

router.put('/:id', upDateNameRubriques);

router.put('/', upDatePositions);

module.exports = router;
