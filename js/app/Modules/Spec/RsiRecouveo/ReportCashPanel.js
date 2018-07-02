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
	extend:'Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel',
	alias: 'widget.op5specrsiveoreportcashpanel',
	
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
		this.onDateSet('month') ;
		this.ready=true ;
		this.buildViews() ;
		this.doLoad() ;
	},
	onTbarChanged: function( filterValues ) {
		this.doLoad() ;
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
				filters: Ext.JSON.encode(this.getFilterValues())
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
