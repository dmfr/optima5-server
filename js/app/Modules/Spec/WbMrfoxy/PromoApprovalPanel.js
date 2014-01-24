Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoApprovalPanel',{
	extend:'Ext.form.Panel',
	requires:[
		'Ext.ux.dams.ColorCombo',
		'Ext.ux.dams.ComboBoxCached'
	],

	initComponent: function() {
		var me = this ;
		me.addEvents('proceed') ;
		
		Ext.apply(me,{
			title: 'Approvals',
			padding: '5px 10px',
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75,
				anchor: '100%'
			},
			layout: 'anchor',
			items: [{
				xtype: 'checkbox',
				boxLabel: 'Approved by Sales Director',
			},{
				xtype: 'checkbox',
				boxLabel: 'Approved by Financial Officer',
			}],
			frame: true,
			buttons: [
				{ xtype: 'button', text: 'Confirm' , handler:this.onProceed, scope:this }
			]
		});
		
		this.callParent() ;
	},
	onProceed: function() {
		var me = this ;
		
		me.destroy() ;
	}
	
	
});