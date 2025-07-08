const express = require('express');
const router = express.Router();
const messagecontroller=require('../controller/message')

router.get('/:user1/:user2', messagecontroller.getMessagesBetween);
router.put('/seen', messagecontroller.markMessagesAsSeen);

module.exports = router;
