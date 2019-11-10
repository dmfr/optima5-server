Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageWalletGroup',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPage',
	
	initComponent: function() {
		this.callParent() ;
	},
	
	getTitleString: function() {
		var filterData = this.getFilterValues() ;
		//console.dir(filterData) ;
		if( Ext.isEmpty(filterData['filter_date']['date_end']) ) {
			return '???' ;
		}
		
		var dateEndStr = Ext.Date.format(Ext.Date.parse(filterData['filter_date']['date_end'],'Y-m-d'),"d/m/Y") ;
		
		return 'Décomposition de l\'encours au ' + dateEndStr ;
	},
	
	doLoad: function() {
		this.callParent() ;
		
		this.loadResultSets({
			tile: {
				reportval_ids: ['wallet?wvalue=amount']
			},
			tile_late: {
				reportval_ids: ['wallet?wvalue=amount&wlate=true']
			},
			piechart_amount: {
				reportval_ids: ['wallet?wvalue=amount'],
				axes: {
					groupby_is_on: true,
					groupby_key: 'status'
				}
			},
			piechart_count: {
				reportval_ids: ['wallet?wvalue=count'],
				axes: {
					groupby_is_on: true,
					groupby_key: 'status'
				}
			},
			grid: {
				reportval_ids: ['wallet?wvalue=amount'],
				axes: {
					groupby_is_on: true,
					groupby_key: 'status_substatus'
				}
			},
		}) ;
	},
	onResultSets: function() {
		if( !this._viewInstalled ) {
			console.log('do layout') ;
			this._viewInstalled = true ;
		}
		console.dir( this._loadResultSets ) ;
	},
	
	dummyFn: function() {
		
	}
});
