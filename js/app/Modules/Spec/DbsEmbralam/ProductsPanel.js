Ext.define('DbsEmbralamProdGridModel',{
	extend: 'Ext.data.Model',
	idProperty: 'prod_id',
	fields: [
		{name: 'prod_id', type:'string'},
		{name: 'prod_txt', type:'string'},
		{name: 'atr_type', type:'string'},
		{name: 'atr_classe', type:'string'},
		{name: 'atr_bu', type:'string'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsEmbralam.ProductsPanel',{
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
					text:'Création Article'
				}],
				items: [{
					border: false,
					flex:1,
					xtype:'gridpanel',
					store: {
						model: 'DbsEmbralamProdGridModel',
						autoLoad: true,
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_moduleId: 'spec_dbs_embralam',
								_action: 'prods_getGrid'
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
							dataIndex: 'prod_id',
							text: 'Code',
							width: 120,
							renderer: function(v) {
								return '<b>'+v+'</b>';
							}
						},{
							dataIndex: 'prod_txt',
							text: 'Description',
							width: 190
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
						}]
					},
					plugins: [{
						ptype: 'bufferedrenderer',
						pluginId: 'bufferedRenderer',
						synchronousRender: true
					}],
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
				itemId:'mProdsFormContainer',
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
			eastpanel = me.getComponent('mProdsFormContainer') ;
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
					title: 'Identification',
					defaults: {
						labelWidth: 100
					},
					items:[{
						xtype: 'textfield',
						fieldLabel: 'Code article',
						name: 'prod_id'
					},{
						xtype: 'textfield',
						fieldLabel: 'Description',
						name: 'prod_txt'
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
			}]
		};
		
		var title = 'Adresse <b>'+record.get('adr_id')+'</b>' ;
		
		eastpanel.removeAll();
		eastpanel.add(eastPanelCfg);
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.expand() ;
		
		var eastInnerPanel = eastpanel.child('panel'),
			adrForm = eastInnerPanel.child('form') ;
		adrForm.loadRecord(record) ;
	}
});