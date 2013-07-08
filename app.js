Ext.Loader.setConfig({
	enabled: true,
	disableCaching: true,
	paths: {
		'Ext': './extjs/src', 
		'Ext.ux' : './js/ux',
		'Ext.calendar' : './js/ext/calendar',
		'Optima5' : './js/app'
		}
});
Ext.require('Ext.*') ;
Ext.require('Optima5.App');

var op5desktop, op5session ;
Ext.onReady(function () {
	
	/*
	Edition en ligne du TreeStore (non utilisé dans ParaCRM
	http://stackoverflow.com/questions/9076979/extjs4-treepanel-childnode-editing
			store.indexOf is not a function
			rowIdx = store.indexOf(record);
	http://www.sencha.com/forum/showthread.php?130008-Where-did-Ext.tree.TreeEditor-go/page2
	*/
	Ext.override(Ext.data.AbstractStore,{
		indexOf: Ext.emptyFn
	});
	
	
	
	
	
	/*
	Désactiver le click droit
	*/
	Ext.getBody().on('contextmenu', Ext.emptyFn, null, {preventDefault: true});
	
	
	/*
	Load record for multi-select COMBO
	http://www.sencha.com/forum/archive/index.php/t-202456.html?s=ef437a00595a4b216c80d979879ef5fc
	http://stackoverflow.com/questions/6299164/using-ext-form-basic-loadrecord-to-load-data-into-combo-box-fields-with-remote-s
	*/
	Ext.form.field.ComboBox.override( {
		setValue: function(v) {
			if( Ext.JSON.decode(v,true) != null ) {
				arguments[0] = Ext.JSON.decode(v) ;
			}
			this.callOverridden(arguments);
		}
	});
	
	Ext.form.FieldSet.override( {
		beforeDestroy: function() {
			this.callParent() ;
		}
	});
	
	
	/*
	DATE FIELD : treat 0000-00-00 as null
	*/
	Ext.form.field.Date.override( {
		setValue: function() {
			if( arguments[0] == '0000-00-00' ) {
				arguments[0] = null ;
			}
			this.callOverridden(arguments);
		}
	});
	
	
	
	
	// onReady : bootstrap Optima app.
	Ext.create('Optima5.App',{}) ;
});
