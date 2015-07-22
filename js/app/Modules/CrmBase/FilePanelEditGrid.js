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
			plugins: [{
				ptype: 'uxgridfilters'
			},{
				ptype: 'rowediting',
				pluginId: 'rowEditor',
				listeners: {
					beforeedit: me.onBeforeEditRecord,
					edit: me.onAfterEditRecord,
					canceledit: me.onCancelEditRecord,
					scope: me
				}
			}],
			listeners: {
				itemcontextmenu: function(view, record, item, index, event) {
					var gridContextMenuItems = new Array() ;
					if( true || !authReadOnly ) {
						gridContextMenuItems.push({
							iconCls: 'icon-bible-delete',
							text: 'Delete record',
							handler : function() {
								me.onClickDelete(record) ;
							},
							scope : me
						});
					}
					var gridContextMenu = Ext.create('Ext.menu.Menu',{
						items : gridContextMenuItems,
						listeners: {
							hide: function(menu) {
								Ext.defer(function(){menu.destroy();},10) ;
							}
						}
					}) ;
					gridContextMenu.showAt(event.getXY());
				},
				scope: me
			},
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
			
			if( v.link_bible && !v.is_raw_link ) {
				return ;
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
					renderer: colorrenderer,
					editorTpl:{ xtype:'colorpickercombo'  }
				}) ;
			}
			if( v.type == 'date' ) {
				Ext.apply(columnObject,{
					renderer: daterenderer,
					editorTpl:{ xtype:'datetimefield'  }
				}) ;
			}
			if( v.type == 'bool' ) {
				Ext.apply(columnObject,{
					renderer: boolrenderer
				}) ;
			}
			if( v.type == 'string' ) {
				Ext.apply(columnObject,{
					editorTpl:{ xtype:'textfield'  }
				}) ;
			}
			if( v.type == 'number' ) {
				Ext.apply(columnObject,{
					editorTpl:{ xtype:'numberfield', hideTrigger:true  }
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
			
			if( v.link_bible ) {
				Ext.apply(columnObject,{
					width: 200
				}) ;
				
				if( v.link_type == 'treenode' ) {
					Ext.apply(columnObject,{
						filter: {
							type: 'op5crmbasebibletree',
							optimaModule: me.optimaModule,
							bibleId: v.link_bible
						},
						editorTpl:{
							xtype:'op5crmbasebibletreepicker',
							pickerWidth:400,
							selectMode: 'single',
							optimaModule:me.optimaModule,
							bibleId: v.link_bible
						}
					}) ;
				}
				
				if( v.link_type == 'entry' ) {
					Ext.apply(columnObject,{
						filter: {
							type: 'op5crmbasebible',
							optimaModule: me.optimaModule,
							bibleId: v.link_bible
						},
						editorTpl:{
							xtype:'op5crmbasebiblepicker',
							pickerWidth:400,
							selectMode: 'single',
							optimaModule:me.optimaModule,
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
			}
			
			// *** Apply editors ***
			Ext.apply(columnObject,{
				
			}) ;
			
			
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
		this.on('destroy',function(){
			Ext.ux.dams.ModelManager.unregister( gridModelName ) ;
		},this) ;
		
		gridStoreCfg = {
			model: gridModelName,
			remoteSort: true,
			remoteFilter: true,
			autoLoad: true,
			autoSync: false,
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'data_getFileGrid_data' ,
					file_code: this.fileId
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
		};
		
		return gridStoreCfg ;
	},
	
	onClickNew: function() {
		var me = this ;
		
		if( !this.isVisible() ) {
			return ;
		}
		
		// **** get Enabled Filters > initial data ****
		var hasError = false ;
		var presetFieldValue = {filerecord_id:-1} ;
		Ext.Array.each( me.filters.getFilterData(), function(filterCfg){
			var filter = me.filters.getFilter( filterCfg.field ) ;
			if( !filter || !filter.active ) {
				return ;
			}
			var filterArgs = filter.getSerialArgs() ;
			switch( filter.alias[0] ) {
				case 'gridfilter.op5crmbasebibletree' :
					if( filterArgs.valueRoot.length != 1 ) {
						hasError = true ;
						return false ;
					}
					presetFieldValue[filterCfg.field] = filterArgs.valueRoot[0] ;
					break ;
				
				case 'gridfilter.op5crmbasebible' :
					if( filterArgs.value.length != 1 ) {
						hasError = true ;
						return false ;
					}
					presetFieldValue[filterCfg.field] = filterArgs.value[0] ;
					break ;
				
				case 'gridfilter.date' :
					Ext.Array.each( filterArgs, function(filterArg) {
						if( filterArg.comparison == 'eq' ) {
							presetFieldValue[filterCfg.field] = Ext.Date.parse(filterArg.value,'Y-m-d') ;
						} else {
							hasError = true ;
							return false ;
						}
					},me) ;
					break ;
				
				default :
					hasError = true ;
					return false ;
					break ;
			}
		},me);
		
		if( hasError ) {
			Ext.Msg.show({
				title:'New record',
				msg: "Cannot set unique value(s) from current filter(s)" ,
				buttons: Ext.Msg.OK,
				icon: Ext.Msg.WARNING
			});
			return ;
		}
		
		var newRecord = Ext.create('FileEditGrid'+'-'+this.fileId, presetFieldValue) ;
		
		this.getStore().insert(0, newRecord );
		this.getPlugin('rowEditor').startEdit(0,0) ;
	},
	onBeforeEditRecord: function(editor,editEvent) {
		var me = this,
			readonlyColumns = [] ;
		
		// **** get Enabled Filters > READONLY ****
		Ext.Array.each( me.filters.getFilterData(), function(filterCfg){
			var filter = me.filters.getFilter( filterCfg.field ) ;
			if( !filter ) {
				return ;
			}
			if( filter.active ) {
				readonlyColumns.push( filterCfg.field ) ;
			}
		},me);
		
		Ext.Array.forEach( editEvent.grid.columns, function(col) {
			if( col.editorTpl ) {
				var editorTpl = Ext.apply({},col.editorTpl) ;
				if( Ext.Array.contains( readonlyColumns, col.dataIndex ) ) {
					Ext.apply( editorTpl, {
						readOnly: true
					}) ;
				}
				col.setEditor(editorTpl) ;
			}
		},me);
	},
	onCancelEditRecord: function(editor,editEvent) {
		var me = this,
			editedRecord = editEvent.record ;
			
		if( editedRecord.data.filerecord_id == -1 ) {
			this.getStore().remove(editedRecord) ;
		}
	},
	onAfterEditRecord: function(editor,editEvent) {
		var me = this,
			crmFields = {},
			editedRecord = editEvent.record ;
		
		if( editedRecord.get('filerecord_id') == -1 ) {
			editedRecord.set('filerecord_id',0);
		}
			
		Ext.Object.each( me.gridCfg.grid_fields , function(k,v) {
			if( v.link_bible && !v.is_raw_link ) {
				return ;
			}
			
			if( editedRecord.data[v.field] != null && v.file_field != null ) {
				var fieldCode = 'field_'+v.file_field ;
				switch( v.type ) {
					case 'date' :
						crmFields[fieldCode] = Ext.Date.format(editedRecord.data[v.field], 'Y-m-d H:i:s') ;
						break ;
						
					default :
						crmFields[fieldCode] = editedRecord.data[v.field] ;
						break ;
				}
			}
		}) ;
		
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_setFileGrid_raw',
			data: Ext.JSON.encode(crmFields),
			file_code: this.fileId,
			is_new: ( editedRecord.get('filerecord_id')>0 ? 0 : 1 ),
			filerecord_id: editedRecord.get('filerecord_id')
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					var filerecordId = Ext.decode(response.responseText).filerecord_id ;
					editedRecord.set('filerecord_id',filerecordId) ;
					editedRecord.set(me.fileId+'_id',filerecordId) ;
				}
			},
			scope: this
		});
	},
	onClickDelete: function(record) {
		var me = this ;
		
		if( record.get('filerecord_id') > 0 ) {
			var ajaxParams = new Object() ;
			Ext.apply( ajaxParams, {
				_action: 'data_setFileGrid_raw',
				do_delete: 1,
				file_code: this.fileId,
				is_new: 0,
				filerecord_id: record.get('filerecord_id')
			});
			me.optimaModule.getConfiguredAjaxConnection().request({
				params: ajaxParams ,
				success: function(response) {
					if( Ext.decode(response.responseText).success == false ) {
						Ext.Msg.alert('Failed', 'Failed');
					}
				},
				scope: this
			});
		}
		
		me.getStore().remove(record) ;
	},
	
	reload: function() {
		if( this.getStore() ) {
			this.getStore().load() ;
		}
	}
	
});