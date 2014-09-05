module.exports = Model(function() {
    'use strict';
    
    return {
        updateUrl: function(id, lastVersion, lastAid) {
            return this.where({ 'id': id }).update({
                'last_version': lastVersion,
                'last_version_aid': lastAid
            });
        }
    };
});
