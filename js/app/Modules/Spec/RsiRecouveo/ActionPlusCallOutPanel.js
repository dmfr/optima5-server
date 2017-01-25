Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallOutPanel',{
	extend:'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallPanel',
	initComponent: function() {
		this.callParent() ;
		this.getForm().findField('adrtel_result').setVisible(true) ;
	}
});
