Ext.define('DbsLamStockTreeModel',{
	extend: 'Ext.data.Model',
	idProperty: 'treenode_key',
	fields: [
		{name: 'treenode_key', type:'string'},
		{name: 'field_ROW_ID', type:'string'},
		{name: 'field_POS_ZONE', type:'string'},
		{name: 'field_POS_ROW', type:'string'}
	]
});

Ext.define('DbsLamStockGridModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id', type:'string'},
		{name: 'status', type:'boolean'},
		{name: 'adr_id', type:'string', useNull:true},
		{name: 'pos_zone', type:'string'},
		{name: 'pos_row', type:'string'},
		{name: 'pos_bay', type:'string'},
		{name: 'pos_level', type:'string'},
		{name: 'pos_bin', type:'string'},
		{name: 'inv_id', type:'int', useNull:true},
		{name: 'inv_prod', type:'string'},
		{name: 'inv_batch', type:'string'},
		{name: 'inv_qty', type:'number', useNull:true},
		{name: 'inv_qty_out', type:'number', useNull:true},
		{name: 'inv_sn', type:'string'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.StockPanel',{
	extend:'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.DbsLam.CfgParamButton'],
	
	_popupMode: false,
	_enableDD: false,
	whseCode: null,
	
	initComponent: function() {
		this.tmpGridModelName = 'DbsLamStockGridModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpGridModelName ) ;
		}) ;
		
		Ext.apply(this, {
			layout: 'border',
			items: [{
				flex: 3,
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
				},Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'WHSE',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: 'Sites / Warehouses',
					itemId: 'btnWhse',
					optimaModule: this.optimaModule,
					listeners: {
						change: {
							fn: function() {
								this.onWhseSet() ;
							},
							scope: this
						},
						ready: {
							fn: function() {
								
							},
							scope: this
						}
					}
				}),'-',{
					icon:'images/op5img/ico_new_16.gif',
					text:'Création adresse(s)',
					handler: function() { this.handleNew() },
					scope: this
				},{
					icon:'images/op5img/ico_print_16.png',
					text:'Impression Inventaires'
				}],
				items: []
			},{
				region: 'east',
				flex: 2,
				xtype: 'panel',
				layout: 'fit',
				itemId:'mStockFormContainer',
				collapsible:true,
				collapsed: true,
				_empty:true,
				listeners:{
					beforeexpand:function(eastpanel) {
						if( eastpanel._empty ) {
							return false;
						}
					},
					scope:this
				}
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			if( !this.down('#pGrid') ) {
				return ;
			}
			if( this.down('#pGrid').getStore().loading || this.down('#pGrid').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		if( this._popupMode ) {
			this.down('toolbar').setVisible(false) ;
			this.down('#mStockFormContainer').setVisible(false) ;
		}
		
		this.doConfigure() ;
	},
	
	
	onWhseSet: function() {
		var filterSiteBtn = this.down('#btnWhse') ;
		if( !Ext.isEmpty(filterSiteBtn.getValue()) ) {
			this.whseCode = filterSiteBtn.getValue() ;
		} else {
			this.whseCode = null ;
		}
		
		this.doConfigure() ;
	},
	doConfigure: function() {
		var pCenter = this.down('#pCenter') ;
		
		if( !this.whseCode ) {
			pCenter.removeAll() ;
			pCenter.add({xtype:'component',cls: 'ux-noframe-bg', flex:1}) ;
			return ;
		}
		
		
		
		var pushModelfields = [], atrAdrColumns = [], atrStockColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			if( attribute.ADR_fieldcode ) {
				var fieldColumn = {
					locked: true,
					text: attribute.atr_txt,
					dataIndex: 'ADR_'+attribute.mkey,
					width: 75
				} ;
				atrAdrColumns.push(fieldColumn) ;
			}
			if( attribute.STOCK_fieldcode ) {
				var fieldColumn = {
					locked: true,
					text: attribute.atr_txt,
					dataIndex: 'STOCK_'+attribute.mkey,
					width: 75
				} ;
				atrStockColumns.push(fieldColumn) ;
			}
			
			pushModelfields.push({
				name: attribute.mkey,
				type: 'string'
			});
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( this.tmpGridModelName ) ;
		Ext.define(this.tmpGridModelName, {
			extend: 'DbsLamStockGridModel',
			fields: pushModelfields
		});
		
		var treepanelCfg = {
			border: 1,
			width: 240,
			xtype: 'treepanel',
			itemId: 'pTree',
			store: {
				model: 'DbsLamStockTreeModel',
				root:{
					iconCls:'task-folder',
					expanded:true,
					treenode_key:'&',
					field_ROW_ID: 'EmbraLAM'
				},
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_action: 'data_getBibleTree',
						bible_code: 'ADR'
					}
				}),
				listeners: {
					load: function(store) {
						if( store.getNodeById(this.whseCode) ) {
							store.setRootNode( store.getNodeById(this.whseCode).copy(undefined,true) ) ;
						}
					},
					scope: this
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
					dataIndex: 'field_ROW_ID',
					text: 'ID',
					width: 200,
					renderer: function(v) {
						return '<b>'+v+'</b>';
					}
				},{
					dataIndex: 'field_POS_ZONE',
					text: 'Zone',
					width: 50
				},{
					dataIndex: 'field_POS_ROW',
					text: 'Allée',
					width: 50
				}]
			},
			listeners: {
				selectionchange: function() {
					this.doGridReload();
				},
				scope: this
			}
		};
		
		var gridpanelCfg = {
			border: false,
			flex:1,
			xtype:'gridpanel',
			itemId: 'pGrid',
			store: {
				model: this.tmpGridModelName,
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'stock_getGrid'
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				}),
				listeners: {
					beforeload: this.onGridBeforeLoad,
					load: Ext.emptyFn,
					scope: this
				}
			},
			columns: {
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
						if( Ext.isEmpty(record.get('inv_prod')) ) {
							metadata.tdCls = 'op5-spec-dbslam-stock-avail'
						} else {
							metadata.tdCls = 'op5-spec-dbslam-stock-notavail'
						}
					}
				},{
					dataIndex: 'adr_id',
					text: 'ID',
					width: 90,
					renderer: function(v) {
						return '<b>'+v+'</b>';
					}
				},{
					text: 'Position',
					columns: [{
						dataIndex: 'pos_bay',
						text: 'Pos.',
						width: 50
					},{
						dataIndex: 'pos_level',
						text: 'Niv.',
						width: 50
					},{
						dataIndex: 'pos_bin',
						text: 'Case',
						width: 50
					}]
				},{
					text: 'Location Attributes',
					columns: atrAdrColumns
				},{
					text: 'Stock Attributes',
					columns: atrStockColumns
				},{
					text: 'Attributs',
					columns: [{
						dataIndex: 'inv_prod',
						text: 'Article',
						width: 100
					},{
						dataIndex: 'inv_batch',
						text: 'BatchCode',
						width: 100
					},{
						dataIndex: 'inv_qty',
						text: 'Qty disp',
						align: 'right',
						width: 75
					},{
						dataIndex: 'inv_sn',
						text: 'Serial',
						width: 100
					}]
				}]
			},
			plugins: [{
				ptype: 'bufferedrenderer',
				pluginId: 'bufferedRenderer',
				synchronousRender: true
			}],
			viewConfig: {
				preserveScrollOnRefresh: true,
				getRowClass: function(record) {
					if( record.get('inv_qty_out') > 0 && record.get('inv_qty') == 0 ) {
						return 'op5-spec-dbslam-stock-out' ;
					}
					if( !record.get('status') ) {
						//return 'op5-spec-dbslam-stock-disabled' ;
					}
				},
				listeners: {
					beforerefresh: function(view) {
						view.isRefreshing = true ;
					},
					refresh: function(view) {
						view.isRefreshing = false ;
					}
				}
			},
			listeners: {
				itemclick: this.onItemClick,
				scope: this
			}
		};
		if( this._enableDD ) {
			Ext.apply(gridpanelCfg,{
				selModel: {
					mode: 'MULTI'
				}
			});
			Ext.apply(gridpanelCfg.viewConfig,{
				plugins: {
					ddGroup : 'DbsLamStockDD',
					ptype: 'gridviewdragdrop'
				}
			});
		}
		
		pCenter.removeAll() ;
		pCenter.add(treepanelCfg,gridpanelCfg) ;
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
			this.setFormRecord(null) ;
			this.doGridReload() ;
		} else {
			this.on('activate',function(){this.onDataChange();}, this, {single:true}) ;
		}
	},
	
	doGridReload: function() {
		var gridpanel = this.down('#pCenter').down('#pGrid') ;
		gridpanel.getStore().load() ;
	},
	onGridBeforeLoad: function(store,options) {
		var treepanel = this.down('#pCenter').down('#pTree') ;
			selectedNodes = treepanel.getView().getSelectionModel().getSelection() ;
		var params = {} ;
		
		Ext.apply(params,{
			whse_code: this.whseCode
		}) ;
		
		if( selectedNodes.length == 1 && !(selectedNodes[0].isRoot()) ) {
			Ext.apply(params,{
				filter_treenodeKey: selectedNodes[0].getId()
			}) ;
		}
		
		options.setParams(params) ;
	},
	onItemClick: function( view, record, itemNode, index, e ) {
		var cellNode = e.getTarget( view.getCellSelector() ),
			cellColumn = view.getHeaderByCell( cellNode ) ;
		
		var eastpanel = this.getComponent('mStockFormContainer') ;
		if( eastpanel.isVisible() ) {
			this.setFormRecord(null) ;
		}
	},
	
	setFormRecord: function(record) {
		var me = this,
			eastpanel = me.getComponent('mStockFormContainer') ;
		if( record == null ) {
			eastpanel._empty = true ;
			eastpanel.collapse() ;
			eastpanel.removeAll() ;
			return ;
		}
	},
	
	doQuit: function() {
		this.destroy() ;
	}
});