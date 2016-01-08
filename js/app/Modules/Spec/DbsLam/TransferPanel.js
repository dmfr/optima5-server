Ext.define('Optima5.Modules.Spec.DbsLam.TransferPanel',{
	extend:'Ext.panel.Panel',
	
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
				},'-',Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'WHSE',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: '<i>Origin</i>',
					itemId: 'btnWhseSrc',
					optimaModule: this.optimaModule
				}),{
					icon: 'images/op5img/ico_arrow-double_16.png'
				},Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamButton',{
					cfgParam_id: 'WHSE',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: '<i>Destination</i>',
					itemId: 'btnWhseDest',
					optimaModule: this.optimaModule
				})],
				items: [{xtype:'component',cls: 'ux-noframe-bg', flex:1}]
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
		//this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		
		this.doConfigure() ;
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
			extend: 'DbsLamStockGridModel',
			fields: pushModelfields
		});
		
		pCenter.removeAll() ;
		pCenter.add({
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
					field_ROW_ID: 'Transfers',
					children: [{
						field_ROW_ID: 'TEST 01',
						leaf: true
					}]
				},
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
					dataIndex: 'field_ROW_ID',
					text: 'Document ID',
					width: 120,
					renderer: function(v) {
						return '<b>'+v+'</b>';
					}
				},{
					dataIndex: 'field_POS_ZONE',
					text: '<b>Status</b>',
					width: 50
				}]
			},
			listeners: {
				selectionchange: function() {
					this.doGridReload();
				},
				scope: this
			}
		},{
			border: false,
			flex:1,
			xtype:'gridpanel',
			itemId: 'pGrid',
			store: {
				model: this.tmpGridModelName,
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
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
					text: '<b>Status</b>',
					dataIndex: 'dest_adr',
					width: 70
				},{
					text: '<b>Source Location</b>',
					dataIndex: 'dest_adr'
				},{
					text: 'Stock Attributes',
					columns: atrStockColumns
				},{
					text: '<b>SKU details</b>',
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
				},{
					text: '<b>Dest Location</b>',
					dataIndex: 'dest_adr'
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
					if( !record.get('status') ) {
						return 'op5-spec-dbslam-stock-disabled' ;
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
			}
		}) ;
	},
	
	doQuit: function() {
		this.destroy() ;
	}
}) ;