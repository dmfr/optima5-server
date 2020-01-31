Ext.define('RsiRecouveoReportUserModel',{
	extend: 'Ext.data.Model',
	idProperty: 'user_id',
	fields: [
		{ name: 'user_id', type: 'string' },
		{ name: 'user_fullname', type: 'string' },
		{ name: 'com_callout', type: 'int' },
		{ name: 'com_mailout', type: 'int' },
		{ name: 'res_PAY', type: 'number' },
		{ name: 'res_AVR', type: 'number' },
		{ name: 'res_misc', type: 'number' },
		{ name: 'delay_pay', type: 'int' },
		{ name: 'delay_open', type: 'int' },
		{ name: 'delay_litig', type: 'int' },
		{ name: 'inv_balage', type: 'auto' }
	]
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportUsersPanel',{
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
			items: []
		});
		this.callParent() ;
		this.tmpModelCnt = 0 ;
		
		this.buildViews() ;
	},

	buildViews: function() {
		var balageFields = [], balageColumns = [] ;
		var balageRenderer = function(value) {
			if( !value || Math.round(value) == 0 ) {
				return '&#160;' ;
			}
			return Ext.util.Format.number(value,'0,000')+''+'&#160;'+'€' ;
		};
		var balageConvert = function(value,record) {
			var thisField = this,
				balageSegmtId = thisField.balageSegmtId ;
			return record.data.inv_balage[balageSegmtId] ;
		};
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
			var balageField = 'inv_balage_'+balageSegmt.segmt_id ;
			balageColumns.push({
				text: balageSegmt.segmt_txt,
				dataIndex: balageField,
				width:100,
				align: 'right',
				renderer: balageRenderer,
				summaryType: 'sum',
				summaryRenderer: balageRenderer
			}) ;
			
			balageFields.push({
				name: balageField,
				balageSegmtId: balageSegmt.segmt_id,
				type: 'number',
				convert: balageConvert
			});
		}) ;
		
		var amountRenderer = function(v) {
			if( v != 0 ) {
				return ''+Ext.util.Format.number(v,'0,000')+''+'&#160;'+'€' ;
			}
		}
		var countRenderer = function(v) {
			if( v != 0 ) {
				return ''+v+'' ;
			}
		}
		
		var columns = [{
			text: 'Collaborateur',
			width:160,
			dataIndex: 'user_fullname',
			locked: true
		},{
			tdCls: 'op5-spec-rsiveo-taupe',
			text: 'Actions réalisées',
			columns: [{
				tdCls: 'op5-spec-rsiveo-taupe',
				text: 'Appels',
				dataIndex: 'com_callout',
				width:100,
				align: 'right',
				renderer: countRenderer,
				summaryType: 'sum'
			},{
				tdCls: 'op5-spec-rsiveo-taupe',
				text: 'Courriers man.',
				dataIndex: 'com_mailout',
				width:100,
				align: 'right',
				renderer: countRenderer,
				summaryType: 'sum'
			}]
		},{
			text: 'Résolution',
			columns: [{
				text: 'Paiements',
				dataIndex: 'res_PAY',
				width:120,
				align: 'right',
				renderer: amountRenderer,
				summaryType: 'sum',
				summaryRenderer: amountRenderer
			},{
				text: 'Avoirs',
				dataIndex: 'res_AVR',
				width:120,
				align: 'right',
				renderer: amountRenderer,
				summaryType: 'sum',
				summaryRenderer: amountRenderer
			},{
				text: 'Autres',
				dataIndex: 'res_misc',
				width:120,
				align: 'right',
				renderer: amountRenderer,
				summaryType: 'sum',
				summaryRenderer: amountRenderer
			}]
		},{
			tdCls: 'op5-spec-rsiveo-taupe',
			text: 'Actions en retard au ' + Ext.Date.format(new Date(),'d/m/Y'),
			columns: [{
				tdCls: 'op5-spec-rsiveo-taupe',
				text: 'Paiements',
				dataIndex: 'delay_pay',
				width:100,
				align: 'right',
				renderer: countRenderer,
				summaryType: 'sum'
			},{
				tdCls: 'op5-spec-rsiveo-taupe',
				text: 'En-cours',
				dataIndex: 'delay_open',
				width:100,
				align: 'right',
				renderer: countRenderer,
				summaryType: 'sum'
			},{
				tdCls: 'op5-spec-rsiveo-taupe',
				text: 'Actions<br>externes',
				dataIndex: 'delay_litig',
				width:100,
				align: 'right',
				renderer: countRenderer,
				summaryType: 'sum'
			}]
		},{
			text: 'Balance âgée',
			columns: balageColumns
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
		
		this.tmpModelName = 'RsiRecouveoReportUserModel'+'-' + this.getId() + (++this.tmpModelCnt) ;
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'RsiRecouveoReportUserModel',
			idProperty: 'user_id',
			fields: balageFields
		});
		
		this.removeAll() ;
		this.add({
			xtype: 'grid',
			itemId: 'pGrid',
			columns: columns,
			features: [{
				ftype: 'summary',
				dock: 'top'
			}],
			store: {
				model: this.tmpModelName,
				data: [],
				proxy: {
					type: 'memory'
				}
			}
		});
	},
	
	getFilterValues: function() {
		if( !this._dashboardPanel || !(this._dashboardPanel instanceof Optima5.Modules.Spec.RsiRecouveo.ReportFilterablePanel) ) {
			return {};
		}
		return this._dashboardPanel.getFilterValues() ;
	},
	doLoad: function(doClearFilters) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getUsers',
				filters: Ext.JSON.encode(this.getFilterValues()),
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
	onLoad: function(ajaxData) {
		// grid 
		if( true ) {
			this.down('#pGrid').getStore().clearFilter() ;
			this.down('#pGrid').getStore().sort('user_fullname','ASC') ;
		}
		this.down('#pGrid').getStore().loadRawData(ajaxData) ;
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
