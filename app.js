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
	TreeViewDragDrop : containerScroll 
	*/
	Ext.tree.plugin.TreeViewDragDrop.override( {
		onViewRender : function(view) {
			var me = this;
			
			if (me.enableDrag) {
					me.dragZone = new Ext.tree.ViewDragZone({
						view: view,
						ddGroup: me.dragGroup || me.ddGroup,
						dragText: me.dragText,
						repairHighlightColor: me.nodeHighlightColor,
						repairHighlight: me.nodeHighlightOnRepair
					});
			}
			
			if (me.enableDrop) {
				me.dropZone = new Ext.tree.ViewDropZone({
					view: view,
					ddGroup: me.dropGroup || me.ddGroup,
					allowContainerDrops: me.allowContainerDrops,
					appendOnly: me.appendOnly,
					allowParentInserts: me.allowParentInserts,
					expandDelay: me.expandDelay,
					dropHighlightColor: me.nodeHighlightColor,
					dropHighlight: me.nodeHighlightOnDrop,
					containerScroll: me.containerScroll
				});
			}
		}
	});
	
	/*
	Désactiver le click droit
	*/
	Ext.getBody().on('contextmenu', Ext.emptyFn, null, {preventDefault: true});
	
	// onReady : bootstrap Optima app.
	Ext.create('Optima5.App',{}) ;
});
