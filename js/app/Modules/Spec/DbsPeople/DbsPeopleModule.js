Ext.define('DbsPeopleTreeModel', {
    extend: 'Ext.data.Model',
	 idProperty: 'nodeKey',
    fields: [
        {name: 'nodeKey',  type: 'string'},
        {name: 'nodeText',   type: 'string'}
     ]
});

Ext.define('Optima5.Modules.Spec.DbsPeople.DbsPeopleModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.DbsPeople.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.addEvents('op5broadcast') ;
		
		me.createWindow({
			width:800,
			height:600,
			resizable:true,
			maximizable:false,
			layout:'fit',
			items:[Ext.create('Optima5.Modules.Spec.DbsPeople.MainPanel',{
				optimaModule: me,
				border: false
			})]
		}) ;
	},
	postCrmEvent: function( crmEvent, postParams ) {
		this.callParent(arguments) ;
	}
});