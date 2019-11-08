Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPageWalletGroup',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ReportDashboardPage',
	
	initComponent: function() {
		this.callParent() ;
	},
	
	getTitleString: function() {
		var filterData = this.getFilterData() ;
		//console.dir(filterData) ;
		if( Ext.isEmpty(filterData['filter_date']['date_end']) ) {
			return '???' ;
		}
		
		var dateEndStr = Ext.Date.format(Ext.Date.parse(filterData['filter_date']['date_end'],'Y-m-d'),"d/m/Y") ;
		
		return 'Décomposition de l\'encours au ' + dateEndStr ;
	},
	
	doLoad: function() {
		this.callParent() ;
		
		
	},
	
	dummyFn: function() {
		
	}
});
