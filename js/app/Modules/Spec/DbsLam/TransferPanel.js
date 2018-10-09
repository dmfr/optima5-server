Ext.define('DbsLamTransferTreeModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'display_txt', string: 'string'},
		{name: 'type', type:'string'},
		{name: 'transfer_filerecord_id', type:'int'},
		{name: 'status_is_on', type:'boolean'},
		{name: 'status_is_ok', type:'boolean'},
		{name: 'whse_src', type:'string'},
		{name: 'whse_dest', type:'string'},
		{name: 'flow_code', type:'string'}
	],
	hasAllowForeign: function() {
		// iscde
		var docFlow = this.get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow),
			flowIsForeign = flowRecord.is_foreign ;
		if( flowIsForeign ) {
			return true ;
		}
		return false ;
	},
	hasAllowCde: function() {
		// iscde
		var docFlow = this.get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow),
			flowIsCde = flowRecord.is_cde ;
		if( flowIsCde ) {
			return true ;
		}
		return false ;
	},
	hasAllowFastforward: function() {
		// iscde
		var docFlow = this.get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow),
			flowIsFastforward = flowRecord.ack_fastforward ;
		if( flowIsFastforward ) {
			return true ;
		}
		return false ;
	},
	hasAllowFinalStock: function() {
		// last step = final + whse_dest = stock
		var docFlow = this.get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow),
			flowSteps = flowRecord.steps,
			lastStepIdx = (flowSteps.length - 1),
			lastIsFinal = flowSteps[lastStepIdx].step_code ;
		
		var docWhse = this.get('whse_dest'),
			whseRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getWhse(docWhse),
			whseIsStock = whseRecord.is_stock ;
		
		if( whseIsStock && lastIsFinal ) {
			return true ;
		}
		return false ;
	}
});




Ext.define('DbsLamTransferLigModel',{
	extend: 'Ext.data.Model',
	idProperty: 'transferlig_filerecord_id',
	fields: [
		{name: 'transfer_filerecord_id', type:'int'},
		{name: 'transferstep_filerecord_id', type:'int'},
		{name: 'transferstep_idx', type:'int'},
		
		{name: 'transferlig_filerecord_id', type:'int'},
		{name: 'status', type:'boolean'},
		{name: 'status_is_ok', type:'boolean'},
		{name: 'status_is_reject', type:'boolean'},
		{name: 'step_code', type:'string'},
		{name: 'hidden', type:'boolean'},
		{name: 'tree_id', type:'string'},
		{name: 'tree_adr', type:'string'},
		{name: 'src_adr', type:'string'},
		{name: 'next_adr', type:'string'},
		{name: 'current_adr', type: 'string'},
		{name: 'current_adr_tmp', type:'boolean'},
		{name: 'current_adr_entryKey', type:'string'},
		{name: 'current_adr_treenodeKey', type:'string'},
		{name: 'container_ref', type:'string'},
		{name: 'stk_prod', type:'string'},
		{name: 'stk_batch', type:'string'},
		{name: 'stk_datelc', type:'string'},
		{name: 'stk_sn', type:'string'},
		{name: 'mvt_qty', type:'number', allowNull:true},
		{name: 'reject_arr', type:'auto'},
		{name: 'flag_allowgroup', type:'boolean'},
		
		{name: 'need_txt', type: 'string'},
		{name: 'need_prod', type: 'string'},
		{name: 'need_qty_remain', type: 'number'},
		{name: 'transfercdeneed_filerecord_id', type:'int'},
		
		{name: '_input_is_on', type:'boolean'}
	]
});

Ext.define('DbsLamTransferStepModel',{
	extend: 'Ext.data.Model',
	idProperty: 'transferstep_filerecord_id',
	fields: [
		{name: 'transfer_filerecord_id', type:'int'},
		
		{name: 'transferstep_filerecord_id', type:'int'},
		{name: 'transferstep_idx', type:'int'},
		{name: 'transferstep_txt', type:'string'},
		{name: 'transferstep_code', type:'string'},
		{name: 'spec_input', type:'boolean'},
		{name: 'spec_cde_picking', type:'boolean'},
		{name: 'spec_cde_packing', type:'boolean'},
		{name: 'whse_src', type:'string'},
		{name: 'whse_dst', type:'string'},
		{name: 'forward_is_on', type:'boolean'},
		{name: 'forward_to_idx', type:'int'}
	],
	hasMany: [{
		model: 'DbsLamTransferLigModel',
		name: 'ligs',
		associationKey: 'ligs'
	}]
});

Ext.define('DbsLamTransferCdeLinkModel',{
	extend: 'Ext.data.Model',
	idProperty: 'transfercdelink_filerecord_id',
	fields: [
		{name: 'transfer_filerecord_id', type:'int'},
		
		{name: 'transfercdelink_filerecord_id', type:'int'},
		{name: 'cdelig_filerecord_id', type:'int'},
		{name: 'cde_filerecord_id', type:'int'},
		{name: 'cde_nr', type: 'string'},
		{name: 'lig_id', type: 'int'},
		{name: 'stk_prod', type: 'string'},
		{name: 'qty_comm', type: 'number'},
		{name: 'qty_cde', type: 'number'}
	]
});

Ext.define('DbsLamTransferOneModel',{
	extend: 'Ext.data.Model',
	idProperty: 'transfer_filerecord_id',
	fields: [
		{name: 'transfer_filerecord_id', type:'int'},
		{name: 'transfer_txt', type:'string'},
		{name: 'transfer_tpl', type:'string'},
		{name: 'transfer_tpltxt', type:'string'},
		{name: 'spec_cde', type:'boolean'},
		{name: 'status_is_on', type:'boolean'},
		{name: 'status_is_ok', type:'boolean'}
	],
	hasMany: [{
		model: 'DbsLamTransferStepModel',
		name: 'steps',
		associationKey: 'steps'
	},{
		model: 'DbsLamTransferCdeLinkModel',
		name: 'cde_links',
		associationKey: 'cde_links'
	}]
});


Ext.define('Optima5.Modules.Spec.DbsLam.TransferPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsLam.TransferCreateForm',
		'Optima5.Modules.Spec.DbsLam.TransferInnerStepPanel'
	],
	
	initComponent: function() {
		this.tmpLigsModelName = 'DbsLamTransferLigsModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpLigsModelName ) ;
		}) ;
		this.tmpNeedLigsModelName = 'DbsLamTransferNeedLigsModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpNeedLigsModelName ) ;
		}) ;
		this.tmpAdrTreeModelName = 'DbsLamTransferAdrTreeModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpAdrTreeModelName ) ;
		}) ;
		
		Ext.apply(this, {
			layout: {
				type: 'border',
				regionWeights: {
					west: 20,
					north: 10,
					center: 0,
					south: -10,
					east: -20
				}
			},
			items: [{
				region: 'west',
				border: 1,
				width: 240,
				
				tbar:[{
					icon: 'images/op5img/ico_back_16.gif',
					text: '<u>Back</u>',
					handler: function(){
						this.doQuit() ;
					},
					scope: this
				},'-',{
					itemId: 'tbCreate',
					icon: 'images/op5img/ico_new_16.gif',
					text: '<b>New doc.</b>',
					handler: function() {
						this.openCreatePopup() ;
					},
					scope: this
				}],
				
				xtype: 'treepanel',
				itemId: 'pTransfers',
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
				rootVisible: false,
				multiSelect: false,
				singleExpand: false,
				columns: {
					defaults: {
						menuDisabled: false,
						draggable: false,
						sortable: false,
						hideable: false,
						resizable: true,
						groupable: false,
						lockable: false
					},
					items: [{
						xtype:'treecolumn',
						dataIndex: 'display_txt',
						text: 'Document ID',
						width: 180
					},{
						dataIndex: 'status_is_ok',
						text: '<b>Status</b>',
						width: 70,
						renderer: function(v,metaData,record) {
							if( record.get('status_is_ok') ) {
								metadata.tdCls = 'op5-spec-dbslam-stock-ok'
							} else if( record.get('status_is_on') ) {
								return 'ACTIVE' ;
							} else if( record.get('type') == 'transfer' ) {
								return '-' ;
							}
						}
					}]
				},
				listeners: {
					itemcontextmenu: this.onTransfersContextMenu,
					selectionchange: this.onTransfersSelection,
					scope: this
				}
			},{
				flex: 2,
				region: 'center',
				itemId: 'pCenter',
				border: 1,
				xtype: 'panel',
				layout: {
					type: 'fit'
				},
				tbar:[Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'WHSE',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: '<i>Origin</i>',
					itemId: 'btnWhseSrc',
					btnReadOnly: true,
					optimaModule: this.optimaModule
				}),{
					itemId: 'btnWhseSeparator',
					icon: 'images/op5img/ico_arrow-double_16.png',
					disabled: true,
					style: {opacity: 1}
				},Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'WHSE',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: '<i>Destination</i>',
					itemId: 'btnWhseDest',
					btnReadOnly: true,
					optimaModule: this.optimaModule
				}),'-',{
					hidden:true,
					itemId: 'tbAdd',
					iconCls: 'op5-spec-dbslam-transfer-add',
					text: '<b>Build/Pick</b>',
					handler: function() {
						this.handleBuildPick() ;
					},
					scope: this
				},{
					hidden:true,
					itemId: 'tbActions',
					icon: 'images/op5img/ico_arrow-down_16.png',
					text: 'Actions',
					menu: [{
						icon: 'images/op5img/ico_new_16.gif',
						text: '<b>Input new</b>',
						handler: function() {
							this.handleNewForeign() ;
						},
						scope: this,
						itemIdForeign: true
					},{
						xtype: 'menuseparator',
						itemIdForeign: true
					},{
						icon: 'images/op5img/ico_print_16.png',
						text: '<b>Print</b>',
						handler: function() {
							this.openPrintPopup() ;
						},
						scope: this
					},{
						icon: 'images/op5img/ico_print_16.png',
						text: '<b>Print labels</b>',
						handler: function() {
							this.openPrintPopup(true) ;
						},
						scope: this
					},{
						xtype: 'menuseparator',
						itemIdFinalStock: true
					},{
						icon: 'images/op5img/ico_process_16.gif',
						text: '<b>Pre-Allocate</b>',
						handler: function() {
							this.handleActionPrealloc() ;
						},
						scope: this,
						itemIdFinalStock: true
					},{
						icon: 'images/op5img/ico_ok_16.gif',
						text: '<b>Acknowledge alloc.</b>',
						handler: function() {
							this.handleActionAckalloc() ;
						},
						scope: this,
						itemIdFinalStock: true
					},{
						xtype: 'menuseparator',
						itemIdCde: true
					},{
						iconCls: 'op5-spec-dbslam-transferaction-stkallocon',
						text: '<b>Stock allocation</b>',
						handler: function() {
							this.handleActionStkAlloc() ;
						},
						scope: this,
						itemIdCde: true
					},{
						iconCls: 'op5-spec-dbslam-transferaction-stkallocoff',
						text: '<b>Un-allocate stock</b>',
						handler: function() {
							this.handleActionStkUnalloc() ;
						},
						scope: this,
						itemIdCde: true
					},{
						xtype: 'menuseparator',
						itemIdFastforward: true
					},{
						icon: 'images/op5img/ico_process_16.gif',
						text: '<b>Acknowlegde steps</b>',
						itemIdFastforward: true,
						itemId: 'tbActionsCdeAck',
						menu: {
							defaults: {
								handler: function(btn) {
									this.handleActionCdeAck(btn._cdeAckStepCode) ;
								},
								scope: this
							},
							items: []
						}
					},{
						xtype: 'menuseparator',
						itemIdCde: true
					},{
						icon: 'images/op5img/ico_print_16.png',
						text: '<b>Print deliv.notes</b>',
						itemIdCde: true,
						handler: function() {
							this.openPrintDoc('transfer_cdebl') ;
						},
						scope: this
					},{
						icon: 'images/op5img/ico_print_16.png',
						text: '<b>Print summary</b>',
						itemIdCde: true,
						handler: function() {
							this.openPrintDoc('transfer_cdebrt') ;
						},
						scope: this
					}]
				},'->',{
					//itemId: 'tbClose',
					icon: 'images/op5img/ico_cancel_small.gif',
					text: 'Close',
					handler: function() {
						this.setActiveTransfer(null) ;
					},
					scope: this
				}],
				items: [{
					xtype: 'component',
					itemId: 'tpEmpty',
					cls: 'ux-noframe-bg',
					hidden: false,
				}]
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
		
		// post Setups
		this.onTransfersSelection() ;
		this.setActiveTransfer(null) ;
		
		// Load Tree
		this.doLoadTransfers() ;
	},
	updateToolbar: function() {
		if( this.down('#pCenter').down('#pTree') ) {
			var treepanel = this.down('#pCenter').down('#pTree'),
				selectedNodes = treepanel.getView().getSelectionModel().getSelection(),
				isDocSelected = (selectedNodes.length==1 && selectedNodes[0].get('type')=='transfer') ;
			this.down('toolbar').down('#tbActions').setVisible(isDocSelected) ;
			
			var searchOn = ( isDocSelected && this.down('#pCenter').down('#pAdrTree') && this.down('#pCenter').down('#pAdrTree').isVisible() ) ;
			this.down('toolbar').down('#tbSearchLogo').setVisible(searchOn) ;
			this.down('toolbar').down('#tbSearchText').setVisible(searchOn) ;
			
			var activeTabId = null,
				activeTab = this.down('#pCenter').down('#tpTabs').getActiveTab() ;
			if( isDocSelected && activeTab ) {
				activeTabId = activeTab.itemId ;
			}
			
			var buildpickOn = false ;
			if( isDocSelected ) {
				var docFlow = selectedNodes[0].get('flow_code'),
					flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow) ;
				
				if( activeTabId=='pLigs' && !flowRecord.is_foreign && !flowRecord.is_cde ) {
					buildpickOn = true ;
				}
				if( activeTabId=='pCdes' && flowRecord.is_cde ) {
					buildpickOn = true ;
				}
				if( activeTabId=='pNeedLigs' && flowRecord.is_cde ) {
					buildpickOn = true ;
				}
			}
			this.down('toolbar').down('#tbAdd').setVisible(buildpickOn) ;
			
			
			if( isDocSelected ) {
				this.down('toolbar').down('#btnWhseSrc').setValue(selectedNodes[0].get('whse_src')) ;
				this.down('toolbar').down('#btnWhseDest').setValue(selectedNodes[0].get('whse_dest')) ;
			} else {
				this.down('toolbar').down('#btnWhseSrc').setValue(null) ;
				this.down('toolbar').down('#btnWhseDest').setValue(null) ;
				this.down('toolbar').down('#tbCreate').setVisible( selectedNodes[0] && selectedNodes[0].get('type')=='_new' ) ;
			}
			
			
			if( isDocSelected ) {
				var doc = selectedNodes[0],
					docAllowFinalStock = doc.hasAllowFinalStock(),
					docAllowCde = doc.hasAllowCde(),
					docAllowForeign = doc.hasAllowForeign(),
					docAllowFastforward = doc.hasAllowFastforward() ;
				Ext.Array.each( this.down('toolbar').down('#tbActions').menu.query('[itemIdFinalStock]'), function(menuitem) {
					menuitem.setVisible( docAllowFinalStock ) ;
				}) ;
				Ext.Array.each( this.down('toolbar').down('#tbActions').menu.query('[itemIdCde]'), function(menuitem) {
					menuitem.setVisible( docAllowCde ) ;
				}) ;
				Ext.Array.each( this.down('toolbar').down('#tbActions').menu.query('[itemIdForeign]'), function(menuitem) {
					menuitem.setVisible( docAllowForeign ) ;
				}) ;
				Ext.Array.each( this.down('toolbar').down('#tbActions').menu.query('[itemIdFastforward]'), function(menuitem) {
					menuitem.setVisible( docAllowFastforward ) ;
				}) ;
				
				var docFlow = doc.get('flow_code'),
					flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow) ;
				var cdeAckButtons = [] ;
				Ext.Array.each( flowRecord.steps, function(step) {
					cdeAckButtons.push({
						_cdeAckStepCode: step.step_code,
						text: step.step_code + ' : ' + step.step_txt
					}) ;
				}) ;
				this.down('toolbar').down('#tbActions').menu.down('#tbActionsCdeAck').menu.removeAll() ;
				this.down('toolbar').down('#tbActions').menu.down('#tbActionsCdeAck').menu.add(cdeAckButtons) ;
			}
		}
	},
	updateWestToolbar: function() {
		//console.log('updateWestToolbar') ;
		var treepanel = this.down('#pTransfers'),
			selectedNodes = treepanel.getView().getSelectionModel().getSelection(),
			isDocSelected = (selectedNodes.length==1 && selectedNodes[0].get('type')=='transfer') ;
		treepanel.down('toolbar').down('#tbCreate').setVisible( selectedNodes[0] && selectedNodes[0].get('type')=='_new' ) ;
	},
	updateCenterToolbar: function() {
		//console.log('updateCenterToolbar') ;
		var pCenter = this.down('#pCenter'),
			pCenterTb = pCenter.down('toolbar'),
			tabPanel = pCenter.down('tabpanel') ;
		if(!tabPanel) {
			pCenterTb.setVisible(false) ;
			return ;
		}
		var activeTab = tabPanel.getActiveTab();
		if( !activeTab ) {
			pCenterTb.setVisible(false) ;
			return ;
		}
		var activeTransferStepRecord = activeTab.getActiveTransferStepRecord() ;
		pCenterTb.down('#btnWhseSrc').setVisible(activeTransferStepRecord);
		pCenterTb.down('#btnWhseSeparator').setVisible(activeTransferStepRecord);
		pCenterTb.down('#btnWhseDest').setVisible(activeTransferStepRecord);
		if( activeTransferStepRecord ){
			pCenterTb.down('#btnWhseSrc').setValue( activeTransferStepRecord.get('whse_src') ) ;
			pCenterTb.down('#btnWhseDest').setValue( activeTransferStepRecord.get('whse_dst') ) ;
		}
		
		pCenterTb.down('#tbAdd').setVisible( true ) ;
		
		//getActiveTransferStepRecord
	},
	updateTabs: function() {
		var treepanel = this.down('#pCenter').down('#pTree'),
			selectedNodes = treepanel.getView().getSelectionModel().getSelection(),
			isDocSelected = (selectedNodes.length==1 && selectedNodes[0].get('type')=='transfer') ;
		this.down('#pCenter').down('#tpTabs').setVisible(isDocSelected) ;
		this.down('#pCenter').down('#tpEmpty').setVisible(!isDocSelected) ;
		if( !isDocSelected ) {
			return ;
		}
		
		var docFlow = selectedNodes[0].get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow) ;
		this.down('#pCenter').down('#pCdes').tab.setVisible( flowRecord.is_cde ) ;
		this.down('#pCenter').down('#pLigs').tab.setVisible( !flowRecord.is_cde ) ;
		this.down('#pCenter').down('#pNeedLigs').tab.setVisible( flowRecord.is_cde ) ;
		
		var tabPanel = this.down('#pCenter').down('#tpTabs'),
			tabActiveCmp = tabPanel.getActiveTab() ;
		if( tabActiveCmp && !tabActiveCmp.tab.isVisible() ) {
			tabPanel.setActiveTab( flowRecord.is_cde ? this.down('#pCenter').down('#pNeedLigs') : this.down('#pCenter').down('#pLigs') ) ;
		}
	},
	doConfigureOnCdesRender: function(grid) {
		var me = this ;
		
		var gridPanelDropTargetEl =  grid.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'DbsLamCdesDD',
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					grid.body.stopAnimation();
					grid.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
					var cdesFilerecordIds = [] ;
					Ext.Array.each( ddSource.dragData.records, function(selectedRecord) {
						if( selectedRecord.get('cde_filerecord_id') ) {
							cdesFilerecordIds.push( selectedRecord.get('cde_filerecord_id') ) ; 
						}
					});
					if( cdesFilerecordIds.length > 0 ) {
						me.handleDropCdes(cdesFilerecordIds) ;
					}
			}
		});
	},
	doConfigureOnListNeedRender: function(grid) {
		//console.dir(arguments) ;
	},
	doConfigureOnListNeedDrop: function(node, data, overModel, dropPosition, dropHandlers) {
		if( overModel.getDepth()!=1 ) {
			return false ;
		}
		
		var showError = null ;
		var srcStockFilerecordIds = [] ;
		Ext.Array.each( data.records, function(rec) {
			if( rec.get('inv_prod') != overModel.get('need_prod') ) {
				showError = 'P/N mismatch' ;
				return false ;
			}
			if( rec.get('inv_qty') <= 0 ) {
				return ;
			}
			srcStockFilerecordIds.push( rec.get('inv_id') ) ;
		}) ;
		if( showError ) {
			Ext.MessageBox.alert('Error',showError) ;
			return false ;
		}
		
		
		dropHandlers.wait = true ;
		if( srcStockFilerecordIds.length>0 ) {
			this.handleDropCdeStock(srcStockFilerecordIds,overModel.get('transfercdeneed_filerecord_id')) ;
		}
		return ;
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
			this.doTransferLoad() ;
		} else {
			this.on('activate',function(){this.onDataChange();}, this, {single:true}) ;
		}
	},
	onTransfersContextMenu: function(view, record, item, index, event) {
		var selRecord = record;
		if( !selRecord ) {
			return ;
		}
		if( selRecord.get('type') != 'transfer' ) {
			return ;
		}
		if( !this._activeTransferRecord || (selRecord.get('transfer_filerecord_id')!=this._activeTransferRecord.getId()) ) {
			return ;
		}
		
		var gridContextMenuItems = new Array() ;
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
	onCdesContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		
		var cdesFilerecordIds = [] ;
		for( var recIdx=0 ; recIdx<selRecords.length ; recIdx++ ) {
			if( !Ext.Array.contains(cdesFilerecordIds,selRecords[recIdx].get('cde_filerecord_id')) ) {
				cdesFilerecordIds.push( selRecords[recIdx].get('cde_filerecord_id') ) ;
			}
		}
		gridContextMenuItems.push({
			iconCls: 'icon-bible-delete',
			text: 'Remove <b>'+cdesFilerecordIds.length+'</b> orders',
			handler : function() {
				this.handleRemoveCdes( cdesFilerecordIds ) ;
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
	onListNeedContextMenu: function(view, record, item, index, event) {
		var gridContextMenuItems = new Array() ;
		
		var selRecords = view.getSelectionModel().getSelection() ;
		if( selRecords.length != 1 ) {
			return ;
		}
		var selRecord = selRecords[0] ;
		if( selRecord.getDepth() != 2 ) {
			return ;
		}

		gridContextMenuItems.push({
			iconCls: 'icon-bible-newfile',
			text: 'Show log',
			handler : function() {
				this.setFormRecord(selRecord) ;
			},
			scope : this
		},'-',{
			iconCls: 'icon-bible-delete',
			text: 'Remove stock allocation',
			handler : function() {
				this.handleRemoveCdeStock( [selRecord.get('transferlig_filerecord_id')] ) ;
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
	onListNeedItemClick: function(view,record) {
		/*
		if( record.getDepth() != 2 ) {
			return ;
		}
		this.setFormRecord(record) ;
		*/
	},
	
	
	
	
	onTransfersSelection: function(selModel, records) {
		this.updateWestToolbar() ;
		if( !records || records.length!=1 ) {
			return ;
		}
		var record = records[0] ;
		if( !(record.get('transfer_filerecord_id')>0) ) {
			return ;
		}
		
		this.setActiveTransfer( record.get('transfer_filerecord_id') ) ;
	},
	onTabChange: function() {
		this.updateCenterToolbar() ;
	},
	
	
	
	
	doLoadTransfers: function() {
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
				
				var map_flowCode_rows = {} ;
				var map_flowCode_txt = {} ;
				Ext.Array.each( ajaxResponse.data, function(transferDoc) {
					var row = {
						leaf: true,
						type: 'transfer',
					};
					Ext.applyIf(row,transferDoc) ;
					Ext.apply(row,{
						display_txt: transferDoc.transfer_txt
					}) ;
					
					if( !map_flowCode_rows.hasOwnProperty(transferDoc.transfer_tpl) ) {
						map_flowCode_rows[transferDoc.transfer_tpl] = [] ;
						map_flowCode_txt[transferDoc.transfer_tpl] = transferDoc.transfer_tpltxt ;
					}
					map_flowCode_rows[transferDoc.transfer_tpl].push(row) ;
				}) ;
				
				var rootChildren = [{
					icon: 'images/op5img/ico_new_16.gif',
					leaf: true,
					type: '_new',
					display_txt: '<i>'+'Create new'+'</i>'
				}] ;
				Ext.Object.each( map_flowCode_rows, function(flowCode,rows) {
					var transferTplTxt = map_flowCode_txt[flowCode] ;
					rootChildren.push({
						iconCls:'task-folder',
						expanded:true,
						display_txt: '<b>'+transferTplTxt+'</b>',
						children: rows
					}); 
				}) ;
				
				
				var treepanel = this.down('#pTransfers') ;
				treepanel.getStore().setRootNode({
					root: true,
					expanded:true,
					children: rootChildren
				}) ;
			},
			scope: this
		}) ;
	},
	
	setActiveTransfer: function(transferFilerecordId) {
		var pTransfers = this.down('#pTransfers'),
			pCenter = this.down('#pCenter') ;
		if( !transferFilerecordId ) {
			this._activeTransferRecord = null ;
			
			pTransfers.getSelectionModel().setLocked(false) ;
			pTransfers.getSelectionModel().deselectAll() ;
			
			pCenter.removeAll() ;
			pCenter.add({
				xtype: 'component',
				itemId: 'tpEmpty',
				cls: 'ux-noframe-bg'
			})
			pCenter.down('toolbar').setVisible(false) ;
			return ;
		}
		pTransfers.getSelectionModel().setLocked(true) ;
		this.doTransferLoad( transferFilerecordId, true ) ;
	},
	
	doTransferLoad: function( transferFilerecordId=null, doBuildTabs=false ) {
		if( !transferFilerecordId && this._activeTransferRecord ) {
			transferFilerecordId = this._activeTransferRecord.get('transfer_filerecord_id') ;
			return this.doTransferLoad(transferFilerecordId,false);
		}
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_getTransfer',
				filter_transferFilerecordId: transferFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return this.onTransferLoad(null);
				}
				if( ajaxResponse.data.length != 1 ) {
					return this.onTransferLoad(null);
				}
				this.onTransferLoad(ajaxResponse.data[0],doBuildTabs) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
		
	},
	onTransferLoad: function( transferRow, doBuildTabs=false ) {
		if( !transferRow ) {
			return this.setActiveTransfer(null);
		}
		
		//build record
		var transferRecord = Ext.ux.dams.ModelManager.create('DbsLamTransferOneModel',transferRow) ;
		this._activeTransferRecord = transferRecord ;
		
		if( doBuildTabs ) {
			this.buildTabs() ;
		} else {
			this.refreshTabs() ;
		}
	},
	buildTabs: function() {
		if( !this._activeTransferRecord ) {
			return this.setActiveTransfer(null);
		}
		
		var pCenter = this.down('#pCenter') ;
		
		var tabItems = [] ;
		if( this._activeTransferRecord.get('spec_cde') ) {
			var className = 'Optima5.Modules.Spec.DbsLam.TransferInnerCdeLinkPanel' ;
			
			var cmp = Ext.create(className,{
				optimaModule: this.optimaModule,
				
				_activeTransferRecord: this._activeTransferRecord,
				
				listeners: {
					op5lamcdeadd: this.onLamCdeAdd,
					op5lamcderemove: this.onLamCdeRemove,
					scope: this
				}
			});
			cmp.refreshData() ;
			tabItems.push(cmp) ;
		}
		this._activeTransferRecord.steps().each( function(transferStepRecord) {
			var className = 'Optima5.Modules.Spec.DbsLam.TransferInnerStepPanel' ;
			
			var cmp = Ext.create(className,{
				optimaModule: this.optimaModule,
				
				_activeTransferRecord: this._activeTransferRecord,
				_actionTransferStepIdx: transferStepRecord.get('transferstep_idx'),
				
				listeners: {
					op5lamstockadd: this.onLamStockAdd,
					op5lamstockremove: this.onLamStockRemove,
					scope: this
				}
			});
			cmp.refreshData() ;
			tabItems.push(cmp) ;
		},this) ;
		
		
		pCenter.removeAll() ;
		pCenter.add({
			xtype: 'tabpanel',
			items: tabItems,
			listeners: {
				tabchange: this.onTabChange,
				scope: this
			}
		})
		pCenter.down('toolbar').setVisible(true) ;
		// select first tab ?
		pCenter.down('tabpanel').setActiveTab(0) ;
		this.updateCenterToolbar() ;
		
	},
	refreshTabs: function() {
		if( !this._activeTransferRecord ) {
			return this.setActiveTransfer(null);
		}
		
		var pCenter = this.down('#pCenter'),
			pCenterTabs = pCenter.down('tabpanel') ;
		if( !pCenterTabs ) {
			return ;
		}
		pCenterTabs.items.each( function(p) {
			p._activeTransferRecord = this._activeTransferRecord ;
			p.refreshData() ;
		},this) ;
	},
	
	
	onLamStockAdd: function( transferInnerPanel, stockAddObjs ) {
		if( !this._activeTransferRecord || !transferInnerPanel || !transferInnerPanel.getActiveTransferStepRecord() ) {
			return ;
		}
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_addStock',
			stock_objs: Ext.JSON.encode(stockAddObjs),
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
			transferStep_filerecordId: transferInnerPanel.getActiveTransferStepRecord().get('transferstep_filerecord_id')
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
	onLamStockRemove: function(transferInnerPanel, transferLigIds) {
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
	onLamCdeAdd: function(transferInnerPanel, cdesFilerecordIds) {
		if( !this._activeTransferRecord || !transferInnerPanel ) {
			return ;
		}
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_addCdeLink',
			cde_filerecordIds: Ext.JSON.encode(cdesFilerecordIds),
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id')
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
	onLamCdeRemove: function(transferInnerPanel, cdesFilerecordIds) {
		if( !this._activeTransferRecord ) {
			return ;
		}
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_removeCdeLink',
			cde_filerecordIds: Ext.JSON.encode(cdesFilerecordIds),
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id')
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
	
	
	
	
	openCreatePopup: function() {
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
			}]
		});
		createPanel.on('saved', function(p) {
			this.doLoadTransfers() ;
		},this,{single:true}) ;
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		createPanel.show();
		createPanel.getEl().alignTo(this.getEl(), 'c-c?');
	},
	
	handleBuildPick: function() {
		if( !this._activeTransferRecord ) {
			return ;
		}
		var activePanel = this.down('#pCenter').down('tabpanel').getActiveTab() ;
		if( !activePanel ) {
			return ;
		}
		return activePanel.handleBuildPick() ;
	},
	
	openPrintPopup: function(printLabels) {
		var pTreeSelection = this.down('#pCenter').down('#pTree').getSelectionModel().getSelection() ;
		if( pTreeSelection.length != 1 || pTreeSelection[0].get('type') != 'transfer' ) {
			Ext.MessageBox.alert('Error','No suitable doc selected.') ;
			return ;
		}
		
		this.showLoadmask() ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_printDoc',
				transfer_filerecordId: pTreeSelection[0].get('transfer_filerecord_id'),
				printEtiq: (printLabels ? 1 : 0)
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.openPrintPopupDo( 'Transfer doc : '+pTreeSelection[0].get('display_txt'), jsonResponse.html ) ;
				} else {
					Ext.MessageBox.alert('Error','Print system disabled') ;
				}
				this.doTransferLoad() ;
			},
			callback: function() {
				this.hideLoadmask() ;
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
	
	
	
	openPrintDoc: function(docCode) {
		if( !this.getActiveTransferFilerecordId() ) {
			Ext.MessageBox.alert('Error','No suitable doc selected.') ;
			return ;
		}
		var pTreeSelection = this.down('#pCenter').down('#pTree').getSelectionModel().getSelection() ;
		
		this.showLoadmask() ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'print_getDoc',
				transfer_filerecordId: this.getActiveTransferFilerecordId(),
				print_doc: docCode
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.openPrintDocDo( 'Transfer doc : '+pTreeSelection[0].get('display_txt'), jsonResponse.html ) ;
				} else {
					Ext.MessageBox.alert('Error','Print system disabled') ;
				}
				this.doTransferLoad() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	openPrintDocDo: function(pageTitle, pageHtml) {
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
	
	
	
	handleActionPrealloc: function() {
		var pTreeSelection = this.down('#pCenter').down('#pTree').getSelectionModel().getSelection() ;
		if( pTreeSelection.length != 1 || pTreeSelection[0].get('type') != 'transfer' ) {
			Ext.MessageBox.alert('Error','No suitable doc selected.') ;
			return ;
		}
		
		var docFlow = pTreeSelection[0].get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow),
			flowSteps = flowRecord.steps,
			lastStepIdx = (flowSteps.length - 1),
			lastStepCode = flowSteps[lastStepIdx].step_code ;
		
		var transferFilerecordId = pTreeSelection[0].get('transfer_filerecord_id'),
			  transferligFilerecordIds = [] ;
		var pLigs = this.down('#pCenter').down('#pLigs') ;
		pLigs.getStore().each( function(gridRec) {
			if( gridRec.get('transfer_filerecord_id') != transferFilerecordId ) {
				return ;
			}
			if( gridRec.get('step_code') != lastStepCode ) {
				return ;
			}
			transferligFilerecordIds.push( gridRec.get('transferlig_filerecord_id') ) ;
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_allocAdrFinal',
				transfer_filerecordId: transferFilerecordId,
				transferLigFilerecordId_arr: Ext.JSON.encode(transferligFilerecordIds),
				transferStepCode: lastStepCode
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				this.doTransferLoad();
				
				//this.doLoadTransfers() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleActionAckalloc: function() {
		var pTreeSelection = this.down('#pCenter').down('#pTree').getSelectionModel().getSelection() ;
		if( pTreeSelection.length != 1 || pTreeSelection[0].get('type') != 'transfer' ) {
			Ext.MessageBox.alert('Error','No suitable doc selected.') ;
			return ;
		}
		
		var docFlow = pTreeSelection[0].get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow),
			flowSteps = flowRecord.steps,
			lastStepIdx = (flowSteps.length - 1),
			lastStepCode = flowSteps[lastStepIdx].step_code ;
		
		var transferFilerecordId = pTreeSelection[0].get('transfer_filerecord_id'),
			  transferligFilerecordIds = [] ;
		var pLigs = this.down('#pCenter').down('#pLigs') ;
		pLigs.getStore().each( function(gridRec) {
			if( gridRec.get('transfer_filerecord_id') != transferFilerecordId ) {
				return ;
			}
			if( gridRec.get('step_code') != lastStepCode ) {
				return ;
			}
			if( gridRec.get('status_is_ok') ) {
				return ;
			}
			transferligFilerecordIds.push( gridRec.get('transferlig_filerecord_id') ) ;
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_commitAdrFinal',
				transfer_filerecordId: transferFilerecordId,
				transferLigFilerecordId_arr: Ext.JSON.encode(transferligFilerecordIds),
				transferStepCode: lastStepCode
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				this.doTransferLoad();
				
				//this.doLoadTransfers() ;
			},
			callback: function() {
				this.hideLoadmask() ;
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
				this.setActiveTransfer(null) ;
				this.doLoadTransfers() ;
			},
			scope: this
		}) ;
	},
	
	handleDropCdes: function(cdesFilerecordIds) {
		var activeTransferFilerecordId = this.getActiveTransferFilerecordId() ;
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_addCdeLink',
			cde_filerecordIds: Ext.JSON.encode(cdesFilerecordIds),
			transfer_filerecordId: activeTransferFilerecordId 
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
	handleRemoveCdes: function(cdesFilerecordIds) {
		var activeTransferFilerecordId = this.getActiveTransferFilerecordId() ;
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_removeCdeLink',
			cde_filerecordIds: Ext.JSON.encode(cdesFilerecordIds),
			transfer_filerecordId: activeTransferFilerecordId
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
	handleDropCdeStock: function(srcStockFilerecordIds,transfercdeneedFilerecordId) {
		var activeTransferFilerecordId = this.getActiveTransferFilerecordId() ;
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_addCdeStock',
			stock_filerecordIds: Ext.JSON.encode(srcStockFilerecordIds),
			transfer_filerecordId: activeTransferFilerecordId,
			transfercdeneed_filerecordId: transfercdeneedFilerecordId
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
	handleRemoveCdeStock: function(transferLigIds) {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_removeCdeStock',
			transfer_filerecordId: this.getActiveTransferFilerecordId(),
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
	handleActionStkUnalloc: function() {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_cdeStockUnalloc',
			transfer_filerecordId: this.getActiveTransferFilerecordId()
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
	handleActionStkAlloc: function() {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_cdeStockAlloc',
			transfer_filerecordId: this.getActiveTransferFilerecordId()
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
	handleActionCdeAck: function( ackStepCode, confirm=false ) {
		if( !confirm ) {
			Ext.Msg.confirm('Acknowledge','Confirm commit for step '+ackStepCode, function(btn){
				if( btn=='yes' ) {
					this.handleActionCdeAck(ackStepCode,true) ;
				}
			},this) ;
			return ;
		}
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_cdeAckStep',
			transfer_filerecordId: this.getActiveTransferFilerecordId(),
			transferStepCode: ackStepCode
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
	
	
	
	handleNewForeign: function() {
		var pLigs = this.down('#pCenter').down('#pLigs') ;
		var news = pLigs.getStore().insert(0,{
			_input_is_on: true
		}) ;
		var newRecord = news[0] ;
		this.down('#pCenter').down('#pLigs').getPlugin('pEditor').startEdit(newRecord) ;
	},
	
	setFormRecord: function( transferLigRecord ) {
		var southP = this.down('#pSouth') ;
		
		if( transferLigRecord == null ) {
			southP._empty = true ;
			southP.removeAll() ;
			southP.collapse() ;
			return ;
		}
		
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
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	handlePrint: function( gridTreeNode ) {
		var treepanel = this.down('#pCenter').down('#pTree'),
			selectedNodes = treepanel.getView().getSelectionModel().getSelection(),
			isDocSelected = (selectedNodes.length==1 && selectedNodes[0].get('type')=='transfer') ;
		if( !isDocSelected ) {
			return ;
		}
		var docFlow = selectedNodes[0].get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow) ;
		//console.dir(flowRecord) ;
		
		var lib ;
		var transferFilerecordId = selectedNodes[0].get('transfer_filerecord_id') ;
		var transferLigFilerecordId_arr = [] ;
		var transferStepCode ;
		if( !Ext.isEmpty(gridTreeNode.get('tree_adr')) ) {
			transferStepCode = [] ;
			gridTreeNode.cascadeBy(function(s) {
				if( s.isLeaf() && s.get('transferlig_filerecord_id') ) {
					transferLigFilerecordId_arr.push(s.get('transferlig_filerecord_id'));
					if( !Ext.Array.contains(transferStepCode,s.get('step_code')) ) {
						transferStepCode.push(s.get('step_code')) ;
					}
				}
			}) ;
			if( transferStepCode.length != 1 ) {
				return ;
			}
			transferStepCode = transferStepCode[0] ;
		} else {
			transferLigFilerecordId_arr.push(gridTreeNode.get('transferlig_filerecord_id')) ;
			transferStepCode = gridTreeNode.get('step_code')
		}
		
		var steps = [], idx ;
		Ext.Array.each( flowRecord.steps, function(step) {
			steps.push(step.step_code) ;
		});
		if( transferStepCode == '' ) {
			idx = steps.length ;
		} else {
			idx = steps.indexOf(transferStepCode) ;
		}
		if( idx > 0 ) {
			idx-- ;
		}
		transferStepCode = steps[idx] ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_printDoc',
				transferFilerecordId: transferFilerecordId,
				transferLigFilerecordId_arr: Ext.JSON.encode(transferLigFilerecordId_arr),
				transferStepCode: transferStepCode,
				printEtiq: 1
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.openPrintPopupDo( 'Container doc', jsonResponse.html ) ;
				} else {
					Ext.MessageBox.alert('Error','Print system disabled') ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleRollback: function( gridTreeNode ) {
		var treepanel = this.down('#pCenter').down('#pTree'),
			selectedNodes = treepanel.getView().getSelectionModel().getSelection(),
			isDocSelected = (selectedNodes.length==1 && selectedNodes[0].get('type')=='transfer') ;
		if( !isDocSelected ) {
			return ;
		}
		var docFlow = selectedNodes[0].get('flow_code'),
			flowRecord = Optima5.Modules.Spec.DbsLam.HelperCache.getMvtflow(docFlow),
			steps = [] ;
		Ext.Array.each( flowRecord.steps, function(step) {
			steps.push(step.step_code) ;
		}) ;
		steps.push('OK') ;
		
		var lib ;
		var transferFilerecordId = selectedNodes[0].get('transfer_filerecord_id') ;
		var transferLigFilerecordId_arr = [] ;
		var currentStepCode, transferStepCode ;
		if( !Ext.isEmpty(gridTreeNode.get('tree_adr')) ) {
			currentStepCode = [] ;
			
			lib = '<b>'+gridTreeNode.get('tree_adr')+'</b>' ;
			gridTreeNode.cascadeBy(function(s) {
				if( s.isLeaf() && s.get('transferlig_filerecord_id') ) {
					transferLigFilerecordId_arr.push(s.get('transferlig_filerecord_id'));
					
					var stepCode = (s.get('status_is_ok') ? 'OK' : s.get('step_code')) ;
					if( !Ext.Array.contains(currentStepCode,stepCode) ) {
						currentStepCode.push(stepCode) ;
					}
				}
			}) ;
			if( currentStepCode.length != 1 ) {
				return ;
			}
			currentStepCode = currentStepCode[0] ;
		} else {
			lib = '<b>id:</b>'+gridTreeNode.get('transferlig_filerecord_id') ;
			transferLigFilerecordId_arr.push(gridTreeNode.get('transferlig_filerecord_id')) ;
			
			var stepCode = (gridTreeNode.get('status_is_ok') ? 'OK' : gridTreeNode.get('step_code')) ;
			currentStepCode = stepCode ;
		}
		transferStepCode = steps[Ext.Array.indexOf(steps,currentStepCode)-1] ;
		
		var me = this ;
		var popupPanel = Ext.create('Ext.form.Panel',{
			optimaModule: this.optimaModule,
			
			width:400,
			height:250,
			
			cls: 'ux-noframe-bg',
			
			transferFilerecordId: transferFilerecordId,
			transferLigFilerecordId_arr: transferLigFilerecordId_arr,
			transferStepCode: transferStepCode,
			
			floating: true,
			renderTo: me.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				}
			}],
			
			xtype: 'form',
			border: false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 8,
			layout:'anchor',
			fieldDefaults: {
				labelWidth: 125,
				anchor: '100%'
			},
			items:[{
				height: 72,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-embralam-liveadr-relocatebanner">',
						'<span>{text}</span>',
					'</div>'
				],
				data: {text: '<b>Rollback procedure</b><br><br>'}
			},{
				xtype: 'displayfield',
				fieldLabel: 'Item(s)',
				value: lib
			},{
				xtype: 'displayfield',
				fieldLabel: 'Transfer lines count',
				value: '<b>'+transferLigFilerecordId_arr.length+'</b>'
			},{
				xtype: 'displayfield',
				fieldLabel: 'Step code',
				value: currentStepCode+'&#160;>>&#160;'+'<b>'+transferStepCode+'</b>'
			}],
			buttons: [{
				xtype: 'button',
				text: 'Submit',
				handler:function(btn){ 
					var formPanel = btn.up('form') ;
					formPanel.doSubmitRelocate() ;
				},
				scope: this
			}],
			doSubmitRelocate: function() {
				this.optimaModule.getConfiguredAjaxConnection().request({
					params: {
						_moduleId: 'spec_dbs_lam',
						_action: 'transfer_rollbackStep',
						transferFilerecordId: this.transferFilerecordId,
						transferLigFilerecordId_arr: Ext.JSON.encode(this.transferLigFilerecordId_arr),
						transferStepCode: this.transferStepCode
					},
					success: function(response) {
						var jsonResponse = Ext.JSON.decode(response.responseText) ;
						if( jsonResponse.success ) {
							this.optimaModule.postCrmEvent('datachange') ;
							this.destroy() ;
						} else {
							Ext.MessageBox.alert('Error',jsonResponse.error) ;
							return ;
						}
					},
					callback: function() {
						//this.hideLoadmask() ;
					},
					scope: this
				}) ;
			},
			onSubmitRelocate: function(ajaxResponse) {
				if( ajaxResponse.success ) {
					this.optimaModule.postCrmEvent('datachange') ;
					this.destroy() ;
				}
			}
		});
		
		popupPanel.on('destroy',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		popupPanel.show();
		popupPanel.getEl().alignTo(me.getEl(), 'c-c?');
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
	
	doQuit: function() {
		this.destroy() ;
	}
}) ;
