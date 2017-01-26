Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallOutPanel',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallPanel',
	initComponent: function() {
		Ext.apply(this,{
			_showNew: true,
			_showResult: true,
			_showValidation: true
		});
		this.callParent() ;
	}
});
