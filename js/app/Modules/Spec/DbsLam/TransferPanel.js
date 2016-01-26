Ext.define('DbsLamTransferTreeModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'display_txt', string: 'string'},
		{name: 'type', type:'string'},
		{name: 'transfer_filerecord_id', type:'int'},
		{name: 'status_is_ok', type:'boolean'},
		{name: 'whse_src', type:'string'},
		{name: 'whse_dest', type:'string'}
	]
});

Ext.define('DbsLamTransferStepModel',{
	extend: 'Ext.data.Model',
	idProperty: 'step_code',
	fields: [
		{name: 'step_code', type:'string'},
		{name: 'status_is_ok', type: 'boolean'},
		{name: 'status_is_previous', type: 'boolean'},
		{name: 'src_adr_entry', type:'string', useNull:true},
		{name: 'src_adr_treenode', type:'string', useNull:true},
		{name: 'src_adr_display', type:'string'},
		{name: 'dest_adr_entry', type:'string', useNull:true},
		{name: 'dest_adr_treenode', type:'string', useNull:true},
		{name: 'dest_adr_display', type:'string'},
		{name: 'commit_user', type: 'string'},
		{name: 'commit_date', type: 'string'}
	]
});
Ext.define('DbsLamTransferGridModel',{
	extend: 'Ext.data.Model',
	idProperty: 'transferlig_filerecord_id',
	fields: [
		{name: 'transfer_filerecord_id', type:'int'},
		{name: 'transferlig_filerecord_id', type:'int'},
		{name: 'status', type:'boolean'},
		{name: 'status_is_ok', type:'boolean'},
		{name: 'status_is_reject', type:'boolean'},
		{name: 'step_code', type:'string'},
		{name: 'tree_adr', type:'string'},
		{name: 'src_adr', type:'string'},
		{name: 'current_adr', type: 'string'},
		{name: 'current_adr_tmp', type:'boolean'},
		{name: 'current_adr_entryKey', type:'string'},
		{name: 'current_adr_treenodeKey', type:'string'},
		{name: 'stk_prod', type:'string'},
		{name: 'stk_batch', type:'string'},
		{name: 'stk_sn', type:'string'},
		{name: 'mvt_qty', type:'number', allowNull:true},
		{name: 'reject_arr', type:'auto'}
	],
	hasMany: [{
		model: 'DbsLamTransferStepModel',
		name: 'steps',
		associationKey: 'steps'
	}]
});
Ext.define('DbsLamTransferOneModel',{
	extend: 'Ext.data.Model',
	idProperty: 'transfer_filerecord_id',
	fields: [
		{name: 'transfer_filerecord_id', type:'int'},
		{name: 'transfer_txt', type:'string'},
		{name: 'flow_code', type:'string'},
		{name: 'status_is_ok', type:'string'},
		{name: 'whse_src', type:'string'},
		{name: 'whse_dest', type:'string'}
	],
	hasMany: [{
		model: 'DbsLamTransferGridModel',
		name: 'ligs',
		associationKey: 'ligs'
	}]
}) ;


Ext.define('Optima5.Modules.Spec.DbsLam.TransferPanel',{
	extend:'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.DbsLam.TransferCreateForm'],
	
	initComponent: function() {
		this.tmpGridModelName = 'DbsLamTransferGridModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpGridModelName ) ;
		}) ;
		this.tmpGridTreeModelName = 'DbsLamTransferGridTreeModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpGridTreeModelName ) ;
		}) ;
		
		Ext.apply(this, {
			layout: 'border',
			items: [{
				flex: 2,
				region: 'center',
				itemId: 'pCenter',
				border: false,
				xtype: 'panel',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				tbar:[{
					icon: 'images/op5img/ico_back_16.gif',
					text: '<u>Back</u>',
					handler: function(){
						this.doQuit() ;
					},
					scope: this
				},'-',Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'WHSE',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: '<i>Origin</i>',
					itemId: 'btnWhseSrc',
					optimaModule: this.optimaModule,
					value: 'STW' // HACK
				}),{
					icon: 'images/op5img/ico_arrow-double_16.png',
					disabled: true,
					style: {opacity: 1}
				},Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'WHSE',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: '<i>Destination</i>',
					itemId: 'btnWhseDest',
					optimaModule: this.optimaModule,
					value: 'MIT' // HACK
				}),'-',{
					itemId: 'tbCreate',
					icon: 'images/op5img/ico_new_16.gif',
					text: '<b>New doc.</b>',
					handler: function() {
						this.openCreatePopup() ;
					},
					scope: this
				},'-',{
					hidden:true,
					itemId: 'tbAdd',
					iconCls: 'op5-spec-dbslam-transfer-add',
					text: '<b>Build/Pick</b>',
					handler: function() {
						this.openStockPopup() ;
					},
					scope: this
				},{
					hidden:true,
					itemId: 'tbPrint',
					icon: 'images/op5img/ico_print_16.png',
					text: '<b>Print</b>',
					handler: function() {
						this.openPrintPopup() ;
					},
					scope: this
				}],
				items: [{xtype:'component',cls: 'ux-noframe-bg', flex:1}]
			},{
				region: 'south',
				flex: 1,
				xtype: 'panel',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				itemId:'pSouth',
				collapsible:true,
				collapsed: true,
				_empty:true,
				listeners:{
					beforeexpand:function(eastpanel) {
						if( eastpanel._empty ) {
							return false;
						}
					},
					collapse: function(eastpanel) {
						eastpanel._empty=true;
					},
					scope:this
				}
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		
		this.updateToolbar() ;
		this.doConfigure() ;
	},
	updateToolbar: function() {
		if( this.down('#pCenter').down('#pTree') ) {
			var treepanel = this.down('#pCenter').down('#pTree'),
				selectedNodes = treepanel.getView().getSelectionModel().getSelection(),
				isDocSelected = (selectedNodes.length==1 && selectedNodes[0].get('type')=='transfer') ;
			this.down('toolbar').down('#tbAdd').setVisible(isDocSelected) ;
			this.down('toolbar').down('#tbPrint').setVisible(isDocSelected) ;
		}
	},
	doConfigure: function() {
		var pCenter = this.down('#pCenter') ;
		
		
		var pushModelfields = [], atrAdrColumns = [], atrStockColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			var fieldColumn = {
				locked: true,
				text: attribute.atr_txt,
				dataIndex: attribute.mkey,
				width: 75
			} ;
			if( attribute.ADR_fieldcode ) {
				atrAdrColumns.push(fieldColumn) ;
			}
			if( attribute.STOCK_fieldcode ) {
				atrStockColumns.push(fieldColumn) ;
			}
			
			pushModelfields.push({
				name: attribute.mkey,
				type: 'string'
			});
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( this.tmpGridModelName ) ;
		Ext.define(this.tmpGridModelName, {
			extend: 'DbsLamTransferGridModel',
			fields: pushModelfields,
			hasMany: [{
				model: 'DbsLamTransferStepModel',
				name: 'steps',
				associationKey: 'steps'
			}]
		});
		
		Ext.ux.dams.ModelManager.unregister( this.tmpGridTreeModelName ) ;
		Ext.define(this.tmpGridTreeModelName, {
			extend: 'DbsLamTransferGridModel',
			fields: pushModelfields,
			idProperty: 'id'
		});
		
		var gridColumns = {
			defaults: {
				menuDisabled: true,
				draggable: false,
				sortable: false,
				hideable: false,
				resizable: false,
				groupable: false,
				lockable: false
			},
			items: [{
				text: '',
				width: 24,
				renderer: function(v,metadata,record) {
					if( record.get('status_is_reject') ) {
						metadata.tdCls = 'op5-spec-dbslam-stock-notavail'
					} else if( !record.get('status_is_ok') ) {
						metadata.tdCls = 'op5-spec-dbslam-stock-wait'
					} else {
						metadata.tdCls = 'op5-spec-dbslam-stock-avail'
					}
				}
			},{
				text: '<b>Status</b>',
				dataIndex: 'step_code',
				width: 65,
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: '<b>Source Location</b>',
				dataIndex: 'src_adr',
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: 'Stock Attributes',
				columns: atrStockColumns
			},{
				text: '<b>SKU details</b>',
				columns: [{
					dataIndex: 'stk_prod',
					text: 'Article',
					width: 100
				},{
					dataIndex: 'stk_batch',
					text: 'BatchCode',
					width: 100
				},{
					dataIndex: 'mvt_qty',
					text: 'Qty disp',
					align: 'right',
					width: 75
				},{
					dataIndex: 'stk_sn',
					text: 'Serial',
					width: 100
				}]
			},{
				text: '<b>Dest Location</b>',
				dataIndex: 'current_adr',
				renderer: function(v,metaData,record) {
					if( record.get('status_is_ok') ) {
						return '<b>'+v+'</b>' ;
					} else {
						return '<i>'+v+'</i>' ;
					}
				}
			}]
		};
		var gridTreeColumns = {
			defaults: {
				menuDisabled: true,
				draggable: false,
				sortable: false,
				hideable: false,
				resizable: false,
				groupable: false,
				lockable: false
			},
			items: [{
				xtype: 'treecolumn',
				text: '<b>Location</b>',
				dataIndex: 'tree_adr',
				width: 200,
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: '<b>Status</b>',
				dataIndex: 'step_code',
				width: 65,
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: 'Stock Attributes',
				columns: atrStockColumns
			},{
				text: '<b>SKU details</b>',
				columns: [{
					dataIndex: 'stk_prod',
					text: 'Article',
					width: 100
				},{
					dataIndex: 'stk_batch',
					text: 'BatchCode',
					width: 100
				},{
					dataIndex: 'mvt_qty',
					text: 'Qty disp',
					align: 'right',
					width: 75
				},{
					dataIndex: 'stk_sn',
					text: 'Serial',
					width: 100
				}]
			}]
		};
		
		pCenter.removeAll() ;
		pCenter.add({
			border: 1,
			width: 240,
			xtype: 'treepanel',
			itemId: 'pTree',
			store: {
				model: 'DbsLamTransferTreeModel',
				root:{},
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			collapsible: false,
			useArrows: false,
			rootVisible: true,
			multiSelect: false,
			singleExpand: false,
			columns: {
				defaults: {
					menuDisabled: false,
					draggable: false,
					sortable: false,
					hideable: false,
					resizable: false,
					groupable: false,
					lockable: false
				},
				items: [{
					xtype:'treecolumn',
					dataIndex: 'display_txt',
					text: 'Document ID',
					width: 120
				},{
					dataIndex: 'status_is_ok',
					text: '<b>Status</b>',
					width: 70,
					renderer: function(v,metaData,record) {
						if( v ) {
							metadata.tdCls = 'op5-spec-dbslam-stock-ok'
						}
					}
				}]
			},
			listeners: {
				itemcontextmenu: this.onTreeContextMenu,
				selectionchange: function() {
					this.updateToolbar();
					this.doGridReload();
				},
				scope: this
			}
		},{
			xtype: 'tabpanel',
			flex:1,
			border: false,
			items: [{
				title: 'List',
				xtype:'gridpanel',
				itemId: 'pGrid',
				store: {
					model: this.tmpGridModelName,
					autoLoad: true,
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_dbs_lam',
							_action: 'transfer_getTransferLig'
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					}),
					listeners: {
						beforeload: this.onGridBeforeLoad,
						load: this.onGridLoad,
						scope: this
					}
				},
				selModel: {
					mode: 'MULTI'
				},
				columns: gridColumns,
				plugins: [{
					ptype: 'bufferedrenderer',
					pluginId: 'bufferedRenderer',
					synchronousRender: true
				}],
				listeners: {
					render: this.doConfigureOnGridRender,
					itemclick: this.onGridItemClick,
					itemcontextmenu: this.onGridContextMenu,
					scope: this
				},
				viewConfig: {
					preserveScrollOnRefresh: true,
					getRowClass: function(record) {
					},
					listeners: {
						beforerefresh: function(view) {
							view.isRefreshing = true ;
						},
						refresh: function(view) {
							view.isRefreshing = false ;
						}
					}
				}
			},{
				title: 'Tree/Location',
				xtype: 'treepanel',
				itemId: 'pGridTree',
				store: {
					model: this.tmpGridTreeModelName,
					root:{},
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				},
				collapsible: false,
				useArrows: false,
				rootVisible: false,
				multiSelect: false,
				singleExpand: false,
				columns: gridTreeColumns
			}]
		}) ;
		
		// Build tree
		this.doTreeLoad() ;
	},
	doConfigureOnGridRender: function(grid) {
		var me = this ;
		
		var gridPanelDropTargetEl =  grid.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'DbsLamStockDD',
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					grid.body.stopAnimation();
					grid.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
					var srcStockFilerecordIds = [] ;
					Ext.Array.each( ddSource.dragData.records, function(selectedRecord) {
						if( selectedRecord.get('inv_id') ) {
							srcStockFilerecordIds.push( selectedRecord.get('inv_id') ) ; 
						}
					});
					if( srcStockFilerecordIds.length > 0 ) {
						me.handleDropStock(srcStockFilerecordIds) ;
					}
			}
		});
	},
	
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.onDataChange() ;
				break ;
			default: break ;
		}
	},
	onDataChange: function() {
		if( this.isVisible() ) {
			this.doGridReload() ;
		} else {
			this.on('activate',function(){this.onDataChange();}, this, {single:true}) ;
		}
	},
	onTreeContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		if( selRecords.length != 1 || selRecords[0].get('type') != 'transfer' ) {
			return ;
		}
		var selRecord = selRecords[0];
		
		gridContextMenuItems.push({
			iconCls: 'icon-bible-delete',
			text: 'Delete <b>'+selRecord.get('display_txt')+'</b> doc',
			handler : function() {
				this.handleDeleteDoc( selRecord.get('transfer_filerecord_id') ) ;
			},
			scope : this
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
	},
	onGridContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		
		var entryKeys = [] ;
		for( var recIdx=0 ; recIdx<selRecords.length ; recIdx++ ) {
			entryKeys.push( selRecords[recIdx].get('transferlig_filerecord_id') ) ;
		}
		gridContextMenuItems.push({
			iconCls: 'icon-bible-delete',
			text: 'Remove <b>'+selRecords.length+'</b> rows',
			handler : function() {
				this.handleRemoveLigs( entryKeys ) ;
			},
			scope : this
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
	},
	onGridItemClick: function(view,record) {
		this.setFormRecord(record) ;
	},
	
	
	doTreeLoad: function() {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_getTransfer'
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				
				var transferChildren = [] ;
				Ext.Array.each( ajaxResponse.data, function(transferDoc) {
					transferChildren.push({
						leaf: true,
						type: 'transfer',
						display_txt: transferDoc.transfer_txt,
						transfer_filerecord_id: transferDoc.transfer_filerecord_id,
						step_code: transferDoc.step_code,
						whse_src: transferDoc.whse_src,
						whse_dest: transferDoc.whse_dest
					}) ;
				}) ;
				
				var treepanel = this.down('#pCenter').down('#pTree') ;
				treepanel.getStore().setRootNode({
					root: true,
					iconCls:'task-folder',
					expanded:true,
					display_txt: '<b>Transfers</b>',
					children: transferChildren
				}) ;
			},
			scope: this
		}) ;
	},
	
	doGridReload: function() {
		var gridpanel = this.down('#pCenter').down('#pGrid') ;
		gridpanel.getStore().load() ;
	},
	onGridBeforeLoad: function(store,options) {
		var treepanel = this.down('#pCenter').down('#pTree'),
			selectedNodes = treepanel.getView().getSelectionModel().getSelection() ;
		var params = {} ;
		
		Ext.apply(params,{
			//whse_code: this.whseCode
		}) ;
		
		if( selectedNodes.length == 1 && !(selectedNodes[0].isRoot()) ) {
			Ext.apply(params,{
				filter_transferFilerecordId: selectedNodes[0].get('transfer_filerecord_id')
			}) ;
		}
		
		options.setParams(params) ;
		
		this.down('#pCenter').down('#pGridTree').setRootNode({root:true}) ;
	},
	onGridLoad: function(store) {
		// buildTree
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'data_getBibleTreeOne',
				bible_code: 'ADR'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				var dataRoot = ajaxResponse.dataRoot ;
				this.onGridLoadBuildTree(dataRoot,store) ;
			},
			scope: this
		}) ;
	},
	onGridLoadBuildTree: function(dataRoot,gridStore) {
		var treeStore = Ext.create('Ext.data.TreeStore',{
			model: 'DbsLamLiveTreeModel',
			data: dataRoot,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		
		//qualify records
		var map_treeAdr_childrenAdr = {} ;
		var map_treeAdr_gridRows = {} ;
		gridStore.each( function(gridRecord) {
			var gridRow = Ext.clone(gridRecord.getData()),
				treeAdr ;
			
			if( !gridRecord.get('current_adr_tmp') ) {
				if( !map_treeAdr_childrenAdr.hasOwnProperty(gridRecord.get('current_adr_treenodeKey')) ) {
					map_treeAdr_childrenAdr[gridRecord.get('current_adr_treenodeKey')] = [] ;
				}
				if( !Ext.Array.contains(map_treeAdr_childrenAdr[gridRecord.get('current_adr_treenodeKey')], gridRecord.get('current_adr_entryKey')) ) {
					map_treeAdr_childrenAdr[gridRecord.get('current_adr_treenodeKey')].push(gridRecord.get('current_adr_entryKey')) ;
				}
				treeAdr = gridRecord.get('current_adr_entryKey') ;
			} else {
				treeAdr = gridRecord.get('current_adr_treenodeKey') ;
			}
			
			if( !map_treeAdr_gridRows.hasOwnProperty(treeAdr) ) {
				map_treeAdr_gridRows[treeAdr] = [] ;
			}
			
			gridRow.leaf = true ;
			if( gridRecord.get('status_is_reject') ) {
				gridRow.icon = 'images/op5img/ico_cancel_small.gif' ;
			} else if( gridRecord.get('status_is_ok') ) {
				gridRow.icon = 'images/op5img/ico_ok_16.gif' ;
			} else {
				gridRow.icon = 'images/op5img/ico_wait_small.gif' ;
			}
			
			map_treeAdr_gridRows[treeAdr].push(gridRow) ;
		}) ;
		
		var cascadeRoot = function(node) {
			node['tree_adr'] = node.nodeKey ;
			delete node.checked ;
			node['icon'] = '' ;
			if( Ext.isEmpty(node.children) ) {
				node['leaf'] = false ;
				node['expanded'] = true ;
				node.children = [] ;
			}
			if( map_treeAdr_childrenAdr[node.tree_adr] ) {
				Ext.Array.each(map_treeAdr_childrenAdr[node.tree_adr], function(newAdr) {
					node.children.push({
						expanded: true,
						leaf: false,
						tree_adr: newAdr,
						nodeKey: newAdr,
						children: []
					});
				}) ;
			}
			if( map_treeAdr_gridRows[node.tree_adr] ) {
				Ext.Array.each(map_treeAdr_gridRows[node.tree_adr], function(gridRow) {
					node.children.push(gridRow);
				}) ;
				return ;
			}
			Ext.Array.each( node.children, function(childNode) {
				cascadeRoot(childNode) ;
			});
		} ;
		cascadeRoot(dataRoot) ;
		
		var treeStore = Ext.create('Ext.data.TreeStore',{
			model: this.tmpGridTreeModelName,
			data: dataRoot,
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		while(true) {
			var nodesToRemove = [] ;
			treeStore.getRoot().cascadeBy(function(node) {
				if( !node.isRoot() && !node.isLeaf() && !node.hasChildNodes() ) {
					nodesToRemove.push(node) ;
					return false ;
				}
			}) ;
			if( nodesToRemove.length == 0 ) {
				break ;
			}
			Ext.Array.each(nodesToRemove, function(node) {
				node.remove();
			});
		}
		this.down('#pCenter').down('#pGridTree').setRootNode(treeStore.getRootNode()) ;
	},
	
	openCreatePopup: function() {
		var whseSrc = this.down('#btnWhseSrc').getValue(),
			whseDest = this.down('#btnWhseDest').getValue() ;
		if( Ext.isEmpty(whseSrc) || Ext.isEmpty(whseSrc) ) {
			Ext.Msg.alert('Notice','Select source/destination warehouse') ;
		}
		
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.DbsLam.TransferCreateForm',{
			optimaModule: this.optimaModule,
			width:400, // dummy initial size, for border layout to work
			height:null, // ...
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}],
			values: {
				whse_src: whseSrc,
				whse_dest: whseDest
			}
		});
		createPanel.on('saved', function(p) {
			this.doTreeLoad() ;
		},this,{single:true}) ;
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		createPanel.show();
		createPanel.getEl().alignTo(this.getEl(), 'c-c?');
	},
	
	openStockPopup: function() {
		var treepanel = this.down('#pCenter').down('#pTree'),
			selectedNodes = treepanel.getView().getSelectionModel().getSelection(),
			isDocSelected = (selectedNodes.length==1 && selectedNodes[0].get('type')=='transfer'),
			whseSrc = selectedNodes[0].get('whse_src') ;
		
		this.optimaModule.createWindow({
			width:1100,
			height:600,
			resizable:true,
			layout:'fit',
			border: false,
			items:[Ext.create('Optima5.Modules.Spec.DbsLam.StockPanel',{
				optimaModule: this.optimaModule,
				_popupMode: true,
				_enableDD: true,
				whseCode: whseSrc
			})]
		}) ;
	},
	
	openPrintPopup: function() {
		var pTreeSelection = this.down('#pCenter').down('#pTree').getSelectionModel().getSelection() ;
		if( pTreeSelection.length != 1 || pTreeSelection[0].get('type') != 'transfer' ) {
			Ext.MessageBox.alert('Error','No suitable doc selected.') ;
			return ;
		}
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_printDoc',
				transfer_filerecordId: pTreeSelection[0].get('transfer_filerecord_id') 
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.openPrintPopupDo( 'Transfer doc : '+pTreeSelection[0].get('display_txt'), jsonResponse.html ) ;
				} else {
					Ext.MessageBox.alert('Error','Print system disabled') ;
				}
			},
			callback: function() {
				
			},
			scope: this
		}) ;
	},
	openPrintPopupDo: function(pageTitle, pageHtml) {
		this.optimaModule.createWindow({
			width:850,
			height:700,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit',
			title: pageTitle,
			items:[Ext.create('Ext.ux.dams.IFrameContent',{
				itemId: 'uxIFrame',
				content:pageHtml
			})],
			tbar:[{
				icon: 'images/op5img/ico_print_16.png',
				text: 'Print',
				handler: function(btn) {
					var uxIFrame = btn.up('window').down('#uxIFrame'),
						uxIFrameWindows = uxIFrame.getWin() ;
					if( uxIFrameWindows == null ) {
						Ext.MessageBox.alert('Problem','Printing disabled !') ;
						return ;
					}
					uxIFrameWindows.print() ;
				},
				scope: this
			},{
				icon: 'images/op5img/ico_save_16.gif',
				text: 'Save as PDF',
				handler: function(btn) {
					var uxIFrame = btn.up('window').down('#uxIFrame') ;
					
					var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
					Ext.apply(exportParams,{
						_moduleId: 'spec_dbs_lam',
						_action: 'util_htmlToPdf',
						html: Ext.JSON.encode(uxIFrame.content)
					}) ;
					Ext.create('Ext.ux.dams.FileDownloader',{
						renderTo: Ext.getBody(),
						requestParams: exportParams,
						requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
						requestMethod: 'POST'
					}) ;
				},
				scope: this
			}]
		}); 
	},
	
	handleDropStock: function(srcStockFilerecordIds) {
		var pTreeSelection = this.down('#pCenter').down('#pTree').getSelectionModel().getSelection() ;
		if( pTreeSelection.length != 1 || pTreeSelection[0].get('type') != 'transfer' ) {
			Ext.MessageBox.alert('Error','No suitable doc selected.') ;
			return ;
		}
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_addStock',
			stock_filerecordIds: Ext.JSON.encode(srcStockFilerecordIds),
			transfer_filerecordId: pTreeSelection[0].get('transfer_filerecord_id') 
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange') ;
			},
			scope: this
		}) ;
	},
	handleRemoveLigs: function(transferLigIds) {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_removeStock',
			transferLig_filerecordIds: Ext.JSON.encode(transferLigIds) 
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange') ;
			},
			scope: this
		}) ;
	},
	handleDeleteDoc: function(transferFilerecordId) {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_deleteDoc',
			transfer_filerecordId: transferFilerecordId
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Document not empty !') ;
					return ;
				}
				this.doTreeLoad() ;
			},
			scope: this
		}) ;
	},
	
	setFormRecord: function( transferLigRecord ) {
		var southP = this.down('#pSouth') ;
		southP._empty = false ;
		southP.removeAll() ;
		southP.add({
			xtype: 'grid',
			flex: 2,
			title: 'Steps',
			store: transferLigRecord.steps(),
			columns: [{
				dataIndex: 'status_is_ok',
				text: '',
				width: 24,
				renderer: function(v,metadata,record) {
					if( v ) {
						metadata.tdCls = 'op5-spec-dbslam-stock-avail' ;
					} else {
						metadata.tdCls = 'op5-spec-dbslam-stock-wait' ;
					}
				}
			},{
				dataIndex: 'step_code',
				text: 'Step Code',
				width: 100,
				renderer: function(v) {
					return '<b>'+v+'</b>' ;
				}
			},{
				text: 'Source Loc',
				dataIndex: 'src_adr_display',
				width: 100
			},{
				dataIndex: 'commit_date',
				text: 'Commit date',
				width: 100
			},{
				dataIndex: 'commit_user',
				text: 'Commit user',
				width: 80
			},{
				text: 'Dest Loc',
				dataIndex: 'dest_adr_display',
				width: 100
			}]
		}) ;
		
		if( transferLigRecord.get('status_is_reject') ) {
			var rejectRecords = [] ;
			Ext.Array.each( transferLigRecord.get('reject_arr'), function(rejectCode) {
				var rejectTxt ;
				Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflowAll(), function(mvtflow) {
					Ext.Array.each( mvtflow.checks, function(check) {
						if( rejectCode == check.check_code ) {
							rejectTxt  = check.check_txt
						}
					});
				}) ;
				rejectRecords.push({
					reject_code: rejectCode,
					reject_txt: rejectTxt
				});
			}) ;
			if( !Ext.isEmpty(transferLigRecord.get('reject_txt')) ) {
				rejectRecords.push({
					reject_code: '',
					reject_txt: transferLigRecord.get('reject_txt')
				});
			}
			var rejectStore = Ext.create('Ext.data.Store',{
				fields:[
					{name:'reject_code',type:'string'},
					{name:'reject_txt',type:'string'}
				],
				data: rejectRecords
			}) ;
			southP.add({
				xtype: 'grid',
				flex: 1,
				title: 'Reject causes',
				store: rejectStore,
				columns: [{
					dataIndex: '',
					text: '',
					width: 24,
					renderer: function(v,metadata,record) {
						metadata.tdCls = 'op5-spec-dbslam-stock-notavail' ;
					}
				},{
					dataIndex: 'reject_code',
					text: 'Code',
					width: 100
				},{
					dataIndex: 'reject_txt',
					text: 'Reject desc',
					width: 100
				}]
			}) ;
		}
		southP.expand() ;
	},
	
	doQuit: function() {
		this.destroy() ;
	}
}) ;