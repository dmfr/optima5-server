Ext.define('Optima5.Modules.CrmBase.FilePanel' ,{
	extend: 'Ext.panel.Panel',
			  
	requires: [
		'Optima5.Modules.CrmBase.DataFormPanel',
		'Optima5.Modules.CrmBase.FilePanelEditGrid',
		'Optima5.Modules.CrmBase.FilePanelGmap',
		'Optima5.Modules.CrmBase.FilePanelGallery',
		'Optima5.Modules.CrmBase.FilePanelCalendar',
		'Ext.ux.grid.filters.Filters',
		'Optima5.Modules.CrmBase.BibleFilter',
		'Optima5.Modules.CrmBase.BibleTreeFilter',
	],
	
	optimaModule: null,
	fileId: '' ,
	
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:FilePanel','No module reference ?') ;
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
		
		this.mainview = Ext.create('Ext.panel.Panel',{
			flex: 1,
			border:false,
			layout: {
				type: 'card',
				align: 'stretch'
			},
			maintainFlex : true,
			activeItem : 0,
			//resizable : true ,
			items: [this.gridpanel]
		});
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [this.mainview]
		});
		
		this.callParent(arguments);
		this.addEvents('load','viewchanged') ;
	},
			  
			  
	reconfigure: function( fileId, fileCfgObj ) {
		if( Ext.isObject(fileCfgObj) ) {
			this.fileId = fileId ;
			this.reconfigureData( fileCfgObj ) ;
			return ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action : 'data_getFileGrid_config',
				file_code : fileId
			},
			success: function(response) {
				if( Ext.decode(response.responseText).success == true ) {
					this.fileId = fileId ;
					this.reconfigureData( Ext.decode(response.responseText).data ) ;
				}
				else {
					this.fileId = '' ;
					this.reconfigureDummy(fileId) ;
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
		
		this.mainview  = Ext.create('Ext.panel.Panel',{
			flex: 2,
			border:false,
			layout: {
				type: 'card',
				align: 'stretch',
				deferredRender: true
			},
			maintainFlex : true,
			activeItem : (ajaxData.define_file.viewmode_calendar ? 1 : 0),
			//resizable : true ,
			items: [this.gridpanel,{
				xtype:'op5crmbasefilecalendar',
				border:false,
				panelType: 'calendar',
				optimaModule: me.optimaModule,
				parentFilePanel: me,
				fileId: this.fileId,
				gridCfg: ajaxData,
				startDay: 1,  // 0-based index for the day, 1 = Monday
				listeners: {
					openfile: {
						fn:function(filerecordid) {
							this.editRecordUpdate(filerecordid) ;
						},
						scope:this
					}
				}
			},{
				xtype:'op5crmbasefileeditgrid',
				border:false,
				panelType: 'editgrid',
				optimaModule: me.optimaModule,
				parentFilePanel: me,
				fileId: this.fileId,
				gridCfg: ajaxData,
				listeners: {
					
				}
			},{
				xtype:'op5crmbasefilegmap',
				border:false,
				panelType: 'gmap',
				store:this.gridstore,
				fileId: this.fileId,
				gridCfg: ajaxData,
				listeners: {
					openfile: {
						fn:function(filerecordid) {
							this.editRecordUpdate(filerecordid) ;
						},
						scope:this
					}
				}
			},{
				xtype:'op5crmbasefilegallery',
				border:false,
				optimaModule: me.optimaModule,
				panelType: 'gallery',
				store:this.gridstore,
				fileId: this.fileId,
				dockedItems: [{
					xtype: 'pagingtoolbar',
					store: this.gridstore,   // same store GridPanel is using
					dock: 'bottom',
					displayInfo: true
				}]
			}]
				
		});
		
		this.add( this.mainview ) ;
		this.fireViewChange() ;
	},
	
	reconfigureDataBuildStore: function( ajaxData ) {
		var gridModelName = 'FileGrid'+'-'+this.fileId ;
		
		// Création du modèle GRID
		var modelFields = new Array() ;
		var keyfield = '' ;
		var noNew = false ;
		if( ajaxData.define_file.file_parent_code != '' ) {
			noNew = true ;
		}
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
		Ext.define(gridModelName, {
			extend: 'Ext.data.Model',
			fields: modelFields
		});
		this.on('destroy',function(){
			Ext.ux.dams.ModelManager.unregister( gridModelName ) ;
		},this) ;
		
		var gridstore = Ext.create('Ext.data.Store', {
			model: gridModelName,
			remoteSort: true,
			remoteFilter: true,
			autoLoad: true,
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
		});
		
		return gridstore ;
	},
	
	reconfigureDataBuildGrid: function( ajaxData, gridstore ) {
		var me = this ;
		
		var authReadOnly = false;
		if( ajaxData.auth_status != null && ajaxData.auth_status.readOnly ) {
			authReadOnly = true ;
		}
		
		var gridModelName = 'FileGrid'+'-'+this.fileId ;
		
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
		if( ajaxData.define_file.file_parent_code != '' ) {
			noActions = true ;
		}
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
		
		
		var gridpanel = Ext.create('Ext.grid.Panel',{
			store: gridstore,
			columns: gridColumns,
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			dockedItems: [{
				xtype: 'pagingtoolbar',
				store: gridstore,   // same store GridPanel is using
				dock: 'bottom',
				displayInfo: true
			}],
			viewConfig:{
				plugins: {
					ddGroup: 'FilerecordToAnything',
					ptype: 'gridviewdragdrop',
					enableDrag: true,
					enableDrop: false
				}
			}
		}) ;
		
		
		var me = this ;
		if( !noActions ){
			gridpanel.on('itemdblclick', function( view, record, item, index, event ) {
				me.editRecordUpdate( record.get(keyfield) ) ;
				//console.log( keyfield + ' is ' + selRecords[0].get(keyfield) ) ;
			},me) ;
			
			gridpanel.on('itemcontextmenu', function(view, record, item, index, event) {
				// var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
				
				var gridContextMenuItems = new Array() ;
				
				Ext.Array.each( ajaxData.queries_qobjs, function(o) {
					var iconPath, text,
						qCfg = {} ;
					Ext.apply(qCfg,{
						qType:o.q_type,
						queryId: o.query_id,
						qmergeId: o.qmerge_id,
						qbookId: o.qbook_id,
						qbookZtemplateSsid: o.qbook_ztemplate_ssid,
						qwebId: o.qweb_id,
						qsrcFilerecordId:record.get(keyfield)
					});
					switch( o.q_type ) {
						case 'qbook' :
							iconPath = 'images/op5img/ico_bookmark_16.png' ;
							text = o.qbook_name ;
							break ;
						case 'qbook_ztemplate' :
							iconPath = 'images/op5img/ico_planet_16.png' ;
							text = o.ztemplate_name ;
							break ;
						case 'qweb' :
							iconPath = 'images/op5img/ico_planet_16.png' ;
							text = o.qweb_name ;
							break ;
					}
					gridContextMenuItems.push({
						icon: iconPath,
						text: text,
						handler : function() {
							me.openQdirect( qCfg ) ;
						},
						scope : me
					});
				},me) ;
				if( ajaxData.queries_qobjs.length > 0 ) {
					gridContextMenuItems.push('-') ;
				}
				
				if( true ) {
					gridContextMenuItems.push({
						iconCls: 'icon-bible-edit',
						text: ( authReadOnly ? 'Open record' : 'Edit record' ),
						handler : function() {
							me.editRecordUpdate( record.get(keyfield) ) ;
						},
						scope : me
					});
				}
				if( !authReadOnly ) {
					gridContextMenuItems.push({
						iconCls: 'icon-bible-delete',
						text: 'Delete record',
						handler : function() {
							Ext.Msg.show({
								title:'Delete file record',
								msg: 'Delete record '+record.get(keyfield)+' ?' ,
								buttons: Ext.Msg.YESNO,
								fn:function(buttonId){
									if( buttonId == 'yes' ) {
										me.editRecordDelete( record.get(keyfield) ) ;
									}
								},
								scope:me
							});
							
						},
						scope : me
					});
				}
				if( !noNew && !authReadOnly ) {
					gridContextMenuItems.push('-') ;
					gridContextMenuItems.push({
						iconCls: 'icon-bible-new',
						text: 'New record',
						handler : function() {
							me.editRecordNew() ;
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
			},me) ;
			
			gridpanel.on('containercontextmenu',function(view,event) {
				var gridContextMenuItems = new Array() ;
				if( !noNew && !authReadOnly ) {
					gridContextMenuItems.push({
						iconCls: 'icon-bible-new',
						text: 'New record',
						handler : function() {
							me.editRecordNew() ;
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
				
				if( gridContextMenuItems.length > 0 ) {
					gridContextMenu.showAt(event.getXY());
				}
			},me) ;
			
			/*
			gridpanel.on('filterupdate',function(){
				console.log('Filters :') ;
				console.dir(gridpanel.filters.getFilterData()) ;
				console.log('Query :') ;
				console.dir(gridpanel.filters.buildQuery(gridpanel.filters.getFilterData())) ;
			},me);
			*/
		}
		
		return gridpanel ;
	},
			  
			  
			  
	reconfigureDummy: function( fileId ) {
		if( this.gridpanel ) {
			this.gridpanel.reconfigure( Ext.create('Ext.data.Store',{
				fields: ['dummy'],
				data  : [{
					dummy: 'Empty store.'
				}]
			}),[{
				header: fileId+' not loaded !',  dataIndex: 'dummy',  flex: 1
			}]);
		}
	},
	
	reload: function() {
		if( this.gridstore ) {
			this.gridstore.load() ;
		}
		if( this.mainview && this.mainview.child('op5crmbasefilecalendar') ) {
			this.mainview.child('op5crmbasefilecalendar').reload() ;
		}
		if( this.mainview && this.mainview.child('op5crmbasefileeditgrid') ) {
			this.mainview.child('op5crmbasefileeditgrid').reload() ;
		}
	},
	onClickNew: function() {
		if( this.gridpanel && this.gridpanel.isVisible() ) {
			this.editRecordNew() ;
			return ;
		}
		if( this.mainview && this.mainview.child('op5crmbasefileeditgrid') ) {
			this.mainview.child('op5crmbasefileeditgrid').onClickNew() ;
		}
	},
	onStoreLoad: function() {
		this.fireEvent('load',this) ;
	},
	isEmpty: function() {
		return ( this.gridstore.getTotalCount() == 0 ) ;
	},
	
	editRecordNew: function( formPresets ) {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_editTransaction',
			_subaction: 'init',
			data_type: 'file_record',
			file_code: this.fileId,
			is_new: true
		});
		if( Ext.isObject(formPresets) ) {
			ajaxParams['form_presets'] = Ext.JSON.encode(formPresets) ;
		}
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					var readOnly = false ;
					if( Ext.decode(response.responseText).auth_status != null && Ext.decode(response.responseText).auth_status.readOnly ) {
						readOnly = true ;
					}
					this.openEditFormWindow( {isNew:true}, Ext.decode(response.responseText).transaction_id, readOnly ) ;
				}
			},
			scope: this
		});
	},
	editRecordUpdate: function( filerecordId ) {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_editTransaction',
			_subaction: 'init',
			data_type: 'file_record',
			file_code: this.fileId,
			is_new: false,
			filerecord_id: filerecordId
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					var readOnly = false ;
					if( Ext.decode(response.responseText).auth_status != null && Ext.decode(response.responseText).auth_status.readOnly ) {
						readOnly = true ;
					}
					this.openEditFormWindow( {isNew:false,filerecordId:filerecordId}, Ext.decode(response.responseText).transaction_id, readOnly ) ;
				}
			},
			scope: this
		});
	},
	editRecordDelete: function( filerecordId ) {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_deleteRecord',
			data_type: 'file_record',
			file_code: this.fileId,
			filerecord_id: filerecordId
		});
		var me = this ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.optimaModule.postCrmEvent('datachange',{
						dataType: 'file',
						bibleId: null,
						fileId: me.fileId
					});
				}
			},
			scope: me
		});
	},
			  
	openEditFormWindow: function(editDetails,transactionId,readOnly) {
		var me = this ;
		var dataformpanel = Ext.create('Optima5.Modules.CrmBase.DataFormPanel',{
			optimaModule: me.optimaModule,
			transactionID: transactionId,
			transactionDataType: 'file',
			transactionFileId: me.fileId,
			readOnly: readOnly
		}) ;
		me.optimaModule.createWindow({
			title: (editDetails.isNew? 'New':'#'+editDetails.filerecordId)+' ('+me.fileId+')',
			width:500,
			height:600,
			iconCls: 'op5-crmbase-dataformwindow-icon',
			animCollapse:false,
			border: false,
			items: [ dataformpanel ]
		}) ;
		
		var me = this ;
		dataformpanel.on('beforedestroy',function(destroyedpanel){
			if( destroyedpanel.up('window') ) {
				destroyedpanel.up('window').close() ;
			}
		});
	},
	
	switchToPanel: function( id ){
		var newPanelIdx = this.mainview.items.findIndexBy( function(o,k){
			if( o.panelType == id )
				return true ;
			else
				return false ;
		}) ;
		if( newPanelIdx == -1 )
			return ;
		var layout = this.mainview.getLayout(), activePanel = layout.activeItem, activePanelIdx = this.mainview.items.indexOf(activePanel) ;
		if(activePanelIdx !== newPanelIdx) {
				var newPanel = this.mainview.items.getAt(newPanelIdx) ;
				layout.setActiveItem(newPanelIdx);
		}
		this.fireViewChange() ;
	},
	fireViewChange: function() {
		var me = this,
			activeId = this.mainview.getLayout().getActiveItem().panelType ;
			
		me.fireEvent('viewchange',activeId) ;
	},
	
	exportExcel: function() {
		var me = this ;
		if( !me.gridpanel ) {
			return ;
		}
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_action: 'data_getFileGrid_exportXLS' ,
			file_code: this.fileId
		}) ;
		
		if( me.gridpanel.filters && me.gridpanel.filters.getFilterData().length > 0 ) {
			//console.log('Export Excel :') ;
			//console.dir(me.gridpanel.filters.buildQuery(me.gridpanel.filters.getFilterData())) ;
			
			delete exportParams[me.gridpanel.filters.paramPrefix];
			Ext.apply(exportParams,
				me.gridpanel.filters.buildQuery(me.gridpanel.filters.getFilterData())
			) ;
		}
		else {
			//console.log('Export Excel without filters') ;
		}
		
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	exportGallery: function() {
		var me = this ;
		if( !me.gridpanel ) {
			return ;
		}
		
		var exportParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_action: 'data_getFileGrid_exportGallery' ,
			file_code: this.fileId
		}) ;
		
		if( me.gridpanel.filters && me.gridpanel.filters.getFilterData().length > 0 ) {
			//console.log('Export Excel :') ;
			//console.dir(me.gridpanel.filters.buildQuery(me.gridpanel.filters.getFilterData())) ;
			
			delete exportParams[me.gridpanel.filters.paramPrefix];
			Ext.apply(exportParams,
				me.gridpanel.filters.buildQuery(me.gridpanel.filters.getFilterData())
			) ;
		}
		else {
			//console.log('Export Excel without filters') ;
		}
		
		var arrShownColumns = [] ;
		Ext.Array.each( me.gridpanel.columns, function(col) {
			if( !col.isHidden() ) {
				arrShownColumns.push(col.dataIndex) ;
			}
		},me) ;
		Ext.apply(exportParams, {
			columns: Ext.JSON.encode(arrShownColumns)
		}) ;
		
		
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