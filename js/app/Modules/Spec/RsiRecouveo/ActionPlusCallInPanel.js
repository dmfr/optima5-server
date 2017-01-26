Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallInPanel',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallPanel',
	initComponent: function() {
		Ext.apply(this,{
			_showNew: true,
			_showResult: false,
			_showValidation: true
		});
		this.callParent() ;
	}
});
