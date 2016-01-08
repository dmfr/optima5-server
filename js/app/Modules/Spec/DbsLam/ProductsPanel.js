Ext.define('DbsLamProdGridModel',{
	extend: 'Ext.data.Model',
	idProperty: 'prod_id',
	fields: [
		{name: 'prod_id', type:'string'},
		{name: 'prod_txt', type:'string'},
		{name: 'spec_is_batch', type:'boolean'},
		{name: 'spec_is_dlc', type:'boolean'},
		{name: 'spec_is_sn', type:'boolean'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.ProductsPanel',{
	extend:'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.DbsLam.CfgParamButton'],
	
	initComponent: function() {
		this.tmpModelName = 'DbsLamProdGridModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		
		Ext.apply(this, {
			layout: 'border',
			items: [{
				flex: 3,
				region: 'center',
				border: false,
				xtype: 'panel',
				itemId: 'pCenter',
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
					cfgParam_id: 'SOC',
					icon: 'images/op5img/ico_blocs_small.gif',
					text: 'Companies / Customers',
					itemId: 'btnSoc',
					optimaModule: this.optimaModule,
					listeners: {
						change: {
							fn: function() {
								this.onSocSet() ;
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
					icon: 'images/op5img/ico_search_16.gif',
					handler: function(btn) {
						btn.up().down('#txtSearch').reset() ;
					}
				},{
					xtype: 'textfield',
					itemId: 'txtSearch',
					width: 100,
					listeners: {
						change: function(field) {
							var value = field.getValue(),
								store = this.down('grid').getStore() ;
							if( Ext.isEmpty(value) ) {
								store.clearFilter() ;
								return ;
							}
							store.filter('prod_id',value) ;
						},
						scope: this
					}
				},'->',{
					icon:'images/op5img/ico_new_16.gif',
					text:'Création Article',
					handler: function() { this.handleNew() },
					scope: this
				}],
				items: []
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
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			if( this.down('gridpanel').getStore().loading || this.down('gridpanel').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		this.doConfigure() ;
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
			this.down('gridpanel').getStore().load() ;
		} else {
			this.on('activate',function(){this.onDataChange();}, this, {single:true}) ;
		}
	},
	
	
	
	
	onSocSet: function() {
		var filterSiteBtn = this.down('#btnSoc') ;
		if( !Ext.isEmpty(filterSiteBtn.getValue()) ) {
			this.socCode = filterSiteBtn.getValue() ;
		} else {
			this.socCode = null ;
		}
		
		this.doConfigure() ;
	},
	doConfigure: function() {
		var pCenter = this.down('#pCenter') ;
		
		if( !this.socCode ) {
			pCenter.removeAll() ;
			pCenter.add({xtype:'component',cls: 'ux-noframe-bg', flex:1}) ;
			return ;
		}
		
		var pushModelfields = [], atrColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			var fieldColumn = {
				locked: true,
				text: attribute.atr_txt,
				dataIndex: attribute.mkey,
				width: 75
			} ;
			if( attribute.PROD_fieldcode ) {
				atrColumns.push(fieldColumn) ;
			}
			
			pushModelfields.push({
				name: attribute.mkey,
				type: 'string'
			});
		}) ;
		
		var boolRenderer = function(value) {
			if( value==1 ) {
				return '<b>X</b>' ;
			}
			else {
				return '' ;
			}
		}
		
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'DbsLamProdGridModel',
			fields: pushModelfields
		});
		
		pCenter.removeAll() ;
		pCenter.add({
			border: false,
			flex:1,
			xtype:'gridpanel',
			store: {
				model: this.tmpModelName,
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_lam',
						_action: 'prods_getGrid'
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
							metadata.tdCls = 'op5-spec-dbslam-stock-avail'
						} else {
							metadata.tdCls = 'op5-spec-dbslam-stock-notavail'
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
					text: 'Flags',
					columns: [{
						dataIndex: 'spec_is_batch',
						text: 'Batch',
						renderer: boolRenderer,
						width: 70
					},{
						dataIndex: 'spec_is_dlc',
						text: 'DLC',
						renderer: boolRenderer,
						width: 70
					},{
						dataIndex: 'spec_is_sn',
						text: 'Serial',
						renderer: boolRenderer,
						width: 70
					}]
				},{
					text: 'Attributs',
					columns: atrColumns
				}]
			},
			plugins: [{
				ptype: 'bufferedrenderer',
				pluginId: 'bufferedRenderer',
				synchronousRender: true
			}],
			viewConfig: {
				preserveScrollOnRefresh: true,
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
		});
	},
	
	
	
	
	onGridBeforeLoad: function(store,options) {
		var params = {} ;
		
		Ext.apply(params,{
			soc_code: this.socCode
		}) ;
		
		options.setParams(params) ;
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
					title: 'Flags',
					defaults: {
						labelWidth: 100
					},
					items:[{
						xtype: 'checkboxfield',
						boxLabel: 'Batch code',
						name: 'spec_is_batch'
					},{
						xtype: 'checkboxfield',
						boxLabel: 'Shelf life / DLC',
						name: 'spec_is_dlc'
					},{
						xtype: 'checkboxfield',
						boxLabel: 'S/N',
						name: 'spec_is_sn'
					}]
				},{
					xtype:'fieldset',
					title: 'Attributes',
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
					xtype: 'grid',
					store: {
						model: 'DbsLamStockGridModel',
						autoLoad: false,
						proxy: this.optimaModule.getConfiguredAjaxProxy({
							extraParams : {
								_moduleId: 'spec_dbs_lam',
								_action: 'prods_getStockGrid'
							},
							reader: {
								type: 'json',
								rootProperty: 'data'
							}
						}),
						sorters:[{
							property : 'adr_id',
							direction: 'ASC'
						}]
					},
					columns: [{
						dataIndex: 'adr_id',
						text: 'Adr.ID',
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
						dataIndex: 'inv_qty',
						text: 'Qty disp',
						align: 'right',
						width: 60
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
								_action: 'prods_getMvtsGrid'
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
						dataIndex: 'adr_id',
						text: 'Adr.ID',
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
		
		var title = 'Article <b>'+record.get('prod_id')+'</b>' ;
		
		eastpanel.removeAll();
		eastpanel.add(eastPanelCfg);
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.expand() ;
		
		var eastInnerPanel = eastpanel.child('panel'),
			prodForm = eastInnerPanel.child('form') ;
		eastInnerPanel._prod_id = record.get('prod_id') ;
		if( record.get('prod_id') == null ) {
			eastInnerPanel.down('tabpanel').setVisible(false) ;
		} else {
			prodForm.getForm().findField('prod_id').setReadOnly( true ) ;
			prodForm.loadRecord(record) ;
			Ext.Array.each( eastInnerPanel.query('grid'), function(gridPanel) {
				gridPanel.getStore().load({
					params: {
						prod_id: record.get('prod_id')
					}
				}) ;
			});
		}
	},
	handleNew: function() {
		var newProdRecord = Ext.ux.dams.ModelManager.create(this.tmpModelName,{}) ;
		this.setFormRecord(newProdRecord) ;
	},
	handleSave: function() {
		var me = this,
			eastpanel = me.getComponent('mProdsFormContainer'),
			eastInnerPanel = eastpanel.child('panel') ;
		if( eastInnerPanel == null ) {
			return ;
		}
		
		var prodForm = eastInnerPanel.child('form') ;
			
		var formData = {} ;
		Ext.apply( formData, prodForm.getValues() ) ;
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'prods_setRecord',
			_is_new: ( eastInnerPanel._prod_id == null ? 1 : 0 ),
			prod_id: ( eastInnerPanel._prod_id != null ? eastInnerPanel._prod_id : '' ),
			data: Ext.JSON.encode(formData)
		} ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					if( ajaxResponse.formErrors ) {
						prodForm.getForm().markInvalid( ajaxResponse.formErrors ) ;
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