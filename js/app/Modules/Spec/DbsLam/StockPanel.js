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
		{name: 'inv_qty', type:'number', useNull:true}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.StockPanel',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		this.tmpGridModelName = 'DbsLamStockGridModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpGridModelName ) ;
		}) ;
		
		var pushModelfields = [], atrColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getStockAttributes(), function( stockAttribute ) {
			var fieldColumn = {
				locked: true,
				text: stockAttribute.atr_txt,
				dataIndex: stockAttribute.mkey,
				width: 75
			} ;
			atrColumns.push(fieldColumn) ;
			
			pushModelfields.push({
				name: stockAttribute.mkey,
				type: 'string'
			});
		}) ;
		
		Ext.define(this.tmpGridModelName, {
			extend: 'DbsLamStockGridModel',
			fields: pushModelfields
		});
		
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
					icon: 'images/op5img/ico_back_16.gif',
					text: '<u>Back</u>',
					handler: function(){
						this.doQuit() ;
					},
					scope: this
				},'-',{
					icon:'images/op5img/ico_new_16.gif',
					text:'Création adresse(s)',
					handler: function() { this.handleNew() },
					scope: this
				},{
					icon:'images/op5img/ico_print_16.png',
					text:'Impression Inventaires'
				}],
				items: [{
					border: 1,
					width: 240,
					xtype: 'treepanel',
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
							text: 'Attributs',
							columns: atrColumns
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
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			if( this.down('gridpanel').getStore().loading || this.down('gridpanel').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
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
		var gridpanel = this.down('gridpanel') ;
		gridpanel.getStore().load() ;
	},
	onGridBeforeLoad: function(store,options) {
		var treepanel = this.down('treepanel') ;
			selectedNodes = treepanel.getView().getSelectionModel().getSelection() ;
		
		if( selectedNodes.length == 1 && !(selectedNodes[0].isRoot()) ) {
			options.setParams({
				filter_treenodeKey: selectedNodes[0].getId()
			}) ;
		}
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
		
		var atrFields = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getStockAttributes(), function( stockAttribute ) {
			var atrField = {
				xtype:'op5crmbasebibletreepicker',
				selectMode: 'single',
				optimaModule: this.optimaModule,
				bibleId: stockAttribute.bible_code,
				fieldLabel: stockAttribute.atr_txt,
				name: stockAttribute.mkey
			} ;
			atrFields.push(atrField) ;
		}, this) ;
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
					itemId: 'fsPositionDisplay',
					title: 'Position',
					items:[{
						xtype: 'displayfield',
						fieldLabel: 'Adresse',
						fieldStyle: 'font-weight: bold',
						name: 'adr_id'
					}]
				},{
					xtype:'fieldset',
					itemId: 'fsPositionEdit',
					title: 'Position',
					defaults: {
						labelWidth: 75,
						fieldStyle: 'text-transform:uppercase;',
						anchor: ''
					},
					items:[{
						xtype: 'textfield',
						fieldLabel: 'Adresse',
						name: 'adr_id',
						width: 175
					},{
						xtype: 'textfield',
						fieldLabel: 'Allée',
						name: 'pos_row',
						width: 125
					},{
						xtype: 'textfield',
						fieldLabel: 'Pos.',
						name: 'pos_bay',
						width: 125
					},{
						xtype: 'textfield',
						fieldLabel: 'Niveau',
						name: 'pos_level',
						width: 125
					},{
						xtype: 'textfield',
						fieldLabel: 'Profond.',
						name: 'pos_depth',
						width: 125
					},{
						xtype: 'textfield',
						fieldLabel: 'Case',
						name: 'pos_bin',
						width: 125
					}]
				},{
					xtype:'fieldset',
					title: 'Attributs',
					defaults: {
						labelWidth: 100
					},
					items: atrFields
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
							name: 'inv_prod',
							listeners: {
								change: function(prodField) {
									var formPanel = prodField.up('form') ;
									Ext.Array.each( formPanel.query('field'), function(formField) {
										if( formField != prodField ) {
											formField.reset() ;
										}
									}) ;
								}
							}
						},{
							xtype:'textfield',
							fieldLabel: 'Batch code',
							name: 'inv_batch',
							fieldStyle: 'text-transform:uppercase;'
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
					xtype: 'grid',
					store: {
						model: 'DbsLamMovementModel',
						autoLoad: false,
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_moduleId: 'spec_dbs_lam',
								_action: 'stock_getMvts'
							},
							reader: {
								type: 'json',
								rootProperty: 'data'
							}
						}),
						sorters:[{
							property : 'mvt_id',
							direction: 'DESC'
						}]
					},
					columns: [{
						xtype: 'datecolumn',
						format:'d/m H:i',
						dataIndex: 'mvt_date',
						text: 'Date',
						width: 80
					},{
						dataIndex: 'prod_id',
						text: 'Article',
						width: 90
					},{
						dataIndex: 'batch',
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
		
		if( record.get('adr_id') != null ) {
			var title = 'Adresse <b>'+record.get('adr_id')+'</b>' ;
		} else {
			var title = 'Création Adresse' ;
		}
		
		eastpanel.removeAll();
		eastpanel.add(eastPanelCfg);
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.expand() ;
		
		var eastInnerPanel = eastpanel.child('panel'),
			adrForm = eastInnerPanel.child('form'),
			adrInventory = eastInnerPanel.child('tabpanel').child('form') ;
			adrMvts = eastInnerPanel.child('tabpanel').child('grid') ;
		eastInnerPanel._inv_id = record.get('inv_id') ;
		eastInnerPanel._adr_id = record.get('adr_id') ;
		if( record.get('adr_id') == null ) {
			var toRemove = adrForm.child('#fsPositionDisplay') ;
			toRemove.up().remove(toRemove) ;
			
			eastInnerPanel.down('tabpanel').setVisible(false) ;
		} else {
			var toRemove = adrForm.child('#fsPositionEdit') ;
			toRemove.up().remove(toRemove) ;
			
			adrForm.loadRecord(record) ;
			adrInventory.loadRecord(record) ;
			adrMvts.getStore().load({
				params: {
					adr_id: record.get('adr_id')
				}
			}) ;
		}
	},
	handleNew: function() {
		var newStockRecord = Ext.ux.dams.ModelManager.create(this.tmpGridModelName,{}) ;
		this.setFormRecord(newStockRecord) ;
	},
	handleSave: function() {
		var me = this,
			eastpanel = me.getComponent('mStockFormContainer'),
			eastInnerPanel = eastpanel.child('panel') ;
		if( eastInnerPanel == null ) {
			return ;
		}
		
		var adrForm = eastInnerPanel.child('form'),
			adrInventory = eastInnerPanel.child('tabpanel').child('form') ;
			
		var formData = {} ;
		Ext.apply( formData, adrForm.getValues() ) ;
		Ext.apply( formData, adrInventory.getValues() ) ;
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'stock_setRecord',
			_is_new: ( eastInnerPanel._adr_id == null ? 1 : 0 ),
			adr_id: ( eastInnerPanel._adr_id != null ? eastInnerPanel._adr_id : '' ),
			inv_id: ( eastInnerPanel._inv_id != null ? eastInnerPanel._inv_id : '' ),
			data: Ext.JSON.encode(formData)
		} ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					if( ajaxResponse.formErrors ) {
						adrForm.getForm().markInvalid( ajaxResponse.formErrors ) ;
						return ;
					}
					Ext.MessageBox.alert('Erreur',ajaxResponse.error) ;
					return ;
				}
				this.optimaModule.postCrmEvent('datachange') ;
			},
			scope: this
		}) ;
	},
	
	doQuit: function() {
		this.destroy() ;
	}
});