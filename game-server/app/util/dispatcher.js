var crc = require('crc');

module.exports.dispatch = function(uid, connectors) {
    // console.log(uid);
	var index = Math.abs(crc.crc32(uid)) % connectors.length;
	return connectors[index];
};