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
Ext.require('Ext.calendar.CalendarPanel') ;
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
	
	
	/*
	 * From ExtJS 4.1 Calendar Example
	 */
	// Currently MemoryProxy really only functions for read-only data. Since we want
	// to simulate CRUD transactions we have to at the very least allow them to be
	// marked as completed and successful, otherwise they will never filter back to the
	// UI components correctly.
	Ext.data.MemoryProxy.override({
		updateOperation: function(operation, callback, scope) {
			operation.setCompleted();
			operation.setSuccessful();
			Ext.callback(callback, scope || me, [operation]);
		},
		create: function() {
			this.updateOperation.apply(this, arguments);
		},
		update: function() {
			this.updateOperation.apply(this, arguments);
		},
		destroy: function() {
			this.updateOperation.apply(this, arguments);
		}
	});
	
	
	
	
	
	// onReady : bootstrap Optima app.
	Ext.create('Optima5.App',{}) ;
});
