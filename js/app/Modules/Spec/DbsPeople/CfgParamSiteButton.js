Ext.define('Optima5.Modules.Spec.DbsPeople.CfgParamSiteButton' ,{
	extend: 'Optima5.Modules.Spec.DbsPeople.CfgParamButton',
	
	initComponent: function() {
		Ext.apply(this,{
			icon: 'images/op5img/ico_blocs_small.gif',
			text: 'Sites / Entrepôts',
			cfgParam_id: 'whse'
		});
		this.callParent() ;
	}
}) ;