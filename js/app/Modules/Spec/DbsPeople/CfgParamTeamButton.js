Ext.define('Optima5.Modules.Spec.DbsPeople.CfgParamTeamButton' ,{
	extend: 'Optima5.Modules.Spec.DbsPeople.CfgParamButton',
	
	initComponent: function() {
		Ext.apply(this,{
			icon: 'images/op5img/ico_kuser_16.gif',
			text: 'Equipes',
			cfgParam_id: 'team'
		});
		this.callParent() ;
	}
}) ;