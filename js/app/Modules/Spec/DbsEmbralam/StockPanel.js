Ext.define('DbsEmbralamStockTreeModel',{
	extend: 'Ext.data.Model',
	idProperty: 'treenode_key',
	fields: [
		{name: 'treenode_key', type:'string'},
		{name: 'field_ROW_ID', type:'string'},
		{name: 'field_POS_ZONE', type:'string'},
		{name: 'field_POS_ROW', type:'string'}
	]
});

Ext.define('DbsEmbralamStockGridModel',{
	extend: 'Ext.data.Model',
	idProperty: 'adr_id',
	fields: [
		{name: 'status', type:'boolean'},
		{name: 'adr_id', type:'string'},
		{name: 'pos_zone', type:'string'},
		{name: 'pos_row', type:'string'},
		{name: 'pos_bay', type:'string'},
		{name: 'pos_level', type:'string'},
		{name: 'pos_bin', type:'string'},
		{name: 'atr_type', type:'string'},
		{name: 'atr_classe', type:'string'},
		{name: 'atr_bu', type:'string'},
		{name: 'inv_prod', type:'string'},
		{name: 'inv_batch', type:'string'},
		{name: 'inv_qty', type:'number', useNull:true}
	]
});

Ext.define('Optima5.Modules.Spec.DbsEmbralam.StockPanel',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'border',
			items: [{
				flex: 3,
				region: 'center',
				border: false,
				xtype: 'panel',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				tbar:[{
					icon:'images/op5img/ico_new_16.gif',
					text:'Création adresse(s)'
				},{
					icon:'images/op5img/ico_print_16.png',
					text:'Impression Inventaires'
				}],
				items: [{
					border: 1,
					width: 240,
					xtype: 'treepanel',
					store: {
						model: 'DbsEmbralamStockTreeModel',
						root:{
							iconCls:'task-folder',
							expanded:true,
							treenode_key:'&',
							field_ROW_ID: 'EmbraLAM'
						},
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_action: 'data_getBibleTree',
								bible_code: 'STOCK'
							}
						})
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
							width: 120,
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
					}
				},{
					border: false,
					flex:1,
					xtype:'gridpanel',
					store: {
						model: 'DbsEmbralamStockGridModel',
						autoLoad: true,
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_moduleId: 'spec_dbs_embralam',
								_action: 'stock_getGrid'
							},
							reader: {
								type: 'json',
								root: 'data'
							}
						}),
						listeners: {
							beforeload: Ext.emptyFn,
							load: Ext.emptyFn,
							scope: this
						}
					},
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
							text: '',
							width: 24,
							renderer: function(v,metadata,record) {
								if( Ext.isEmpty(record.get('inv_prod')) ) {
									metadata.tdCls = 'op5-spec-dbsembralam-stock-avail'
								} else {
									metadata.tdCls = 'op5-spec-dbsembralam-stock-notavail'
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
							text: 'Attributs',
							columns: [{
								dataIndex: 'atr_type',
								text: 'Type',
								width: 75
							},{
								dataIndex: 'atr_classe',
								text: 'Classe',
								width: 75
							},{
								dataIndex: 'atr_bu',
								text: 'BU',
								width: 75
							}]
						},{
							text: 'Attributs',
							columns: [{
								dataIndex: 'inv_prod',
								text: 'Article',
								width: 75
							},{
								dataIndex: 'inv_batch',
								text: 'BatchCode',
								width: 75
							},{
								dataIndex: 'inv_qty',
								text: 'Qty disp',
								align: 'right',
								width: 75
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
							if( !record.get('status') ) {
								return 'op5-spec-dbsembralam-stock-disabled' ;
							}
						}
					},
					listeners: {
						itemclick: this.onItemClick,
						scope: this
					}
				}]
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
	},
	onItemClick: function( view, record, itemNode, index, e ) {
		var cellNode = e.getTarget( view.getCellSelector() ),
			cellColumn = view.getHeaderByCell( cellNode ) ;
		this.setFormRecord(record) ;
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
		
		var eastPanelCfg = {
			xtype: 'panel',
			layout: {
				type: 'border',
				align: 'stretch'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
					me.handleSave() ;
				},
				scope:me
			}],
			items:[{
				region: 'center',
				flex: 1,
				xtype: 'form',
				layout: 'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 70,
					anchor: '100%'
				},
				frame:false,
				border: false,
				autoScroll: true,
				bodyPadding: 10,
				bodyCls: 'ux-noframe-bg',
				items: [{
					xtype:'fieldset',
					title: 'Position',
					items:[{
						xtype: 'displayfield',
						fieldLabel: 'Adresse',
						fieldStyle: 'font-weight: bold',
						name: 'adr_id'
					}]
				},{
					xtype:'fieldset',
					title: 'Attributs',
					defaults: {
						labelWidth: 100
					},
					items:[{
						xtype:'op5crmbasebibletreepicker',
						selectMode: 'single',
						optimaModule: this.optimaModule,
						bibleId: 'ATR_TYPE',
						fieldLabel: 'Type Bin(s)',
						name: 'atr_type'
					},{
						xtype:'op5crmbasebibletreepicker',
						selectMode: 'single',
						optimaModule: this.optimaModule,
						bibleId: 'ATR_CLASSE',
						fieldLabel: 'Classe',
						name: 'atr_classe'
					},{
						xtype:'op5crmbasebibletreepicker',
						selectMode: 'single',
						optimaModule: this.optimaModule,
						bibleId: 'ATR_BU',
						fieldLabel: 'BusinessUnit',
						name: 'atr_bu'
					}]
				}]
			},{
				region: 'south',
				flex: 1,
				xtype: 'tabpanel',
				items: [{
					title: 'Inventory',
					icon: 'images/op5img/ico_blocs_small.gif',
					xtype: 'form',
					layout: 'anchor',
					fieldDefaults: {
						labelAlign: 'left',
						labelWidth: 70,
						anchor: '100%'
					},
					frame:false,
					border: false,
					autoScroll: true,
					bodyPadding: 10,
					bodyCls: 'ux-noframe-bg',
					items: [{
						xtype:'fieldset',
						title: 'Inventory item',
						defaults: {
							labelWidth: 100
						},
						items:[{
							xtype:'op5crmbasebiblepicker',
							selectMode: 'single',
							optimaModule: this.optimaModule,
							bibleId: 'PROD',
							fieldLabel: 'Article',
							name: 'inv_prod'
						},{
							xtype:'textfield',
							fieldLabel: 'Batch code',
							name: 'inv_batch'
						},{
							xtype:'numberfield',
							fieldLabel: 'Qty Avail',
							name: 'inv_qty',
							anchor: '',
							width: 180
						}]
					}]
				},{
					title: 'History',
					icon: 'images/op5img/ico_wait_small.gif',
					xtype: 'gridpanel',
					store: {
						fields: ['mvt_date','inv_prod','inv_batch','mvt_qty'],
						data: []
					},
					columns: [{
						dataIndex: 'mvt_date',
						text: 'Date',
						width: 80
					},{
						dataIndex: 'inv_prod',
						text: 'Article',
						width: 90
					},{
						dataIndex: 'inv_batch',
						text: 'BatchCode',
						width: 100
					},{
						dataIndex: 'mvt_qty',
						text: 'Qty disp',
						align: 'right',
						width: 60,
						renderer: function(v,metaData,record) {
							var sign ;
							if( v > 0 ) {
								metaData.tdCls += ' op5-spec-dbspeople-balance-pos' ;
								sign = '+' ;
							} else {
								metaData.tdCls += ' op5-spec-dbspeople-balance-neg' ;
								sign = '-' ;
							}
							return sign + ' ' + v ;
						}
					}]
				}]
			}]
		};
		
		var title = 'Adresse <b>'+record.get('adr_id')+'</b>' ;
		
		eastpanel.removeAll();
		eastpanel.add(eastPanelCfg);
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.expand() ;
		
		var eastInnerPanel = eastpanel.child('panel'),
			adrForm = eastInnerPanel.child('form'),
			adrInventory = eastInnerPanel.child('tabpanel').child('form') ;
			adrMvts = eastInnerPanel.child('tabpanel').child('grid') ;
		adrForm.loadRecord(record) ;
		adrInventory.loadRecord(record) ;
		
		if( !Ext.isEmpty( record.get('inv_prod') ) ) {
			var fakeRecord = {
				mvt_date: '22/11/2014',
				inv_prod: record.get('inv_prod'),
				inv_batch: record.get('inv_batch'),
				mvt_qty: record.get('inv_qty')
			} ;
			adrMvts.getStore().loadData([fakeRecord]) ;
		}
	}
});