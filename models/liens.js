const mongoose = require('mongoose');
const ALLOWED_DOMAINS = process.env.ALLOWED_TLDS.split(',').join('|')
const patern = new RegExp(
  `^https?://(?:[a-z0-9-]+\.)+?(?:${ALLOWED_DOMAINS})(?:\\/[^?#]*)?(?:\\?[^#]*)?(?:#.*)?$`,
  'i'
)

const lienSchema =  mongoose.Schema({

    href: {type:String, validate:{
        validator:function(value){
            return patern.test(value);
        },
        message : function(obj){
            console.log(obj.value)
            const arrRegExp = [ {name:"needs https?://", regExp:/^https?:\/\//},
                                {name:"needs no whitespace", regExp:/\S+/},
                                {name:"domaine value not expected", regExp:new RegExp(`\\.(${ALLOWED_DOMAINS})$`,'i')}]
            const err = arrRegExp.filter(el=>!el.regExp.test(obj.value)).map(el=>el.name);
            return `Not a validated url beacuse of :'${err}'`
        } 
    }},
    description: String,
    motsClefs: [{type: String}],
    createdAt: {type: Date, default: Date.now },
    clicNum: {type: Number, default:0},
    user: {type: mongoose.Schema.Types.ObjectId, ref:'users'},
    video : {type:Boolean, default:false},
    favoris: {type:Boolean, default:false},

})

const Lien = mongoose.model('liens', lienSchema);

module.exports = Lien;