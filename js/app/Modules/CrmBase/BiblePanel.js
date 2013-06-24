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
			items: [this.mainview]
		});
		
		this.callParent(arguments);
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
		
		this.gridstore = this.reconfigureDataBuildGridStore( ajaxData ) ;
		
		this.gridpanel = this.reconfigureDataBuildGrid( ajaxData , this.gridstore ) ;
		Ext.apply(this.gridpanel,{
			panelType: 'grid'
		});
		
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
				xtype:'op5crmbasebiblegmap',
				panelType: 'gmap',
				store:this.gridstore,
				bibleId: this.bibleId
			}]
		});
		
		this.add( [this.treegrid,{xtype: 'splitter'},this.mainview] ) ;
	},
	
	reconfigureDataBuildTree: function( ajaxData ) {
		var authReadOnly = false;
		if( ajaxData.auth_status != null && ajaxData.auth_status.readOnly ) {
			authReadOnly = true ;
		}
		
		var treeModelName = 'BibleTree'+'-'+this.bibleId ;
		
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
		
		var treeroot = {iconCls:'task-folder',expanded:true,treenode_key:'&',allowDrop:false} ;
		treeroot[keyfield] = '<b>Bible</b>: '+ajaxData.define_bible.text ;
		var treestore = Ext.create('Ext.data.TreeStore', {
			model: treeModelName,
			// nodeParam: 'treenode_key',
			folderSort: true,
			root: treeroot,
			//clearOnLoad: false,
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'data_getBibleTree' ,
					bible_code: this.bibleId
				}
			})
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
			flex: 1,
			collapsible: false,
			useArrows: false,
			rootVisible: true,
			multiSelect: false,
			singleExpand: false,
			// viewConfig:{toggleOnDblClick: false},
			columns: treeColumns,
			listeners: {
				scrollershow: function(scroller) {
					if (scroller && scroller.scrollEl) {
						scroller.clearManagedListeners(); 
						scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
					}
				}
			},
			viewConfig: {
				plugins: {
					ptype: 'treeviewdragdrop',
					ddGroup:'setTreenode',
					enableDrag:false,
					appendOnly:true,
					allowParentInsert:false
				},
				listeners:{
					beforedrop:function(node, data, dropRecord, dropPosition, dropHandlers){
						dropHandlers.wait = true ;
						
						if( data.records.length > 0 && dropRecord ) {
							var entryKey = data.records[0].get('entry_key') ;
							var targetTreenode = dropRecord.get('treenode_key') ;
						
							Ext.Msg.show({
								title:'Assign treenode',
								msg: 'Assign <b>'+entryKey+'</b> to treenode <b>'+targetTreenode+'</b> ?' ,
								buttons: Ext.Msg.YESNO,
								fn:function(buttonId){
									if( buttonId == 'yes' ) {
										me.editEntryAssignTreenode(entryKey,targetTreenode) ;
									}
								},
								scope:me
							});
						}
						
						return true ;
					},
					scope:me
				}
			}
		});
		
		var me = this ;
		treegrid.on('itemclick', function( view, record, item, index, event ) {
			var selRecords = this.treegrid.getSelectionModel().getSelection() ;
			//console.log( selRecords[0].get('treenode_key') ) ;
			//console.log( record.get('treenode_key') ) ;
			this.filterGridByTreenode( selRecords[0].get('treenode_key') ) ;
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
				items : treeContextMenuItems
			}) ;
			
			treeContextMenu.showAt(event.getXY());
			
		},me) ;
		
		
		return treegrid ;
	},
	reconfigureDataBuildGridStore: function( ajaxData ) {
		var gridModelName = 'BibleGrid'+'-'+this.bibleId ;
		
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
				case 'numeric' :
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
			//folderSort: true,
			//root: treeroot,
			//clearOnLoad: false,
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
			})
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
			
			var columnObject = new Object();
			Ext.apply(columnObject,{
            text: v.entry_field_lib,
            sortable: true,
				menuDisabled: true,
            dataIndex: v.entry_field_code,
				xtype:'gridcolumn'
			}) ;
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
			listeners: {
				scrollershow: function(scroller) {
					if (scroller && scroller.scrollEl) {
						scroller.clearManagedListeners(); 
						scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
					}
				}
			},
			viewConfig: {
				plugins: { ptype: 'gridviewdragdrop', ddGroup:'setTreenode', enableDrop:false }
			}
		}) ;
		
		
		
		
		var me = this ;
		gridpanel.on('itemdblclick', function( view, record, item, index, event ) {
			var selRecords = this.gridpanel.getSelectionModel().getSelection() ;
			me.editEntryUpdate( selRecords[0].get('entry_key') ) ;
		},me) ;
		
		gridpanel.on('itemcontextmenu', function(view, record, item, index, event) {
			var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
			
			
			gridContextMenuItems = new Array() ;
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
						me.editEntryDelete( record.get('entry_key') ) ;
					},
					scope : me
				});
			}
			
			var gridContextMenu = Ext.create('Ext.menu.Menu',{
				items : gridContextMenuItems
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
			me.saveMask = Ext.create('Ext.LoadMask',me,{msg:'Wait...'}) ;
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
	editEntryDelete: function( entryKey ) {
		var me = this ;
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_deleteRecord',
			data_type: 'bible_entry',
			bible_code: this.bibleId,
			entry_key: entryKey
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
			  
	editEntryAssignTreenode: function( entryKey, targetTreenodeKey ) {
		var me = this ;
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'data_bibleAssignTreenode',
			bible_code: this.bibleId,
			entry_key: entryKey,
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
			  
	openEditFormWindow: function(editDetails,transactionId,readOnly) {
		var me = this ;
		var dataformpanel = Ext.create('Optima5.Modules.CrmBase.DataFormPanel',{
			optimaModule: me.optimaModule,
			transactionID: transactionId,
			transactionDataType: 'bible',
			transactionBibleId: me.bibleId,
			authReadOnly: readOnly
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
