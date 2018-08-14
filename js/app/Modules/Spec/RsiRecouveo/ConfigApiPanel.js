Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigApiPanel', {
	extend: 'Ext.form.Panel',

	initComponent: function() {
		Ext.apply(this,{
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: []
		});
		this.callParent();
	}
});
