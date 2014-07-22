'use strict';

module.exports = Model(function() {
    return {
        updateUrl: function(id, lastVersion, lastAid) {
            return this.where({ 'id': id }).update({
                'last_version': lastVersion,
                'last_version_aid': lastAid
            });
        }
    };
});
