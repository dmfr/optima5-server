Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextLitigPanel',{
	extend:'Ext.form.Panel',
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: 'anchor',
			items: [{
				xtype: 'fieldset',
				padding: 10,
				title: 'Qualification litige',
				layout: {
					type: 'anchor'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 60
				},
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					cfgParam_id: 'OPT_LITIG',
					cfgParam_emptyDisplayText: 'Select...',
					optimaModule: this.optimaModule,
					name: 'litig_code',
					allowBlank: false,
					fieldLabel: 'Motif'
				})]
			}]
		}) ;
		
		this.callParent() ;
	}
}) ;
