Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPage',{
	extend: 'Ext.panel.Panel',
	alias: 'widget.op5specrsiveoreportdashboardpage',
	
	_dashboardPanel: null,
	_actionTransferStepIdx: null,
	
	_viewInstalled: false,
	
	_loadResultSetsCnt: 0,
	_loadResultSets: {},
	
	initComponent: function() {
		if( !(this._dashboardPanel instanceof Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPanel) ) {
			Optima5.Helper.logError('Spec:RsiRecouveo:ReportDashboardPage','No parent reference ?') ;
		}
		this.optimaModule = this._dashboardPanel.optimaModule ;
		this.callParent() ;
	},
	
	doLoad: function() {
		this.fireEvent('pagetitle',this,this.getTitleString()) ;
	},
	onLoad: function() {
		
	},
	getFilterValues: function() {
		return this._dashboardPanel.getFilterValues() ;
	},
	
	getTitleString: function() {
		return "Page exemple" ;
	},
	
	
	loadResultSets: function( mapSetParams ) {
		this.showLoadmask() ;
		Ext.Object.each( mapSetParams, function(setId,setParams) {
			Ext.applyIf(setParams,{
				filters: this.getFilterValues(),
				axes: [],
				reportval_ids: ['wallet?wvalue=amount']
			}) ;
			
			this._loadResultSetsCnt++ ;
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_rsi_recouveo',
					_action: 'report_getGrid',
					filters:       Ext.JSON.encode(setParams.filters),
					axes:          Ext.JSON.encode(setParams.axes),
					reportval_ids: Ext.JSON.encode(setParams.reportval_ids)
				},
				success: function(response) {
					var ajaxResponse = Ext.decode(response.responseText) ;
					if( ajaxResponse.success == false ) {
						this.onResultSetLoad(setId, null) ;
						return ;
					}
					
					this.onResultSetLoad(setId,ajaxResponse) ;
				},
				failure: function() {
					this.onResultSetLoad(setId, null) ;
				},
				scope: this
			}) ;
		},this) ;
	},
	onResultSetLoad: function( setId, ajaxData ) {
		this._loadResultSetsCnt-- ;
		if( !ajaxData ) {
			delete this._loadResultSets[setId] ;
		}
		this._loadResultSets[setId] = ajaxData ;
		if( this._loadResultSetsCnt==0 ) {
			this.hideLoadmask() ;
			this.onResultSets() ;
		}
	},
	onResultSets: function() {
		//
	},
	getResultSet: function(setId) {
		if( !this._loadResultSets[setId] ) { 
			return [] ;
		}
		var ajaxData = this._loadResultSets[setId] ;
		var dataIndexes = [] ;
		Ext.Array.each(ajaxData.columns, function(col) {
			if( !Ext.isEmpty(col.reportval_id) ) {
				dataIndexes.push(col.dataIndex) ;
			}
		}) ;
		var rows = [],
			row, val ;
		Ext.Array.each(ajaxData.data, function(datarow) {
			row = {} ;
			Ext.Object.each( datarow, function(k,v) {
				if( Ext.Array.contains(dataIndexes,k) ) {
					return ;
				}
				row[k]=v ;
			}) ;
			row['values'] = [] ;
			Ext.Array.each(dataIndexes, function(dataIndex) {
				val = datarow[dataIndex] ;
				if( Ext.isNumber(val) ) {
					//val = Math.round(val) ;
				}
				row.values.push( val ) ;
			}) ;
			rows.push(row) ;
		}) ;
		return rows ;
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
	},
	
	dummyFn: function() {
		
	}
}) ;
