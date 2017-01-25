Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallInPanel',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallPanel',
	initComponent: function() {
		this.callParent() ;
		this.getForm().findField('adrtel_result').setVisible(false) ;
	}
});
