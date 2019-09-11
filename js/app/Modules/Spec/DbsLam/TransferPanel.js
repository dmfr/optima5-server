Ext.define('DbsLamTransferTreeModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'display_txt', string: 'string'},
		{name: 'display_soc', string: 'string'},
		{name: 'display_date', string: 'date', allowNull:true, dateFormat:'Y-m-d'},
		{name: 'type', type:'string'},
		{name: 'transfer_filerecord_id', type:'int'},
		{name: 'status_is_on', type:'boolean'},
		{name: 'status_is_ok', type:'boolean'},
		{name: 'status_is_alert', type:'boolean'},
		{name: 'status_is_closed', type:'boolean'},
		{name: 'soc_code', type:'string'},
		{name: 'whse_src', type:'string'},
		{name: 'whse_dest', type:'string'},
		{name: 'flow_code', type:'string'}
	]
});




Ext.define('DbsLamTransferLigModel',{
	extend: 'Ext.data.Model',
	idProperty: 'transferlig_filerecord_id',
	fields: [
		{name: 'transfer_filerecord_id', type:'int'},
		{name: 'transferstep_filerecord_id', type:'int'},
		{name: 'transferstep_idx', type:'int'},
		
		{name: 'transferlig_filerecord_id', type:'int'},
		{name: 'cdepick_transfercdeneed_filerecord_id', type:'int'},
		{name: 'cdepack_transfercdelink_filerecord_id', type:'int'},
		{name: 'status', type:'boolean'},
		{name: 'status_is_ok', type:'boolean'},
		{name: 'status_is_out', type:'boolean'},
		{name: 'status_is_reject', type:'boolean'},
		{name: 'step_code', type:'string'},
		{name: 'hidden', type:'boolean'},
		{name: 'tree_id', type:'string'},
		{name: 'tree_adr', type:'string'},
		{name: 'src_stk_filerecord_id', type:'string'},
		{name: 'src_whse', type:'string'},
		{name: 'src_adr', type:'string'},
		{name: 'dst_stk_filerecord_id', type:'string'},
		{name: 'dst_whse', type:'string'},
		{name: 'dst_adr', type:'string'},
		{name: 'inputstack_ref', type:'string'},
		{name: 'inputstack_level', type:'int'},
		{name: 'container_ref', type:'string'},
		{name: 'container_ref_display', type:'string'},
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
		
		{name: 'pack_id_sscc', type: 'string'},
		{name: 'pack_id_trspt_code', type: 'string'},
		{name: 'pack_id_trspt_id', type: 'string'},
		{name: 'pack_status_is_ready', type:'boolean'},
		{name: 'pack_status_is_shipped', type:'boolean'},
		{name: 'transfercdepack_filerecord_id', type:'int'},
		
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
		{name: 'spec_nocde_out', type:'boolean'},
		{name: 'whse_src', type:'string'},
		{name: 'whse_dst', type:'string'},
		{name: 'forward_is_on', type:'boolean'},
		{name: 'forward_to_idx', type:'int'},
		
		{name: 'stacking_is_on', type:'boolean'},
		
		{name: 'pda_is_on', type:'boolean'},
		{name: 'pdaspec_is_on', type:'boolean'},
		{name: 'pdaspec_code', type:'string', allowNull:true},
		
		{name: 'inputlist_is_on', type:'boolean'}
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
		{name: 'soc_code', type:'string'},
		{name: 'soc_is_multi', type:'boolean'},
		{name: 'spec_cde', type:'boolean'},
		{name: 'status_is_on', type:'boolean'},
		{name: 'status_is_ok', type:'boolean'},
		{name: 'status_is_alert', type:'boolean'},
		{name: 'status_is_closed', type:'boolean'},
		{name: 'date_touch', type:'date', dateFormat:'Y-m-d'}
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
		'Optima5.Modules.Spec.DbsLam.TransferInnerStepPanel',
		'Optima5.Modules.Spec.DbsLam.TransferInnerCdeLinkPanel',
		'Optima5.Modules.Spec.DbsLam.TransferInnerCdePickingPanel',
		'Optima5.Modules.Spec.DbsLam.TransferInnerCdePackingPanel',
		
		'Optima5.Modules.Spec.DbsLam.TransferInnerPoList'
	],
	
	initComponent: function() {
		// *** PDA Spec ****
		var pdaSpecMenuItems = [{
			_pdaIsOn: false,
			_pdaSpecIsOn: false,
			_pdaSpecCode: null,
			text: 'PDA Disabled'
		},{
			_pdaIsOn: true,
			_pdaSpecIsOn: false,
			_pdaSpecCode: null,
			text: 'Standard Input'
		}] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getPdaspecAll(), function(pdaspec) {
			pdaSpecMenuItems.push({
				_pdaIsOn: true,
				_pdaSpecIsOn: true,
				_pdaSpecCode: pdaspec.pdaspec_code,
				text: 'Spec: '+pdaspec.pdaspec_txt
			});
		}) ;
		
		
		Ext.apply(this, {
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				border: 1,
				width: 300,
				
				tbar:[{
					icon: 'images/op5img/ico_back_16.gif',
					text: '<u>Back</u>',
					handler: function(){
						this.doQuit() ;
					},
					scope: this
				},'-',Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'SOC',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: 'Scope',
					itemId: 'btnSoc',
					optimaModule: this.optimaModule,
					listeners: {
						change: function() {
							this.doLoadTransfers() ;
						},
						scope: this
					}
				}),{
					itemId: 'tbCreate',
					icon: 'images/op5img/ico_new_16.gif',
					text: '<b>New doc.</b>',
					handler: function() {
						this.openCreatePopup() ;
					},
					scope: this
				},'->',{
					xtype: 'checkbox',
					itemId: 'chkClosed',
					boxLabel: 'Closed ?',
					listeners: {
						change: function() {
							this.doLoadTransfers() ;
						},
						scope: this
					}
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
						dataIndex: 'display_soc',
						text: 'Soc',
						width: 70
					},{
						xtype: 'datecolumn',
						format: 'd/m/Y',
						dataIndex: 'display_date',
						text: 'Date',
						width: 85
					}]
				},
				listeners: {
					itemcontextmenu: this.onTransfersContextMenu,
					selectionchange: this.onTransfersSelection,
					scope: this
				},
				viewConfig: {
					//enableTextSelection: true,
					preserveScrollOnRefresh: true,
					getRowClass: function(record) {
						if( record.get('type')=='transfer' && ( record.get('status_is_on') || !record.get('status_is_ok') ) ) {
							return 'op5-spec-dbslam-transfer-active' ;
						}
					}
				}
			},{
				xtype: 'splitter'
			},{
				flex: 2,
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
					itemId: 'tbInput',
					iconCls: 'op5-spec-dbslam-transfer-add',
					text: '<b>Input new</b>',
					handler: function() {
						this.handleInputNew() ;
					},
					scope: this
				},{
					hidden:true,
					itemId: 'tbPdaSpec',
					iconCls: 'op5-spec-dbslam-transfer-pda',
					text: '',
					menu: {
						defaults: {
							handler: function(menuitem) {
								var pdaspec_obj = {
									pda_is_on: menuitem._pdaIsOn,
									pdaspec_is_on: menuitem._pdaSpecIsOn,
									pdaspec_code: menuitem._pdaSpecCode
								};
								this.handleSelectPdaspec(pdaspec_obj) ;
							},
							scope: this
						},
						items: pdaSpecMenuItems
					}
				},{
					itemId: 'tbActions',
					icon: 'images/op5img/ico_arrow-down_16.png',
					text: 'Actions',
					menu: [{
						icon: 'images/op5img/ico_print_16.png',
						text: '<b>Print</b>',
						itemIdPrintList: true,
						handler: function() {
							this.openPrintPopup() ;
						},
						scope: this
					},{
						icon: 'images/op5img/ico_print_16.png',
						text: '<b>Print labels</b>',
						itemIdPrintLabels: true,
						handler: function() {
							this.openPrintPopup(true) ;
						},
						scope: this
					},{
						xtype: 'menuseparator',
						itemIdAdrAlloc: true
					},{
						icon: 'images/op5img/ico_process_16.gif',
						text: '<b>Pre-Allocate</b>',
						handler: function() {
							this.handleActionAdrAlloc() ;
						},
						scope: this,
						itemIdAdrAlloc: true
					},{
						xtype: 'menuseparator',
						itemIdCdeAlloc: true
					},{
						iconCls: 'op5-spec-dbslam-transferaction-stkallocon',
						text: '<b>Stock allocation</b>',
						itemIdCdeAlloc: true,
						handler: function() {
							this.handleActionStkAlloc() ;
						},
						scope: this
					},{
						iconCls: 'op5-spec-dbslam-transferaction-stkallocoff',
						text: '<b>Un-allocate stock</b>',
						itemIdCdeAlloc: true,
						handler: function() {
							this.handleActionStkUnalloc() ;
						},
						scope: this
					},{
						xtype: 'menuseparator',
						itemIdFastforward: true
					},{
						icon: 'images/op5img/ico_process_16.gif',
						text: '<b>Commit all</b>',
						itemIdFastforward: true,
						handler: function() {
							this.handleActionFastCommit() ;
						},
						scope: this
					},{
						icon: 'images/op5img/ico_arrow-double_16.png',
						text: '<b>Validate Out</b>',
						itemIdFastforwardOut: true,
						handler: function() {
							this.handleActionFastOut() ;
						},
						scope: this
					},{
						xtype: 'menuseparator',
						itemIdInputPo: true
					},{
						icon: 'images/op5img/ico_calendar_16.png',
						text: '<b>Declare PO Input</b>',
						itemIdInputPo: true,
						handler: function() {
							this.handleSelectInputPo() ;
						},
						scope: this
					},{
						itemId: 'toggle-inputstacking',
						itemIdInputStacking: true,
						xtype: 'menucheckitem',
						text: 'Stacking options',
						checked: false,
						checkHandler : this.handleChangeInputStacking,
						scope: this
					}]
				},{
					itemId: 'tbShipping',
					icon: 'images/op5img/ico_arrow-down_16.png',
					text: 'Shipping',
					menu: [{
						icon: 'images/op5img/ico_print_16.png',
						text: '<b>Print supports</b>',
						handler: function() {
							this.handlePrintSupports() ;
						},
						scope: this
					},{
						icon: 'images/op5img/ico_arrow-double_16.png',
						text: '<b>Validate shipping</b>',
						handler: function() {
							this.handleCdeShipping() ;
						},
						scope: this
					},{
						xtype: 'menuseparator'
					},{
						icon: 'images/op5img/ico_print_16.png',
						text: '<b>Print deliv.notes</b>',
						handler: function() {
							this.openPrintDoc('transfer_cdebl') ;
						},
						scope: this
					},{
						icon: 'images/op5img/ico_print_16.png',
						text: '<b>Print summary</b>',
						handler: function() {
							this.openPrintDoc('transfer_cdebrt') ;
						},
						scope: this
					}]
				},'->',{
					itemId: 'tbDoc',
					text: 'Document',
					hidden:false,
					iconCls: 'op5-crmbase-qtoolbar-file',
					viewConfig: {forceFit: true},
					menu: [{
						//itemId: 'tbClose',
						icon: 'images/op5img/ico_reload_small.gif',
						text: 'Reload',
						handler: function() {
							this.doTransferLoad() ;
						},
						scope: this
					},{
						icon: 'images/op5img/ico_cancel_small.gif',
						text: 'Close',
						handler: function() {
							this.setActiveTransfer(null) ;
						},
						scope: this
					},'-',{
						itemId: 'reopen',
						text: 'Reopen',
						icon: 'images/op5img/ico_arrow-double_16.png',
						handler: function() {
							this.handleReopenDoc() ;
						},
						scope: this
					},{
						itemId: 'rename',
						text: 'Rename',
						iconCls: 'op5-crmbase-qtoolbar-file-save',
						handler: function() {
							this.handleRenameDoc() ;
						},
						scope: this
					},{
						itemId: 'delete',
						text: 'Delete doc.',
						iconCls: 'op5-crmbase-qtoolbar-file-delete',
						handler: function() {
							var transferFilerecordId = this._activeTransferRecord.get('transfer_filerecord_id') ;
							this.handleDeleteDoc( transferFilerecordId ) ;
						},
						scope: this
					}]
				}],
				items: [{
					xtype: 'component',
					itemId: 'tpEmpty',
					cls: 'ux-noframe-bg',
					hidden: false,
				}]
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
	updateWestToolbar: function() {
		//console.log('updateWestToolbar') ;
		var treepanel = this.down('#pTransfers'),
			selectedNodes = treepanel.getView().getSelectionModel().getSelection(),
			isDocSelected = (selectedNodes.length==1 && selectedNodes[0].get('type')=='transfer') ;
		var newMode = (selectedNodes[0] && selectedNodes[0].get('type')=='_new') ;
		treepanel.down('toolbar').down('#tbCreate').setVisible( newMode ) ;
		treepanel.down('toolbar').down('#btnSoc').setVisible( !newMode ) ;
	},
	updateCenterToolbar: function() {
		
		
		//console.log('updateCenterToolbar') ;
		var pCenter = this.down('#pCenter'),
			pCenterTb = pCenter.down('toolbar'),
			tabPanel = pCenter.down('tabpanel') ;
		if(!this._activeTransferRecord || !tabPanel) {
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
			pCenterTb.down('#btnWhseSrc').setValue( activeTransferStepRecord.get('whse_src'), true ) ;
			pCenterTb.down('#btnWhseDest').setValue( activeTransferStepRecord.get('whse_dst'), true ) ;
		}
		
		var hasBuildPick = activeTab.hasBuildPick(),
			hasInput = activeTab.hasInputNew(),
			hasSpecInputList = (activeTab.getSpecTab()=='TransferInnerPoList') ;
		pCenterTb.down('#tbAdd').setVisible( hasBuildPick ) ;
		pCenterTb.down('#tbInput').setVisible( hasInput || hasSpecInputList ) ;
		pCenterTb.down('#tbPdaSpec').setVisible( hasInput ) ;
		if( hasInput ) { // PDA Spec
			var selMenuItem = null ;
			pCenterTb.down('#tbPdaSpec').menu.items.each( function(menuitem) {
				var stepData = activeTransferStepRecord.getData() ;
				if( menuitem._pdaIsOn == stepData.pda_is_on
					&& menuitem._pdaSpecIsOn == stepData.pdaspec_is_on
					&& menuitem._pdaSpecCode == stepData.pdaspec_code ) {
					
					selMenuItem = menuitem ;
					return false ;
				}
			}) ;
			if( selMenuItem ) {
				pCenterTb.down('#tbPdaSpec').setText( selMenuItem.text ) ;
			}
		}
		if( hasInput ) { // Toggle stacking
			var stepData = activeTransferStepRecord.getData() ;
			
			var chkInputStacking = pCenterTb.down('#tbActions').down('#toggle-inputstacking') ;
			chkInputStacking.setChecked(stepData.stacking_is_on) ;
		}
		
			if( true ) { // options
				pCenterTb.down('#tbActions').setVisible( Ext.isEmpty(activeTab.getSpecTab()) ) ;
				
				var optionsHasFastCommit = activeTab.optionsHasFastCommit(),
					optionsHasFastOut = activeTab.optionsHasFastOut(),
					optionsCdeDocs = activeTab.optionsHasCdeDocs(),
					optionsCdeAlloc = activeTab.optionsHasCdeAlloc(),
					optionsAdrAlloc = activeTab.optionsHasAdrAlloc(),
					optionsPrintLabels = activeTab.optionsHasPrintLabels(),
					optionsPrintList = activeTab.optionsHasPrintList(),
					optionsShipping = activeTab.optionsHasShipping(),
					optionsInputPo = activeTab.hasInputNew(),
					optionsInputStacking = activeTab.hasInputNew() ;
				pCenterTb.down('#tbShipping').setVisible(optionsShipping) ;
				Ext.Array.each( pCenterTb.down('#tbActions').menu.query('[itemIdCdeDocs]'), function(menuitem) {
					menuitem.setVisible( optionsCdeDocs ) ;
				}) ;
				Ext.Array.each( pCenterTb.down('#tbActions').menu.query('[itemIdAdrAlloc]'), function(menuitem) {
					menuitem.setVisible( optionsAdrAlloc ) ;
				}) ;
				Ext.Array.each( pCenterTb.down('#tbActions').menu.query('[itemIdCdeAlloc]'), function(menuitem) {
					menuitem.setVisible( optionsCdeAlloc ) ;
				}) ;
				Ext.Array.each( pCenterTb.down('#tbActions').menu.query('[itemIdFastforward]'), function(menuitem) {
					menuitem.setVisible( optionsHasFastCommit ) ;
				}) ;
				Ext.Array.each( pCenterTb.down('#tbActions').menu.query('[itemIdFastforwardOut]'), function(menuitem) {
					menuitem.setVisible( optionsHasFastOut ) ;
				}) ;
				Ext.Array.each( pCenterTb.down('#tbActions').menu.query('[itemIdPrintList]'), function(menuitem) {
					menuitem.setVisible( optionsPrintList ) ;
				}) ;
				Ext.Array.each( pCenterTb.down('#tbActions').menu.query('[itemIdPrintLabels]'), function(menuitem) {
					menuitem.setVisible( optionsPrintLabels ) ;
				}) ;
				Ext.Array.each( pCenterTb.down('#tbActions').menu.query('[itemIdInputPo]'), function(menuitem) {
					menuitem.setVisible( optionsInputPo ) ;
				}) ;
				Ext.Array.each( pCenterTb.down('#tbActions').menu.query('[itemIdInputStacking]'), function(menuitem) {
					menuitem.setVisible( optionsInputStacking ) ;
				}) ;
				
			}
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
		
		return ;
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
	
	
	
	doLoadTransfers_tool_getIconUrl: function( transferDocData ) {
		var iconUrl ;
		if( !transferDocData.status_is_on && !transferDocData.status_is_ok ) {
			iconUrl = 'images/op5img/ico_wait_small.gif' ;
		}
		if( transferDocData.status_is_on && !transferDocData.status_is_ok ) {
			iconUrl = 'images/op5img/ico_orangedot.gif' ;
		}
		if( transferDocData.status_is_on && transferDocData.status_is_ok ) {
			iconUrl = 'images/op5img/ico_greendot.gif' ;
		}
		if( !transferDocData.status_is_on && transferDocData.status_is_ok ) {
			iconUrl = ' ' ;
		}
		if( transferDocData.status_is_on && transferDocData.status_is_alert ) {
			iconUrl = 'images/op5img/ico_reddot.gif' ;
		}
		return iconUrl ;
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
				
				var showClosed = this.down('#chkClosed').getValue(),
					filterSoc = this.down('#btnSoc').getValue() ;
				
				var map_flowCode_rows = {} ;
				var map_flowCode_txt = {} ;
				Ext.Array.each( ajaxResponse.data, function(transferDocData) {
					if( !showClosed && transferDocData.status_is_closed ) {
						return ;
					}
					if( !Ext.isEmpty(filterSoc) && (transferDocData.soc_code!=filterSoc) ) {
						return ;
					}
					var transferRecord = Ext.ux.dams.ModelManager.create('DbsLamTransferOneModel',transferDocData),
						transferDoc = transferRecord.getData() ;
					var row = {
						leaf: true,
						type: 'transfer',
					};
					Ext.applyIf(row,transferDoc) ;
					Ext.apply(row,{
						icon: this.doLoadTransfers_tool_getIconUrl(transferDoc),
						display_txt: transferDoc.transfer_txt,
						display_soc: (transferDoc.soc_is_multi ? '<i>multi</i>' : transferDoc.soc_code),
						display_date: transferDoc.date_touch
					}) ;
					
					if( !map_flowCode_rows.hasOwnProperty(transferDoc.transfer_tpl) ) {
						map_flowCode_rows[transferDoc.transfer_tpl] = [] ;
						map_flowCode_txt[transferDoc.transfer_tpl] = transferDoc.transfer_tpltxt ;
					}
					map_flowCode_rows[transferDoc.transfer_tpl].push(row) ;
				},this) ;
				
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
			
			//pTransfers.getSelectionModel().setLocked(false) ;
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
		//pTransfers.getSelectionModel().setLocked(true) ;
		
		var activeTabIndex = null,
			tabpanel = this.down('#pCenter').down('tabpanel') ;
		if( tabpanel ) {
			var activeTab = tabpanel.getActiveTab();
			var activeTabIndex = tabpanel.items.indexOf(activeTab);
		}
		this.doTransferLoad( transferFilerecordId, true, activeTabIndex ) ;
	},
	setActiveTransferTxt: function(transferFilerecordId, transferTxt) { // HACK?
		var pTransfers = this.down('#pTransfers'),
			pTransfersSelection = pTransfers.getSelectionModel().getSelection() ;
		if( pTransfersSelection.length==1 && pTransfersSelection[0].get('type')=='transfer' 
			&& pTransfersSelection[0].get('transfer_filerecord_id')==transferFilerecordId ) {
			
			pTransfersSelection[0].set('display_txt',transferTxt) ;
			pTransfersSelection[0].commit() ;
			pTransfers.getView().refresh() ;
		}
	},
	setActiveTransferIcon: function(transferFilerecordId, iconUrl) { // HACK?
		var pTransfers = this.down('#pTransfers'),
			pTransfersSelection = pTransfers.getSelectionModel().getSelection() ;
		if( pTransfersSelection.length==1 && pTransfersSelection[0].get('type')=='transfer' 
			&& pTransfersSelection[0].get('transfer_filerecord_id')==transferFilerecordId ) {
			
			pTransfersSelection[0].set('icon',iconUrl) ;
			pTransfers.getView().refresh() ;
		}
	},
	
	doTransferLoad: function( transferFilerecordId=null, doBuildTabs=false, setActiveTab=null ) {
		if( !transferFilerecordId && this._activeTransferRecord ) {
			transferFilerecordId = this._activeTransferRecord.get('transfer_filerecord_id') ;
			return this.doTransferLoad(transferFilerecordId,doBuildTabs);
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
				this.onTransferLoad(ajaxResponse.data[0],doBuildTabs,setActiveTab) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
		
	},
	onTransferLoad: function( transferRow, doBuildTabs=false, setActiveTab ) {
		if( !transferRow ) {
			return this.setActiveTransfer(null);
		}
		
		//build record
		var transferRecord = Ext.ux.dams.ModelManager.create('DbsLamTransferOneModel',transferRow) ;
		this._activeTransferRecord = transferRecord ;
		this.setActiveTransferIcon( 
			this._activeTransferRecord.get('transfer_filerecord_id'),
			this.doLoadTransfers_tool_getIconUrl(transferRecord.getData())
		) ;
		
		if( doBuildTabs ) {
			this.buildTabs(setActiveTab) ;
		} else {
			this.refreshTabs() ;
		}
	},
	buildTabs: function(setActiveTab) {
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
			if( transferStepRecord.get('spec_input') && transferStepRecord.get('inputlist_is_on') ) {
				var className = 'Optima5.Modules.Spec.DbsLam.TransferInnerPoList' ;
				
				var cmp = Ext.create(className,{
					optimaModule: this.optimaModule,
					
					closable: true,
					
					_activeTransferRecord: this._activeTransferRecord,
					_actionTransferStepIdx: transferStepRecord.get('transferstep_idx'),
					
					listeners: {
						op5lamcdeadd: this.onLamCdeAdd,
						op5lamcderemove: this.onLamCdeRemove,
						scope: this
					}
				});
				cmp.refreshData() ;
				tabItems.push(cmp) ;
			}
			if( !transferStepRecord.get('spec_cde_picking') && !transferStepRecord.get('spec_cde_packing') ) {
				var className = 'Optima5.Modules.Spec.DbsLam.TransferInnerStepPanel' ;
				
				var cmp = Ext.create(className,{
					optimaModule: this.optimaModule,
					
					_activeTransferRecord: this._activeTransferRecord,
					_actionTransferStepIdx: transferStepRecord.get('transferstep_idx'),
					
					listeners: {
						op5lamstockadd: this.onLamStockAdd,
						op5lamstockremove: this.onLamStockRemove,
						op5lamstockrollback: this.onLamStockRollback,
						op5lamstocksetadr: this.onLamStockSetAdr,
						scope: this
					}
				});
				cmp.refreshData() ;
				tabItems.push(cmp) ;
			}
			if( transferStepRecord.get('spec_cde_picking') ) {
				var className = 'Optima5.Modules.Spec.DbsLam.TransferInnerCdePickingPanel' ;
				
				var cmp = Ext.create(className,{
					optimaModule: this.optimaModule,
					
					_activeTransferRecord: this._activeTransferRecord,
					_actionTransferStepIdx: transferStepRecord.get('transferstep_idx'),
					
					listeners: {
						op5lamstockpickingadd: this.onLamStockPickingAdd,
						op5lamstockpickingremove: this.onLamStockPickingRemove,
						op5lamstockpickingrollback: this.onLamStockRollback,
						scope: this
					}
				});
				cmp.refreshData() ;
				tabItems.push(cmp) ;
			}
			if( transferStepRecord.get('spec_cde_packing') ) {
				var className = 'Optima5.Modules.Spec.DbsLam.TransferInnerCdePackingPanel' ;
				
				var cmp = Ext.create(className,{
					optimaModule: this.optimaModule,
					
					_activeTransferRecord: this._activeTransferRecord,
					_actionTransferStepIdx: transferStepRecord.get('transferstep_idx'),
					
					listeners: {
						//op5lamstockadd: this.onLamStockAdd,
						//op5lamstockremove: this.onLamStockRemove,
						op5lamstockpackingrollback: this.onLamStockRollback,
						op5lamstockpackingprint: this.onLamPackingPrint,
						//op5lamstocksetadr: this.onLamStockSetAdr,
						scope: this
					}
				});
				cmp.refreshData() ;
				tabItems.push(cmp) ;
			}
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
		pCenter.down('tabpanel').setActiveTab(setActiveTab||0) ;
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
		this.updateCenterToolbar() ;
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
					var transferInnerPanel = this.down('#pCenter').down('tabpanel').getActiveTab() ;
					if( transferInnerPanel && transferInnerPanel.getActiveTransferStepRecord().get('spec_input') ) {
						var doClose ;
						transferInnerPanel.handleInputNew(doClose=true) ;
					} else {
						Ext.MessageBox.alert('Error','Error') ;
					}
					return ;
				}
				this.optimaModule.postCrmEvent('datachange') ;
			},
			scope: this
		}) ;
	},
	onLamStockRemove: function(transferInnerPanel, transferLigIds) {
		if( !this._activeTransferRecord || !transferInnerPanel || !transferInnerPanel.getActiveTransferStepRecord() ) {
			return ;
		}
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_removeStock',
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
			transferStep_filerecordId: transferInnerPanel.getActiveTransferStepRecord().get('transferstep_filerecord_id'),
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
	onLamStockRollback: function(transferInnerPanel, transferLigIds) {
		if( !this._activeTransferRecord || !transferInnerPanel || !transferInnerPanel.getActiveTransferStepRecord() ) {
			return ;
		}
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_rollback',
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
			transferStep_filerecordId: transferInnerPanel.getActiveTransferStepRecord().get('transferstep_filerecord_id'),
			transferLig_filerecordIds: Ext.JSON.encode(transferLigIds) 
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Rollback failed / not allowed') ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange') ;
			},
			scope: this
		}) ;
	},
	onLamStockSetAdr: function( transferInnerPanel, adrObj ) {
		if( !this._activeTransferRecord || !transferInnerPanel || !transferInnerPanel.getActiveTransferStepRecord() ) {
			return ;
		}
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_setAdr',
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
			transferStep_filerecordId: transferInnerPanel.getActiveTransferStepRecord().get('transferstep_filerecord_id'),
			adr_objs: Ext.JSON.encode([adrObj]) 
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					transferInnerPanel.rollbackEditorAdr(true) ;
					return ;
				}
				transferInnerPanel.rollbackEditorAdr(false);
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
	onLamStockPickingAdd: function( transferInnerPanel, stockAddObjs ) {
		if( !this._activeTransferRecord || !transferInnerPanel || !transferInnerPanel.getActiveTransferStepRecord() ) {
			return ;
		}
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_addCdePickingStock',
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
	onLamStockPickingRemove: function(transferInnerPanel, transferLigIds) {
		if( !this._activeTransferRecord || !transferInnerPanel || !transferInnerPanel.getActiveTransferStepRecord() ) {
			return ;
		}
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_removeCdePickingStock',
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
			transferStep_filerecordId: transferInnerPanel.getActiveTransferStepRecord().get('transferstep_filerecord_id'),
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
	
	onLamPackingPrint: function(transferInnerPanel, transferCdePack_filerecordIds) {
		console.dir(transferCdePack_filerecordIds) ;
		this.handlePrintSupports(transferCdePack_filerecordIds) ;
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
	handleInputNew: function() {
		if( !this._activeTransferRecord ) {
			return ;
		}
		var activePanel = this.down('#pCenter').down('tabpanel').getActiveTab() ;
		if( !activePanel ) {
			return ;
		}
		return activePanel.handleInputNew() ;
	},
	
	openPrintPopup: function(printLabels) {
		var pCenter = this.down('#pCenter'),
			pCenterTb = pCenter.down('toolbar'),
			tabPanel = pCenter.down('tabpanel') ;
		var activeTab = tabPanel.getActiveTab();
		if( !activeTab ) {
			return ;
		}
		var activeTransferStepRecord = activeTab.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return ;
		}
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_printDoc',
				transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
				transferStep_filerecordId: activeTransferStepRecord.get('transferstep_filerecord_id'),
				printEtiq: (printLabels ? 1 : 0)
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.openPrintPopupDo( 'Transfer doc', jsonResponse.html ) ;
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
		if( !this._activeTransferRecord ) {
			Ext.MessageBox.alert('Error','No suitable doc selected.') ;
			return ;
		}
		
		this.showLoadmask() ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'print_getDoc',
				transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
				print_doc: docCode
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.openPrintDocDo( 'Transfer doc : '+this._activeTransferRecord.get('transfer_txt'), jsonResponse.html ) ;
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
	
	
	
	
	handleReopenDoc: function(transferTxtNew=null) {
		if( !this._activeTransferRecord ) {
			return ;
		}
		var transferFilerecordId = this._activeTransferRecord.get('transfer_filerecord_id') ;
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_reopenDoc',
			transfer_filerecordId: transferFilerecordId
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
			},
			scope: this
		}) ;
	},
	handleRenameDoc: function(transferTxtNew=null) {
		if( !this._activeTransferRecord ) {
			return ;
		}
		var transferFilerecordId = this._activeTransferRecord.get('transfer_filerecord_id'),
			transferTxt = this._activeTransferRecord.get('transfer_txt') ;
		if( !transferTxtNew ) {
			Ext.Msg.prompt('Rename','Set new document name :', function(btn, text){
				if (btn == 'ok'){
					this.handleRenameDoc(text) ;
				}
			},this,false,transferTxt) ;
			return ;
		}
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_renameDoc',
			transfer_filerecordId: transferFilerecordId,
			transfer_txt: transferTxtNew
		} ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.setActiveTransferTxt(transferFilerecordId,transferTxtNew) ;
			},
			scope: this
		}) ;
	},
	handleDeleteDoc: function() {
		if( !this._activeTransferRecord ) {
			return ;
		}
		var transferFilerecordId = this._activeTransferRecord.get('transfer_filerecord_id') ;
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
	
	handleActionStkUnalloc: function() {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_cdeStockUnalloc',
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id')
		} ;
		this.showLoadmask() ;
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
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleActionStkAlloc: function() {
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_cdeStockAlloc',
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id')
		} ;
		this.showLoadmask() ;
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
			callback: function() {
				this.hideLoadmask() ;
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
	
	
	handleActionAdrAlloc: function() {
		var pCenter = this.down('#pCenter'),
			pCenterTb = pCenter.down('toolbar'),
			tabPanel = pCenter.down('tabpanel') ;
		if( !tabPanel ) {
			return ;
		}
		var activeTab = tabPanel.getActiveTab();
		if( !activeTab ) {
			return ;
		}
		if( !activeTab.optionsHasAdrAlloc() ) {
			return ;
		}
		
		var activeTransferStepRecord = activeTab.getActiveTransferStepRecord() ;
		// toutes lignes non commit
		var adrObjs = [] ;
		activeTransferStepRecord.ligs().each( function(transferLigRecord) {
			if( transferLigRecord.get('status_is_ok') || !Ext.isEmpty(transferLigRecord.get('dst_adr')) ) {
				return ;
			}
			adrObjs.push({
				transferlig_filerecord_id: transferLigRecord.get('transferlig_filerecord_id'),
				adr_auto: true
			}) ;
		}) ;
		if( Ext.isEmpty(adrObjs) ) {
			Ext.MessageBox.alert('Empty','All items already allocated') ;
			return ;
		}
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_setAdr',
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
			transferStep_filerecordId: activeTransferStepRecord.get('transferstep_filerecord_id'),
			adr_objs: Ext.JSON.encode(adrObjs) 
		} ;
		this.showLoadmask() ;
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
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleActionFastCommit: function() {
		var pCenter = this.down('#pCenter'),
			pCenterTb = pCenter.down('toolbar'),
			tabPanel = pCenter.down('tabpanel') ;
		if( !tabPanel ) {
			return ;
		}
		var activeTab = tabPanel.getActiveTab();
		if( !activeTab ) {
			return ;
		}
		if( !activeTab.optionsHasFastCommit() ) {
			return ;
		}
		
		var activeTransferStepRecord = activeTab.getActiveTransferStepRecord() ;
		// toutes lignes non commit
		var transferLig_filerecordIds = [] ;
		activeTransferStepRecord.ligs().each( function(transferLigRecord) {
			if( transferLigRecord.get('status_is_ok') || Ext.isEmpty(transferLigRecord.get('dst_adr')) ) {
				return ;
			}
			transferLig_filerecordIds.push( transferLigRecord.get('transferlig_filerecord_id') ) ;
		}) ;
		if( activeTransferStepRecord.get('spec_cde_packing') ) {
			// HACK commit pour packing
		} else if( Ext.isEmpty(transferLig_filerecordIds) ) {
			Ext.MessageBox.alert('Empty','All items already commited') ;
			return ;
		}
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_setCommit',
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
			transferStep_filerecordId: activeTransferStepRecord.get('transferstep_filerecord_id'),
			transferLig_filerecordIds: Ext.JSON.encode(transferLig_filerecordIds) 
		} ;
		this.showLoadmask() ;
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
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleActionFastOut: function() {
		var pCenter = this.down('#pCenter'),
			pCenterTb = pCenter.down('toolbar'),
			tabPanel = pCenter.down('tabpanel') ;
		if( !tabPanel ) {
			return ;
		}
		var activeTab = tabPanel.getActiveTab();
		if( !activeTab ) {
			return ;
		}
		if( !activeTab.optionsHasFastCommit() ) {
			return ;
		}
		
		var activeTransferStepRecord = activeTab.getActiveTransferStepRecord() ;
		// toutes lignes non commit
		var transferLig_filerecordIds = [] ;
		activeTransferStepRecord.ligs().each( function(transferLigRecord) {
			if( !transferLigRecord.get('status_is_ok') || transferLigRecord.get('status_is_out') ) {
				return ;
			}
			transferLig_filerecordIds.push( transferLigRecord.get('transferlig_filerecord_id') ) ;
		}) ;
		if( this._activeTransferRecord.get('spec_cde') || !activeTransferStepRecord.get('spec_nocde_out') ) {
			Ext.MessageBox.alert('Error','Incompatible document') ;
			return ;
		}
		if( Ext.isEmpty(transferLig_filerecordIds) ) {
			Ext.MessageBox.alert('Empty','All items already commited') ;
			return ;
		}
		
		
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_setOut',
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
			transferStep_filerecordId: activeTransferStepRecord.get('transferstep_filerecord_id'),
			transferLig_filerecordIds: Ext.JSON.encode(transferLig_filerecordIds) 
		} ;
		this.showLoadmask() ;
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
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleCdeShipping: function(confirmed) {
		if( !confirmed ) {
			Ext.Msg.confirm('Confirm','Validate shipping ?', function(btn){
				if( btn=='yes' ) {
					this.handleCdeShipping(true) ;
				}
			},this) ;
			return ;
		}
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_cdeShippingOut',
				transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id')
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error',ajaxResponse.error) ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange') ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
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
	},
	
	
	handleSelectPdaspec: function( pdaspecObj, confirmed=false ) {
		if( !confirmed ) {
			Ext.Msg.confirm('Confirm','Set PDA input method ?', function(btn){
				if( btn=='yes' ) {
					this.handleSelectPdaspec(pdaspecObj,true) ;
				}
			},this) ;
			return ;
		}
		var pCenter = this.down('#pCenter'),
			pCenterTb = pCenter.down('toolbar'),
			tabPanel = pCenter.down('tabpanel') ;
		var activeTab = tabPanel.getActiveTab();
		if( !activeTab ) {
			return ;
		}
		var activeTransferStepRecord = activeTab.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return ;
		}
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferInput_setPdaSpec',
				transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
				transferStep_filerecordId: activeTransferStepRecord.get('transferstep_filerecord_id'),
				pdaspec_obj: Ext.JSON.encode(pdaspecObj)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error',ajaxResponse.error) ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange') ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	
	handleSelectInputPo: function() {
		var pCenter = this.down('#pCenter'),
			pCenterTb = pCenter.down('toolbar'),
			tabPanel = pCenter.down('tabpanel') ;
		var activeTab = tabPanel.getActiveTab();
		if( !activeTab ) {
			return ;
		}
		var activeTransferStepRecord = activeTab.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return ;
		}
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transferInputPo_setState',
				transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
				transferStep_filerecordId: activeTransferStepRecord.get('transferstep_filerecord_id'),
				inputlist_obj: Ext.JSON.encode({
					inputlist_is_on: true
				})
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error',ajaxResponse.error) ;
					return ;
				}
				//this.optimaModule.postCrmEvent('datachange') ;
				this.doTransferLoad(null,true) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	handleChangeInputStacking: function() {
		var pCenter = this.down('#pCenter'),
			pCenterTb = pCenter.down('toolbar'),
			tabPanel = pCenter.down('tabpanel') ;
		var activeTab = tabPanel.getActiveTab();
		if( !activeTab ) {
			return ;
		}
		var activeTransferStepRecord = activeTab.getActiveTransferStepRecord() ;
		if( !activeTransferStepRecord ) {
			return ;
		}
		
		var chkInputStacking = pCenterTb.down('#tbActions').down('#toggle-inputstacking'),
			checked = chkInputStacking.checked ;
		
		if( activeTransferStepRecord.get('stacking_is_on') == checked ) {
			return ;
		}
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_setStackingState',
				transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
				transferStep_filerecordId: activeTransferStepRecord.get('transferstep_filerecord_id'),
				stacking_is_on: (checked ? 1 : 0)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error',ajaxResponse.error) ;
					return ;
				}
				//this.optimaModule.postCrmEvent('datachange') ;
				this.doTransferLoad(null,true) ;
			},
			callback: function() {
				//this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	
	handlePrintSupports: function(transferCdePack_filerecordIds=null) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_getTransferCdePack',
				filter_transferFilerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
				filter_transferCdePackFilerecordId_arr: (transferCdePack_filerecordIds ? Ext.JSON.encode(transferCdePack_filerecordIds) : null),
				do_generate: 1,
				download_zpl: true
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error',ajaxResponse.error) ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange') ;
				this.openTransferCdePackPopup( ajaxResponse.data ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handlePrintSupportsDo: function(transferCdePack_filerecordIds,printerIp) {
		this.showLoadmask() ;
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'transfer_spool_transferCdePack',
			transfer_filerecordId: this._activeTransferRecord.get('transfer_filerecord_id'),
			transferCdePack_filerecordIds: Ext.JSON.encode(transferCdePack_filerecordIds),
			printer_printerIp: printerIp
		} ;
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				//this.optimaModule.postCrmEvent('datachange') ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	openTransferCdePackPopup: function( ajaxData ) {
		var cnt_total = cnt_printable = 0 ;
		Ext.Array.each( ajaxData, function(row) {
			cnt_total++ ;
			if( row.zpl_is_on ) {
				cnt_printable++ ;
			}
		}) ;
		
		var me = this ;
		var popupPanel = Ext.create('Ext.form.Panel',{
			optimaModule: this.optimaModule,
			
			rows_arrTransferCdePack: ajaxData,
			
			width:400,
			height:250,
			
			cls: 'ux-noframe-bg',
			
			transferFilerecordId: null,
			transferLigFilerecordId_arr: null,
			transferStepCode: null,
			
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
			listeners: {
				zplprintqz: function( zplArr, printerName ) {
					this.libZplPrint( zplArr, printerName ) ;
				},
				zplprintsys: function( transferCdePack_filerecordIds, printerIp ) {
					this.handlePrintSupportsDo(transferCdePack_filerecordIds,printerIp) ;
				},
				zpldownload: function( zplArr, zplTitle ) {
					var zplBinary = zplArr.join('') ;
					this.libZplDownload( zplBinary, zplTitle, 'text/plain' ) ;
				},
				scope: this,
			},
			items:[{
				height: 72,
				xtype: 'component',
				tpl: [
					'<div class="op5-spec-embralam-liveadr-relocatebanner">',
						'<span>{text}</span>',
					'</div>'
				],
				data: {text: '<b>Print supports</b><br><br>'}
			},{
				xtype: 'displayfield',
				fieldLabel: 'Total supports',
				fieldStyle: 'font-weight:bold',
				value: cnt_total
			},{
				xtype: 'displayfield',
				fieldLabel: 'Printable supports',
				fieldStyle: 'font-weight:bold',
				value: cnt_printable
			}],
			buttons: [{
				xtype: 'button',
				text: 'Download ZPL',
				handler:function(btn){ 
					var formPanel = btn.up('form') ;
					formPanel.doSubmitDownload() ;
				},
				scope: this
			},{
				hidden: true,
				itemId: 'btnPrintQz',
				xtype: 'button',
				text: '<b>Print to QZ</b>',
				menu: {
					defaults: {
						handler:function(btn){ 
							var printerName = btn._printerName ;
							var formPanel = btn.up('form') ;
							formPanel.doSubmitPrintQz(printerName) ;
						},
						scope: this
					},
					items: []
				}
			},{
				hidden: true,
				itemId: 'btnPrintSys',
				xtype: 'button',
				text: '<b>Print</b>',
				menu: {
					defaults: {
						handler:function(btn){ 
							var printerIp = btn._printerIp ;
							var formPanel = btn.up('form') ;
							formPanel.doSubmitPrintSystem(printerIp) ;
						},
						scope: this
					},
					items: []
				}
			}],
			getZplTitle: function() {
				return 'ZPL_'+new Date().getTime()+'.zpl' ;
			},
			getTransferCdePackFilerecordIds: function() {
				var ids = [] ;
				Ext.Array.each( this.rows_arrTransferCdePack, function(row) {
					ids.push( row.transfercdepack_filerecord_id ) ;
				},this) ;
				return ids ;
			},
			getZplBinaryArr: function() {
				var binaryArr = [] ;
				Ext.Array.each( this.rows_arrTransferCdePack, function(row) {
					if( row.zpl_is_on ) {
						binaryArr.push(row.zpl_binary) ;
					}
				},this) ;
				return binaryArr ;
			},
			doSubmitDownload: function() {
				var binaryArr = this.getZplBinaryArr() ;
				if( Ext.isEmpty(binaryArr) ) {
					return ;
				}
				this.fireEvent('zpldownload',binaryArr,this.getZplTitle()) ;
			},
			doSubmitPrintQz: function(printerName) {
				var binaryArr = this.getZplBinaryArr() ;
				if( Ext.isEmpty(binaryArr) ) {
					return ;
				}
				this.fireEvent('zplprintqz',binaryArr, printerName) ;
			},
			doSubmitPrintSystem: function(printerIp) {
				var ids = this.getTransferCdePackFilerecordIds() ;
				this.fireEvent('zplprintsys',ids, printerIp) ;
			},
			onSubmitRelocate: function(ajaxResponse) {
				if( ajaxResponse.success ) {
					this.optimaModule.postCrmEvent('datachange') ;
					this.destroy() ;
				}
			},
			
			queryPrintersQz: function() {
				if( typeof qz == 'undefined' ) {
					//Ext.MessageBox.alert('Error','Print system disabled') ;
					return ;
				}
				var me = this ;
				qz.websocket.connect().then(function() {
					// Pass the printer name into the next Promise
					qz.printers.find().then(function(data) {
						
						me.populatePrintersQz(data) ;
						qz.websocket.disconnect() ;
					}).catch(function(e) { 
						me.populatePrintersQz(null) ;
						qz.websocket.disconnect() ;
					})
				}).catch(function(e) { me.populatePrintersQz(null) });
			},
			populatePrintersQz: function(arrPrinters) {
				var btnPrint = this.down('#btnPrintQz') ;
				if( !arrPrinters || arrPrinters.length==0 ) {
					btnPrint.setVisible(false) ;
					btnPrint.menu.removeAll() ;
				}
				var menuItems = [] ;
				Ext.Array.each(arrPrinters, function(printerName) {
					menuItems.push({
						icon: 'images/op5img/ico_print_16.png',
						text: printerName,
						_printerName: printerName,
					}) ;
				}) ;
				btnPrint.menu.removeAll() ;
				btnPrint.menu.add(menuItems) ;
				btnPrint.setVisible(true) ;
			},
			
			queryPrintersSystem: function() {
				this.populatePrintersSystem()
			},
			populatePrintersSystem: function() {
				var btnPrint = this.down('#btnPrintSys') ;
				var menuItems = [] ;
				Ext.Array.each(Optima5.Modules.Spec.DbsLam.HelperCache.getPrinterAll(), function(printerRow) {
					var text = printerRow.printer_ip ;
					if( printerRow.printer_desc ) {
						text+= ' - ' + printerRow.printer_desc ;
					}
					menuItems.push({
						icon: 'images/op5img/ico_print_16.png',
						text: text,
						_printerIp: printerRow.printer_ip,
					}) ;
				}) ;
				btnPrint.menu.removeAll() ;
				btnPrint.menu.add(menuItems) ;
				btnPrint.setVisible(true) ;
			}
		});
		
		popupPanel.on('destroy',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		popupPanel.show();
		popupPanel.queryPrintersQz() ;
		popupPanel.queryPrintersSystem() ;
		popupPanel.getEl().alignTo(me.getEl(), 'c-c?');
	},
	

	
	
	
	libZplDownload: function(data, strFileName, strMimeType) {
		
		var self = window, // this script is only for browsers anyway...
			u = "application/octet-stream", // this default mime also triggers iframe downloads
			m = strMimeType || u, 
			x = data,
			D = document,
			a = D.createElement("a"),
			z = function(a){return String(a);},
			
			
			B = self.Blob || self.MozBlob || self.WebKitBlob || z,
			BB = self.MSBlobBuilder || self.WebKitBlobBuilder || self.BlobBuilder,
			fn = strFileName || "download",
			blob, 
			b,
			ua,
			fr;

		//if(typeof B.bind === 'function' ){ B=B.bind(self); }
		
		if(String(this)==="true"){ //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
			x=[x, m];
			m=x[0];
			x=x[1]; 
		}
		
		
		
		//go ahead and download dataURLs right away
		if(String(x).match(/^data\:[\w+\-]+\/[\w+\-]+[,;]/)){
			return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
				navigator.msSaveBlob(d2b(x), fn) : 
				saver(x) ; // everyone else can save dataURLs un-processed
		}//end if dataURL passed?
		
		try{
		
			blob = x instanceof B ? 
				x : 
				new B([x], {type: m}) ;
		}catch(y){
			if(BB){
				b = new BB();
				b.append([x]);
				blob = b.getBlob(m); // the blob
			}
			
		}
		
		
		
		function d2b(u) {
			var p= u.split(/[:;,]/),
			t= p[1],
			dec= p[2] == "base64" ? atob : decodeURIComponent,
			bin= dec(p.pop()),
			mx= bin.length,
			i= 0,
			uia= new Uint8Array(mx);

			for(i;i<mx;++i) uia[i]= bin.charCodeAt(i);

			return new B([uia], {type: t});
		}
		
		function saver(url, winMode){
			
			
			if ('download' in a) { //html5 A[download] 			
				a.href = url;
				a.setAttribute("download", fn);
				a.innerHTML = "downloading...";
				D.body.appendChild(a);
				setTimeout(function() {
					a.click();
					D.body.removeChild(a);
					if(winMode===true){setTimeout(function(){ self.URL.revokeObjectURL(a.href);}, 250 );}
				}, 66);
				return true;
			}
			
			//do iframe dataURL download (old ch+FF):
			var f = D.createElement("iframe");
			D.body.appendChild(f);
			if(!winMode){ // force a mime that will download:
				url="data:"+url.replace(/^data:([\w\/\-\+]+)/, u);
			}
			
		
			f.src = url;
			setTimeout(function(){ D.body.removeChild(f); }, 333);
			
		}//end saver 
			

		if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
			return navigator.msSaveBlob(blob, fn);
		} 	
		
		if(self.URL){ // simple fast and modern way using Blob and URL:
			saver(self.URL.createObjectURL(blob), true);
		}else{
			// handle non-Blob()+non-URL browsers:
			if(typeof blob === "string" || blob.constructor===z ){
				try{
					return saver( "data:" +  m   + ";base64,"  +  self.btoa(blob)  ); 
				}catch(y){
					return saver( "data:" +  m   + "," + encodeURIComponent(blob)  ); 
				}
			}
			
			// Blob but not URL:
			fr=new FileReader();
			fr.onload=function(e){
				saver(this.result); 
			};
			fr.readAsDataURL(blob);
		}	
		return true;
	},
	libZplPrint: function(dataArr, printerName) {
		//console.log(printerName) ;
		if( typeof qz == 'undefined' ) {
			//Ext.MessageBox.alert('Error','Print system disabled') ;
			return ;
		}
		qz.websocket.connect().then(function() {
			// Pass the printer name into the next Promise
			//console.log(printerName) ;
			return qz.printers.find(printerName);
		}).then(function(printer) {
			// Create a default config for the found printer
			var config = qz.configs.create(printer);

			// Raw ZPL
			//var data = ['^XA^FO50,50^ADN,36,20^FDRAW ZPL EXAMPLE^FS^XZ'];

			qz.print(config, dataArr).then( function() {
				qz.websocket.disconnect() ;
			}) ;
		}).catch(function(e) { 
			qz.websocket.disconnect() ;
			console.error(e); 
			Ext.MessageBox.alert('Error',e) ;
		});
	}
}) ;
