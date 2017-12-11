Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallOutPanel',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallPanel',
	initComponent: function() {
		Ext.apply(this,{
			_showNew: true,
			_showResult: true,
			_showValidation: true
		});
		this.callParent() ;
	},
	onSelectAdrbookResult: function(adrbookResult) {
		var optCalloutData = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getOptData('OPT_CALLOUT'),
			optCalloutRow = null ;
		Ext.Array.each( optCalloutData, function(row) {
			if( row.id == adrbookResult ) {
				optCalloutRow = row ;
				return false ;
			}
		}) ;
		var isVisible = (optCalloutRow && optCalloutRow.id=='APP_OK') ;
		this.down('#txtCallOut').setVisible( isVisible ) ;
		this.down('#notxtCallOut').setVisible( !isVisible ) ;
	}
});
