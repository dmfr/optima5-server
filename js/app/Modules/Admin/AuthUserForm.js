Ext.define('Optima5.Modules.Admin.AuthUserForm' ,{
	extend: 'Ext.form.Panel',
			  
	requires: [] ,
			 
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Admin:SdomainsForm','No module reference ?') ;
		}
		
		Ext.apply(me,{
			border: false,
			frame:false,
			bodyPadding: 10,
			bodyCls: 'ux-noframe-bg',
			defaults: {
				//anchor: '100%'
			},
			layout: 'anchor',
			fieldDefaults: {
				labelAlign: 'left',
				labelSeparator: ''
				//labelWidth: 125
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
					me.saveRecord() ;
				},
				scope:me
			}]
		});
		
		this.callParent() ;
		
		// console.dir( me.query('combobox') ) ;
		me.on('destroy',function() {
			if( me.loadmask ) {
				me.loadmask.destroy()
			}
		},me) ;
	},
	loadRecord: function( adminAuthUserRecord ) {
		
	}

}); 
