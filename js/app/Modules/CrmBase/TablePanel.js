Ext.define('Optima5.Modules.CrmBase.TablePanel' ,{
	extend: 'Ext.panel.Panel',
			  
	requires: [
		'Ext.ux.grid.filters.Filters'
	],
	
	optimaModule: null,
	tableId: '' ,
	
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:TablePanel','No module reference ?') ;
		}
		
		this.gridpanel = Ext.create('Ext.grid.Panel',{
			border:false,
			store: {
				fields: ['dummy'],
				data  : [{
					dummy: 'Please wait'
				}]
			},
			columns: [
				{header: 'Loading...',  dataIndex: 'dummy',  flex: 1}
			]
		});
		
		Ext.apply(this,{
			layout: 'fit',
			items: [this.gridpanel]
		});
		
		this.callParent(arguments);
		
		this.on('destroy',function(p){
			if( p.gridModelName ) {
				Ext.ux.dams.ModelManager.unregister( p.gridModelName ) ;
			}
		},this) ;
	},
			  
			  
	reconfigure: function( tableId, tableCfgObj ) {
		if( Ext.isObject(tableCfgObj) ) {
			this.tableId = tableId ;
			this.reconfigureData( tableCfgObj ) ;
			return ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action : 'data_getTableGrid_config',
				table_code : tableId
			},
			success: function(response) {
				if( Ext.decode(response.responseText).success == true ) {
					this.tableId = tableId ;
					this.reconfigureData( Ext.decode(response.responseText).data ) ;
				}
				else {
					this.tableId = '' ;
					this.reconfigureDummy(tableId) ;
				}
			},
			scope: this
		});
	},
			  
	reconfigureData: function( ajaxData ) {
		var me = this ;
		this.removeAll() ;
		
		this.gridstore = this.reconfigureDataBuildStore( ajaxData ) ;
		this.gridpanel = this.reconfigureDataBuildGrid( ajaxData, this.gridstore ) ;
		Ext.apply(this.gridpanel,{
			panelType: 'grid',
			border:false
		}) ;
		
		this.add( this.gridpanel ) ;
	},
	
	reconfigureDataBuildStore: function( ajaxData ) {
		var gridModelName = 'TableGrid'+'-'+this.getId() ;
		
		// Création du modèle GRID
		var modelFields = new Array() ;
		var keyfield = '' ;
		var noNew = false ;
		Ext.Object.each( ajaxData.grid_fields , function(k,v) {
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
		modelFields.push( {name: '_phantom', type:'boolean'} ) ;
		
		if( this.gridModelName ) {
			Ext.ux.dams.ModelManager.unregister( this.gridModelName ) ;
		}
		Ext.define(gridModelName, {
			extend: 'Ext.data.Model',
			fields: modelFields
		});
		this.gridModelName = gridModelName ;
		
		var gridstore = Ext.create('Ext.data.Store', {
			model: gridModelName,
			remoteSort: true,
			remoteFilter: true,
			autoLoad: true,
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'data_getTableGrid_data' ,
					table_code: this.tableId
				},
				reader: {
					type: 'json',
					rootProperty: 'data',
					totalProperty: 'total'
				}
			}),
			listeners: {
				load: {
					fn: this.onStoreLoad,
					scope: this
				}
			}
		});
		
		return gridstore ;
	},
	
	reconfigureDataBuildGrid: function( ajaxData, gridstore ) {
		var me = this ;
		
		var authReadOnly = false;
		if( ajaxData.auth_status != null && ajaxData.auth_status.readOnly ) {
			authReadOnly = true ;
		}
		
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
		var modelFields = new Array() ;
		var keyfield = '' ;
		var noActions=false, noNew=false ;
		var gridColumns = new Array() ;
		Ext.Object.each( ajaxData.grid_fields , function(k,v) {
			// console.dir(v) ;
			/*
			if( !(v.entry_field_is_highlight) )
				return ;
			*/
			if( v.is_key == true ) {
				keyfield = v.field ;
				return ;
			}
			
			switch( v.type )
			{
				default :
					break ;
			}
			
			if( v.is_raw_link ) {
				return ;
			}
			
			var columnObject = new Object();
			Ext.apply(columnObject,{
            text: v.text,
            dataIndex: v.field,
				sortable: true,
				menuDisabled: false,
				xtype:'gridcolumn'
			}) ;
			if( v.type == 'color' ) {
				Ext.apply(columnObject,{
					renderer: colorrenderer
				}) ;
			}
			if( v.type == 'number' ) {
				Ext.apply(columnObject,{
					editor:{ xtype:'numberfield' }
				}) ;
			}
			if( v.type == 'date' ) {
				Ext.apply(columnObject,{
					renderer: daterenderer
				}) ;
				Ext.apply(columnObject,{
					editor:{ xtype:'datetimefield' }
				}) ;
			}
			if( v.type == 'bool' ) {
				Ext.apply(columnObject,{
					renderer: boolrenderer
				}) ;
			}
			if( v.table_code == this.tableId && (!v.link_bible || v.link_bible_is_key) ) {
				Ext.apply(columnObject,{
					text: '<b>'+columnObject.text+'</b>'
				}) ;
			}
			
			if( v.type == 'date' ) {
				Ext.apply(columnObject,{
					filter: {
						type: 'date',
						dateFormat: 'Y-m-d'
					}
				}) ;
			}
			else {
				var filterType ;
				switch( v.type ) {
					case 'bool' :
						filterType = 'boolean' ;
						break ;
				}
				Ext.apply(columnObject,{
					filter: (filterType || true)
				}) ;
			}
			
			var editor ;
			switch( v.type ) {
				case 'date' :
					editor = { xtype:'datetimefield' } ;
					break ;
				case 'number' :
					editor = { xtype:'numberfield' } ;
					break ;
				case 'bool' :
					editor = { xtype:'checkboxfield' } ;
					break ;
				default :
					editor = { xtype:'textfield' } ;
					break ;
			}
			Ext.apply(columnObject,{
				editor: editor
			}) ;
			
			
			gridColumns.push( columnObject ) ;
		},this) ;
		
		
		var gridpanel = Ext.create('Ext.grid.Panel',{
			store: gridstore,
			columns: gridColumns,
			plugins: [{
				ptype: 'uxgridfilters'
			},{
				ptype: 'rowediting',
				pluginId: 'rowEditor',
				listeners: {
					edit: me.onAfterEdit,
					canceledit: me.onCancelEdit,
					scope: this
				}
			}],
			viewConfig: {
				preserveScrollOnRefresh: true,
				preserveScrollOnReload: true
			},
			dockedItems: [{
				xtype: 'pagingtoolbar',
				store: gridstore,   // same store GridPanel is using
				dock: 'bottom',
				displayInfo: true
			}]
		}) ;
		
		gridpanel.on('itemcontextmenu', function(view, record, item, index, event) {
			// var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
			if( authReadOnly ){
				return ;
			}
			
			var gridContextMenuItems = new Array() ;
			gridContextMenuItems.push({
				iconCls: 'icon-bible-edit',
				text: 'Edit',
				handler : function() {
					me.editRecordModify( record ) ;
				},
				scope : me
			});
			gridContextMenuItems.push({
				iconCls: 'icon-bible-delete',
				text: 'Delete',
				handler : function() {
					Ext.Msg.show({
						title:'Delete row',
						msg: 'Delete row ?' ,
						buttons: Ext.Msg.YESNO,
						fn:function(buttonId){
							if( buttonId == 'yes' ) {
								me.editRecordDelete( record ) ;
							}
						},
						scope:me
					});
					
				},
				scope : me
			});
			gridContextMenuItems.push('-') ;
			gridContextMenuItems.push({
				iconCls: 'icon-bible-new',
				text: 'New record',
				handler : function() {
					me.editRecordNew() ;
				},
				scope : me
			});
			
			var gridContextMenu = Ext.create('Ext.menu.Menu',{
				items : gridContextMenuItems,
				listeners: {
					hide: function(menu) {
						Ext.defer(function(){menu.destroy();},10) ;
					}
				}
			}) ;
			
			gridContextMenu.showAt(event.getXY());
		},me) ;
		
		gridpanel.on('containercontextmenu',function(view,event) {
			if( authReadOnly ) {
				return ;
			}
			var gridContextMenuItems = new Array() ;
			gridContextMenuItems.push({
				iconCls: 'icon-bible-new',
				text: 'New record',
				handler : function() {
					me.editRecordNew() ;
				},
				scope : me
			});
			
			var gridContextMenu = Ext.create('Ext.menu.Menu',{
				items : gridContextMenuItems,
				listeners: {
					hide: function(menu) {
						Ext.defer(function(){menu.destroy();},10) ;
					}
				}
			}) ;
			
			if( gridContextMenuItems.length > 0 ) {
				gridContextMenu.showAt(event.getXY());
			}
		},me) ;
		return gridpanel ;
	},
			  
			  
			  
	reconfigureDummy: function( tableId ) {
		if( this.gridpanel ) {
			this.gridpanel.reconfigure( Ext.create('Ext.data.Store',{
				fields: ['dummy'],
				data  : [{
					dummy: 'Empty store.'
				}]
			}),[{
				header: tableId+' not loaded !',  dataIndex: 'dummy',  flex: 1
			}]);
		}
	},
	
	reload: function() {
		if( this.gridstore ) {
			this.gridstore.load() ;
		}
	},
	onStoreLoad: function() {
		this.fireEvent('load',this) ;
	},
	isEmpty: function() {
		return ( this.gridstore.getTotalCount() == 0 ) ;
	},
	
	editRecordNew: function() {
		var rec = this.down('gridpanel').getStore().insert(0,{_phantom:true}) ;
		this.down('gridpanel').getPlugin('rowEditor').startEdit(0) ;
	},
	editRecordModify: function(record) {
		this.down('gridpanel').getPlugin('rowEditor').startEdit(record) ;
	},
	editRecordDelete: function(record) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'data_editTableGrid_delete',
				table_code: this.tableId,
				values_original: Ext.JSON.encode( record.getData() )
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
			},
			callback: function() {
				this.reload() ;
			},
			scope: this
		}) ;
	},
	
	onAfterEdit: function(editor,context) {
		if( context.record.get('_phantom') ) {
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_action: 'data_editTableGrid_new',
					table_code: this.tableId,
					values_new: Ext.JSON.encode( context.newValues )
				},
				success: function(response) {
					var ajaxResponse = Ext.decode(response.responseText) ;
					if( ajaxResponse.success == false ) {
						Ext.MessageBox.alert('Error','Error') ;
						return ;
					}
				},
				callback: function() {
					this.reload() ;
				},
				scope: this
			}) ;
		} else {
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_action: 'data_editTableGrid_modify',
					table_code: this.tableId,
					values_original: Ext.JSON.encode( context.originalValues ),
					values_new: Ext.JSON.encode( context.newValues )
				},
				success: function(response) {
					var ajaxResponse = Ext.decode(response.responseText) ;
					if( ajaxResponse.success == false ) {
						Ext.MessageBox.alert('Error','Error') ;
						return ;
					}
				},
				callback: function() {
					this.reload() ;
				},
				scope: this
			}) ;
		}
	},
	onCancelEdit: function(editor,context) {
		var gridpanel = this.down('gridpanel') ;
		if( context.record.get('_phantom') ) {
			gridpanel.getStore().remove(context.record) ;
		}
	},
	
	switchToPanel: Ext.emptyFn,
	
	exportTable: function(fileFormat) {
		var me = this ;
		if( !me.gridpanel ) {
			return ;
		}
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_action: 'data_getTableGrid_export' ,
			output_format: fileFormat,
			table_code: this.tableId
		}) ;
		
		if( me.gridpanel.filters && me.gridpanel.filters.getFilterData().length > 0 ) {
			Ext.apply( exportParams, {
				filter: Ext.JSON.encode(me.gridpanel.filters.getFilterData())
			}) ;
		}
		
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	
	openQdirect: function( qCfg ) {
		var me = this ;
		me.optimaModule.createWindow(qCfg,Optima5.Modules.CrmBase.QdirectWindow) ;
	}
	
});
