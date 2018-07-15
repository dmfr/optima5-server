/**
 * France (France) translation
 * By Rayane
 * for Recouveo SI
 */
Ext.onReady(function() {
	if (Ext.util && Ext.util.Format) {
		Ext.apply(Ext.util.Format, {
			thousandSeparator: ' ',
			decimalSeparator: ',',
			currencySign: '\u20ac',
			// French Euro
			dateFormat: 'd/m/Y'
		});
	}
});
Ext.define("Ext.locale.fr.grid.filters.filter.Date", {
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

Ext.define("Ext.locale.fr.form.Basic", {
    override: "Ext.form.Basic",
    waitTitle: "Chargement..."
});

Ext.define("Ext.locale.fr.util.Format", {
	override: "Ext.util.Format",
	thousandSeparator: ' ',
	decimalSeparator: ','
});

Ext.define("Ext.locale.fr.grid.filters.filter.List", {
    override: "Ext.grid.filters.filter.List",
    loadingText: "Chargement..."
});

Ext.define("Ext.locale.fr.grid.filters.filter.Number", {
    override: "Ext.grid.filters.filter.Number",
    emptyText: "Entrez un nombre..."
});

Ext.define("Ext.locale.fr.grid.filters.filter.String", {
    override: "Ext.grid.filters.filter.String",
    emptyText: "Entrez le texte..."
});
