Ext.define('Optima5.Modules.CrmBase.DefineStoreFieldJoinPanel' ,{
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			layout:{
				type:'hbox',
				align:'stretch'
			}
		});
		
		this.callParent() ;
	}
	
}) ;