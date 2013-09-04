Ext.define('Optima5.Modules.CrmBase.FilePanelEditGrid',{
	extend : 'Ext.grid.Panel',
	
	requires : [],
	
	alias : 'widget.op5crmbasefileeditgrid',
	
	initComponent: function() {
		var me = this ;
		
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:FilePanelEditGrid','No module reference ?') ;
			return ;
		}
		if( (me.parentFilePanel) instanceof Optima5.Modules.CrmBase.FilePanel ) {} else {
			Optima5.Helper.logError('CrmBase:FilePanelEditGrid','No parent FilePanel reference ?') ;
			return ;
		}
		if( !me.gridCfg || !me.gridCfg.grid_fields ) {
			Optima5.Helper.logError('CrmBase:FilePanelEditGrid','No proper config ?') ;
			return ;
		}
		
		/*
		var authReadOnly = false;
		if( me.gridCfg.auth_status != null && me.gridCfg.auth_status.readOnly ) {
			authReadOnly = true ;
		}
		*/
		
		
		var gridColumns = me.initGetColumns() ;
		
		var gridStore = Ext.create('Ext.data.Store',me.initGetStoreCfg()) ;
		
		
		Ext.apply(me,{
			store: gridStore,
			columns: gridColumns,
			features: [{
				ftype:'filters',
				encode: true
			}],
			dockedItems: [{
				xtype: 'pagingtoolbar',
				store: gridStore,   // same store GridPanel is using
				dock: 'bottom',
				displayInfo: true
			}]
		}) ;
		
		
		
		me.callParent(arguments) ;
	},
	initGetColumns: function() {
		var me = this ;
		
		var daterenderer = Ext.util.Format.dateRenderer('d/m/Y H:i');
		var boolrenderer = function(value) {
			if( value==1 ) {
				return '<b>X</b>' ;
			}
			else {
				return '' ;
			}
		}
		var colorrenderer = function( value, metaData ) {
			metaData.style = 'background-color: #' + value + '; background-image: none;'
		}
		
		// Création du modèle GRID
		var gridColumns = new Array() ;
		Ext.Object.each( me.gridCfg.grid_fields , function(k,v) {
			// console.dir(v) ;
			/*
			if( !(v.entry_field_is_highlight) )
				return ;
			*/
			if( v.is_key == true ) {
				return ;
			}
			
			switch( v.type )
			{
				default :
					break ;
			}
			
			var columnObject = new Object();
			Ext.apply(columnObject,{
            text: v.text,
            sortable: false,
            dataIndex: v.field,
				hidden: !(v.is_display),
				sortable: true,
				menuDisabled: false,
				xtype:'gridcolumn'
			}) ;
			if( v.type == 'color' ) {
				Ext.apply(columnObject,{
					renderer: colorrenderer
				}) ;
			}
			if( v.type == 'date' ) {
				Ext.apply(columnObject,{
					renderer: daterenderer
				}) ;
			}
			if( v.type == 'bool' ) {
				Ext.apply(columnObject,{
					renderer: boolrenderer
				}) ;
			}
			if( v.file_code == this.fileId && (!v.link_bible || v.link_bible_is_key) ) {
				Ext.apply(columnObject,{
					text: '<b>'+columnObject.text+'</b>'
				}) ;
			}
			if( v.link_bible && v.link_bible_is_key ) {
				Ext.apply(columnObject,{
					text: '<u>'+columnObject.text+'</u>'
				}) ;
			}
			
			if( v.link_bible && v.link_bible_is_key ) {
				if( v.link_bible_type == 'tree' ) {
					Ext.apply(columnObject,{
						filter: {
							type: 'op5crmbasebibletree',
							optimaModule: me.optimaModule,
							bibleId: v.link_bible
						}
					}) ;
				}
				
				if( v.link_bible_type == 'entry' ) {
					Ext.apply(columnObject,{
						filter: {
							type: 'op5crmbasebible',
							optimaModule: me.optimaModule,
							bibleId: v.link_bible
						}
					}) ;
				}
			}
			else {
				if( v.type == 'date' ) {
					Ext.apply(columnObject,{
						filter: {
							type: 'date',
							dateFormat: 'Y-m-d'
						}
					}) ;
				}
				else {
					Ext.apply(columnObject,{
						filterable: true
					}) ;
				}
			}
			
			
			if( v.entry_field_type == 'link' ) {
				Ext.apply(columnObject,{
					renderer : function( value ) {
						if( value == '' || Ext.JSON.decode(value).length < 1 ){
							return '' ;
						}
						if( Ext.Array.contains( Ext.JSON.decode(value), '&' ) ) {
							return '<img src="images/op5img/ico_dataadd_16.gif"/>' + '&nbsp;(<b>' + v.link + '</b>)' ;
						}
						return '<img src="images/op5img/ico_dataadd_16.gif"/>' + '&nbsp;' + Ext.JSON.decode(value).join(' / ') ;
					}
				});
			}
			gridColumns.push( columnObject ) ;
		},this) ;
		
		return gridColumns ;
	},
	initGetStoreCfg: function() {
		var me = this ;
		
		var gridModelName = 'FileEditGrid'+'-'+this.fileId ;
		
		// Création du modèle GRID
		var modelFields = new Array() ;
		var keyfield = '' ;
		var noNew = false ;
		if( me.gridCfg.define_file.file_parent_code != '' ) {
			noNew = true ;
		}
		Ext.Object.each( me.gridCfg.grid_fields , function(k,v) {
			// console.dir(v) ;
			/*
			if( !(v.entry_field_is_highlight) && false )
				return ;
			*/
			if( v.is_key == true )
				keyfield = v.field ;
			
			switch( v.type )
			{
				case 'number' :
				case 'date' :
					var fieldType = v.type ;
					break ;
					
				default :
					var fieldType = 'string' ;
					break ;
			}
			
			var fieldObject = new Object();
			Ext.apply(fieldObject,{
				name: v.field,
				type: fieldType
			}) ;
			if( v.type == 'date' ) {
				Ext.apply(fieldObject,{
					dateFormat: 'Y-m-d H:i:s'
				}) ;
			}
			modelFields.push( fieldObject ) ;
		},this) ;
		Ext.define(gridModelName, {
			extend: 'Ext.data.Model',
			fields: modelFields
		});
		
		gridStoreCfg = {
			model: gridModelName,
			remoteSort: true,
			autoLoad: true,
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'data_getFileGrid_data' ,
					file_code: this.fileId
				},
				reader: {
					type: 'json',
					root: 'data',
					totalProperty: 'total'
				}
			}),
			listeners: {
				load: {
					fn: this.onStoreLoad,
					scope: this
				}
			}
		};
		
		return gridStoreCfg ;
	}
	
});