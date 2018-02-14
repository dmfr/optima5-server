/**
 * France (France) translation
 * By Rayane
 * for Recouveo SI
 */

Ext.define("Ext.locale.en.grid.filters.filter.Date", {
    override: "Ext.grid.filters.filter.Date",
    config: {
        fields: {
            lt: {text: 'Avant'},
            gt: {text: 'Après'},
            eq: {text: 'Le'}
        }
    },
    // Defaults to Ext.Date.defaultFormat
    dateFormat: null
});

Ext.define("Ext.locale.en.form.Basic", {
    override: "Ext.form.Basic",
    waitTitle: "Chargement..."
});

Ext.define("Ext.locale.en.grid.filters.filter.List", {
    override: "Ext.grid.filters.filter.List",
    loadingText: "Chargement..."
});

Ext.define("Ext.locale.en.grid.filters.filter.Number", {
    override: "Ext.grid.filters.filter.Number",
    emptyText: "Entrez un nombre..."
});

Ext.define("Ext.locale.en.grid.filters.filter.String", {
    override: "Ext.grid.filters.filter.String",
    emptyText: "Entrez le texte..."
});
