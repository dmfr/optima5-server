Ext.define('Optima5.Modules.ParaCRM.FilePanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5paracrmfile',
			  
	requires: [
		'Ext.form.*',
		'Ext.data.*',
		'Ext.grid.*',
		'Ext.tree.*',
		'Optima5.Modules.ParaCRM.DataFormPanel',
		'Optima5.Modules.ParaCRM.FilePanelGmap',
		'Optima5.Modules.ParaCRM.FilePanelGallery',
		'Ext.ux.grid.FiltersFeature',
		'Optima5.Modules.ParaCRM.BibleFilter',
		'Optima5.Modules.ParaCRM.BibleTreeFilter'
	],
			  
	fileId: '' ,
			  
			  
	initComponent: function() {
		
		this.gridpanel = Ext.create('Ext.grid.Panel',{
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
			
			items: [this.mainview],
			 
			listeners : {
				reloadiffile: {
					fn: this.onReloadIfFile,
					scope : this
				}
			}
		});
		
		this.callParent(arguments);
	},
			  
			  
	reconfigure: function( fileId ) {
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: {
				_moduleName: 'paracrm',
				_action : 'data_getFileGrid_config',
				file_code : fileId
			},
			succCallback: function(response) {
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
		this.removeAll() ;
		
		this.gridstore = this.reconfigureDataBuildStore( ajaxData ) ;
		this.gridpanel = this.reconfigureDataBuildGrid( ajaxData, this.gridstore ) ;
		Ext.apply(this.gridpanel,{
			panelType: 'grid'
		}) ;
		
		this.mainview  = Ext.create('Ext.panel.Panel',{
			flex: 2,
			layout: {
				type: 'card',
				align: 'stretch',
				deferredRender: true
			},
			maintainFlex : true,
			activeItem : 0,
			//resizable : true ,
			items: [this.gridpanel,{
				xtype:'op5paracrmfilegmap',
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
				xtype:'op5paracrmfilegallery',
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
		
		var gridstore = Ext.create('Ext.data.Store', {
			model: gridModelName,
			//folderSort: true,
			//root: treeroot,
			//clearOnLoad: false,
			remoteSort: true,
			autoLoad: true,
			proxy: {
				type: 'ajax',
				url: 'server/backend.php',
				extraParams : {
					_sessionName: op5session.get('session_id'),
					_moduleName: 'paracrm' ,
					_action: 'data_getFileGrid_data' ,
					file_code: this.fileId
				},
				actionMethods: {
					read:'POST'
				},
				reader: {
					type: 'json',
					root: 'data',
					totalProperty: 'total'
				}
			}
		});
		
		return gridstore ;
	},
	
	reconfigureDataBuildGrid: function( ajaxData, gridstore ) {
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
							type: 'op5paracrmbibletree',
							bibleId: v.link_bible
						}
					}) ;
				}
				
				if( v.link_bible_type == 'entry' ) {
					Ext.apply(columnObject,{
						filter: {
							type: 'op5paracrmbible',
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
		
		
		var filtersParams = {
			ftype: 'filters',
			encode: true
			// encode and local configuration options defined previously for easier reuse
			/*
			encode: encode, // json encode the filter query
			local: local   // defaults to false (remote filtering)
			*/

			// Filters are most naturally placed in the column definition, but can also be
			// added here.
			/*
			filters: [
					{
						type: 'boolean',
						dataIndex: 'visible'
					}
			]*/
		};
		
		
		var gridpanel = Ext.create('Ext.grid.Panel',{
			store: gridstore,
			columns: gridColumns,
			features: [ filtersParams ],
			dockedItems: [{
				xtype: 'pagingtoolbar',
				store: gridstore,   // same store GridPanel is using
				dock: 'bottom',
				displayInfo: true
			}],
			listeners: {
				scrollershow: function(scroller) {
					if (scroller && scroller.scrollEl) {
						scroller.clearManagedListeners(); 
						scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
					}
				}
			}
		}) ;
		
		
		var me = this ;
		if( !noActions ){
			gridpanel.on('itemdblclick', function( view, record, item, index, event ) {
				var selRecords = this.gridpanel.getSelectionModel().getSelection() ;
				me.editRecordUpdate( selRecords[0].get(keyfield) ) ;
				//console.log( keyfield + ' is ' + selRecords[0].get(keyfield) ) ;
			},me) ;
			
			gridpanel.on('itemcontextmenu', function(view, record, item, index, event) {
				// var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
				
				
				gridContextMenuItems = new Array() ;
				if( true ) {
					gridContextMenuItems.push({
						iconCls: 'icon-bible-edit',
						text: 'Edit record',
						handler : function() {
							me.editRecordUpdate( record.get(keyfield) ) ;
						},
						scope : me
					});
				}
				if( true ) {
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
				if( !noNew ) {
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
					items : gridContextMenuItems
				}) ;
				
				gridContextMenu.showAt(event.getXY());
			},me) ;
			
			gridpanel.on('containercontextmenu',function(view,event) {
				gridContextMenuItems = new Array() ;
				if( !noNew ) {
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
					items : gridContextMenuItems
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
	},
	onReloadIfFile: function(fileId) {
		//console.log('Asked to reload if curFile is '+fileId) ;
		if( this.isVisible() && (this.fileId == fileId) ) {
			this.reload() ;
		}
	},
			  
	editRecordNew: function( treenodeKey ) {
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'data_editTransaction',
			_subaction: 'init',
			data_type: 'file_record',
			file_code: this.fileId,
			is_new: true
		});
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					this.openEditFormWindow( {}, Ext.decode(response.responseText).transaction_id ) ;
				}
			},
			scope: this
		});
	},
	editRecordUpdate: function( filerecordId ) {
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'data_editTransaction',
			_subaction: 'init',
			data_type: 'file_record',
			file_code: this.fileId,
			is_new: false,
			filerecord_id: filerecordId
		});
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					this.openEditFormWindow( {}, Ext.decode(response.responseText).transaction_id ) ;
				}
			},
			scope: this
		});
	},
	editRecordDelete: function( filerecordId ) {
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'data_deleteRecord',
			data_type: 'file_record',
			file_code: this.fileId,
			filerecord_id: filerecordId
		});
		var me = this ;
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					Ext.each( Ext.ComponentQuery.query('window > panel'), function(obj) {
						if( Ext.getClassName(obj) == 'Optima5.Modules.ParaCRM.FilePanel' ) {
							obj.fireEvent('reloadiffile',me.fileId) ;
						}
					},me) ;
				}
			},
			scope: me
		});
	},
			  
	openEditFormWindow: function(editDetails,transactionId) {
		var baseAjaxParams = new Object() ;
		Ext.apply( baseAjaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'data_editTransaction',
			_transaction_id : transactionId
		});
		
		var dataformpanel = Ext.create('Optima5.Modules.ParaCRM.DataFormPanel',{
			ajaxBaseParams: baseAjaxParams
		}) ;
		var dataformpanelWindow = op5desktop.getDesktop().createWindow({
			title:'DataFormPanel(Rename!!)',
			width:500,
			height:600,
			iconCls: 'parapouet',
			animCollapse:false,
			border: false,

			layout: {
				type: 'card',
				align: 'stretch'
			},
			items: [ dataformpanel ]
		}) ;
		dataformpanelWindow.show() ;
		
		var me = this ;
		dataformpanel.on('transactionend',function(){
			Ext.each( Ext.ComponentQuery.query('window > panel'), function(obj) {
				if( Ext.getClassName(obj) == 'Optima5.Modules.ParaCRM.FilePanel' ) {
					obj.fireEvent('reloadiffile',me.fileId) ;
				}
			},me) ;
		});
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
	},
	
	exportExcel: function() {
		var me = this ;
		if( !me.gridpanel ) {
			return ;
		}
		
		var exportParams = {} ;
		Ext.apply(exportParams,{
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
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
			requestAction: 'server/backend.php',
			requestMethod: 'POST'
		}) ;
	},
	exportGallery: function() {
		var me = this ;
		if( !me.gridpanel ) {
			return ;
		}
		
		var exportParams = {} ;
		Ext.apply(exportParams,{
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
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
			requestAction: 'server/backend.php',
			requestMethod: 'POST'
		}) ;
	}
	
});