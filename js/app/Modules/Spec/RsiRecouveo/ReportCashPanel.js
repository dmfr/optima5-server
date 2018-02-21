Ext.define('RsiRecouveoReportCashModel',{
	extend: 'Ext.data.Model',
	idProperty: 'group_id',
	fields: [
		{ name: 'group_id', type: 'string' },
		{ name: 'group_txt', type: 'string' },
		{ name: 'scope', type: 'number' },
		{ name: 'ec_start', type: 'number' },
		{ name: 'ec_end', type: 'number' },
		{ name: 'ec_max', type: 'number' },
		{ name: 'paid_LOCAL', type: 'number' },
		{ name: 'paid_REMOTE', type: 'number' },
		{ name: 'paid_AVR', type: 'number' },
		{ name: 'paid_misc', type: 'number' }
	]
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportCashPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.CheckColumnNull',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',
		'Optima5.Modules.Spec.RsiRecouveo.SearchCombo',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamFilter',
		'Optima5.Modules.Spec.RsiRecouveo.MultiActionForm'
	],
	
	filters: {},
	autoRefreshDelay: (10*60*1000),
	defaultViewMode: 'file',
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'fit',
			tbar:[{
				hidden: this._readonlyMode,
				icon: 'images/modules/rsiveo-back-16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'-',{
				itemId: 'btnFilterDate',
				xtype: 'button',
				textBase: 'Dates période',
				menu: [{
					xtype: 'form',
					bodyPadding: 6,
					bodyCls: 'ux-noframe-bg',
					width: 200,
					layout: 'anchor',
					fieldDefaults: {
						anchor: '100%',
						labelWidth: 75
					},
					items: [{
						xtype: 'datefield',
						format: 'Y-m-d',
						name: 'date_start',
						fieldLabel: 'Date début',
						listeners: {
							change: function() {
								this.applyFilterDate() ;
							},
							scope: this
						}
					},{
						xtype: 'datefield',
						format: 'Y-m-d',
						name: 'date_end',
						fieldLabel: 'Date fin',
						listeners: {
							change: function() {
								this.applyFilterDate() ;
							},
							scope: this
						}
					}],
					buttons: [{
						text: 'Appliquer',
						handler: function(btn) {
							var form = btn.up('form') ;
							this.applyFilterDate() ;
						},
						scope: this
					},{
						text: 'Reset',
						handler: function(btn) {
							var form = btn.up('form') ;
							form.reset() ;
							this.applyFilterDate() ;
						},
						scope: this
					}]
				}]
			},'->',{
				iconCls: 'op5-spec-rsiveo-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doLoad(true) ;
				},
				scope: this
			}],
			items: [{
				region: 'center',
				flex: 1,
				border: false,
				xtype: 'panel',
				itemId: 'pCenter',
				layout: {
					type: 'fit'
				},
				items: []
			}]
		});
		this.callParent() ;
		this.applyFilterDate(true) ;
		this.tmpModelCnt = 0 ;
		
		this.buildViews() ;
		this.doLoad() ;
	},
	applyFilterDate: function(silent) {
		var filterDateForm = this.down('#btnFilterDate').menu.down('form'),
			filterDateValues = filterDateForm.getForm().getFieldValues() ;
		var filterDateBtn = this.down('#btnFilterDate') ;
		var txt ;
		if( !filterDateValues.date_start && !filterDateValues.date_end ) {
			txt = filterDateBtn.textBase ;
		} else {
			txt = [] ;
			if( filterDateValues.date_start ) {
				txt.push('Du : '+Ext.Date.format(filterDateValues.date_start,'d/m/Y')) ;
			}
			if( filterDateValues.date_end ) {
				txt.push('Au : '+Ext.Date.format(filterDateValues.date_end,'d/m/Y')) ;
			}
			txt = txt.join(' / ') ;
		}
		filterDateBtn.setText(txt) ;
		
		if( filterDateValues.date_start ) {
			this.filters['date_start'] = Ext.Date.format(filterDateValues.date_start,'Y-m-d') ;
		} else {
			this.filters['date_start'] = null ;
		}
		if( filterDateValues.date_end ) {
			this.filters['date_end'] = Ext.Date.format(filterDateValues.date_end,'Y-m-d') ;
		} else {
			this.filters['date_end'] = null ;
		}
		
		if( !silent ) {
			this.doLoad() ;
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
		this.doLoad() 
	},

	buildViews: function() {
		var amountRendererIf = function(v) {
			if( v != 0 ) {
				return ''+Ext.util.Format.number(v,'0,000')+''+'&#160;'+'€' ;
			}
		}
		var amountRenderer = function(v) {
			if( true ) {
				return ''+Ext.util.Format.number(v,'0,000')+''+'&#160;'+'€' ;
			}
		}
		var countRenderer = function(v) {
			if( v != 0 ) {
				return ''+v+'' ;
			}
		}
		
		var pCenter = this.down('#pCenter') ;
		
		var columns = [{
			tdCls: 'op5-spec-rsiveo-taupe',
			text: 'Entités',
			columns: [{
				tdCls: 'op5-spec-rsiveo-taupe',
				text: 'Code',
				dataIndex: 'group_id',
				width:100,
				align: 'center'
			},{
				tdCls: 'op5-spec-rsiveo-taupe',
				text: 'Libellé',
				dataIndex: 'group_txt',
				width:150,
				align: 'center'
			}]
		},{
			text: 'Scope',
			width:120,
			dataIndex: 'scope',
			align: 'right',
			renderer: amountRenderer,
			summaryType: 'sum',
			summaryRenderer: amountRenderer
		},{
			text: 'Encours<br>Début',
			width:120,
			dataIndex: 'ec_start',
			align: 'right',
			renderer: amountRenderer,
			summaryType: 'sum',
			summaryRenderer: amountRenderer
		},{
			text: 'Encours<br>Max.',
			width:120,
			dataIndex: 'ec_max',
			align: 'right',
			renderer: amountRenderer,
			summaryType: 'sum',
			summaryRenderer: amountRenderer
		},{
			text: 'Paiements',
			tdCls: 'op5-spec-rsiveo-taupe',
			columns: [{
				tdCls: 'op5-spec-rsiveo-taupe',
				text: 'Encaissé<br>local',
				dataIndex: 'paid_LOCAL',
				width:120,
				align: 'right',
				renderer: amountRendererIf,
				summaryType: 'sum',
				summaryRenderer: amountRenderer
			},{
				tdCls: 'op5-spec-rsiveo-taupe',
				text: 'Encaissé<br>société',
				dataIndex: 'paid_REMOTE',
				width:120,
				align: 'right',
				renderer: amountRendererIf,
				summaryType: 'sum',
				summaryRenderer: amountRenderer
			},{
				tdCls: 'op5-spec-rsiveo-taupe',
				text: 'Avoirs',
				dataIndex: 'paid_AVR',
				width:120,
				align: 'right',
				renderer: amountRendererIf,
				summaryType: 'sum',
				summaryRenderer: amountRenderer
			},{
				tdCls: 'op5-spec-rsiveo-taupe',
				text: 'Autres',
				dataIndex: 'paid_misc',
				width:120,
				align: 'right',
				renderer: amountRendererIf,
				summaryType: 'sum',
				summaryRenderer: amountRenderer
			}]
		},{
			text: 'Encours<br>Fin',
			width:120,
			dataIndex: 'ec_end',
			align: 'right',
			renderer: amountRenderer,
			summaryType: 'sum',
			summaryRenderer: amountRenderer
		}] ;
		
		columns = {
			defaults: {
				menuDisabled: false,
				draggable: false,
				sortable: true,
				hideable: false,
				resizable: true,
				groupable: false,
				lockable: false
			},
			items: columns
		}
		
		pCenter.removeAll() ;
		pCenter.add({
			xtype: 'grid',
			itemId: 'pGrid',
			columns: columns,
			features: [{
				ftype: 'summary',
				dock: 'top'
			}],
			emptyText: 'Sélectionner dates début/fin',
			store: {
				model: 'RsiRecouveoReportCashModel',
				data: [],
				proxy: {
					type: 'memory'
				},
				sorters: [{
					property: 'group_id',
					direction: 'ASC'
				}]
			}
		});
	},
	
	doLoad: function(doClearFilters) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getCash',
				filters: Ext.JSON.encode(this.filters)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoad(ajaxResponse.data, doClearFilters) ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function(ajaxData, doClearFilters) {
		// grid 
		if( doClearFilters ) {
			this.down('#pCenter').down('#pGrid').getStore().clearFilter() ;
			this.down('#pCenter').down('#pGrid').getStore().sort('group_id','ASC') ;
		}
		this.down('#pCenter').down('#pGrid').getStore().loadRawData(ajaxData) ;
		this.down('#pCenter').down('#pGrid').getView().refresh() ;
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
			msg: RsiRecouveoLoadMsg.loadMsg
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	}
	
});
