Ext.define('Optima5.Modules.CrmBase.BiblePanel' ,{
	extend: 'Ext.panel.Panel',
			  
	requires: [
		'Optima5.Modules.CrmBase.DataFormPanel',
		'Optima5.Modules.CrmBase.BiblePanelGmap'
	],
	
	optimaModule: null,
	bibleId: '' ,
			  
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:BiblePanel','No module reference ?') ;
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
		this.addEvents('load') ;
	},
			  
			  
	reconfigure: function( bibleId, bibleCfgObj ) {
		if( Ext.isObject(bibleCfgObj) ) {
			this.bibleId = bibleId ;
			this.reconfigureData( bibleCfgObj ) ;
			return ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action : 'data_getBibleCfg',
				bible_code : bibleId
			},
			success: function(response) {
				if( Ext.decode(response.responseText).success == true ) {
					this.bibleId = bibleId ;
					this.reconfigureData( Ext.decode(response.responseText).data ) ;
				}
				else {
					this.bibleId = '' ;
					this.reconfigureDummy(bibleId) ;
				}
			},
			scope: this
		});
	},
			  
	reconfigureData: function( ajaxData ) {
		this.removeAll() ;
		
		this.treegrid  = this.reconfigureDataBuildTree( ajaxData ) ;
		Ext.apply(this.treegrid,{
			border:true,
			flex: 1
		});
		
		this.gridstore = this.reconfigureDataBuildGridStore( ajaxData ) ;
		
		this.gridpanel = this.reconfigureDataBuildGrid( ajaxData , this.gridstore ) ;
		Ext.apply(this.gridpanel,{
			panelType: 'grid',
			border:false
		});
		
		this.mainview  = Ext.create('Ext.panel.Panel',{
			flex: 2,
			border:true,
			layout: {
				type: 'card',
				align: 'stretch',
				deferredRender: true
			},
			maintainFlex : true,
			activeItem : 0,
			//resizable : true ,
			items: [this.gridpanel,{
				xtype:'op5crmbasebiblegmap',
				border:false,
				panelType: 'gmap',
				store:this.gridstore,
				bibleId: this.bibleId
			}]
		});
		
		this.add( [this.treegrid,{xtype: 'splitter'},this.mainview] ) ;
	},
	
	getTreeModelName: function() {
		return 'BibleTree'+'-'+this.bibleId ;
	},
	reconfigureDataBuildTree: function( ajaxData ) {
		var authReadOnly = false;
		if( ajaxData.auth_status != null && ajaxData.auth_status.readOnly ) {
			authReadOnly = true ;
		}
		
		var treeModelName = this.getTreeModelName() ;
		
		// Création du modèle TREE
		var modelFields = new Array() ;
		var keyfield = '' ;
		Ext.Object.each( ajaxData.tree_fields , function(k,v) {
			// console.dir(v) ;
			if( !(v.tree_field_is_highlight) && false )
				return ;
			if( v.tree_field_is_key == true )
				keyfield = v.tree_field_code ;
			
			switch( v.tree_field_type )
			{
				case 'number' :
				case 'date' :
					var fieldType = v.tree_field_type ;
					break ;
					
				default :
					var fieldType = 'string' ;
					break ;
			}
			
			var fieldObject = new Object();
			Ext.apply(fieldObject,{
				name: v.tree_field_code,
				type: fieldType
			}) ;
			modelFields.push( fieldObject ) ;
		},this) ;
		Ext.define(treeModelName, {
			extend: 'Ext.data.Model',
			// idProperty: 'treenode_key',
			fields: modelFields
		});
		
		var treeroot = {iconCls:'task-folder',expanded:true,treenode_key:'&',allowDrop:true,allowDrag:false} ;
		treeroot[keyfield] = '<b>Bible</b>: '+ajaxData.define_bible.text ;
		var treestore = Ext.create('Ext.data.TreeStore', {
			model: treeModelName,
			// nodeParam: 'treenode_key',
			folderSort: true,
			root: treeroot,
			clearOnLoad: true,
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'data_getBibleTree' ,
					bible_code: this.bibleId
				}
			}),
			listeners: {
				load: {
					fn: this.onStoreLoad,
					scope: this
				}
			}
		});
		
		var treeColumns = new Array() ;
		Ext.Object.each( ajaxData.tree_fields , function(k,v) {
			// console.dir(v) ;
			if( !(v.tree_field_is_highlight) )
				return ;
			if( v.tree_field_is_key == true )
				keyfield = v.tree_field_code ;
			
			switch( v.tree_field_type )
			{
				default :
					break ;
			}
			
			var columnObject = new Object();
			Ext.apply(columnObject,{
            text: v.tree_field_lib,
            sortable: false,
            dataIndex: v.tree_field_code,
				menuDisabled: true,
				xtype:'gridcolumn'
			}) ;
			if( v.tree_field_is_key ){
				Ext.apply(columnObject,{
					xtype: 'treecolumn'
				}) ;
			}
			if( v.tree_field_type == 'link' ) {
				Ext.apply(columnObject,{
					renderer : function( value ) {
						if( value == '' || Ext.JSON.decode(value).length < 1 ){
							return '' ;
						}
						if( Ext.Array.contains( Ext.JSON.decode(value), '&' ) ) {
							return '<img src="images/op5img/ico_dataadd_16.gif"/>' + '&nbsp;(<b>' + v.tree_field_linkbible + '</b>)' ;
						}
						return '<img src="images/op5img/ico_dataadd_16.gif"/>' + '&nbsp;' + Ext.JSON.decode(value).join(' / ') ;
					}
				});
			}
			treeColumns.push( columnObject ) ;
		},this) ;
		
		var treegrid = Ext.create('Ext.tree.Panel',{
			store: treestore,
			collapsible: false,
			useArrows: false,
			rootVisible: true,
			multiSelect: false,
			singleExpand: false,
			// viewConfig:{toggleOnDblClick: false},
			columns: treeColumns,
			viewConfig: {
				plugins: {
					ptype: 'treeviewdragdrop',
					ddGroup:'setTreenode'+this.getId(),
					enableDrag:true,
					appendOnly:true,
					allowParentInsert:false,
					containerScroll: true
				},
				listeners:{
					beforedrop:function(node, data, dropRecord, dropPosition, dropHandlers){
						dropHandlers.wait = true ;
						
						if( data.records.length > 0 && dropRecord ) {
							var dragRecord = data.records[0] ;
							switch( Ext.getClassName(dragRecord) ) {
								case this.getGridModelName() :
									if( dropRecord.isRoot() ) {
										Ext.Msg.show({
											title:'Assign treenode',
											msg: 'Cannot assign bible entry on root node !' ,
											buttons: Ext.Msg.OK,
											icon: Ext.Msg.WARNING
										});
										return ;
									}
									
									var entryKeys = [],
										targetTreenode = dropRecord.get('treenode_key'),
										msg ;
									
									for( var recIdx=0 ; recIdx<data.records.length ; recIdx++ ) {
										entryKeys.push(data.records[recIdx].get('entry_key')) ;
									}
									
									if( entryKeys.length == 1 ) {
										msg = 'Assign <b>'+entryKeys[0]+'</b> to treenode <b>'+targetTreenode+'</b> ?' ;
									} else {
										msg = 'Assign <b>'+entryKeys.length+'</b> records to treenode <b>'+targetTreenode+'</b> ?' ;
									}
									
									Ext.Msg.show({
										title:'Assign treenode',
										msg: msg ,
										buttons: Ext.Msg.YESNO,
										fn:function(buttonId){
											if( buttonId == 'yes' ) {
												me.editEntryAssignTreenode(entryKeys,targetTreenode) ;
											}
										},
										scope:me
									});
									break ;
								
								case this.getTreeModelName() :
									var treenodeKey = data.records[0].get('treenode_key') ;
									var targetTreenode = dropRecord.get('treenode_key') ;
									var msg ;
									if( dropRecord.isRoot() ) {
										msg = 'Assign <b>'+treenodeKey+'</b> as child of <b>root</b> node ?' ;
									} else {
										msg = 'Assign <b>'+treenodeKey+'</b> as child of node <b>'+targetTreenode+'</b> ?' ;
									}
									Ext.Msg.show({
										title:'Assign treenode',
										msg: msg ,
										buttons: Ext.Msg.YESNO,
										fn:function(buttonId){
											if( buttonId == 'yes' ) {
												me.editTreenodeAssignParentTreenode(treenodeKey,targetTreenode) ;
											}
										},
										scope:me
									});
									break ;
								
								default :
									return true ;
							}
						}
						
						return true ;
					},
					scope:this
				}
			}
		});
		
		var me = this ;
		treegrid.on('itemclick', function( view, record, item, index, event ) {
			this.filterGridByTreenode( record.get('treenode_key') ) ;
		},me) ;
		
		treegrid.on('itemcontextmenu', function(view, record, item, index, event) {
			
			treeContextMenuItems = new Array() ;
			if( !authReadOnly ) {
				var mytext = 'New root node' ;
				if( record.get('treenode_key') != '&' )
					mytext = 'New subnode for <b>'+record.get('treenode_key')+'</b>' ;
				treeContextMenuItems.push({
					iconCls: 'icon-bible-new',
					text: mytext,
					handler : function() {
						// console.log( 'Create child node of '+record.get('treenode_key') ) ;
						me.editNodeNew( record.get('treenode_key') ) ;
					},
					scope : me
				});
			}
			if( record.get('treenode_key') != '&' ) {
				treeContextMenuItems.push({
					iconCls: 'icon-bible-edit',
					text: authReadOnly ? 'Open <b>'+record.get('treenode_key')+'</b> node' : 'Edit <b>'+record.get('treenode_key')+'</b> node',
					handler : function() {
						me.editNodeUpdate( record.get('treenode_key') ) ;
					},
					scope : me
				});
			}
			if( !authReadOnly && !(record.get('nb_entries') > 0) && !(record.get('nb_children') > 0) && record.get('treenode_key') != '&' ) {
				treeContextMenuItems.push({
					iconCls: 'icon-bible-delete',
					text: 'Delete <b>'+record.get('treenode_key')+'</b> Node',
					handler : function() {
						me.editNodeDelete( record.get('treenode_key') ) ;
					},
					scope : me
				});
			}
			if( !authReadOnly && record.get('treenode_key') != '&' ) {
				treeContextMenuItems.push('-') ;
				treeContextMenuItems.push({
					iconCls: 'icon-bible-newfile',
					text: 'New record on <b>'+record.get('treenode_key')+'</b> node </b>',
					handler : function() {
						me.editEntryNew( record.get('treenode_key') ) ;
					},
					scope : me
				});
			};
			
			var treeContextMenu = Ext.create('Ext.menu.Menu',{
				items : treeContextMenuItems,
				listeners: {
					hide: function(menu) {
						menu.destroy() ;
					}
				}
			}) ;
			
			treeContextMenu.showAt(event.getXY());
			
		},me) ;
		
		
		return treegrid ;
	},
	
	getGridModelName: function() {
		return 'BibleGrid'+'-'+this.bibleId ;
	},
	reconfigureDataBuildGridStore: function( ajaxData ) {
		var gridModelName = this.getGridModelName() ;
		
		// Création du modèle GRID
		var modelFields = new Array() ;
		var keyfield = '' ;
		Ext.Object.each( ajaxData.entry_fields , function(k,v) {
			// console.dir(v) ;
			if( !(v.entry_field_is_highlight) && false )
				return ;
			if( v.entry_field_is_key == true )
				keyfield = v.tree_field_code ;
			
			switch( v.entry_field_type )
			{
				case 'number' :
				case 'date' :
					var fieldType = v.entry_field_type ;
					break ;
					
				default :
					var fieldType = 'string' ;
					break ;
			}
			
			var fieldObject = new Object();
			Ext.apply(fieldObject,{
				name: v.entry_field_code,
				type: fieldType
			}) ;
			modelFields.push( fieldObject ) ;
		},this) ;
		Ext.define(gridModelName, {
			extend: 'Ext.data.Model',
			fields: modelFields
		});
		
		var gridstore = Ext.create('Ext.data.Store', {
			model: gridModelName,
			autoLoad: true,
			remoteSort: true,
			remoteFilter: true,
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'data_getBibleGrid' ,
					bible_code: this.bibleId
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
		});
		
		return gridstore ;
	},
			  
	reconfigureDataBuildGrid: function( ajaxData , gridstore ) {
		var authReadOnly = false;
		if( ajaxData.auth_status != null && ajaxData.auth_status.readOnly ) {
			authReadOnly = true ;
		}
		
		var keyfield = '' ;
		var gridColumns = new Array() ;
		Ext.Object.each( ajaxData.entry_fields , function(k,v) {
			// console.dir(v) ;
			if( !(v.entry_field_is_highlight) )
				return ;
			if( v.entry_field_is_key == true )
				keyfield = v.entry_field_code ;
			
			switch( v.entry_field_type )
			{
				default :
					break ;
			}
			
			var boolrenderer = function(value) {
				if( value==1 ) {
					return '<b>X</b>' ;
				}
				else {
					return '' ;
				}
			}
		
			var columnObject = new Object();
			Ext.apply(columnObject,{
            text: v.entry_field_lib,
            sortable: true,
				menuDisabled: true,
            dataIndex: v.entry_field_code,
				xtype:'gridcolumn'
			}) ;
			if( v.entry_field_type == 'bool' ) {
				Ext.apply(columnObject,{
					renderer: boolrenderer
				}) ;
			}
			if( v.entry_field_type == 'link' ) {
				Ext.apply(columnObject,{
					renderer : function( value ) {
						if( value == '' || Ext.JSON.decode(value).length < 1 ){
							return '' ;
						}
						if( Ext.Array.contains( Ext.JSON.decode(value), '&' ) ) {
							return '(<b>' + v.entry_field_linkbible + '</b>)' ;
						}
						return Ext.JSON.decode(value).join(' / ') ;
					}
				});
			}
			gridColumns.push( columnObject ) ;
		},this) ;
		
		
		
		
		var gridpanel = Ext.create('Ext.grid.Panel',{
			store: gridstore,
			columns: gridColumns,
			dockedItems: [{
				xtype: 'pagingtoolbar',
				store: gridstore,   // same store GridPanel is using
				dock: 'bottom',
				displayInfo: true
			}],
			selModel: {
				mode: 'MULTI'
			},
			viewConfig: {
				plugins: { ptype: 'gridviewdragdrop', ddGroup:'setTreenode'+this.getId(), enableDrop:false }
			}
		}) ;
		
		
		
		
		var me = this ;
		gridpanel.on('itemdblclick', function( view, record, item, index, event ) {
			me.editEntryUpdate( record.get('entry_key') ) ;
		},me) ;
		
		gridpanel.on('itemcontextmenu', function(view, record, item, index, event) {
			var gridContextMenuItems = new Array() ;
			
			var selRecords = view.getSelectionModel().getSelection() ;
			if( selRecords.length > 1 ) {
				if( !authReadOnly ) {
					var entryKeys = [] ;
					for( var recIdx=0 ; recIdx<selRecords.length ; recIdx++ ) {
						entryKeys.push( selRecords[recIdx].get('entry_key') ) ;
					}
					gridContextMenuItems.push({
						iconCls: 'icon-bible-delete',
						text: 'Delete <b>'+selRecords.length+'</b> records',
						handler : function() {
							
							me.editEntryDelete( entryKeys ) ;
						},
						scope : me
					});
				}
			} else {
				var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
				
				if( authReadOnly ) {
					gridContextMenuItems.push({
						iconCls: 'icon-bible-edit',
						text: 'Open <b>'+strHeader+'</b>',
						handler : function() {
							me.editEntryUpdate( record.get('entry_key') ) ;
						},
						scope : me
					});
				}
				if( !authReadOnly ) {
					gridContextMenuItems.push({
						iconCls: 'icon-bible-edit',
						text: 'Edit <b>'+strHeader+'</b>',
						handler : function() {
							me.editEntryUpdate( record.get('entry_key') ) ;
						},
						scope : me
					});
				}
				if( !authReadOnly ) {
					gridContextMenuItems.push({
						iconCls: 'icon-bible-delete',
						text: 'Delete <b>'+strHeader+'</b>',
						handler : function() {
							me.editEntryDelete( [record.get('entry_key')] ) ;
						},
						scope : me
					});
				}
			}
			
			var gridContextMenu = Ext.create('Ext.menu.Menu',{
				items : gridContextMenuItems,
				listeners: {
					hide: function(menu) {
						menu.destroy() ;
					}
				}
			}) ;
			
			gridContextMenu.showAt(event.getXY());
		},me) ;
		
		
		
		return gridpanel ;
	},
			  
			  
			  
	reconfigureDummy: function( bibleId ) {
		if( this.treegrid ) {
			this.treegrid.reconfigure( Ext.create('Ext.data.Store',{
				fields:['dummy']
			}),[]);
		}
		
		if( this.gridpanel ) {
			this.gridpanel.reconfigure( Ext.create('Ext.data.Store',{
				fields: ['dummy'],
				data  : [{
					dummy: 'Empty store.'
				}]
			}),[{
				header: bibleId+' not loaded !',  dataIndex: 'dummy',  flex: 1
			}]);
		}
	},
			  
	reload: function() {
		if( this.treegrid ) {
			this.treegrid.getStore().load() ;
		}
		if( this.gridstore ) {
			this.gridstore.load() ;
		}
	},
	onStoreLoad: function() {
		this.fireEvent('load',this) ;
	},
	isEmpty: function() {
		return ( !this.treegrid.getRootNode().hasChildNodes() && this.gridstore.getTotalCount() == 0 ) ;
	},
	
	filterGridByTreenode: function( treenodeKey ) {
		var parameters = new Object() ;
		Ext.apply(parameters,{
			filters: [ new Ext.util.Filter({
				property: 'treenode_key',
				value   : treenodeKey
			})]
		});
		if( this.gridstore ) {
			this.gridstore.filters.clear() ;
			this.gridstore.filters.addAll([new Ext.util.Filter({
				property: 'treenode_key',
				value   : treenodeKey
			})]) ;
			this.gridstore.loadPage(1);
		}
	},
			  
	editMaskSet: function( trueOfFalse ) {
		var me = this ;
		if( !me.saveMask ) {
			me.saveMask = Ext.create('Ext.LoadMask',{
				target: me,
				msg:'Wait...'
			}) ;
		}
		if( trueOfFalse === true ) {
			me.saveMask.show() ;
		}
		if( trueOfFalse === false ) {
			me.saveMask.hide() ;
		}
	},
			  
	editNodeNew: function( parentTreenodeKey ) {
		var me = this ;
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_editTransaction',
			_subaction: 'init',
			data_type: 'bible_treenode',
			bible_code: this.bibleId,
			is_new: true,
			treenode_parent_key: parentTreenodeKey
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
					this.openEditFormWindow( {isNew:true}, Ext.decode(response.responseText).transaction_id, readOnly ) ;
				}
			},
			scope: this
		});
	},
	editNodeUpdate: function( treenodeKey ) {
		var me = this ;
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_editTransaction',
			_subaction: 'init',
			data_type: 'bible_treenode',
			bible_code: this.bibleId,
			is_new: false,
			treenode_key: treenodeKey
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
					this.openEditFormWindow( {isNew:false,biblerecordId:treenodeKey}, Ext.decode(response.responseText).transaction_id, readOnly ) ;
				}
			},
			scope: this
		});
	},
	editNodeDelete: function( treenodeKey ) {
		var me = this ;
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_deleteRecord',
			data_type: 'bible_treenode',
			bible_code: this.bibleId,
			treenode_key: treenodeKey
		});
		var me = this ;
		me.editMaskSet(true) ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				me.editMaskSet(false) ;
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.optimaModule.postCrmEvent('datachange',{
						dataType: 'bible',
						bibleId: me.bibleId,
						fileId: null
					});
				}
			},
			scope: me
		});
	},
	editEntryNew: function( treenodeKey ) {
		var me = this ;
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_editTransaction',
			_subaction: 'init',
			data_type: 'bible_entry',
			bible_code: this.bibleId,
			is_new: true,
			treenode_key: treenodeKey
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
					this.openEditFormWindow( {isNew:true}, Ext.decode(response.responseText).transaction_id, readOnly ) ;
				}
			},
			scope: this
		});
	},
	editEntryUpdate: function( entryKey ) {
		var me = this ;
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_editTransaction',
			_subaction: 'init',
			data_type: 'bible_entry',
			bible_code: this.bibleId,
			is_new: false,
			entry_key: entryKey
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
					this.openEditFormWindow( {isNew:false,biblerecordId:entryKey}, Ext.decode(response.responseText).transaction_id, readOnly ) ;
				}
			},
			scope: this
		});
	},
	editEntryDelete: function( entryKeys ) {
		var me = this ;
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_deleteRecord',
			data_type: 'bible_entry',
			bible_code: this.bibleId,
			entry_keys: Ext.JSON.encode(entryKeys)
		});
		var me = this ;
		me.editMaskSet(true) ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				me.editMaskSet(false) ;
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.optimaModule.postCrmEvent('datachange',{
						dataType: 'bible',
						bibleId: me.bibleId,
						fileId: null
					});
				}
			},
			scope: me
		});
	},
			  
	editEntryAssignTreenode: function( entryKeys, targetTreenodeKey ) {
		var me = this ;
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_bibleAssignTreenode',
			bible_code: this.bibleId,
			entry_keys: Ext.JSON.encode(entryKeys),
			target_treenode_key: targetTreenodeKey
		});
		var me = this ;
		me.editMaskSet(true) ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				me.editMaskSet(false) ;
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.optimaModule.postCrmEvent('datachange',{
						dataType: 'bible',
						bibleId: me.bibleId,
						fileId: null
					});
				}
			},
			scope: me
		});
	},
	editTreenodeAssignParentTreenode: function( treenodeKey, parentTreenodeKey ) {
		var me = this ;
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_bibleAssignParentTreenode',
			bible_code: this.bibleId,
			treenode_key: treenodeKey,
			target_treenode_key: parentTreenodeKey
		});
		var me = this ;
		me.editMaskSet(true) ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				me.editMaskSet(false) ;
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.optimaModule.postCrmEvent('datachange',{
						dataType: 'bible',
						bibleId: me.bibleId,
						fileId: null
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
			transactionDataType: 'bible',
			transactionBibleId: me.bibleId,
			readOnly: readOnly
		}) ;
		me.optimaModule.createWindow({
			title: (editDetails.isNew? 'New':'#'+editDetails.biblerecordId)+' ('+me.bibleId+')',
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
	}
	
	
});
